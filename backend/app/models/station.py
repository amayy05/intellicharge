"""
SQLAlchemy ORM models for Charging Station.
"""

from sqlalchemy import Column, String, Float, Integer, Text
from app.core.database import Base


class Station(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    operator = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    city_region = Column(String, nullable=False, index=True)
    connector_types = Column(Text, nullable=False)  # Comma-separated or JSON list
    charger_count = Column(Integer, default=4)
    power_kw = Column(Float, default=50.0)
    pricing_per_kwh = Column(Float, default=16.0)
    amenities = Column(Text, default="[]")  # JSON string
    source = Column(String, default="OpenChargeMap")
