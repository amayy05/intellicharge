"""
Pydantic schemas for Multi-Factor Station Recommendation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    lat: float = Field(..., description="User current latitude")
    lng: float = Field(..., description="User current longitude")
    battery_pct: float = Field(..., ge=1, le=100, description="Current EV battery percentage (1-100)")
    radius_km: Optional[float] = Field(50.0, description="Search radius in kilometers")
    connector_type: Optional[str] = Field(None, description="Required connector type e.g. CCS2, Type 2")


class StationScoreBreakdown(BaseModel):
    predicted_wait_minutes: float
    straight_distance_km: float
    road_distance_km: float
    travel_time_minutes: float
    total_time_minutes: float  # wait + travel
    composite_score: float
    is_reachable: bool
    remaining_range_km: float
    battery_after_arrival_pct: float
    is_closest: bool
    time_saved_vs_closest_min: float


class RankedStationCard(BaseModel):
    rank: int
    station_id: str
    station_name: str
    operator: str
    address: str
    city_region: str
    latitude: float
    longitude: float
    connector_types: List[str]
    charger_count: int
    power_kw: float
    pricing_per_kwh: float
    amenities: List[str]
    breakdown: StationScoreBreakdown
    recommendation_tag: Optional[str] = None  # e.g., "Best Overall Choice", "Fastest Total Time", "Closest"
    google_maps_url: str


class RecommendationResponse(BaseModel):
    status: str = "success"
    user_location: dict
    battery_pct: float
    estimated_range_km: float
    total_found: int
    reachable_count: int
    top_recommendation: Optional[RankedStationCard] = None
    ranked_stations: List[RankedStationCard]
    summary_insight: str
