# IntelliCharge ⚡
> **An AI-Powered Smart EV Charging Network with Predictive Queue Estimation & Intelligent Routing**  
> *Dept. of Computer Engineering, SJCEM Palghar | v0.1 (Build-Scoped MVP)*

---

## 📌 Problem & Motivation
Traditional EV apps (PlugShare, OpenChargeMap) display **where** a station is located and its **current** status. However, they do not predict **how long a driver will wait upon arrival**, nor do they factor in **battery State-of-Charge (SoC)** or **road winding distances** when making recommendations.

**IntelliCharge** bridges this gap by:
1. **Predictive Wait-Time Modeling**: Estimating arrival queue duration using an ML regressor trained on 60–90 days of diurnal rush patterns.
2. **Battery-Aware Reachability**: Filtering stations based on real-time vehicle battery level ($1.3\times$ road-winding factor).
3. **Multi-Factor Intelligent Ranking**: Scoring stations on a weighted composite of predicted queue delay, driving travel time, and charger capacity.
4. **AI Reasoning Agent**: Conversational natural-language interface exposing backend prediction and ranking tools to explain recommendations.
5. **Seamless Handoff**: 1-click turn-by-turn navigation deep links to Google Maps.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite + Leaflet                   │
│         (Interactive OpenStreetMap + AI Agent Chat)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│  ├── /stations/nearby        ├── /stations/{id}/predict-wait│
│  ├── /recommend              └── /agent/query               │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      SQLAlchemy ORM          │ │   ML Wait-Time Regressor   │
│  (SQLite: Stations & Queues) │ │  (Scikit-Learn / Gradient) │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_db.py
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web dashboard will be live at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stations/nearby?lat=&lng=&radius_km=` | Search charging stations within radius |
| `GET` | `/stations/{id}/predict-wait?arrival_ts=` | Predict queue wait time at arrival timestamp |
| `GET` | `/recommend?lat=&lng=&battery_pct=` | Multi-factor battery-aware station recommendations |
| `POST` | `/agent/query` | Conversational AI agent tool-calling reasoning query |

---

## 🎓 SJCEM Viva Demo Script (3-Minute Walkthrough)
1. **Scenario 1 (Form-Based Smart Recommendation)**:
   - Select **SJCEM Palghar Campus** with **25% battery**.
   - Show how the top recommendation balances **transit distance** vs **predicted arrival wait time**.
   - Note the **"Why Recommended"** badge showing time saved over congested alternatives.
2. **Scenario 2 (Battery Reachability & Congestion Avoidance)**:
   - Decrease battery to **10%** and observe how stations outside safe range are flagged and filtered.
3. **Scenario 3 (Conversational AI Agent)**:
   - Switch to the **AI Reasoning Agent** tab.
   - Enter: *"I'm at SJCEM Palghar with 20% battery, need CCS2 with low wait"*.
   - Expand the **Agent Tool Calls** accordion to show the agent executing `parse_intent`, `get_nearby_stations_and_rank`, and `predict_wait_model` in real-time.
