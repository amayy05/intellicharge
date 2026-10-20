"""
API endpoints for Charging Stations and Wait-Time Predictions.
"""

import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.station import Station
from app.schemas.station import (
    StationResponse,
    StationWaitPrediction,
    Station24hForecast,
    HourlyWaitForecast,
)
from app.ml.predictor import get_wait_time_predictor
from app.services.distance import estimate_road_distance_km

router = APIRouter(prefix="/stations", tags=["Stations"])


def _parse_amenities(raw: str) -> list:
    """Parse amenities from either JSON array or comma-separated string."""
    try:
        if raw.startswith("["):
            return json.loads(raw)
        return [a.strip() for a in raw.split(",") if a.strip()]
    except Exception:
        return []


def _station_to_response(st: Station) -> StationResponse:
    """Convert a Station ORM object to a StationResponse schema."""
    c_types = [c.strip() for c in st.connector_types.split(",") if c.strip()]
    amenities = _parse_amenities(st.amenities or "")
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
        if connector_type and connector_type.strip() and connector_type.strip().lower() != "all":
            c_types_lower = [c.strip().lower() for c in st.connector_types.split(",")]
            if connector_type.strip().lower() not in c_types_lower:
                continue

        straight_dist, _ = estimate_road_distance_km(lat, lng, st.latitude, st.longitude)
        if straight_dist <= radius_km:
            results.append(_station_to_response(st))

    return results


@router.get("/{station_id}", response_model=StationResponse)
def get_station_details(station_id: str, db: Session = Depends(get_db)):
    """Returns details for a single charging station by ID."""
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return _station_to_response(st)


@router.get("/{station_id}/predict-wait", response_model=StationWaitPrediction)
def predict_station_wait(
    station_id: str,
    arrival_ts: Optional[str] = Query(None, description="ISO arrival timestamp (e.g. 2026-08-22T18:30:00)"),
    db: Session = Depends(get_db),
):
    """
    Predicts expected queue wait time in minutes for an EV arriving at the specified time.
    Prediction source is labeled as 'model' (trained ML) or 'heuristic' (time-of-day estimate).
    """
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    arrival_dt = datetime.now()
    if arrival_ts:
        try:
            arrival_dt = datetime.fromisoformat(arrival_ts)
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid arrival_ts format. Use ISO 8601.")

    predictor = get_wait_time_predictor()
    pred_res = predictor.predict(
        station_id=station_id,
        arrival_time=arrival_dt,
        charger_count=st.charger_count,
        station_name=st.name,
    )

    return StationWaitPrediction(**pred_res)


@router.get("/{station_id}/forecast-24h", response_model=Station24hForecast)
def forecast_station_wait_24h(station_id: str, db: Session = Depends(get_db)):
    """Hourly wait-time forecast for the next 24 hours from the ML/heuristic predictor."""
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    predictor = get_wait_time_predictor()
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    hours: List[HourlyWaitForecast] = []
    peak_wait = -1.0
    peak_label = None
    confidence_source = "heuristic"

    for offset in range(24):
        arrival_dt = now + timedelta(hours=offset)
        pred = predictor.predict(
            station_id=station_id,
            arrival_time=arrival_dt,
            charger_count=st.charger_count,
            station_name=st.name,
        )
        confidence_source = pred.get("confidence_source", "heuristic")
        wait = float(pred["predicted_wait_minutes"])
        label = arrival_dt.strftime("%H:%M")
        if wait > peak_wait:
            peak_wait = wait
            peak_label = label
        hours.append(
            HourlyWaitForecast(
                hour=arrival_dt.hour,
                hour_label=label,
                arrival_time=pred["arrival_time"],
                predicted_wait_minutes=wait,
                congestion_level=pred["congestion_level"],
                color_code=pred["color_code"],
            )
        )

    current_wait = hours[0].predicted_wait_minutes if hours else 0.0
    return Station24hForecast(
        station_id=station_id,
        station_name=st.name,
        generated_at=datetime.now().isoformat(),
        confidence_source=confidence_source,
        current_wait_minutes=current_wait,
        peak_wait_minutes=max(0.0, peak_wait),
        peak_hour_label=peak_label,
        hours=hours,
    )
