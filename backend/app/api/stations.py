"""
API endpoints for Charging Stations and Wait-Time Predictions.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.station import Station
from app.schemas.station import StationResponse, StationWaitPrediction
from app.ml.predictor import get_wait_time_predictor
from app.services.distance import estimate_road_distance_km

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("/nearby", response_model=List[StationResponse])
def get_nearby_stations(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    connector_type: Optional[str] = Query(None, description="Filter connector type e.g. CCS2, Type 2"),
    db: Session = Depends(get_db),
):
    """
    Returns real charging stations within the specified radius, optionally filtered by connector type.
    """
    stations = db.query(Station).all()
    results = []

    for st in stations:
        if connector_type and connector_type.strip():
            c_types = [c.strip().lower() for c in st.connector_types.split(",")]
            if connector_type.strip().lower() not in c_types:
                continue

        straight_dist, _ = estimate_road_distance_km(lat, lng, st.latitude, st.longitude)
        if straight_dist <= radius_km:
            c_types = [c.strip() for c in st.connector_types.split(",") if c.strip()]
            import json
            try:
                amenities = json.loads(st.amenities) if st.amenities.startswith("[") else [a.strip() for a in st.amenities.split(",")]
            except Exception:
                amenities = []

            results.append(
                StationResponse(
                    id=st.id,
                    name=st.name,
                    operator=st.operator,
                    latitude=st.latitude,
                    longitude=st.longitude,
                    address=st.address,
                    city_region=st.city_region,
                    connector_types=c_types,
                    charger_count=st.charger_count,
                    power_kw=st.power_kw,
                    pricing_per_kwh=st.pricing_per_kwh,
                    amenities=amenities,
                    source=st.source,
                )
            )

    return results


@router.get("/{station_id}", response_model=StationResponse)
def get_station_details(station_id: str, db: Session = Depends(get_db)):
    """Returns details for a single charging station by ID."""
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    import json
    c_types = [c.strip() for c in st.connector_types.split(",") if c.strip()]
    try:
        amenities = json.loads(st.amenities) if st.amenities.startswith("[") else [a.strip() for a in st.amenities.split(",")]
    except Exception:
        amenities = []

    return StationResponse(
        id=st.id,
        name=st.name,
        operator=st.operator,
        latitude=st.latitude,
        longitude=st.longitude,
        address=st.address,
        city_region=st.city_region,
        connector_types=c_types,
        charger_count=st.charger_count,
        power_kw=st.power_kw,
        pricing_per_kwh=st.pricing_per_kwh,
        amenities=amenities,
        source=st.source,
    )


@router.get("/{station_id}/predict-wait", response_model=StationWaitPrediction)
def predict_station_wait(
    station_id: str,
    arrival_ts: Optional[str] = Query(None, description="ISO arrival timestamp (e.g. 2026-08-22T18:30:00)"),
    db: Session = Depends(get_db),
):
    """
    Predicts expected queue wait time in minutes for an EV arriving at the specified time.
    """
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    arrival_dt = datetime.now()
    if arrival_ts:
        try:
            arrival_dt = datetime.fromisoformat(arrival_ts)
        except Exception:
            pass

    predictor = get_wait_time_predictor()
    pred_res = predictor.predict(
        station_id=station_id,
        arrival_time=arrival_dt,
        charger_count=st.charger_count,
    )

    return StationWaitPrediction(
        station_id=station_id,
        station_name=st.name,
        arrival_time=pred_res["arrival_time"],
        predicted_wait_minutes=pred_res["predicted_wait_minutes"],
        congestion_level=pred_res["congestion_level"],
        color_code=pred_res["color_code"],
        status_text=pred_res["status_text"],
        confidence_pct=pred_res["confidence_pct"],
    )
