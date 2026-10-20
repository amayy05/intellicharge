"""
Automated unit and integration test suite for IntelliCharge Virtual Queue & Prediction MVP.
Tests:
1. Valid station + valid vehicle creates a planned request.
2. A planned request is not counted as currently waiting before check-in.
3. Check-in changes the entry into the station's virtual waiting queue.
4. Cancellation removes it from active queue counts and causes recalculation.
5. Completed/cancelled/expired entries are excluded from active queue calculations.
6. Validation errors: invalid station, invalid vehicle, invalid SOC, target <= current SOC,
   invalid timestamp, wrong station ID, and unauthorized ownership fail safely.
7. Connector incompatibility is surfaced correctly.
8. Per-station queue isolation: Station A requests do not affect Station B.
9. Multi-charger scheduling handles both idle and busy chargers independently.
10. Charging duration uses station power and vehicle limit (not hardcoded 50 kW).
11. Duplicate check-in / cancel events are idempotent and do not corrupt state.
12. ML and heuristic fallback produce valid non-negative results with correct source labels.
13. Ten-user scenario across two stations verifying isolation, consistency, and idempotency.

Uses an isolated temporary SQLite database to avoid touching or modifying backend/intellicharge.db.
"""

import os
import sys
import tempfile
from pathlib import Path
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.station import Station
from app.models.vehicle import EVVehicle
from app.models.queue_entry import QueueEntry
from app.models.session import ChargingSession
from app.services.charging_math import (
    calculate_charging_duration_minutes,
    check_connector_compatibility,
)
from app.services.queue_engine import (
    get_station_queue_status,
    estimate_queue_wait_time,
    recalculate_queue,
)
from app.ml.predictor import get_wait_time_predictor


@pytest.fixture(scope="module")
def test_env():
    temp_file = tempfile.NamedTemporaryFile(suffix="_test_vq.db", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    test_engine = create_engine(
        f"sqlite:///{temp_path}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    db = TestingSessionLocal()
    try:
        # Station A: 2 chargers, 60 kW, CCS2 & Type 2
        st_a = Station(
            id="st-iso-01",
            name="Palghar Super Fast Hub",
            operator="Tata Power",
            latitude=19.6967,
            longitude=72.7699,
            address="Station Road, Palghar West",
            city_region="Palghar",
            connector_types="CCS2,Type 2",
            charger_count=2,
            power_kw=60.0,
            pricing_per_kwh=18.0,
            amenities="[]",
        )
        # Station B: 4 chargers, 30 kW, Type 2 only
        st_b = Station(
            id="st-iso-02",
            name="Boisar MIDC Green Hub",
            operator="Statiq",
            latitude=19.8032,
            longitude=72.7541,
            address="MIDC Road, Boisar",
            city_region="Palghar",
            connector_types="Type 2",
            charger_count=4,
            power_kw=30.0,
            pricing_per_kwh=15.0,
            amenities="[]",
        )
        db.add_all([st_a, st_b])

        # Users
        u1 = User(id=1, email="driver1@example.com", hashed_password=get_password_hash("pass1"), name="Driver One")
        u2 = User(id=2, email="driver2@example.com", hashed_password=get_password_hash("pass2"), name="Driver Two")
        demo_u = User(id=99, email="demo@intellicharge.ai", hashed_password=get_password_hash("password123"), name="Demo Driver")
        db.add_all([u1, u2, demo_u])
        db.commit()

        # Vehicles
        v1 = EVVehicle(id=1, user_id=1, model_name="Nexon EV Max", battery_capacity_kwh=40.5, max_charging_power_kw=50.0, connector_type="CCS2")
        v2 = EVVehicle(id=2, user_id=2, model_name="Tiago EV", battery_capacity_kwh=24.0, max_charging_power_kw=30.0, connector_type="CCS2")
        v3 = EVVehicle(id=3, user_id=1, model_name="Mahindra XUV400", battery_capacity_kwh=39.4, max_charging_power_kw=50.0, connector_type="CHAdeMO")
        db.add_all([v1, v2, v3])
        db.commit()
    finally:
        db.close()

    yield {
        "client": client,
        "SessionLocal": TestingSessionLocal,
        "engine": test_engine,
        "tokens": {
            1: create_access_token(1),
            2: create_access_token(2),
        }
    }

    app.dependency_overrides.clear()
    try:
        os.unlink(temp_path)
    except Exception:
        pass


@pytest.fixture(autouse=True)
def clean_queue_and_sessions(test_env):
    """Ensure each test runs with a completely clean queue state."""
    SessionLocal = test_env["SessionLocal"]
    db = SessionLocal()
    try:
        db.query(QueueEntry).delete()
        db.query(ChargingSession).delete()
        db.commit()
    finally:
        db.close()


# -------------------------------------------------------------------------
# Test 1 & 2: Valid planned request creation and queue separation
# -------------------------------------------------------------------------
def test_create_planned_request_and_queue_separation(test_env):
    client = test_env["client"]
    token = test_env["tokens"][1]
    headers = {"Authorization": f"Bearer {token}"}

    future_time = (datetime.now(timezone.utc) + timedelta(minutes=45)).isoformat()

    res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={
            "vehicle_id": 1,
            "current_soc": 20.0,
            "target_soc": 80.0,
            "expected_arrival_at": future_time,
        },
        headers=headers,
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "success"
    assert data["entry_status"] == "PLANNED"
    assert data["station_id"] == "st-iso-01"
    assert data["vehicle_id"] == 1
    assert data["estimated_duration_minutes"] > 0
    assert data["operator_verified"] is False
    assert "Virtual estimate only" in data["disclaimer"]

    # Verify that PLANNED request is NOT counted as physically waiting in queue status
    status_res = client.get("/stations/st-iso-01/queue")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["waiting_vehicles"] == 0
    assert status_data["planned_requests"] == 1
    assert status_data["operator_verified"] is False


# -------------------------------------------------------------------------
# Test 3: Check-in transitions to virtual waiting queue
# -------------------------------------------------------------------------
def test_check_in_transitions_to_waiting_queue(test_env):
    client = test_env["client"]
    token = test_env["tokens"][1]
    headers = {"Authorization": f"Bearer {token}"}

    future_time = (datetime.now(timezone.utc) + timedelta(minutes=45)).isoformat()
    plan_res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={
            "vehicle_id": 1,
            "current_soc": 20.0,
            "target_soc": 80.0,
            "expected_arrival_at": future_time,
        },
        headers=headers,
    )
    assert plan_res.status_code == 200
    entry_id = plan_res.json()["queue_entry_id"]

    # Driver arrives at station and checks in
    checkin_res = client.post(f"/stations/st-iso-01/queue/{entry_id}/check-in", headers=headers)
    assert checkin_res.status_code == 200, checkin_res.text
    checkin_data = checkin_res.json()
    assert checkin_data["entry_status"] == "WAITING"
    assert checkin_data["checked_in_at"] is not None

    # Verify queue status now reflects 1 waiting vehicle and 0 planned requests
    status_res = client.get("/stations/st-iso-01/queue")
    status_data = status_res.json()
    assert status_data["waiting_vehicles"] == 1
    assert status_data["planned_requests"] == 0


# -------------------------------------------------------------------------
# Test 4: Cancellation removes from queue and recalculates
# -------------------------------------------------------------------------
def test_cancellation_removes_from_active_queue(test_env):
    client = test_env["client"]
    token = test_env["tokens"][1]
    headers = {"Authorization": f"Bearer {token}"}

    join_res = client.post(
        "/stations/st-iso-01/queue/join",
        json={"vehicle_id": 1, "current_soc": 20.0, "target_soc": 80.0},
        headers=headers,
    )
    assert join_res.status_code == 200
    entry_id = join_res.json()["queue_entry_id"]

    # Verify 1 waiting
    assert client.get("/stations/st-iso-01/queue").json()["waiting_vehicles"] == 1

    # Cancel request
    cancel_res = client.post(f"/stations/st-iso-01/queue/{entry_id}/leave", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "success"

    # Queue status must now show 0 waiting vehicles
    status_res = client.get("/stations/st-iso-01/queue")
    status_data = status_res.json()
    assert status_data["waiting_vehicles"] == 0
    assert status_data["planned_requests"] == 0


# -------------------------------------------------------------------------
# Test 5: Completed/cancelled/expired entries are excluded from active counts
# -------------------------------------------------------------------------
def test_terminal_entries_excluded_from_counts(test_env):
    SessionLocal = test_env["SessionLocal"]
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        e_comp = QueueEntry(
            station_id="st-iso-01",
            vehicle_id=1,
            user_id=1,
            status="COMPLETED",
            joined_at=now - timedelta(hours=2),
            estimated_duration_minutes=30.0,
        )
        e_exp = QueueEntry(
            station_id="st-iso-01",
            vehicle_id=1,
            user_id=1,
            status="EXPIRED",
            joined_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=2),
            estimated_duration_minutes=30.0,
        )
        e_canc = QueueEntry(
            station_id="st-iso-01",
            vehicle_id=1,
            user_id=1,
            status="CANCELLED",
            joined_at=now - timedelta(hours=1),
            estimated_duration_minutes=30.0,
        )
        db.add_all([e_comp, e_exp, e_canc])
        db.commit()

        status_data = get_station_queue_status(db, "st-iso-01")
        assert status_data["waiting_vehicles"] == 0
        assert status_data["planned_requests"] == 0
    finally:
        db.close()


# -------------------------------------------------------------------------
# Test 6: Input validation, timestamps, SOC bounds, ownership, and errors
# -------------------------------------------------------------------------
def test_validations_and_error_handling(test_env):
    client = test_env["client"]
    token1 = test_env["tokens"][1]
    token2 = test_env["tokens"][2]

    # 1. Non-existent station
    res = client.post("/stations/invalid-station-xyz/queue/join", json={"vehicle_id": 1, "current_soc": 20, "target_soc": 80})
    assert res.status_code == 404

    # 2. Non-existent vehicle
    res = client.post("/stations/st-iso-01/queue/join", json={"vehicle_id": 99999, "current_soc": 20, "target_soc": 80})
    assert res.status_code == 404

    # 3. SOC out of range (< 0)
    res = client.post("/stations/st-iso-01/queue/join", json={"vehicle_id": 1, "current_soc": -5, "target_soc": 80})
    assert res.status_code == 422

    # 4. Target SOC <= Current SOC
    res = client.post("/stations/st-iso-01/queue/join", json={"vehicle_id": 1, "current_soc": 80, "target_soc": 80})
    assert res.status_code == 422

    res = client.post("/stations/st-iso-01/queue/join", json={"vehicle_id": 1, "current_soc": 80, "target_soc": 50})
    assert res.status_code == 422

    # 5. Invalid expected_arrival timestamp in distant past
    past_ts = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={"vehicle_id": 1, "current_soc": 20, "target_soc": 80, "expected_arrival_at": past_ts},
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 422

    # 6. IDOR / Ownership check: User 2 attempting to operate with User 1's vehicle
    res = client.post(
        "/stations/st-iso-01/queue/join",
        json={"vehicle_id": 1, "current_soc": 20, "target_soc": 80},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert res.status_code == 403

    # 7. Wrong station ID in check-in
    create_res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={"vehicle_id": 2, "current_soc": 20, "target_soc": 80},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert create_res.status_code == 200
    entry_id = create_res.json()["queue_entry_id"]

    # Try to check in at st-iso-02 using st-iso-01's entry ID
    mismatch_res = client.post(
        f"/stations/st-iso-02/queue/{entry_id}/check-in",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert mismatch_res.status_code == 400

    # User 1 attempting to cancel User 2's entry -> 403
    unauth_cancel = client.post(
        f"/stations/st-iso-01/queue/{entry_id}/leave",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert unauth_cancel.status_code == 403


# -------------------------------------------------------------------------
# Test 7: Connector incompatibility is surfaced correctly
# -------------------------------------------------------------------------
def test_connector_incompatibility_surfaced(test_env):
    client = test_env["client"]
    token = test_env["tokens"][1]
    headers = {"Authorization": f"Bearer {token}"}

    # Vehicle 3 has CHAdeMO connector, st-iso-01 only supports CCS2 and Type 2
    res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={"vehicle_id": 3, "current_soc": 20, "target_soc": 80},
        headers=headers,
    )
    assert res.status_code == 422
    assert "Connector incompatibility" in res.json()["detail"]


# -------------------------------------------------------------------------
# Test 8: Per-station queue isolation
# -------------------------------------------------------------------------
def test_per_station_queue_isolation(test_env):
    client = test_env["client"]
    token = test_env["tokens"][1]
    headers = {"Authorization": f"Bearer {token}"}

    # Record baseline for Station B
    init_b = client.get("/stations/st-iso-02/queue").json()

    # Join queue at Station A (immediate)
    res_a = client.post(
        "/stations/st-iso-01/queue/join",
        json={"vehicle_id": 1, "current_soc": 30, "target_soc": 80},
        headers=headers,
    )
    assert res_a.status_code == 200

    # Verify Station A changed
    stat_a = client.get("/stations/st-iso-01/queue").json()
    assert stat_a["waiting_vehicles"] == 1

    # Verify Station B queue and wait time DID NOT CHANGE AT ALL
    stat_b = client.get("/stations/st-iso-02/queue").json()
    assert stat_b["waiting_vehicles"] == init_b["waiting_vehicles"]
    assert stat_b["planned_requests"] == init_b["planned_requests"]
    assert stat_b["estimated_wait_minutes"] == init_b["estimated_wait_minutes"]


# -------------------------------------------------------------------------
# Test 9: Multi-charger scheduling
# -------------------------------------------------------------------------
def test_multi_charger_scheduling(test_env):
    SessionLocal = test_env["SessionLocal"]
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        # Station st-iso-01 has 2 chargers.
        # Simulate Charger 0 busy for 15 mins, Charger 1 busy for 30 mins.
        s0 = ChargingSession(
            station_id="st-iso-01",
            charger_id=0,
            vehicle_id=1,
            start_soc=20,
            target_soc=80,
            started_at=now,
            estimated_duration_minutes=15.0,
            estimated_end_at=now + timedelta(minutes=15),
            status="CHARGING",
        )
        s1 = ChargingSession(
            station_id="st-iso-01",
            charger_id=1,
            vehicle_id=2,
            start_soc=20,
            target_soc=80,
            started_at=now,
            estimated_duration_minutes=30.0,
            estimated_end_at=now + timedelta(minutes=30),
            status="CHARGING",
        )
        db.add_all([s0, s1])
        db.commit()

        # A new vehicle arriving needs 30 mins charge.
        # It should wait for the EARLIEST charger to become free (~15 mins),
        # NOT the sum of both chargers (15 + 30 = 45 mins)!
        wait_time, start_time = estimate_queue_wait_time(db, "st-iso-01", 30.0)
        assert 14.0 <= wait_time <= 16.0

        # Now suppose only 1 charger is busy and 1 charger is completely idle
        s0.status = "COMPLETED"
        db.commit()
        wait_time_idle, _ = estimate_queue_wait_time(db, "st-iso-01", 30.0)
        assert wait_time_idle == 0.0
    finally:
        db.close()


# -------------------------------------------------------------------------
# Test 10: Charging duration uses station power and vehicle limit
# -------------------------------------------------------------------------
def test_charging_duration_calculation_logic():
    # 1. Vehicle max 30 kW, Station 60 kW -> Effective power is 30 kW
    dur_30kw = calculate_charging_duration_minutes(
        battery_capacity_kwh=30.0,
        current_soc=0.0,
        target_soc=100.0,
        vehicle_max_power_kw=30.0,
        charger_power_kw=60.0,
        efficiency_factor=1.0,
    )
    # 30 kWh / 30 kW = 1 hour = 60 minutes
    assert dur_30kw == 60.0

    # 2. Vehicle max 100 kW, Station 50 kW -> Effective power is 50 kW
    dur_50kw = calculate_charging_duration_minutes(
        battery_capacity_kwh=30.0,
        current_soc=0.0,
        target_soc=100.0,
        vehicle_max_power_kw=100.0,
        charger_power_kw=50.0,
        efficiency_factor=1.0,
    )
    # 30 kWh / 50 kW = 0.6 hours = 36 minutes
    assert dur_50kw == 36.0

    # 3. Invalid parameters raise ValueError
    with pytest.raises(ValueError):
        calculate_charging_duration_minutes(30.0, -10, 80, 50, 50)
    with pytest.raises(ValueError):
        calculate_charging_duration_minutes(30.0, 50, 30, 50, 50)
    with pytest.raises(ValueError):
        calculate_charging_duration_minutes(-30.0, 20, 80, 50, 50)


# -------------------------------------------------------------------------
# Test 11: Idempotency of check-in and cancel events
# -------------------------------------------------------------------------
def test_idempotent_state_transitions(test_env):
    client = test_env["client"]
    token = test_env["tokens"][2]
    headers = {"Authorization": f"Bearer {token}"}

    # Create planned entry
    plan_res = client.post(
        "/stations/st-iso-01/queue/plan",
        json={"vehicle_id": 2, "current_soc": 25, "target_soc": 75},
        headers=headers,
    )
    entry_id = plan_res.json()["queue_entry_id"]

    # 1. Check in once
    checkin_1 = client.post(f"/stations/st-iso-01/queue/{entry_id}/check-in", headers=headers)
    assert checkin_1.status_code == 200
    assert checkin_1.json()["entry_status"] == "WAITING"

    # 2. Check in a second time (duplicate call) -> must be idempotent, return 200 without creating duplicate
    checkin_2 = client.post(f"/stations/st-iso-01/queue/{entry_id}/check-in", headers=headers)
    assert checkin_2.status_code == 200
    assert checkin_2.json()["entry_status"] == "WAITING"

    # Verify only 1 waiting vehicle in queue
    status_1 = client.get("/stations/st-iso-01/queue").json()
    assert status_1["waiting_vehicles"] == 1

    # 3. Cancel once
    cancel_1 = client.post(f"/stations/st-iso-01/queue/{entry_id}/leave", headers=headers)
    assert cancel_1.status_code == 200

    # 4. Cancel a second time (duplicate call) -> must be idempotent, return 200
    cancel_2 = client.post(f"/stations/st-iso-01/queue/{entry_id}/leave", headers=headers)
    assert cancel_2.status_code == 200
    assert "already cancelled" in cancel_2.json()["message"]


# -------------------------------------------------------------------------
# Test 12: Predictor model and heuristic paths produce valid results & labels
# -------------------------------------------------------------------------
def test_predictor_source_labels_and_non_negative():
    predictor = get_wait_time_predictor()
    now = datetime.now()

    res = predictor.predict(station_id="st-iso-01", arrival_time=now, charger_count=2)
    assert res["predicted_wait_minutes"] >= 0.0
    assert res["confidence_source"] in ("model", "heuristic")
    assert res["congestion_level"] in ("Low", "Moderate", "High", "Critical")
    assert res["color_code"] in ("green", "amber", "orange", "red")


# -------------------------------------------------------------------------
# Test 13: Ten-User Scenario
# -------------------------------------------------------------------------
def test_ten_user_scenario_across_two_stations(test_env):
    """
    Simulates 10 independent users and vehicles submitting planned requests
    across Station A (st-iso-01) and Station B (st-iso-02).
    Verifies:
    - 10 distinct request IDs
    - Correct station mapping and vehicle association
    - No queue leakage between stations
    - Consistent queue state transitions after check-in and cancellations
    - Non-negative wait estimates throughout
    """
    client = test_env["client"]
    SessionLocal = test_env["SessionLocal"]
    db = SessionLocal()

    # Create 10 distinct users and vehicles
    users_info = []
    try:
        for i in range(10, 20):
            u = User(id=i, email=f"driver{i}@example.com", hashed_password=get_password_hash("pass"), name=f"User {i}")
            ctype = "CCS2" if i < 15 else "Type 2"
            v = EVVehicle(
                id=i,
                user_id=i,
                model_name=f"EV Model {i}",
                battery_capacity_kwh=35.0,
                max_charging_power_kw=40.0,
                connector_type=ctype,
            )
            db.add_all([u, v])
            users_info.append({"user_id": i, "vehicle_id": i, "connector": ctype, "token": create_access_token(i)})
        db.commit()
    finally:
        db.close()

    station_a_users = users_info[:5] # users 10..14 for Station A (CCS2 supported)
    station_b_users = users_info[5:] # users 15..19 for Station B (Type 2 supported)

    created_requests = []
    now = datetime.now(timezone.utc)

    # 1. Submit 5 planned requests at Station A
    for idx, u in enumerate(station_a_users):
        future_arr = (now + timedelta(minutes=30 + idx * 10)).isoformat()
        res = client.post(
            "/stations/st-iso-01/queue/plan",
            json={
                "vehicle_id": u["vehicle_id"],
                "current_soc": 20.0 + idx * 5,
                "target_soc": 80.0,
                "expected_arrival_at": future_arr,
            },
            headers={"Authorization": f"Bearer {u['token']}"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["entry_status"] == "PLANNED"
        assert data["estimated_wait_minutes"] >= 0.0
        created_requests.append({"id": data["queue_entry_id"], "station": "st-iso-01", "user": u})

    # 2. Submit 5 planned requests at Station B
    for idx, u in enumerate(station_b_users):
        future_arr = (now + timedelta(minutes=30 + idx * 10)).isoformat()
        res = client.post(
            "/stations/st-iso-02/queue/plan",
            json={
                "vehicle_id": u["vehicle_id"],
                "current_soc": 15.0 + idx * 5,
                "target_soc": 85.0,
                "expected_arrival_at": future_arr,
            },
            headers={"Authorization": f"Bearer {u['token']}"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["entry_status"] == "PLANNED"
        assert data["estimated_wait_minutes"] >= 0.0
        created_requests.append({"id": data["queue_entry_id"], "station": "st-iso-02", "user": u})

    # Verify uniqueness of all 10 request IDs
    request_ids = [r["id"] for r in created_requests]
    assert len(request_ids) == 10
    assert len(set(request_ids)) == 10

    # Verify initial queue counts before check-ins:
    # Station A: 0 waiting, 5 planned
    # Station B: 0 waiting, 5 planned
    st_a_stat = client.get("/stations/st-iso-01/queue").json()
    st_b_stat = client.get("/stations/st-iso-02/queue").json()
    assert st_a_stat["waiting_vehicles"] == 0
    assert st_a_stat["planned_requests"] == 5
    assert st_b_stat["waiting_vehicles"] == 0
    assert st_b_stat["planned_requests"] == 5

    # 3. Simulate check-ins:
    # First 3 users at Station A check in
    for req in created_requests[:3]:
        cin = client.post(
            f"/stations/st-iso-01/queue/{req['id']}/check-in",
            headers={"Authorization": f"Bearer {req['user']['token']}"},
        )
        assert cin.status_code == 200
        assert cin.json()["entry_status"] == "WAITING"

    # First 2 users at Station B check in
    for req in created_requests[5:7]:
        cin = client.post(
            f"/stations/st-iso-02/queue/{req['id']}/check-in",
            headers={"Authorization": f"Bearer {req['user']['token']}"},
        )
        assert cin.status_code == 200
        assert cin.json()["entry_status"] == "WAITING"

    # Verify counts reflect check-ins without leakage:
    # Station A: 3 waiting, 2 planned
    # Station B: 2 waiting, 3 planned
    st_a_stat2 = client.get("/stations/st-iso-01/queue").json()
    st_b_stat2 = client.get("/stations/st-iso-02/queue").json()
    assert st_a_stat2["waiting_vehicles"] == 3
    assert st_a_stat2["planned_requests"] == 2
    assert st_b_stat2["waiting_vehicles"] == 2
    assert st_b_stat2["planned_requests"] == 3

    # 4. User cancels one request at Station A and one at Station B
    cancel_a = client.post(
        f"/stations/st-iso-01/queue/{created_requests[0]['id']}/leave",
        headers={"Authorization": f"Bearer {created_requests[0]['user']['token']}"},
    )
    assert cancel_a.status_code == 200

    cancel_b = client.post(
        f"/stations/st-iso-02/queue/{created_requests[5]['id']}/leave",
        headers={"Authorization": f"Bearer {created_requests[5]['user']['token']}"},
    )
    assert cancel_b.status_code == 200

    # Verify counts updated:
    # Station A waiting drops from 3 to 2
    # Station B waiting drops from 2 to 1
    st_a_stat3 = client.get("/stations/st-iso-01/queue").json()
    st_b_stat3 = client.get("/stations/st-iso-02/queue").json()
    assert st_a_stat3["waiting_vehicles"] == 2
    assert st_b_stat3["waiting_vehicles"] == 1

    # Verify repeated cancellations do not crash or corrupt
    cancel_a_repeat = client.post(
        f"/stations/st-iso-01/queue/{created_requests[0]['id']}/leave",
        headers={"Authorization": f"Bearer {created_requests[0]['user']['token']}"},
    )
    assert cancel_a_repeat.status_code == 200
    assert client.get("/stations/st-iso-01/queue").json()["waiting_vehicles"] == 2
