"""
Geospatial calculation utilities: Haversine distance, road-winding factor,
travel duration estimates, and Google Maps external deep-links.
"""

import math
from app.core.config import settings


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle (straight-line) distance between two points in kilometers.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def estimate_road_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> tuple[float, float]:
    """
    Estimates realistic road driving distance by multiplying straight-line distance
    by the road-winding coefficient (~1.3x).
    
    Returns:
        (straight_distance_km, estimated_road_distance_km)
    """
    straight_dist = haversine_distance_km(lat1, lon1, lat2, lon2)
    road_dist = straight_dist * settings.ROAD_WINDING_FACTOR
    return round(straight_dist, 2), round(road_dist, 2)


def estimate_travel_time_minutes(road_distance_km: float, avg_speed_kmh: float = None) -> float:
    """
    Estimates transit driving time in minutes based on expected urban/highway speeds.
    """
    speed = avg_speed_kmh or settings.AVERAGE_CITY_SPEED_KMH
    time_hours = road_distance_km / max(1.0, speed)
    return round(time_hours * 60.0, 1)


def build_google_maps_navigate_url(dest_lat: float, dest_lng: float, origin_lat: float = None, origin_lng: float = None) -> str:
    """
    Builds an external Google Maps turn-by-turn navigation deep-link.
    Specifying the destination with driving mode allows Google Maps to automatically route
    from the driver's current device location (or user's selected starting point) without 
    causing origin-destination collision issues.
    """
    return f"https://www.google.com/maps/dir/?api=1&destination={dest_lat},{dest_lng}&travelmode=driving"

