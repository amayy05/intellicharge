"""
Service for simulating time passing in the queue system.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.session import ChargingSession
from app.models.queue_entry import QueueEntry
from app.services.queue_engine import check_and_start_sessions, recalculate_queue

def advance_time(db: Session, minutes: float):
    """
    Simulates the passage of time.
    Completes sessions that should be finished and starts new ones.
    """
    now = datetime.utcnow()
    # We pretend "now" is now, but things might have ended in the past relative to the simulation
    # Actually, the simplest way to simulate time passage on actual DB records is to reduce the 
    # estimated/actual end times and start times by `minutes`.
    
    delta = timedelta(minutes=minutes)
    
    # 1. Update active sessions: shift their started_at and estimated_end_at backward in time
    active_sessions = db.query(ChargingSession).filter(ChargingSession.status == "CHARGING").all()
    for session in active_sessions:
        if session.started_at:
            session.started_at = session.started_at - delta
        if session.estimated_end_at:
            session.estimated_end_at = session.estimated_end_at - delta
            
            # If the session has ended
            if session.estimated_end_at <= now:
                session.status = "COMPLETED"
                session.actual_end_at = now
    
    # 2. Update queue entries
    waiting_entries = db.query(QueueEntry).filter(
        QueueEntry.status.in_(["WAITING", "ASSIGNED"])
    ).all()
    
    for entry in waiting_entries:
        if entry.joined_at:
            entry.joined_at = entry.joined_at - delta
            
    db.commit()
    
    # 3. Check for newly available chargers and start sessions
    # We need to get all distinct station IDs that had activity
    station_ids = set([s.station_id for s in active_sessions] + [e.station_id for e in waiting_entries])
    
    for sid in station_ids:
        check_and_start_sessions(db, sid)
        recalculate_queue(db, sid)
        
    db.commit()
