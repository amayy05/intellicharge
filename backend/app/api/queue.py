from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple

from app.core.database import get_db
from app.models.queue_entry import QueueEntry
from app.models.vehicle import EVVehicle
from app.models.user import User
from app.models.station import Station
from app.models.session import ChargingSession
from app.schemas.queue import (
    QueueJoinRequest,
    QueuePlanRequest,
    QueueJoinResponse,
    QueueStatusResponse,
    QueueEntryDetailResponse,
    DISCLAIMER_TEXT,
)
from app.services.queue_engine import (
    get_station_queue_status,
    estimate_queue_wait_time,
    recalculate_queue,
    to_utc,
    clean_expired_entries,
)
from app.services.charging_math import (
    calculate_charging_duration_minutes,
    check_connector_compatibility,
)
from app.services.simulator import advance_time
from app.api.deps import get_optional_current_user, get_current_user
from app.api.vehicles import get_or_create_demo_user

router = APIRouter(prefix="/stations", tags=["Queue"])


def _resolve_user(db: Session, current_user: Optional[User]) -> Tuple[User, bool]:
    """
    Returns (user, is_authenticated).
    When a valid JWT token was provided, is_authenticated is True.
    Otherwise falls back to demo user with is_authenticated=False.
    """
    if current_user:
        return current_user, True
    return get_or_create_demo_user(db), False


def _is_vehicle_accessible_by_user(vehicle: EVVehicle, user: User, is_auth: bool, db: Session) -> bool:
    """
    Checks if a vehicle is accessible by the user.
    - If unauthenticated, demo/public access is permitted.
    - If authenticated, check if the user owns the vehicle (type-safe comparison: str vs int).
    - If the vehicle belongs to demo user or is a shared demo vehicle, allow authenticated user as fallback.
    """
    if not is_auth:
        return True

    # Type-safe comparison: SQLite VARCHAR column returns str, user.id is int
    if str(vehicle.user_id) == str(user.id):
        return True

    # Check if this is a demo vehicle
    demo_user = get_or_create_demo_user(db)
    if str(vehicle.user_id).lower() in ("demo_user", "none", "") or str(vehicle.user_id) == str(demo_user.id):
        return True

    return False


@router.get("/queue/my-requests", response_model=List[QueueEntryDetailResponse])
def get_all_my_queue_requests(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve all active/recent requests for the current driver."""
    user, _ = _resolve_user(db, current_user)
    entries = db.query(QueueEntry).filter(
        QueueEntry.user_id == user.id,
        QueueEntry.status.in_(["PLANNED", "WAITING", "ASSIGNED", "CHARGING"]),
    ).order_by(QueueEntry.joined_at.desc()).all()
    return entries


@router.get("/{station_id}/queue/my-requests", response_model=List[QueueEntryDetailResponse])
def get_my_station_queue_requests(
    station_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve active requests for the current driver at a specific station."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    user, _ = _resolve_user(db, current_user)
    entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.user_id == user.id,
        QueueEntry.status.in_(["PLANNED", "WAITING", "ASSIGNED", "CHARGING"]),
    ).order_by(QueueEntry.joined_at.desc()).all()
    return entries


@router.get("/{station_id}/queue", response_model=QueueStatusResponse)
def get_queue_status(station_id: str, db: Session = Depends(get_db)):
    """
    Public endpoint — returns aggregate queue status for a station.
    Separates active sessions, checked-in virtual queue waiting count,
    and planned arrival requests. Never leaks PII.
    """
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    status_data = get_station_queue_status(db, station_id)
    return QueueStatusResponse(**status_data)


@router.post("/{station_id}/queue/plan", response_model=QueueJoinResponse)
def plan_queue_arrival(
    station_id: str,
    request: QueuePlanRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Create a planned virtual queue request for an expected arrival time.
    PLANNED requests are included in future demand forecasting but NOT
    counted as physically waiting and NOT assigned a real charger.
    """
    # 1. Validate station existence
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    # 2. Resolve user & vehicle ownership
    user, is_auth = _resolve_user(db, current_user)
    vehicle = db.query(EVVehicle).filter(EVVehicle.id == request.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if is_auth and not _is_vehicle_accessible_by_user(vehicle, user, is_auth, db):
        raise HTTPException(status_code=403, detail="Vehicle does not belong to your account.")

    # 3. Validate battery & SOC inputs
    if not (0 <= request.current_soc <= 100) or not (0 <= request.target_soc <= 100):
        raise HTTPException(status_code=422, detail="SoC values must be between 0 and 100.")
    if request.target_soc <= request.current_soc:
        raise HTTPException(status_code=422, detail="target_soc must be strictly greater than current_soc.")
    if vehicle.battery_capacity_kwh <= 0 or vehicle.max_charging_power_kw <= 0:
        raise HTTPException(status_code=422, detail="Vehicle battery capacity and power must be positive.")

    # 4. Check connector compatibility
    is_compatible, comp_label = check_connector_compatibility(station.connector_types, vehicle.connector_type)
    if not is_compatible:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Connector incompatibility: Vehicle requires '{vehicle.connector_type}', "
                f"but station '{station.name}' only provides '{station.connector_types}'."
            )
        )

    # 5. Validate expected arrival timestamp
    now = datetime.now(timezone.utc)
    expected_arr = to_utc(request.expected_arrival_at) if request.expected_arrival_at else (now + timedelta(minutes=30))
    if expected_arr < (now - timedelta(minutes=15)):
        raise HTTPException(status_code=422, detail="expected_arrival_at cannot be in the past.")

    # 6. Prevent duplicate active requests for the same vehicle at this station
    existing_active = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.vehicle_id == vehicle.id,
        QueueEntry.status.in_(["PLANNED", "WAITING", "CHARGING"]),
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=409,
            detail=f"An active request ({existing_active.status}) already exists for this vehicle at this station.",
        )

    # 7. Calculate charging duration using station actual power rating
    duration = calculate_charging_duration_minutes(
        battery_capacity_kwh=vehicle.battery_capacity_kwh,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        vehicle_max_power_kw=vehicle.max_charging_power_kw,
        charger_power_kw=station.power_kw or 50.0,
    )

    # 8. Estimate wait time at target arrival
    wait_time, start_time = estimate_queue_wait_time(db, station_id, duration, arrival_time=expected_arr)

    # 9. Create PLANNED entry
    expires_at = expected_arr + timedelta(minutes=30)
    entry = QueueEntry(
        station_id=station_id,
        vehicle_id=vehicle.id,
        user_id=user.id,
        status="PLANNED",
        joined_at=now,
        expected_arrival_at=expected_arr,
        expires_at=expires_at,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        estimated_duration_minutes=duration,
        estimated_start_at=start_time,
        estimated_end_at=start_time + timedelta(minutes=duration),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return QueueJoinResponse(
        status="success",
        queue_entry_id=entry.id,
        station_id=station_id,
        vehicle_id=vehicle.id,
        entry_status="PLANNED",
        estimated_duration_minutes=duration,
        estimated_wait_minutes=wait_time,
        estimated_start_time=start_time,
        expected_arrival_at=expected_arr,
        checked_in_at=None,
        prediction_source="planned_demand",
        operator_verified=False,
        disclaimer=DISCLAIMER_TEXT,
    )


@router.post("/{station_id}/queue/join", response_model=QueueJoinResponse)
def join_queue(
    station_id: str,
    request: QueueJoinRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Join a station's virtual queue (immediate check-in upon arrival)
    or create a planned request if arrival is in the future.
    Maintains backward compatibility for existing clients.
    """
    # 1. Validate station existence
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    # 2. Resolve user & vehicle ownership
    user, is_auth = _resolve_user(db, current_user)
    vehicle = db.query(EVVehicle).filter(EVVehicle.id == request.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if is_auth and not _is_vehicle_accessible_by_user(vehicle, user, is_auth, db):
        raise HTTPException(status_code=403, detail="Vehicle does not belong to your account.")

    # 3. Validate SoC & battery inputs
    if not (0 <= request.current_soc <= 100) or not (0 <= request.target_soc <= 100):
        raise HTTPException(status_code=422, detail="SoC values must be between 0 and 100.")
    if request.target_soc <= request.current_soc:
        raise HTTPException(status_code=422, detail="target_soc must be strictly greater than current_soc.")
    if vehicle.battery_capacity_kwh <= 0 or vehicle.max_charging_power_kw <= 0:
        raise HTTPException(status_code=422, detail="Vehicle battery capacity and power must be positive.")

    # 4. Check connector compatibility
    is_compatible, comp_label = check_connector_compatibility(station.connector_types, vehicle.connector_type)
    if not is_compatible:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Connector incompatibility: Vehicle requires '{vehicle.connector_type}', "
                f"but station '{station.name}' only provides '{station.connector_types}'."
            )
        )

    # 5. Check duplicate active requests
    existing_active = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.vehicle_id == vehicle.id,
        QueueEntry.status.in_(["PLANNED", "WAITING", "CHARGING"]),
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=409,
            detail=f"An active request ({existing_active.status}) already exists for this vehicle at this station.",
        )

    now = datetime.now(timezone.utc)
    target_arrival = to_utc(request.expected_arrival_at) if request.expected_arrival_at else now

    # If expected_arrival is significantly in future (> 5 min), treat as PLANNED
    is_future_plan = target_arrival > (now + timedelta(minutes=5))

    duration = calculate_charging_duration_minutes(
        battery_capacity_kwh=vehicle.battery_capacity_kwh,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        vehicle_max_power_kw=vehicle.max_charging_power_kw,
        charger_power_kw=station.power_kw or 50.0,
    )

    wait_time, start_time = estimate_queue_wait_time(db, station_id, duration, arrival_time=target_arrival)

    entry_status = "PLANNED" if is_future_plan else "WAITING"
    checked_in_at = None if is_future_plan else now
    expires_at = (target_arrival + timedelta(minutes=30)) if is_future_plan else None

    entry = QueueEntry(
        station_id=station_id,
        vehicle_id=vehicle.id,
        user_id=user.id,
        status=entry_status,
        joined_at=now,
        expected_arrival_at=target_arrival if is_future_plan else None,
        checked_in_at=checked_in_at,
        expires_at=expires_at,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        estimated_duration_minutes=duration,
        estimated_start_at=start_time,
        estimated_end_at=start_time + timedelta(minutes=duration),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    if not is_future_plan:
        recalculate_queue(db, station_id)

    return QueueJoinResponse(
        status="success",
        queue_entry_id=entry.id,
        station_id=station_id,
        vehicle_id=vehicle.id,
        entry_status=entry_status,
        estimated_duration_minutes=duration,
        estimated_wait_minutes=wait_time,
        estimated_start_time=start_time,
        expected_arrival_at=target_arrival if is_future_plan else None,
        checked_in_at=checked_in_at,
        prediction_source="planned_demand" if is_future_plan else "virtual_queue",
        operator_verified=False,
        disclaimer=DISCLAIMER_TEXT,
    )


@router.post("/{station_id}/queue/{entry_id}/check-in", response_model=QueueJoinResponse)
def check_in_to_queue(
    station_id: str,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Check in to an existing planned request upon physical arrival at the station,
    moving it into that station's checked-in virtual queue.
    Idempotent: duplicate check-ins return current status safely.
    """
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    # Station isolation check: ensure entry belongs to path station
    if entry.station_id != station_id:
        raise HTTPException(
            status_code=400,
            detail=f"Queue entry {entry_id} belongs to station '{entry.station_id}', not '{station_id}'."
        )

    # Ownership check
    user, is_auth = _resolve_user(db, current_user)
    if entry.user_id is not None:
        if not is_auth:
            raise HTTPException(status_code=401, detail="Authentication required to check in this queue entry.")
        if str(entry.user_id) != str(user.id):
            raise HTTPException(status_code=403, detail="You do not have permission to check in this queue entry.")

    # Idempotent handling if already WAITING or CHARGING
    if entry.status in ("WAITING", "CHARGING"):
        wait_time, start_time = estimate_queue_wait_time(db, station_id, entry.estimated_duration_minutes)
        return QueueJoinResponse(
            status="success",
            queue_entry_id=entry.id,
            station_id=station_id,
            vehicle_id=entry.vehicle_id,
            entry_status=entry.status,
            estimated_duration_minutes=entry.estimated_duration_minutes,
            estimated_wait_minutes=wait_time,
            estimated_start_time=entry.estimated_start_at or start_time,
            expected_arrival_at=entry.expected_arrival_at,
            checked_in_at=entry.checked_in_at,
            prediction_source="virtual_queue",
            operator_verified=False,
            disclaimer=DISCLAIMER_TEXT,
        )

    if entry.status in ("COMPLETED", "CANCELLED", "EXPIRED"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot check in entry with terminal status '{entry.status}'."
        )

    # Transition PLANNED -> WAITING
    now = datetime.now(timezone.utc)
    entry.status = "WAITING"
    entry.checked_in_at = now
    db.commit()

    # Recalculate virtual queue for this station
    recalculate_queue(db, station_id)
    db.refresh(entry)

    wait_time, start_time = estimate_queue_wait_time(db, station_id, entry.estimated_duration_minutes)

    return QueueJoinResponse(
        status="success",
        queue_entry_id=entry.id,
        station_id=station_id,
        vehicle_id=entry.vehicle_id,
        entry_status="WAITING",
        estimated_duration_minutes=entry.estimated_duration_minutes,
        estimated_wait_minutes=wait_time,
        estimated_start_time=entry.estimated_start_at or start_time,
        expected_arrival_at=entry.expected_arrival_at,
        checked_in_at=entry.checked_in_at,
        prediction_source="virtual_queue",
        operator_verified=False,
        disclaimer=DISCLAIMER_TEXT,
    )


@router.post("/{station_id}/queue/{entry_id}/leave")
@router.post("/{station_id}/queue/{entry_id}/cancel")
def leave_queue(
    station_id: str,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Leave / cancel a planned request or waiting queue entry.
    Requires station match and ownership validation.
    Idempotent: cancelling an already cancelled entry succeeds cleanly.
    """
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.station_id != station_id:
        raise HTTPException(
            status_code=400,
            detail=f"Queue entry {entry_id} belongs to station '{entry.station_id}', not '{station_id}'."
        )

    user, is_auth = _resolve_user(db, current_user)
    if entry.user_id is not None:
        if not is_auth:
            raise HTTPException(
                status_code=401,
                detail="Authentication required to cancel this queue entry.",
            )
        if str(entry.user_id) != str(user.id):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to cancel this queue entry.",
            )

    # Idempotent cancellation
    if entry.status == "CANCELLED":
        return {"status": "success", "message": "Queue entry was already cancelled."}

    if entry.status in ("COMPLETED", "EXPIRED"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel entry with terminal status '{entry.status}'.",
        )

    # Terminate linked simulated session if applicable
    if entry.session_id:
        sess = db.query(ChargingSession).filter(ChargingSession.id == entry.session_id).first()
        if sess and sess.status == "CHARGING":
            sess.status = "CANCELLED"
            sess.actual_end_at = datetime.now(timezone.utc)

    was_waiting = entry.status in ("WAITING", "ASSIGNED", "CHARGING")
    entry.status = "CANCELLED"
    db.commit()

    if was_waiting:
        recalculate_queue(db, station_id)

    return {"status": "success", "message": "Left queue"}


# DEMO-ONLY ENDPOINT — clearly labeled, not for production use
@router.post("/demo/tick", tags=["Demo"])
def demo_tick(
    minutes: float = 5.0,
    db: Session = Depends(get_db),
):
    """[DEMO ONLY] Advances simulated time by X minutes for demonstration purposes.
    This endpoint simulates queue progression and is labeled as demo/synthetic data."""
    if minutes <= 0 or minutes > 480:
        raise HTTPException(status_code=422, detail="minutes must be between 0 and 480.")
    advance_time(db, minutes)
    return {
        "status": "success",
        "message": f"[DEMO] Simulated time advanced by {minutes} minutes",
        "note": "This uses synthetic simulation data, not real charging events.",
    }
