"""
Service for calculating charging durations and connector compatibility.
"""
import json
from typing import Tuple, Optional, List


def normalize_connector(connector: str) -> str:
    """Normalize connector string for case and separator-insensitive comparison."""
    if not connector:
        return ""
    return connector.strip().lower().replace(" ", "").replace("-", "").replace("_", "")


def check_connector_compatibility(
    station_connectors_raw: Optional[str],
    vehicle_connector: Optional[str]
) -> Tuple[bool, str]:
    """
    Checks if a vehicle's connector type is supported by a station.
    Returns (is_compatible, status_label):
    - (True, "compatible")
    - (False, "incompatible")
    - (False, "unknown")
    """
    if not vehicle_connector or not str(vehicle_connector).strip():
        return False, "unknown"
    if not station_connectors_raw or not str(station_connectors_raw).strip():
        return False, "unknown"

    norm_vehicle = normalize_connector(vehicle_connector)
    raw = station_connectors_raw.strip()

    station_list: List[str] = []
    if raw.startswith("["):
        try:
            station_list = json.loads(raw)
        except Exception:
            station_list = [c.strip() for c in raw.split(",") if c.strip()]
    else:
        station_list = [c.strip() for c in raw.split(",") if c.strip()]

    for c in station_list:
        if normalize_connector(c) == norm_vehicle:
            return True, "compatible"

    return False, "incompatible"


def calculate_energy_required(battery_capacity_kwh: float, current_soc: float, target_soc: float) -> float:
    """Calculate the energy required in kWh with validation."""
    if not (0 <= current_soc <= 100):
        raise ValueError(f"current_soc must be between 0 and 100, got {current_soc}")
    if not (0 <= target_soc <= 100):
        raise ValueError(f"target_soc must be between 0 and 100, got {target_soc}")
    if battery_capacity_kwh <= 0:
        raise ValueError(f"battery_capacity_kwh must be positive, got {battery_capacity_kwh}")

    if current_soc >= target_soc:
        return 0.0
    soc_diff = target_soc - current_soc
    return battery_capacity_kwh * (soc_diff / 100.0)


def calculate_charging_duration_minutes(
    battery_capacity_kwh: float, 
    current_soc: float, 
    target_soc: float, 
    vehicle_max_power_kw: float, 
    charger_power_kw: float,
    efficiency_factor: float = 0.9
) -> float:
    """
    Calculate estimated charging duration in minutes.
    Uses effective power = min(vehicle_max_power_kw, charger_power_kw).
    Applies efficiency/overhead factor.
    """
    if target_soc <= current_soc:
        raise ValueError(f"target_soc ({target_soc}) must be strictly greater than current_soc ({current_soc})")
    if vehicle_max_power_kw <= 0:
        raise ValueError(f"vehicle_max_power_kw must be positive, got {vehicle_max_power_kw}")
    if charger_power_kw <= 0:
        raise ValueError(f"charger_power_kw must be positive, got {charger_power_kw}")
    if efficiency_factor <= 0 or efficiency_factor > 1.0:
        raise ValueError(f"efficiency_factor must be between 0 and 1.0, got {efficiency_factor}")

    energy_required = calculate_energy_required(battery_capacity_kwh, current_soc, target_soc)
    if energy_required <= 0:
        return 0.0

    # Effective power is min of charger power and vehicle onboard power limit
    effective_power = min(float(vehicle_max_power_kw), float(charger_power_kw))
    
    # Calculate duration in hours, then convert to minutes
    duration_hours = energy_required / effective_power
    duration_minutes = duration_hours * 60.0
    
    # Apply efficiency/tapering factor
    duration_minutes = duration_minutes / efficiency_factor
    
    return round(duration_minutes, 1)
