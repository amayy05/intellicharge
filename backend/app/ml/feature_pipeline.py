"""
Feature extraction and preprocessing pipeline for wait-time prediction.
"""

from typing import Dict, List, Any
import numpy as np


class FeaturePipeline:
    """Extracts features for wait-time prediction models."""

    def __init__(self, station_stats: Dict[str, Dict[str, float]] = None):
        # station_id -> {"mean_wait": float, "mean_occupancy": float, "charger_count": int}
        self.station_stats = station_stats or {}

    def fit(self, snapshots: List[Dict[str, Any]]):
        """Computes historical baseline aggregations per station."""
        accum = {}
        for s in snapshots:
            sid = s["station_id"]
            if sid not in accum:
                accum[sid] = {"waits": [], "occupied": [], "chargers": s.get("charger_count", 4)}
            accum[sid]["waits"].append(s.get("wait_minutes", 0.0))
            accum[sid]["occupied"].append(s.get("occupied_chargers", 0))

        self.station_stats = {}
        for sid, data in accum.items():
            self.station_stats[sid] = {
                "mean_wait": float(np.mean(data["waits"])) if data["waits"] else 0.0,
                "mean_occupancy": float(np.mean(data["occupied"])) if data["occupied"] else 0.0,
                "charger_count": data["chargers"],
            }
        return self

    def extract_features(
        self,
        station_id: str,
        hour: int,
        day_of_week: int,
        charger_count: int = None,
    ) -> List[float]:
        """
        Builds a numeric feature vector:
        [hour, day_of_week, is_weekend, sin_hour, cos_hour, charger_count, station_mean_wait]
        """
        is_weekend = 1.0 if day_of_week in (5, 6) else 0.0
        sin_hour = np.sin(2 * np.pi * hour / 24.0)
        cos_hour = np.cos(2 * np.pi * hour / 24.0)

        st_stat = self.station_stats.get(station_id, {})
        cc = charger_count or st_stat.get("charger_count", 4)
        mean_wait = st_stat.get("mean_wait", 5.0)

        return [
            float(hour),
            float(day_of_week),
            is_weekend,
            float(sin_hour),
            float(cos_hour),
            float(cc),
            float(mean_wait),
        ]
