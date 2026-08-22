"""
API endpoint for Multi-Factor EV Charging Recommendation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.recommend import RecommendationResponse
from app.services.ranking import compute_station_recommendations

router = APIRouter(prefix="/recommend", tags=["Recommendation Engine"])


@router.get("", response_model=RecommendationResponse)
def get_recommendation(
    lat: float = Query(..., description="Current user latitude"),
    lng: float = Query(..., description="Current user longitude"),
    battery_pct: float = Query(..., ge=1, le=100, description="Current battery percentage (1-100)"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    connector_type: Optional[str] = Query(None, description="Preferred connector (CCS2, Type 2, CHAdeMO)"),
    db: Session = Depends(get_db),
):
    """
    Computes multi-factor EV charging station recommendations:
    - Filters out stations unreachable with current remaining battery.
    - Estimates driving transit time with 1.3x road winding factor.
    - Queries ML wait-time predictor for arrival-time queue congestion.
    - Ranks stations by weighted composite score and generates insights.
    """
    return compute_station_recommendations(
        db=db,
        user_lat=lat,
        user_lng=lng,
        battery_pct=battery_pct,
        radius_km=radius_km,
        connector_type=connector_type,
    )
