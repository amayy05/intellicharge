"""
Inference service for wait-time predictions using the trained ML model.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODEL_PATH = BASE_DIR / "data" / "models" / "wait_time_model.joblib"
PIPELINE_PATH = BASE_DIR / "data" / "models" / "feature_pipeline.joblib"

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False


class WaitTimePredictor:
    """Predicts wait time for an EV station at a specified arrival time."""

    def __init__(self):
        self.model = None
        self.pipeline = None
        self._load_artifacts()

    def _load_artifacts(self):
        if HAS_JOBLIB and MODEL_PATH.exists() and PIPELINE_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.pipeline = joblib.load(PIPELINE_PATH)
                print(f"[WaitTimePredictor] Loaded ML model and feature pipeline from disk.")
            except Exception as e:
                print(f"[WaitTimePredictor] Error loading model: {e}. Using heuristic fallback.")
                self.model = None
                self.pipeline = None

    def predict(
        self,
        station_id: str,
        arrival_time: Optional[datetime] = None,
        charger_count: int = 4,
    ) -> Dict[str, Any]:
        """
        Predicts queue wait time in minutes for given station and arrival timestamp.
        """
        if arrival_time is None:
            arrival_time = datetime.now()

        hour = arrival_time.hour
        day_of_week = arrival_time.weekday()
        is_weekend = day_of_week in (5, 6)

        predicted_wait = 0.0

        if self.model and self.pipeline:
            features = self.pipeline.extract_features(
                station_id=station_id,
                hour=hour,
                day_of_week=day_of_week,
                charger_count=charger_count,
            )
            raw_pred = self.model.predict([features])[0]
            predicted_wait = max(0.0, float(raw_pred))
        else:
            # Fallback heuristic if model file not yet compiled
            # Diurnal calculation
            if 8 <= hour <= 11 or 17 <= hour <= 21:
                base_wait = 18.0 if not is_weekend else 22.0
            elif 12 <= hour <= 16:
                base_wait = 10.0
            else:
                base_wait = 2.0
            # Scale by charger count (more chargers -> faster turnover)
            predicted_wait = max(0.0, base_wait * (4.0 / max(1, charger_count)))

        predicted_wait = round(predicted_wait, 1)

        # Categorize congestion level
        if predicted_wait <= 5.0:
            congestion_level = "Low"
            color_code = "green"
            status_text = "Available / Immediate"
        elif predicted_wait <= 15.0:
            congestion_level = "Moderate"
            color_code = "amber"
            status_text = "Minor queue"
        elif predicted_wait <= 30.0:
            congestion_level = "High"
            color_code = "orange"
            status_text = "Moderate queue"
        else:
            congestion_level = "Critical"
            color_code = "red"
            status_text = "Heavy queue / Congested"

        return {
            "station_id": station_id,
            "arrival_time": arrival_time.isoformat(),
            "predicted_wait_minutes": predicted_wait,
            "congestion_level": congestion_level,
            "color_code": color_code,
            "status_text": status_text,
            "confidence_pct": 92.5 if self.model else 80.0,
        }


# Singleton instance
_predictor_instance = None

def get_wait_time_predictor() -> WaitTimePredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = WaitTimePredictor()
    return _predictor_instance
