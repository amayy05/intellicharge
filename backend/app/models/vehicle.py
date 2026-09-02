"""
SQLAlchemy ORM model for EV Vehicles.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class EVVehicle(Base):
    __tablename__ = "ev_vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True, default="demo_user")
    model_name = Column(String, nullable=False)
    battery_capacity_kwh = Column(Float, nullable=False)
    max_charging_power_kw = Column(Float, nullable=False)
    connector_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
