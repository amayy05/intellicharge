# IntelliCharge ⚡
> **An AI-Powered Smart EV Charging Network with Predictive Queue Estimation & Intelligent Routing**  
> *Dept. of Computer Engineering, SJCEM Palghar | v0.1 (Build-Scoped MVP)*

---

## 📌 Problem & Vision
Traditional EV navigation apps (OpenChargeMap, PlugShare) tell drivers **where** a charger exists and its **current** status. However, they do not tell drivers **how long the queue will be upon arrival**, nor do they consider **remaining battery percentage or driving distance** to rank the best station.

**IntelliCharge** bridges this gap by:
1. **Predictive Wait-Time Modeling**: Estimating arrival-time queue duration using ML trained on historical utilization curves.
2. **Multi-Factor Intelligent Ranking**: Scoring stations on a weighted balance of predicted wait time, transit distance/ETA, and charger availability.
3. **Battery-Aware Reachability**: Filtering out unreachable stations to eliminate range anxiety.
4. **Seamless Navigation**: One-click handoff to Google Maps for turn-by-turn directions.

---

## 🏗️ Architecture & Tech Stack
- **Backend**: FastAPI (Python 3.10+)
- **Database**: SQLite with SQLAlchemy ORM
- **ML / Prediction**: Scikit-Learn (RandomForest / Gradient Boosting Regressor)
- **Frontend**: React + Vite + Leaflet (OpenStreetMap) + Modern UI
- **Geospatial & Routing**: Haversine distance with road-winding correction (~1.3x) + Google Maps external routing

---

## 🚀 Repository Structure
```text
├── backend/
│   ├── app/
│   │   ├── api/           # API routes (/stations, /recommend, /predict)
│   │   ├── core/          # Configuration & DB session
│   │   ├── models/        # SQLAlchemy ORM models (Station, QueueSnapshot)
│   │   ├── ml/            # Wait-time prediction model & feature pipelines
│   │   ├── services/      # Station ranking, scoring & distance calculations
│   │   └── main.py        # FastAPI entrypoint
│   └── requirements.txt
├── frontend/              # React + Vite + Leaflet dashboard
├── data/
│   ├── raw/               # Seeded MMR & Palghar station dataset
│   ├── generator/         # Synthetic historical queue data generator
│   └── models/            # Serialized trained ML models (.joblib / .pkl)
└── README.md
```
