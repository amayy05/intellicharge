"""
SQLAlchemy ORM model for Queue Entries.
"""
from sqlalchemy import Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from typing import Optional
from app.core.database import Base

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    vehicle_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    # Owner reference — required for authorization checks (IDOR prevention)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, index=True, nullable=True)

    session_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Optional link to the actual session if assigned

    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    expected_arrival_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    current_soc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_soc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    estimated_duration_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_start_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    estimated_end_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default="WAITING")  # PLANNED, WAITING, ASSIGNED, CHARGING, COMPLETED, CANCELLED, EXPIRED
    priority: Mapped[int] = mapped_column(Integer, default=0)
