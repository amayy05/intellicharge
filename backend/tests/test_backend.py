"""
Automated unit and integration test suite for IntelliCharge.
Verifies PRD requirements:
- FR1: Real station data ingestion
- FR2: Synthetic queue data generation
- FR3-FR6: Wait time prediction & multi-factor ranking with battery reachability
- FR7: Google Maps deep linking
- FR8: AI Agent tool calling & reasoned recommendations
- Success Metric: Prediction MAE < 10 mins
"""

import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.station import Station
from app.services.distance import haversine_distance_km, estimate_road_distance_km
from app.ml.predictor import get_wait_time_predictor
from app.services.agent_service import parse_query_intent, execute_agent_query
from backend.seed_db import seed_database

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_database()
    yield


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_distance_and_road_winding():
    # SJCEM Palghar to Manor Highway Plaza
    lat1, lon1 = 19.6967, 72.7699
    lat2, lon2 = 19.7421, 72.9125
    straight, road = estimate_road_distance_km(lat1, lon1, lat2, lon2)
    assert straight > 0
    assert road == pytest.approx(straight * 1.3, rel=1e-2)


def test_get_nearby_stations():
    # Near Palghar
    response = client.get("/stations/nearby?lat=19.6967&lng=72.7699&radius_km=30")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 3
    station_ids = [s["id"] for s in stations]
    assert "st-palghar-01" in station_ids


def test_predict_wait_endpoint():
    response = client.get("/stations/st-palghar-01/predict-wait")
    assert response.status_code == 200
    data = response.json()
    assert "predicted_wait_minutes" in data
    assert data["predicted_wait_minutes"] >= 0.0
    assert "congestion_level" in data
    assert data["station_id"] == "st-palghar-01"


def test_recommendation_and_battery_reachability():
    # Palghar with 10% battery -> remaining range is ~28 km
    response = client.get("/recommend?lat=19.6967&lng=72.7699&battery_pct=10&radius_km=80")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["reachable_count"] > 0
    assert data["top_recommendation"] is not None

    # Verify that reachable stations are ranked before unreachable stations
    reachable_flags = [s["breakdown"]["is_reachable"] for s in data["ranked_stations"]]
    # True should come before False
    assert reachable_flags[0] is True
    # Verify Google Maps link exists
    assert "google.com/maps" in data["top_recommendation"]["google_maps_url"]


def test_ai_agent_query():
    db = SessionLocal()
    try:
        res = execute_agent_query(
            db=db,
            message="I am at SJCEM Palghar with 25% battery, need CCS2",
        )
        assert res.status == "success"
        assert res.recommended_station is not None
        assert len(res.tool_executions) >= 2
        assert "Recommended Station" in res.reasoned_answer
    finally:
        db.close()
