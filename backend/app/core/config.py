"""
Application configuration for IntelliCharge backend.
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseModel):
    PROJECT_NAME: str = "IntelliCharge API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    # SQLite Database
    DB_PATH: str = str(BASE_DIR / "backend" / "intellicharge.db")
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"

    # Geospatial and EV Parameters
    ROAD_WINDING_FACTOR: float = 1.3  # Multiplier for Haversine -> road distance
    AVERAGE_CITY_SPEED_KMH: float = 35.0  # Used for transit travel time calculation
    DEFAULT_EV_BATTERY_CAPACITY_KWH: float = 40.5  # Nexon EV Long Range
    DEFAULT_EV_MAX_RANGE_KM: float = 280.0  # Max driving range at 100% SoC

    # Ranking Weights
    WEIGHT_WAIT_TIME: float = 0.50     # Priority on avoiding queue delays
    WEIGHT_TRAVEL_TIME: float = 0.35   # Priority on distance/transit ETA
    WEIGHT_CHARGER_CAPACITY: float = 0.15 # Priority on larger multi-charger hubs

    # LLM Settings (optional API key; if empty, graceful rule-based agent is used)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")  # openai / anthropic / gemini / mock
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")


settings = Settings()
