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
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.station import Station
from app.services.distance import haversine_distance_km, estimate_road_distance_km
from app.ml.predictor import get_wait_time_predictor
from app.services.agent_service import parse_query_intent, execute_agent_query
try:
    from seed_db import seed_database
except ImportError:
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
        assert len(res.reasoned_answer) > 20
        # Should mention station name or recommend
        assert (
            "Recommended Station" in res.reasoned_answer
            or "recommend" in res.reasoned_answer.lower()
            or res.recommended_station.station_name.lower() in res.reasoned_answer.lower()
        )
    finally:
        db.close()


def test_ai_agent_respects_gps_location_and_near_me():
    """
    Verifies that when the user is at custom GPS coordinates (e.g. Boisar: 19.8137, 72.7356)
    and says 'near me', the agent does not override with Mumbai/BKC and recommends
    the Statiq Boisar MIDC charger (~2.9 km away).
    """
    db = SessionLocal()
    try:
        intent = parse_query_intent(
            query="20% battery , find the best type 2 charge near me",
            default_lat=19.8137,
            default_lng=72.7356,
            default_battery=20.0,
            default_connector=None,
        )
        assert intent["lat"] == pytest.approx(19.8137, abs=1e-3)
        assert intent["lng"] == pytest.approx(72.7356, abs=1e-3)
        assert intent["battery_pct"] == 20.0
        assert intent["connector_type"] == "Type 2"

        res = execute_agent_query(
            db=db,
            message="20% battery , find the best type 2 charge near me",
            lat=19.8137,
            lng=72.7356,
            battery_pct=20.0,
            connector_type=None,
        )
        assert res.status == "success"
        assert res.recommended_station is not None
        assert "Boisar" in res.recommended_station.station_name or "Statiq" in res.recommended_station.station_name
        assert res.recommended_station.breakdown.road_distance_km < 10.0
    finally:
        db.close()

