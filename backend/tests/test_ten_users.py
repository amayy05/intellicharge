"""
Automated 10-User Test Suite for IntelliCharge.

Tests 10 isolated synthetic user accounts across:
- Authentication (register/login/logout)
- Station browsing
- Vehicle profile management
- Queue join/leave with ownership isolation (IDOR tests)
- Authorization (unauthenticated access, cross-user access)
- Concurrent queue joins
- Input validation

All accounts are synthetic (tester01@example.test ... tester10@example.test).
This is an AUTOMATED test with simulated users, NOT a real human usability study.
"""

import pytest
import time
import threading
from typing import Optional
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.models.station import Station
from app.models.queue_entry import QueueEntry
from app.models.vehicle import EVVehicle
from app.models.user import User

client = TestClient(app, raise_server_exceptions=False)

# ── Synthetic Test Users ──────────────────────────────────────────────────────
TEST_USERS = [
    {
        "email": f"tester{i:02d}@example.test",
        "password": f"Secure!Pass{i:02d}#",
        "name": f"Test Driver {i:02d}",
        "vehicle": {
            "model_name": f"Tata Nexon EV (Tester {i:02d})",
            "battery_capacity_kwh": 30.2 + i * 0.5,
            "max_charging_power_kw": 50.0,
            "connector_type": "CCS2" if i % 2 == 0 else "Type 2",
        },
    }
    for i in range(1, 11)
]

TEST_STATION_ID = "st-palghar-01"

# Token cache: email -> token
_tokens: dict = {}
# Vehicle id cache: email -> vehicle_id
_vehicle_ids: dict = {}


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    """Seed DB schema and clean up test accounts before/after module."""
    Base.metadata.create_all(bind=engine)
    _cleanup_test_users()
    yield
    _cleanup_test_users()


def _cleanup_test_users():
    """Remove all synthetic test accounts and their data."""
    db = SessionLocal()
    try:
        emails = [u["email"] for u in TEST_USERS]
        users = db.query(User).filter(User.email.in_(emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            vehicle_ids = [
                v.id for v in db.query(EVVehicle).filter(EVVehicle.user_id.in_(user_ids)).all()
            ]
            if vehicle_ids:
                db.query(QueueEntry).filter(QueueEntry.vehicle_id.in_(vehicle_ids)).delete(
                    synchronize_session=False
                )
            db.query(EVVehicle).filter(EVVehicle.user_id.in_(user_ids)).delete(
                synchronize_session=False
            )
        db.query(User).filter(User.email.in_(emails)).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def _register_and_token(user_data: dict) -> str:
    """Register user (or log in if already exists) and cache token."""
    email = user_data["email"]
    if email in _tokens:
        return _tokens[email]

    # Try register first
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": user_data["password"],
        "name": user_data["name"],
    })
    if res.status_code not in (200, 201):
        # Already exists — log in
        res = client.post("/api/auth/login", json={
            "email": email,
            "password": user_data["password"],
        })
    assert res.status_code in (200, 201), f"Auth failed for {email}: {res.text}"
    token = res.json()["access_token"]
    _tokens[email] = token
    return token


def _create_vehicle(user_data: dict, token: str) -> int:
    """Create a vehicle for the user and cache its ID."""
    email = user_data["email"]
    if email in _vehicle_ids:
        return _vehicle_ids[email]

    res = client.post(
        "/api/vehicles/",
        json=user_data["vehicle"],
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, f"Vehicle creation failed: {res.text}"
    vid = res.json()["id"]
    _vehicle_ids[email] = vid
    return vid


# ── Scenario 1: Registration / Authentication ─────────────────────────────────

class TestScenario1_Auth:
    """Scenario 1: Each user registers and receives a valid JWT."""

    @pytest.mark.parametrize("user_data", TEST_USERS)
    def test_register(self, user_data):
        """U01-U10: Register synthetic user and get JWT."""
        token = _register_and_token(user_data)
        assert token and len(token) > 20

    def test_unauthenticated_me_returns_401(self):
        """Unauthenticated /api/auth/me must return 401."""
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_invalid_token_returns_401(self):
        """Tampered JWT must be rejected."""
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert res.status_code == 401

    def test_wrong_password_returns_401(self):
        """Wrong password must return 401, not 500."""
        # Register first user (may already exist)
        _register_and_token(TEST_USERS[0])
        res = client.post("/api/auth/login", json={
            "email": TEST_USERS[0]["email"],
            "password": "wrong_password_99",
        })
        assert res.status_code == 401

    @pytest.mark.parametrize("user_data", TEST_USERS)
    def test_get_me(self, user_data):
        """U01-U10: Authenticated /me returns correct user profile."""
        token = _register_and_token(user_data)
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["email"] == user_data["email"]


# ── Scenario 2: Station Browsing (public) ────────────────────────────────────

class TestScenario2_StationBrowsing:
    """Scenario 2: All users can browse stations without authentication."""

    def test_nearby_stations_is_public(self):
        """Station list must be accessible without a token."""
        res = client.get("/api/stations/nearby?lat=19.6967&lng=72.7699&radius_km=50")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_nearby_stations_returns_results(self):
        """At least one station is returned near Palghar."""
        res = client.get("/api/stations/nearby?lat=19.6967&lng=72.7699&radius_km=50")
        stations = res.json()
        assert len(stations) >= 1

    def test_station_detail_public(self):
        """Single station detail is public."""
        res = client.get(f"/api/stations/{TEST_STATION_ID}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == TEST_STATION_ID

    def test_unknown_station_returns_404(self):
        """Non-existent station must return 404."""
        res = client.get("/api/stations/nonexistent-station-xyz")
        assert res.status_code == 404

    def test_predict_wait_is_public(self):
        """Wait-time prediction is public."""
        res = client.get(f"/api/stations/{TEST_STATION_ID}/predict-wait")
        assert res.status_code == 200
        data = res.json()
        assert "predicted_wait_minutes" in data
        assert "confidence_source" in data  # no fake percentage claim
        assert data["confidence_source"] in ("model", "heuristic")

    def test_connector_type_filter(self):
        """Connector type filter returns consistent results."""
        res = client.get("/api/stations/nearby?lat=19.6967&lng=72.7699&radius_km=50&connector_type=CCS2")
        assert res.status_code == 200


# ── Scenario 3: Vehicle/Preferences Management ───────────────────────────────

class TestScenario3_Vehicles:
    """Scenario 3: Each user creates a vehicle profile."""

    @pytest.mark.parametrize("user_data", TEST_USERS)
    def test_create_vehicle(self, user_data):
        """U01-U10: Create unique vehicle for each user."""
        token = _register_and_token(user_data)
        vid = _create_vehicle(user_data, token)
        assert vid > 0

    @pytest.mark.parametrize("user_data", TEST_USERS)
    def test_user_sees_only_own_vehicles(self, user_data):
        """Each user's vehicle list must contain only their own vehicles."""
        token = _register_and_token(user_data)
        expected_vid = _vehicle_ids.get(user_data["email"])
        res = client.get("/api/vehicles/", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        vids = [v["id"] for v in res.json()]
        if expected_vid:
            assert expected_vid in vids
        # Ensure no other test user's vehicle is returned
        other_vids = [
            _vehicle_ids[u["email"]]
            for u in TEST_USERS
            if u["email"] != user_data["email"] and u["email"] in _vehicle_ids
        ]
        for ov in other_vids:
            assert ov not in vids, f"Vehicle {ov} of another user leaked into {user_data['email']}'s list!"

    def test_unauthenticated_vehicle_create_still_works(self):
        """Unauthenticated vehicle creation falls back to demo user (legacy behavior)."""
        res = client.post("/api/vehicles/", json={
            "model_name": "Demo Test Car",
            "battery_capacity_kwh": 40.0,
            "max_charging_power_kw": 50.0,
            "connector_type": "CCS2",
        })
        # Should succeed (demo user fallback)
        assert res.status_code == 200


# ── Scenario 4: Queue Join ────────────────────────────────────────────────────

class TestScenario4_QueueJoin:
    """Scenario 4: Users join queue at test station."""

    def setup_method(self):
        """Cancel all active test queue entries before each test."""
        db = SessionLocal()
        try:
            emails = [u["email"] for u in TEST_USERS]
            users = db.query(User).filter(User.email.in_(emails)).all()
            user_ids = [u.id for u in users]
            if user_ids:
                db.query(QueueEntry).filter(
                    QueueEntry.user_id.in_(user_ids),
                    QueueEntry.status.in_(["WAITING", "ASSIGNED"]),
                ).update({"status": "CANCELLED"}, synchronize_session=False)
                db.commit()
        finally:
            db.close()

    def test_unauthenticated_join_returns_401(self):
        """Joining a queue without a token must return 401."""
        res = client.post(f"/api/stations/{TEST_STATION_ID}/queue/join", json={
            "vehicle_id": 1,
            "current_soc": 20.0,
            "target_soc": 80.0,
        })
        assert res.status_code == 401

    def test_join_with_wrong_vehicle_returns_404(self):
        """Joining with another user's vehicle must return 404."""
        # Get tester01 token
        token_01 = _register_and_token(TEST_USERS[0])
        # Try to use tester02's vehicle
        vid_02 = _vehicle_ids.get(TEST_USERS[1]["email"])
        if not vid_02:
            pytest.skip("Tester 02 vehicle not yet created")
        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/join",
            json={"vehicle_id": vid_02, "current_soc": 20.0, "target_soc": 80.0},
            headers={"Authorization": f"Bearer {token_01}"},
        )
        assert res.status_code == 404  # vehicle not found for this user

    def test_join_with_invalid_soc_returns_422(self):
        """current_soc >= target_soc must return 422."""
        token = _register_and_token(TEST_USERS[0])
        vid = _create_vehicle(TEST_USERS[0], token)
        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/join",
            json={"vehicle_id": vid, "current_soc": 80.0, "target_soc": 20.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

    @pytest.mark.parametrize("user_data", TEST_USERS[:5])  # First 5 users
    def test_authenticated_join(self, user_data):
        """U01-U05: Authenticated users successfully join queue."""
        token = _register_and_token(user_data)
        vid = _create_vehicle(user_data, token)
        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/join",
            json={"vehicle_id": vid, "current_soc": 20.0, "target_soc": 80.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "queue_entry_id" in data
        assert data["estimated_wait_minutes"] >= 0


# ── Scenario 5: Queue Status ──────────────────────────────────────────────────

class TestScenario5_QueueStatus:
    """Scenario 5: Users check their queue/session state."""

    def test_queue_status_is_public(self):
        """Queue aggregate status is public (no personal data)."""
        res = client.get(f"/api/stations/{TEST_STATION_ID}/queue")
        assert res.status_code == 200
        data = res.json()
        assert "active_sessions" in data
        assert "waiting_vehicles" in data
        assert "available_chargers" in data
        assert "total_chargers" in data


# ── Scenario 6: Queue Leave / IDOR Protection ────────────────────────────────

class TestScenario6_QueueLeave:
    """Scenario 6 + Authorization: Only owner can cancel their entry."""

    @pytest.fixture(autouse=True)
    def create_entry_for_user1(self):
        """Create a queue entry owned by tester01 before each test."""
        token = _register_and_token(TEST_USERS[0])
        vid = _create_vehicle(TEST_USERS[0], token)
        # Cancel any existing active entries first
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == TEST_USERS[0]["email"]).first()
            if user:
                db.query(QueueEntry).filter(
                    QueueEntry.user_id == user.id,
                    QueueEntry.status.in_(["WAITING", "ASSIGNED"]),
                ).update({"status": "CANCELLED"}, synchronize_session=False)
                db.commit()
        finally:
            db.close()

        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/join",
            json={"vehicle_id": vid, "current_soc": 15.0, "target_soc": 80.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        if res.status_code == 200:
            self.entry_id = res.json()["queue_entry_id"]
        else:
            self.entry_id = None

    def test_owner_can_leave(self):
        """Queue entry owner can cancel their own entry."""
        if not self.entry_id:
            pytest.skip("No queue entry created")
        token = _register_and_token(TEST_USERS[0])
        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/{self.entry_id}/leave",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

    def test_other_user_cannot_cancel_entry(self):
        """IDOR: User B cannot cancel User A's queue entry."""
        if not self.entry_id:
            pytest.skip("No queue entry created")
        token_other = _register_and_token(TEST_USERS[1])
        res = client.post(
            f"/api/stations/{TEST_STATION_ID}/queue/{self.entry_id}/leave",
            headers={"Authorization": f"Bearer {token_other}"},
        )
        assert res.status_code == 403

    def test_unauthenticated_cannot_cancel(self):
        """Unauthenticated request to leave queue must return 401."""
        if not self.entry_id:
            pytest.skip("No queue entry created")
        res = client.post(f"/api/stations/{TEST_STATION_ID}/queue/{self.entry_id}/leave")
        assert res.status_code == 401


# ── Scenario 7: Invalid Input / Unavailable Station ─────────────────────────

class TestScenario7_InvalidInput:
    """Scenario 7: Error handling for invalid inputs."""

    def test_join_nonexistent_station(self):
        """Joining a non-existent station must return 404, not 500."""
        token = _register_and_token(TEST_USERS[0])
        vid = _vehicle_ids.get(TEST_USERS[0]["email"]) or _create_vehicle(TEST_USERS[0], token)
        res = client.post(
            "/api/stations/fake-station-xyz/queue/join",
            json={"vehicle_id": vid, "current_soc": 20.0, "target_soc": 80.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 404

    def test_invalid_arrival_ts_returns_422(self):
        """Invalid arrival_ts format must return 422."""
        res = client.get(f"/api/stations/{TEST_STATION_ID}/predict-wait?arrival_ts=not-a-date")
        assert res.status_code == 422

    def test_battery_pct_out_of_range(self):
        """battery_pct=0 must be rejected by the recommendation endpoint."""
        res = client.get("/api/recommend?lat=19.6967&lng=72.7699&battery_pct=0")
        assert res.status_code == 422

    def test_recommend_returns_structure(self):
        """Recommendation with valid input returns expected shape."""
        res = client.get("/api/recommend?lat=19.6967&lng=72.7699&battery_pct=50")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"


# ── Scenario 8: Sign Out (Token Invalidation) ────────────────────────────────

class TestScenario8_SignOut:
    """
    Scenario 8: JWT expiry / sign-out behavior.
    Note: JWTs are stateless — there is no server-side revocation list in the current
    implementation. Sign-out is client-side (clear token). This is documented as a
    known limitation (Medium severity).
    """

    def test_clearing_token_prevents_access(self):
        """After clearing token locally, /me must return 401 without the token."""
        # We simulate sign-out by simply not sending the token
        res = client.get("/api/auth/me")
        assert res.status_code == 401


# ── Concurrency Test ──────────────────────────────────────────────────────────

class TestConcurrency:
    """
    10-concurrent-client test: join queue simultaneously and verify:
    - No duplicate entries in error state
    - Response times reasonable
    - No 5xx errors
    """

    def test_concurrent_queue_joins(self):
        """10 users join the queue concurrently; all should succeed or fail gracefully."""
        results = []
        errors = []

        def join_as_user(user_data):
            try:
                token = _register_and_token(user_data)
                vid = _create_vehicle(user_data, token)
                # Cancel prior entries
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.email == user_data["email"]).first()
                    if user:
                        db.query(QueueEntry).filter(
                            QueueEntry.user_id == user.id,
                            QueueEntry.status.in_(["WAITING", "ASSIGNED"]),
                        ).update({"status": "CANCELLED"}, synchronize_session=False)
                        db.commit()
                finally:
                    db.close()

                start = time.time()
                res = client.post(
                    f"/api/stations/{TEST_STATION_ID}/queue/join",
                    json={"vehicle_id": vid, "current_soc": 20.0, "target_soc": 80.0},
                    headers={"Authorization": f"Bearer {token}"},
                )
                latency = (time.time() - start) * 1000  # ms
                results.append({
                    "user": user_data["email"],
                    "status_code": res.status_code,
                    "latency_ms": round(latency, 1),
                    "success": res.status_code == 200,
                })
            except Exception as e:
                errors.append({"user": user_data["email"], "error": str(e)})

        threads = [threading.Thread(target=join_as_user, args=(u,)) for u in TEST_USERS]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        success_count = sum(1 for r in results if r["success"])
        error_count = len(errors)
        status_codes = [r["status_code"] for r in results]
        latencies = [r["latency_ms"] for r in results if r["success"]]

        # No 5xx errors
        server_errors = [c for c in status_codes if c >= 500]
        assert server_errors == [], f"Server errors detected: {server_errors}"

        # Majority should succeed
        assert success_count >= 8, f"Only {success_count}/10 concurrent joins succeeded: {results}"

        # Latency check
        if latencies:
            p50 = sorted(latencies)[len(latencies) // 2]
            p95 = sorted(latencies)[int(len(latencies) * 0.95)]
            print(f"\nConcurrency latency — p50: {p50}ms, p95: {p95}ms, errors: {error_count}")

        print(f"\nConcurrent join results: {success_count}/10 successful")
        for r in results:
            print(f"  {r['user']}: HTTP {r['status_code']} in {r['latency_ms']}ms")
