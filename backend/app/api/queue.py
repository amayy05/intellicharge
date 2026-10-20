from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.models.queue_entry import QueueEntry
from app.models.vehicle import EVVehicle
from app.models.user import User
from app.schemas.queue import QueueJoinRequest, QueueJoinResponse, QueueStatusResponse
from app.services.queue_engine import get_station_queue_status, estimate_queue_wait_time, recalculate_queue
from app.services.charging_math import calculate_charging_duration_minutes
from app.services.simulator import advance_time
from app.api.deps import get_current_user, get_optional_current_user

router = APIRouter(prefix="/stations", tags=["Queue"])


@router.get("/{station_id}/queue", response_model=QueueStatusResponse)
def get_queue_status(station_id: str, db: Session = Depends(get_db)):
    """Public endpoint — returns aggregate queue status for a station (no personal data)."""
    status = get_station_queue_status(db, station_id)
    return QueueStatusResponse(station_id=station_id, **status)


@router.post("/{station_id}/queue/join", response_model=QueueJoinResponse)
def join_queue(
    station_id: str,
    request: QueueJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a station queue. Requires authentication. Vehicle must belong to current user."""
    # 1. Get vehicle details — enforce ownership so user A cannot queue with user B's vehicle
    vehicle = db.query(EVVehicle).filter(
        EVVehicle.id == request.vehicle_id,
        EVVehicle.user_id == current_user.id,
    ).first()
    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found or does not belong to your account.",
        )

    # Validate SoC inputs
    if not (0 <= request.current_soc <= 100) or not (0 < request.target_soc <= 100):
        raise HTTPException(status_code=422, detail="SoC values must be between 0 and 100.")
    if request.current_soc >= request.target_soc:
        raise HTTPException(status_code=422, detail="target_soc must be greater than current_soc.")

    # 2. Calculate duration — use station's actual power rating where available
    from app.models.station import Station
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found.")
    charger_power_kw = station.power_kw or 50.0

    duration = calculate_charging_duration_minutes(
        battery_capacity_kwh=vehicle.battery_capacity_kwh,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        vehicle_max_power_kw=vehicle.max_charging_power_kw,
        charger_power_kw=charger_power_kw,
    )

    # 3. Get wait time
    wait_time, start_time = estimate_queue_wait_time(db, station_id, duration)

    # 4. Create Queue Entry — store user_id for ownership tracking
    entry = QueueEntry(
        station_id=station_id,
        vehicle_id=vehicle.id,
        user_id=current_user.id,
        estimated_duration_minutes=duration,
        estimated_start_at=start_time,
        estimated_end_at=start_time + timedelta(minutes=duration),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Recalculate positions for all waiting vehicles
    recalculate_queue(db, station_id)

    return QueueJoinResponse(
        status="success",
        queue_entry_id=entry.id,
        estimated_duration_minutes=duration,
        estimated_wait_minutes=wait_time,
        estimated_start_time=start_time,
    )


@router.post("/{station_id}/queue/{entry_id}/leave")
def leave_queue(
    station_id: str,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave/cancel a queue entry. Requires authentication. Only the entry owner can cancel."""
    entry = db.query(QueueEntry).filter(
        QueueEntry.id == entry_id,
        QueueEntry.station_id == station_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    # IDOR protection: only the owner can cancel their own entry
    if entry.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to cancel this queue entry.",
        )

    if entry.status not in ("WAITING", "ASSIGNED"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel entry with status '{entry.status}'.",
        )

    entry.status = "CANCELLED"
    db.commit()

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
