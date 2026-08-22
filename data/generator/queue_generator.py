"""
Synthetic Queue and Occupancy Data Generator for IntelliCharge MVP.
Generates 60-90 days of hourly snapshots for EV charging stations
incorporating diurnal rush patterns, weekend vs weekday dynamics,
and station charger capacity constraints.
"""

import json
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List


def generate_hourly_profile(
    hour: int,
    day_of_week: int,
    charger_count: int,
    station_region: str,
) -> tuple[int, float]:
    """
    Computes realistic occupancy and queue wait time for a given hour.
    
    Returns:
        (occupied_chargers: int, wait_minutes: float)
    """
    is_weekend = day_of_week in (5, 6)  # Saturday=5, Sunday=6
    is_highway_or_mall = "highway" in station_region.lower() or "mall" in station_region.lower()

    # Diurnal demand curve base (0.0 to 1.0)
    # Morning rush: 08:00 - 11:00, Evening rush: 17:00 - 21:00
    if 0 <= hour < 5:
        base_demand = 0.08 + random.uniform(0.0, 0.05)
    elif 5 <= hour < 8:
        base_demand = 0.20 + (hour - 5) * 0.12
    elif 8 <= hour < 11:
        # Morning peak
        base_demand = 0.75 if not is_weekend else 0.55
        base_demand += random.uniform(-0.08, 0.12)
    elif 11 <= hour < 16:
        # Mid-day
        base_demand = 0.50 if not is_weekend else (0.80 if is_highway_or_mall else 0.65)
        base_demand += random.uniform(-0.05, 0.10)
    elif 16 <= hour < 21:
        # Evening peak
        base_demand = 0.88 if not is_weekend else (0.92 if is_highway_or_mall else 0.75)
        base_demand += random.uniform(-0.05, 0.15)
    elif 21 <= hour < 24:
        # Late night tapering
        base_demand = 0.40 - (hour - 21) * 0.10
        base_demand += random.uniform(-0.05, 0.05)
    else:
        base_demand = 0.2

    # Weekend adjustments
    if is_weekend and is_highway_or_mall:
        base_demand = min(1.2, base_demand * 1.25)

    base_demand = max(0.02, min(1.3, base_demand))

    # Calculate raw vehicle demand at station
    expected_vehicles = base_demand * charger_count
    # Add Poisson-like stochastic jitter
    actual_vehicles = max(0, int(round(random.gauss(expected_vehicles, max(0.6, 0.25 * charger_count)))))

    occupied_chargers = min(charger_count, actual_vehicles)
    queued_vehicles = max(0, actual_vehicles - charger_count)

    # Average fast-charging session length ~ 30-45 mins.
    # If all chargers occupied, each queued vehicle waits ~ (session_length / charger_count) minutes.
    if queued_vehicles > 0:
        avg_session_min = random.uniform(28.0, 42.0)
        turnover_rate = avg_session_min / max(1, charger_count)
        wait_minutes = round(queued_vehicles * turnover_rate + random.uniform(3.0, 8.0), 1)
    elif occupied_chargers == charger_count:
        # Full capacity, but no queued cars yet; slight buffer wait (0 - 5 mins)
        wait_minutes = round(random.uniform(0.0, 4.5), 1)
    else:
        wait_minutes = 0.0

    return occupied_chargers, wait_minutes


def generate_synthetic_dataset(
    stations_json_path: str,
    output_json_path: str,
    days: int = 75,
) -> List[Dict]:
    """Generates synthetic historical queue snapshots for all stations."""
    with open(stations_json_path, "r", encoding="utf-8") as f:
        stations = json.load(f)

    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)

    snapshots = []
    current_time = start_time

    while current_time <= end_time:
        hour = current_time.hour
        day_of_week = current_time.weekday()
        ts_str = current_time.isoformat()

        for st in stations:
            st_id = st["id"]
            charger_count = st.get("charger_count", 4)
            st_name = st.get("name", "")

            occupied, wait = generate_hourly_profile(
                hour=hour,
                day_of_week=day_of_week,
                charger_count=charger_count,
                station_region=st_name,
            )

            snapshots.append({
                "station_id": st_id,
                "timestamp": ts_str,
                "hour_of_day": hour,
                "day_of_week": day_of_week,
                "is_weekend": 1 if day_of_week in (5, 6) else 0,
                "charger_count": charger_count,
                "occupied_chargers": occupied,
                "wait_minutes": wait,
            })

        current_time += timedelta(hours=1)

    out_path = Path(output_json_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(snapshots, f, indent=2)

    print(f"Generated {len(snapshots)} synthetic queue records across {len(stations)} stations for {days} days.")
    return snapshots


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    raw_st_path = base_dir / "raw" / "mmr_palghar_stations.json"
    out_path = base_dir / "synthetic_queue_history.json"
    generate_synthetic_dataset(str(raw_st_path), str(out_path), days=75)
