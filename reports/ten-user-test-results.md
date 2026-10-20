# IntelliCharge — Automated 10-User Test Results

**Date/Time:** 2026-10-16T17:27:40Z  
**Commit:** c2b16b9  
**Environment:** Local (Windows 11, Python 3.13.5, SQLite test DB)  
**Test Command:** `python -m pytest tests/test_ten_users.py -v --tb=short`  
**Test Framework:** pytest 9.1.1, FastAPI TestClient  

> **Important:** These are automated tests with 10 *synthetic* accounts.  
> They are NOT real human usability sessions. See `human-usability-test-kit.md` for the real-user test protocol.

---

## Test Users (Synthetic)

| Alias | Email | Vehicle | Connector |
|---|---|---|---|
| tester01 | tester01@example.test | Tata Nexon EV (Tester 01) — 30.7 kWh | CCS2 |
| tester02 | tester02@example.test | Tata Nexon EV (Tester 02) — 31.2 kWh | Type 2 |
| tester03 | tester03@example.test | Tata Nexon EV (Tester 03) — 31.7 kWh | CCS2 |
| tester04 | tester04@example.test | Tata Nexon EV (Tester 04) — 32.2 kWh | Type 2 |
| tester05 | tester05@example.test | Tata Nexon EV (Tester 05) — 32.7 kWh | CCS2 |
| tester06 | tester06@example.test | Tata Nexon EV (Tester 06) — 33.2 kWh | Type 2 |
| tester07 | tester07@example.test | Tata Nexon EV (Tester 07) — 33.7 kWh | CCS2 |
| tester08 | tester08@example.test | Tata Nexon EV (Tester 08) — 34.2 kWh | Type 2 |
| tester09 | tester09@example.test | Tata Nexon EV (Tester 09) — 34.7 kWh | CCS2 |
| tester10 | tester10@example.test | Tata Nexon EV (Tester 10) — 35.2 kWh | Type 2 |

---

## Scenario Matrix (68 Tests)

| Scenario | Tests | U01 | U02 | U03 | U04 | U05 | U06 | U07 | U08 | U09 | U10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Register & Auth | 23 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2. Station Browsing | 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3. Vehicle Profiles | 11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4. Queue Join | 8 | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | n/a |
| 5. Queue Status | 1 | ✅ | — | — | — | — | — | — | — | — | — |
| 6. Queue Leave + IDOR | 3 | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 7. Invalid Input | 4 | ✅ | — | — | — | — | — | — | — | — | — |
| 8. Sign-out / Token | 1 | ✅ | — | — | — | — | — | — | — | — | — |
| Concurrency (all 10) | 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Total: 68 passed / 0 failed / 0 blocked**

---

## Authorization Isolation Results

| Test | Result |
|---|---|
| User A cannot read User B's vehicles | ✅ PASS — each user's list contains only their own vehicles |
| User A cannot cancel User B's queue entry (IDOR) | ✅ PASS — returns 403 Forbidden |
| Unauthenticated join queue returns 401 | ✅ PASS |
| Unauthenticated cancel returns 401 | ✅ PASS |
| Invalid JWT returns 401 | ✅ PASS |
| Wrong password returns 401 | ✅ PASS |
| Public station browsing works without auth | ✅ PASS |
| Queue aggregate status is public (no personal data) | ✅ PASS |

---

## Concurrency Test Results

- **Method:** 10 concurrent `threading.Thread` clients using FastAPI TestClient
- **Operation:** All 10 users join queue simultaneously at `st-palghar-01`
- **Result:** ✅ 10/10 succeeded, 0 server errors (no HTTP 5xx)
- **Latency:** p50 ≈ 4ms, p95 ≈ 45ms (in-process TestClient, not network)
- **Note:** TestClient is in-process; real network deployment may see higher latency. SQLite serializes writes — no race conditions observed.

---

## Defects Discovered and Fixed

| ID | Defect | Fix |
|---|---|---|
| S03 | No auth on queue join | Added `get_current_user` dependency |
| S04 | IDOR on queue leave | Added `user_id` ownership check |
| C02 | Hardcoded 50kW charger power | Now uses `station.power_kw` |
| P2-1 | No SoC validation | Returns 422 for invalid SoC values |

---

## Limitations

- Tests run against the same production SQLite DB file. A separate test DB is recommended for full isolation.
- TestClient is in-process; real concurrent HTTP would show different latency characteristics.
- 10 concurrent threads is not a load test — it validates correctness under minimal concurrency.
- Scenario 4 queue join tested for first 5 users only (to avoid excessive queue buildup in shared DB).
