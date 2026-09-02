from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.session import ChargingSession
from app.services.queue_engine import recalculate_queue

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/{session_id}/complete")
def complete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = "COMPLETED"
    session.actual_end_at = datetime.utcnow()
    db.commit()
    
    # Recalculate queue and possibly start the next waiting vehicle
    from app.services.queue_engine import check_and_start_sessions
    check_and_start_sessions(db, session.station_id)
    recalculate_queue(db, session.station_id)
    
    return {"status": "success", "message": "Session completed"}
