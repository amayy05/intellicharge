"""
Service for calculating charging durations.
"""

def calculate_energy_required(battery_capacity_kwh: float, current_soc: float, target_soc: float) -> float:
    """Calculate the energy required in kWh."""
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
    """
    energy_required = calculate_energy_required(battery_capacity_kwh, current_soc, target_soc)
    if energy_required <= 0:
        return 0.0
    
    # The effective power is the minimum of what the charger can provide and what the vehicle can take
    effective_power = min(vehicle_max_power_kw, charger_power_kw)
    
    # Calculate duration in hours, then convert to minutes
    duration_hours = energy_required / effective_power
    duration_minutes = duration_hours * 60
    
    # Apply efficiency factor to account for non-ideal charging curves (slowing down near 80-100%)
    # If efficiency is 0.9, it means it takes longer. duration = duration / 0.9
    duration_minutes = duration_minutes / efficiency_factor
    
    return round(duration_minutes, 1)
