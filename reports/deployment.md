# IntelliCharge — Deployment Guide

**Stack:** Python 3.13 / FastAPI + React (Vite) + SQLite  
**Status:** Local-only deployment verified. No public URL exists yet.

---

## Local Development (Verified Working)

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or pnpm

### Backend Setup

```powershell
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template (NEVER commit .env)
Copy-Item .env.example .env
# Edit .env and set SECRET_KEY to a strong random value:
# python -c "import secrets; print(secrets.token_hex(32))"

# Seed the database (creates schema, loads stations, trains ML model)
python seed_db.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API available at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

Frontend available at: http://localhost:5173

### Running Tests

```powershell
cd backend

# Original test suite (7 tests)
python -m pytest tests/test_backend.py -v

# 10-user automated test suite (68 tests)
python -m pytest tests/test_ten_users.py -v

# All tests
python -m pytest tests/ -v
```

---

## Environment Variables

| Variable | Required | Example | Notes |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | `<64-char random hex>` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `APP_ENV` | No | `development` / `production` | Set to `production` to enable security startup checks |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated; defaults to local dev servers |
| `LLM_PROVIDER` | No | `mock` / `openai` / `gemini` | Default: `mock` (no API key required) |
| `LLM_API_KEY` | No | `sk-...` | Required only if `LLM_PROVIDER` ≠ `mock` |
| `LLM_MODEL` | No | `gpt-4o-mini` | OpenAI model name |
| `GOOGLE_MAPS_API_KEY` | No | `AIza...` | Falls back to Haversine if not set |

---

## Docker Compose (Local Staging)

> **Not yet created** — prepare before production deployment.

A recommended `docker-compose.yml` would include:
- Backend service: `python:3.13-slim`, `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Frontend service: `node:18-alpine`, `npm run build`, served by `nginx`
- Volume mount for `intellicharge.db`
- Health check on `/health`

---

## Production Deployment (Steps Required from Owner)

### Option A: Vercel (Frontend) + Render/Railway (Backend)

1. **Backend (Render or Railway):**
   - Push to GitHub
   - Create new Web Service
   - Build command: `pip install -r requirements.txt && python seed_db.py`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set env vars: `SECRET_KEY`, `APP_ENV=production`, `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - **Warning:** SQLite on Render is ephemeral — migrate to PostgreSQL for persistence

2. **Frontend (Vercel):**
   - Import GitHub repository
   - Root directory: `frontend/`
   - Build command: `npm run build`
   - Output directory: `dist/`
   - Set env var: `VITE_API_URL=https://your-backend.render.com`
   - Update `vite.config.js` proxy to point to backend URL

3. **CORS:** Set `ALLOWED_ORIGINS=https://your-frontend.vercel.app` on backend

### Option B: Single VPS (Nginx + Gunicorn)

1. Install nginx, Python, Node.js
2. Build frontend: `npm run build` → serve `dist/` via nginx
3. Run backend: `gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2`
4. Configure nginx reverse proxy: `/api/` → backend:8000
5. Use Let's Encrypt for HTTPS

---

## Health Endpoint

```
GET /health
→ {"status": "healthy", "database": "connected"}
```

---

## Rollback

```powershell
# Restore previous database backup
Copy-Item intellicharge.db.backup intellicharge.db

# Or reset to clean seed
Remove-Item intellicharge.db -Force
python seed_db.py
```

---

## Before Going Public

- [ ] Set `SECRET_KEY` to a strong random value (never the default)
- [ ] Set `APP_ENV=production`
- [ ] Set `ALLOWED_ORIGINS` to your exact frontend domain
- [ ] Switch SQLite to PostgreSQL for production persistence
- [ ] Enable HTTPS (required for credentials over CORS)
- [ ] Remove or restrict `/api/stations/demo/tick` endpoint in production
- [ ] Reduce `ACCESS_TOKEN_EXPIRE_MINUTES` (currently 7 days — consider 24h)
- [ ] Run full test suite against staging environment

> **No public URL exists.** This document provides the steps for the repository owner to create one.
