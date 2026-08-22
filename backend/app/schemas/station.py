"""
Pydantic schemas for Stations.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class StationBase(BaseModel):
    id: str
    name: str
    operator: str
    latitude: float
    longitude: float
    address: str
    city_region: str
    connector_types: List[str]
    charger_count: int
    power_kw: float
    pricing_per_kwh: float
    amenities: List[str]
    source: str = "OpenChargeMap"


class StationResponse(StationBase):
    class Config:
        from_attributes = True


class StationWaitPrediction(BaseModel):
    station_id: str
    station_name: str
    arrival_time: str
    predicted_wait_minutes: float
    congestion_level: str
    color_code: str
    status_text: str
    confidence_pct: float
