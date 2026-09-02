"""
Service for simulating dynamic queues and multi-charger scheduling.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.station import Station
from app.models.session import ChargingSession
from app.models.queue_entry import QueueEntry

def get_station_queue_status(db: Session, station_id: str) -> dict:
    """
    Returns the current queue status for a station.
    """
    # Active sessions (CHARGING)
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    # Waiting vehicles (WAITING or ASSIGNED)
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status.in_(["WAITING", "ASSIGNED"])
    ).order_by(QueueEntry.joined_at).all()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    charger_count = station.charger_count if station else 4
    
    available_chargers = max(0, charger_count - len(active_sessions))
    
    return {
        "active_sessions": len(active_sessions),
        "waiting_vehicles": len(waiting_entries),
        "available_chargers": available_chargers,
        "total_chargers": charger_count,
    }


def estimate_queue_wait_time(db: Session, station_id: str, new_charging_duration_minutes: float) -> Tuple[float, Optional[datetime]]:
    """
    Estimates the wait time for a new vehicle arriving at the station.
    Returns (wait_time_minutes, estimated_start_time).
    """
    now = datetime.utcnow()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return 0.0, now
        
    charger_count = station.charger_count
    
    # Get all active sessions
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    # Get all waiting vehicles that are already in the queue
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status.in_(["WAITING", "ASSIGNED"])
    ).order_by(QueueEntry.joined_at).all()
    
    # We build a list of when chargers will become available.
    # Start with empty chargers available now.
    charger_available_times = []
    
    # Initialize with active sessions
    for session in active_sessions:
        if session.estimated_end_at:
            charger_available_times.append(session.estimated_end_at)
        else:
            # Fallback if somehow estimated_end_at is missing
            est = session.started_at + timedelta(minutes=session.estimated_duration_minutes or 30)
            charger_available_times.append(max(now, est))
            
    # Add available chargers
    available_count = max(0, charger_count - len(active_sessions))
    for _ in range(available_count):
        charger_available_times.append(now)
        
    # Now simulate the existing queue
    for entry in waiting_entries:
        # Find the earliest available charger
        charger_available_times.sort()
        earliest_available = max(now, charger_available_times[0])
        
        # Assign this vehicle to this charger
        # It will occupy the charger for its estimated duration
        end_time = earliest_available + timedelta(minutes=entry.estimated_duration_minutes)
        
        # Update the charger's available time
        charger_available_times[0] = end_time
        
    # Finally, find the wait time for OUR new vehicle
    charger_available_times.sort()
    my_start_time = max(now, charger_available_times[0])
    
    wait_time_minutes = (my_start_time - now).total_seconds() / 60.0
    return round(wait_time_minutes, 1), my_start_time


def recalculate_queue(db: Session, station_id: str):
    """
    Recalculates the estimated start and end times for all waiting entries at a station.
    This should be called when a session completes or a new vehicle joins.
    """
    now = datetime.utcnow()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return
        
    charger_count = station.charger_count
    
    active_sessions = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).all()
    
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.station_id == station_id,
        QueueEntry.status == "WAITING"
    ).order_by(QueueEntry.joined_at).all()
    
    charger_available_times = []
    
    for session in active_sessions:
        if session.estimated_end_at:
            charger_available_times.append(session.estimated_end_at)
        else:
            est = session.started_at + timedelta(minutes=session.estimated_duration_minutes or 30)
            charger_available_times.append(max(now, est))
            
    available_count = max(0, charger_count - len(active_sessions))
    for _ in range(available_count):
        charger_available_times.append(now)
        
    # Update all waiting entries
    for entry in waiting_entries:
        charger_available_times.sort()
        earliest_available = max(now, charger_available_times[0])
        
        entry.estimated_start_at = earliest_available
        entry.estimated_end_at = earliest_available + timedelta(minutes=entry.estimated_duration_minutes)
        
        charger_available_times[0] = entry.estimated_end_at
        
    db.commit()


def check_and_start_sessions(db: Session, station_id: str):
    """
    Checks if there are available chargers and waiting vehicles.
    If so, transitions WAITING vehicles to CHARGING automatically (for simulation purposes).
    """
    now = datetime.utcnow()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return
        
    active_sessions_count = db.query(ChargingSession).filter(
        ChargingSession.station_id == station_id,
        ChargingSession.status == "CHARGING"
    ).count()
    
    available_chargers = station.charger_count - active_sessions_count
    
    if available_chargers > 0:
        waiting_entries = db.query(QueueEntry).filter(
            QueueEntry.station_id == station_id,
            QueueEntry.status == "WAITING"
        ).order_by(QueueEntry.joined_at).limit(available_chargers).all()
        
        for entry in waiting_entries:
            # Create a session
            new_session = ChargingSession(
                station_id=station_id,
                charger_id=0, # Simplified
                vehicle_id=entry.vehicle_id,
                start_soc=20.0, # Simplified
                target_soc=80.0, # Simplified
                started_at=now,
                estimated_duration_minutes=entry.estimated_duration_minutes,
                estimated_end_at=now + timedelta(minutes=entry.estimated_duration_minutes),
                status="CHARGING"
            )
            db.add(new_session)
            
            entry.status = "CHARGING"
            
        db.commit()
        recalculate_queue(db, station_id)
