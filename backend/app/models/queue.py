"""
SQLAlchemy ORM model for synthetic historical queue snapshots.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Index
from app.core.database import Base


class QueueSnapshot(Base):
    __tablename__ = "queue_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(String, nullable=False, index=True)
    hour_of_day = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    occupied_chargers = Column(Integer, nullable=False)
    wait_minutes = Column(Float, nullable=False)


Index("idx_station_time", QueueSnapshot.station_id, QueueSnapshot.timestamp)
