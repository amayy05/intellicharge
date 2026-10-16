"""
SQLAlchemy ORM models for Charging Station.
"""

from sqlalchemy import String, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    operator: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    city_region: Mapped[str] = mapped_column(String, nullable=False, index=True)
    connector_types: Mapped[str] = mapped_column(Text, nullable=False)  # Comma-separated or JSON list
    charger_count: Mapped[int] = mapped_column(Integer, default=4)
    power_kw: Mapped[float] = mapped_column(Float, default=50.0)
    pricing_per_kwh: Mapped[float] = mapped_column(Float, default=16.0)
    amenities: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    source: Mapped[str] = mapped_column(String, default="OpenChargeMap")
