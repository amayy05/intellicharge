"""
FastAPI application entrypoint for IntelliCharge backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.stations import router as stations_router
from app.api.recommend import router as recommend_router
from app.api.agent import router as agent_router
from app.api.vehicles import router as vehicles_router
from app.api.queue import router as queue_router
from app.api.sessions import router as sessions_router
from app.api.auth import router as auth_router
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate optional columns if existing SQLite DB was created previously
with engine.connect() as conn:
    for migration in [
        "ALTER TABLE users ADD COLUMN name VARCHAR",
        "ALTER TABLE queue_entries ADD COLUMN user_id INTEGER",
        "ALTER TABLE queue_entries ADD COLUMN expected_arrival_at DATETIME",
        "ALTER TABLE queue_entries ADD COLUMN checked_in_at DATETIME",
        "ALTER TABLE queue_entries ADD COLUMN expires_at DATETIME",
        "ALTER TABLE queue_entries ADD COLUMN current_soc FLOAT",
        "ALTER TABLE queue_entries ADD COLUMN target_soc FLOAT",
    ]:
        try:
            conn.execute(text(migration))
            conn.commit()
        except Exception:
            pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart EV Charging Network with Predictive Queue Estimation & Intelligent Routing",
)

# CORS configuration: explicit allowlist from env; allow_credentials is safe because
# origins are not wildcard in production.
_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include API Routers — mounted with /api prefix as standard
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(stations_router, prefix=settings.API_V1_STR)
app.include_router(recommend_router, prefix=settings.API_V1_STR)
app.include_router(agent_router, prefix=settings.API_V1_STR)
app.include_router(vehicles_router, prefix=settings.API_V1_STR)
app.include_router(queue_router, prefix=settings.API_V1_STR)
app.include_router(sessions_router, prefix=settings.API_V1_STR)

# Also mount legacy routes at root for backward compatibility with frontend clients and tests
app.include_router(stations_router)
app.include_router(recommend_router)
app.include_router(agent_router)
app.include_router(vehicles_router)
app.include_router(queue_router)
app.include_router(sessions_router)



@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected"}
