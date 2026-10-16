"""
SQLAlchemy ORM model for Charging Sessions.
"""
from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from app.core.database import Base

class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    charger_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    vehicle_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    start_soc: Mapped[float] = mapped_column(Float, nullable=False)
    target_soc: Mapped[float] = mapped_column(Float, nullable=False)

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    estimated_end_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    actual_end_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    estimated_duration_minutes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_duration_minutes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default="WAITING") # WAITING, CHARGING, COMPLETED, CANCELLED
