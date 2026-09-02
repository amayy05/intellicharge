"""
SQLAlchemy ORM model for Charging Sessions.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, index=True, nullable=False)
    charger_id = Column(Integer, index=True, nullable=False)
    vehicle_id = Column(Integer, index=True, nullable=False)

    start_soc = Column(Float, nullable=False)
    target_soc = Column(Float, nullable=False)

    started_at = Column(DateTime, nullable=True)
    estimated_end_at = Column(DateTime, nullable=True)
    actual_end_at = Column(DateTime, nullable=True)

    estimated_duration_minutes = Column(Float, nullable=True)
    actual_duration_minutes = Column(Float, nullable=True)

    status = Column(String, nullable=False, default="WAITING") # WAITING, CHARGING, COMPLETED, CANCELLED
