# IntelliCharge — Fix Plan (P0–P3)

**Date:** 2026-10-16 | **Commit:** c2b16b9

## Priority Legend
- **P0:** Secrets exposure, auth bypass, data loss, unsafe public access
- **P1:** Broken build/startup, blocked core flows, critical data bugs
- **P2:** Validation, error states, performance, accessibility, maintainability
- **P3:** Low-value decoration, polish, minor refactors

---

## P0 Fixes (Critical Security)

| # | Task | File | Status |
|---|---|---|---|
| P0-1 | Remove hardcoded JWT secret from `.env.example`; replace with placeholder | `.env.example` | ✅ Fixed |
| P0-2 | Add startup guard: refuse boot if `SECRET_KEY` is known-weak in production | `core/config.py` | ✅ Fixed |
| P0-3 | Fix CORS from `allow_origins=["*"]` + credentials to explicit allowlist via `ALLOWED_ORIGINS` env | `main.py` | ✅ Fixed |

## P1 Fixes (High Security / Core Workflows)

| # | Task | File | Status |
|---|---|---|---|
| P1-1 | Add `get_current_user` auth to `POST /queue/join` | `api/queue.py` | ✅ Fixed |
| P1-2 | Add IDOR ownership check to `POST /queue/{id}/leave` (403 if not owner) | `api/queue.py` | ✅ Fixed |
| P1-3 | Add `user_id` to `QueueEntry` model + auto-migration | `models/queue_entry.py`, `main.py` | ✅ Fixed |
| P1-4 | Remove duplicate router registrations (each router mounted twice) | `main.py` | ✅ Fixed |
| P1-5 | Replace fake `confidence_pct: 92.5/80.0` with `confidence_source: "model"/"heuristic"` | `ml/predictor.py`, `schemas/station.py` | ✅ Fixed |
| P1-6 | Use actual `station.power_kw` instead of hardcoded `50.0` for duration calc | `api/queue.py` | ✅ Fixed |

## P2 Fixes (Quality / Validation)

| # | Task | File | Status |
|---|---|---|---|
| P2-1 | Add SoC validation (current_soc < target_soc; range 0–100) | `api/queue.py` | ✅ Fixed |
| P2-2 | Return 422 with message for invalid `arrival_ts` ISO format | `api/stations.py` | ✅ Fixed |
| P2-3 | Move `import json` out of for-loop; extract `_station_to_response` helper | `api/stations.py` | ✅ Fixed |
| P2-4 | Label `/demo/tick` clearly as demo-only in response body and tags | `api/queue.py` | ✅ Fixed |
| P2-5 | Add 10-user automated test suite covering auth isolation and IDOR | `tests/test_ten_users.py` | ✅ Done (68/68 pass) |

## P3 Remaining (Not Yet Applied)

| # | Task | Notes |
|---|---|---|
| P3-1 | Add 300ms debounce in `App.jsx` before firing recommendation request | Prevents rapid-fire API calls on slider change |
| P3-2 | Merge `DriverAuth.jsx` into `AuthModal.jsx` (duplicate component) | Code size reduction |
| P3-3 | Add server-side JWT revocation (Redis allowlist or short expiry) | Needs Redis infra decision first |
| P3-4 | Replace `charger_id=0` in `check_and_start_sessions` with real charger tracking | Requires charger-level DB model |
| P3-5 | Add DB-level filtering for `/stations/nearby` instead of loading all stations | Fine at current scale, future-proofing |
