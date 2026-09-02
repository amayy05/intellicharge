"""
SQLAlchemy ORM model for Queue Entries.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, index=True, nullable=False)
    vehicle_id = Column(Integer, index=True, nullable=False)
    
    session_id = Column(Integer, nullable=True) # Optional link to the actual session if assigned

    joined_at = Column(DateTime, default=datetime.utcnow)

    estimated_duration_minutes = Column(Float, nullable=False)
    estimated_start_at = Column(DateTime, nullable=True)
    estimated_end_at = Column(DateTime, nullable=True)

    status = Column(String, nullable=False, default="WAITING") # WAITING, ASSIGNED, CHARGING, COMPLETED, CANCELLED, EXPIRED
    priority = Column(Integer, default=0)
