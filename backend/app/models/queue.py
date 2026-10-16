"""
SQLAlchemy ORM model for synthetic historical queue snapshots.
"""

from sqlalchemy import Integer, String, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class QueueSnapshot(Base):
    __tablename__ = "queue_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp: Mapped[str] = mapped_column(String, nullable=False, index=True)
    hour_of_day: Mapped[int] = mapped_column(Integer, nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    occupied_chargers: Mapped[int] = mapped_column(Integer, nullable=False)
    wait_minutes: Mapped[float] = mapped_column(Float, nullable=False)


Index("idx_station_time", QueueSnapshot.station_id, QueueSnapshot.timestamp)
