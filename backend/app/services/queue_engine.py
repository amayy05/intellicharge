"""
Service for simulating dynamic queues, multi-charger scheduling, and wait-time estimation.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.station import Station
from app.models.session import ChargingSession
from app.models.queue_entry import QueueEntry
from app.schemas.queue import DISCLAIMER_TEXT


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures a datetime is timezone-aware UTC, even when loaded from SQLite as naive."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def clean_expired_entries(db: Session, station_id: str):
    """
    Cleans up expired PLANNED requests whose expiry time has passed.
    Executed lazily on queue queries and mutations for the specific station.
    """
    now = datetime.now(timezone.utc)
    expired = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status == "PLANNED",
        QueueEntry.expires_at != None,
    ).all()

    modified = False
    for entry in expired:
        if entry.expires_at and to_utc(entry.expires_at) < now:
            entry.status = "EXPIRED"
            modified = True

    if modified:
        db.commit()


def get_station_queue_status(db: Session, station_id: str) -> dict:
    """
    Returns the current queue status for a specific station.
    Correctly isolates counts and separates physically checked-in WAITING
    vehicles from future PLANNED requests.
    """
    clean_expired_entries(db, station_id)
    now = datetime.now(timezone.utc)

    # Active sessions at this station (CHARGING)
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    # Checked-in waiting vehicles in the station's virtual queue (WAITING or ASSIGNED)
    # PLANNED entries are strictly excluded here.
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status.in_(["WAITING", "ASSIGNED"])
    ).order_by(QueueEntry.joined_at).all()

    # Planned future requests within next 24h
    window_end = now + timedelta(hours=24)
    planned_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status == "PLANNED",
        or_(QueueEntry.expires_at == None, QueueEntry.expires_at > now),
        or_(QueueEntry.expected_arrival_at == None, QueueEntry.expected_arrival_at <= window_end)
    ).all()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    charger_count = station.charger_count if station else 4
    
    available_chargers = max(0, charger_count - len(active_sessions))
    
    # Calculate current wait estimate for an immediate arrival
    wait_time_minutes, _ = estimate_queue_wait_time(db, station_id, 30.0)

    # Prediction source labeling
    if len(active_sessions) > 0 or len(waiting_entries) > 0:
        prediction_source = "virtual_queue"
    else:
        prediction_source = "heuristic"

    return {
        "station_id": station_id,
        "active_sessions": len(active_sessions),
        "waiting_vehicles": len(waiting_entries),
        "planned_requests": len(planned_entries),
        "available_chargers": available_chargers,
        "total_chargers": charger_count,
        "estimated_wait_minutes": wait_time_minutes,
        "prediction_source": prediction_source,
        "operator_verified": False,
        "notice": DISCLAIMER_TEXT,
    }


def estimate_queue_wait_time(
    db: Session, 
    station_id: str, 
    new_charging_duration_minutes: float,
    arrival_time: Optional[datetime] = None
) -> Tuple[float, datetime]:
    """
    Estimates the wait time for an EV arriving at the station.
    Performs multi-charger scheduling:
    - If arrival_time is None or immediate: simulates current active sessions + checked-in waiting queue.
    - If arrival_time is in the future: advances simulation to arrival_time and includes planned requests in the window.
    Returns (wait_time_minutes, estimated_start_time).
    """
    now = datetime.now(timezone.utc)
    target_arrival = to_utc(arrival_time) if arrival_time else now
    if target_arrival is None or target_arrival < now:
        target_arrival = now

    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return 0.0, target_arrival
        
    charger_count = max(1, station.charger_count)
    clean_expired_entries(db, station_id)

    # 1. Get all active sessions for this station
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    # 2. Get checked-in waiting vehicles in queue (FIFO)
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status.in_(["WAITING", "ASSIGNED"])
    ).order_by(QueueEntry.joined_at).all()
    
    # Initialize charger availability array
    charger_available_times: List[datetime] = []
    
    for session in active_sessions:
        if session.estimated_end_at:
            end_dt = to_utc(session.estimated_end_at)
            charger_available_times.append(max(now, end_dt))
        else:
            started = to_utc(session.started_at) or now
            dur = session.estimated_duration_minutes or 30.0
            est = started + timedelta(minutes=dur)
            charger_available_times.append(max(now, est))
            
    # Add currently unoccupied chargers (available right now)
    available_count = max(0, charger_count - len(active_sessions))
    for _ in range(available_count):
        charger_available_times.append(now)

    # Pad or trim to exactly charger_count to guarantee valid bounds
    while len(charger_available_times) < charger_count:
        charger_available_times.append(now)
    charger_available_times = charger_available_times[:charger_count]
        
    # 3. Simulate through currently waiting (checked-in) vehicles
    for entry in waiting_entries:
        charger_available_times.sort()
        earliest_available = max(now, charger_available_times[0])
        dur = max(5.0, entry.estimated_duration_minutes or 30.0)
        end_time = earliest_available + timedelta(minutes=dur)
        charger_available_times[0] = end_time

    # 4. If arrival is significantly in the future, include planned requests scheduled before arrival
    if target_arrival > (now + timedelta(minutes=5)):
        planned_prior = db.query(QueueEntry).filter(
            QueueEntry.station_id == station_id,
            QueueEntry.status == "PLANNED",
            QueueEntry.expected_arrival_at != None,
            QueueEntry.expected_arrival_at <= target_arrival,
            or_(QueueEntry.expires_at == None, QueueEntry.expires_at > target_arrival)
        ).order_by(QueueEntry.expected_arrival_at).all()

        for p_entry in planned_prior:
            p_arrival = to_utc(p_entry.expected_arrival_at) or target_arrival
            charger_available_times.sort()
            earliest_available = max(p_arrival, charger_available_times[0])
            dur = max(5.0, p_entry.estimated_duration_minutes or 30.0)
            charger_available_times[0] = earliest_available + timedelta(minutes=dur)

    # 5. Find start time for our vehicle
    charger_available_times.sort()
    my_start_time = max(target_arrival, charger_available_times[0])
    
    wait_time_minutes = (my_start_time - target_arrival).total_seconds() / 60.0
    return max(0.0, round(wait_time_minutes, 1)), my_start_time


def recalculate_queue(db: Session, station_id: str):
    """
    Recalculates estimated start and end times for all WAITING entries at a station.
    Properly scoped to the station. Only updates WAITING entries, not PLANNED entries.
    """
    now = datetime.now(timezone.utc)
    clean_expired_entries(db, station_id)

    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return
        
    charger_count = max(1, station.charger_count)
    
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status == "WAITING"
    ).order_by(QueueEntry.joined_at).all()
    
    charger_available_times: List[datetime] = []
    
    for session in active_sessions:
        if session.estimated_end_at:
            end_dt = to_utc(session.estimated_end_at)
            charger_available_times.append(max(now, end_dt))
        else:
            started = to_utc(session.started_at) or now
            dur = session.estimated_duration_minutes or 30.0
            charger_available_times.append(max(now, started + timedelta(minutes=dur)))
            
    available_count = max(0, charger_count - len(active_sessions))
    for _ in range(available_count):
        charger_available_times.append(now)

    while len(charger_available_times) < charger_count:
        charger_available_times.append(now)
    charger_available_times = charger_available_times[:charger_count]
        
    # Update waiting entries
    for entry in waiting_entries:
        charger_available_times.sort()
        earliest_available = max(now, charger_available_times[0])
        dur = max(5.0, entry.estimated_duration_minutes or 30.0)
        
        entry.estimated_start_at = earliest_available
        entry.estimated_end_at = earliest_available + timedelta(minutes=dur)
        
        charger_available_times[0] = entry.estimated_end_at
        
    db.commit()


def check_and_start_sessions(db: Session, station_id: str):
    """
    Checks if there are available chargers and WAITING vehicles.
    If so, transitions WAITING vehicles to CHARGING in simulation.
    Never auto-starts PLANNED vehicles (they have not checked in).
    Prevents duplicate sessions if already created.
    """
    now = datetime.now(timezone.utc)
    clean_expired_entries(db, station_id)
    
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return
        
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    available_chargers = station.charger_count - len(active_sessions)
    
    if available_chargers > 0:
        waiting_entries = db.query(QueueEntry).filter(
            QueueEntry.station_id == station_id,
            QueueEntry.status == "WAITING",
            QueueEntry.session_id == None
        ).order_by(QueueEntry.joined_at).limit(available_chargers).all()
        
        occupied_charger_ids = {s.charger_id for s in active_sessions}

        for entry in waiting_entries:
            # Check if this vehicle already has an active session (idempotency)
            existing_session = db.query(ChargingSession).filter(
                ChargingSession.station_id == station_id,
                ChargingSession.vehicle_id == entry.vehicle_id,
                ChargingSession.status == "CHARGING"
            ).first()
            if existing_session:
                entry.session_id = existing_session.id
                entry.status = "CHARGING"
                continue

            # Pick an available charger ID
            charger_id = 0
            for cid in range(station.charger_count):
                if cid not in occupied_charger_ids:
                    charger_id = cid
                    occupied_charger_ids.add(cid)
                    break

            start_soc = entry.current_soc if entry.current_soc is not None else 20.0
            target_soc = entry.target_soc if entry.target_soc is not None else 80.0
            dur = max(5.0, entry.estimated_duration_minutes or 30.0)

            new_session = ChargingSession(
                station_id=station_id,
                charger_id=charger_id,
                vehicle_id=entry.vehicle_id,
                start_soc=start_soc,
                target_soc=target_soc,
                started_at=now,
                estimated_duration_minutes=dur,
                estimated_end_at=now + timedelta(minutes=dur),
                status="CHARGING"
            )
            db.add(new_session)
            db.flush()
            
            entry.session_id = new_session.id
            entry.status = "CHARGING"
            
        db.commit()
        recalculate_queue(db, station_id)
