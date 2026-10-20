"""
Pydantic schemas for Stations.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

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
    model_config = ConfigDict(from_attributes=True)


class StationWaitPrediction(BaseModel):
    station_id: str
    station_name: Optional[str] = None
    arrival_time: str
    predicted_wait_minutes: float
    congestion_level: str
    color_code: str
    status_text: str
    # "model" = trained ML inference; "heuristic" = time-of-day estimate (no false accuracy %)
    confidence_source: str = "heuristic"
    prediction_source: str = "heuristic"
    waiting_vehicles: int = 0
    planned_requests: int = 0
    operator_verified: bool = False
    disclaimer: str = (
        "Virtual estimate only — this does not reserve a physical charger. "
        "Station availability is not confirmed by the operator."
    )
    model_config = ConfigDict(from_attributes=True)


class HourlyWaitForecast(BaseModel):
    hour: int
    hour_label: str
    arrival_time: str
    predicted_wait_minutes: float
    congestion_level: str
    color_code: str


class Station24hForecast(BaseModel):
    station_id: str
    station_name: Optional[str] = None
    generated_at: str
    confidence_source: str = "heuristic"
    current_wait_minutes: float
    peak_wait_minutes: float
    peak_hour_label: Optional[str] = None
    hours: List[HourlyWaitForecast]
