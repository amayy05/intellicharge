"""
SQLAlchemy ORM model for EV Vehicles.
"""
from sqlalchemy import Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.core.database import Base

class EVVehicle(Base):
    __tablename__ = "ev_vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String, nullable=False)
    battery_capacity_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    max_charging_power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    connector_type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
