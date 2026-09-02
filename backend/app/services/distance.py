"""
Geospatial calculation utilities: Google Maps Distance Matrix API integration,
Haversine straight-line distance, road-winding factor fallback,
travel duration estimates, and Google Maps external deep-links.
"""

import math
import logging
from typing import List, Tuple, Optional, Dict, Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory cache for Distance Matrix queries:
# Key: ((round(lat1, 4), round(lon1, 4)), (round(lat2, 4), round(lon2, 4)))
# Value: {"road_distance_km": float, "travel_time_minutes": float}
_distance_matrix_cache: Dict[Tuple[Tuple[float, float], Tuple[float, float]], Dict[str, float]] = {}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle (straight-line) distance between two points in kilometers
    using the Haversine spherical trigonometric formula.
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


def fetch_google_distance_matrix(
    origin: Tuple[float, float],
    destinations: List[Tuple[float, float]]
) -> Optional[List[Optional[Dict[str, float]]]]:
    """
    Calls the actual Google Maps Distance Matrix API to retrieve real road driving
    distances and current traffic travel durations for a batch of destinations.

    Returns:
        List of dicts with {"road_distance_km": float, "travel_time_minutes": float}
        corresponding to each destination, or None if the API cannot be reached/key is missing.
    """
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return None

    if not destinations:
        return []

    results: List[Optional[Dict[str, float]]] = [None] * len(destinations)
    destinations_to_query: List[Tuple[int, Tuple[float, float]]] = []

    # Check in-memory cache first
    origin_key = (round(origin[0], 4), round(origin[1], 4))
    for idx, dest in enumerate(destinations):
        dest_key = (round(dest[0], 4), round(dest[1], 4))
        cache_key = (origin_key, dest_key)
        if cache_key in _distance_matrix_cache:
            results[idx] = _distance_matrix_cache[cache_key]
        else:
            destinations_to_query.append((idx, dest))

    if not destinations_to_query:
        return results

    # Google Maps Distance Matrix API accepts up to 25 destinations per single request
    BATCH_SIZE = 25
    endpoint = "https://maps.googleapis.com/maps/api/distancematrix/json"

    for i in range(0, len(destinations_to_query), BATCH_SIZE):
        batch = destinations_to_query[i : i + BATCH_SIZE]
        dests_param = "|".join(f"{d[1][0]},{d[1][1]}" for d in batch)
        params = {
            "origins": f"{origin[0]},{origin[1]}",
            "destinations": dests_param,
            "mode": "driving",
            "key": api_key,
        }

        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(endpoint, params=params)

            if response.status_code != 200:
                logger.warning(f"Google Distance Matrix API returned HTTP {response.status_code}")
                continue

            data = response.json()
            if data.get("status") != "OK":
                logger.warning(f"Google Distance Matrix API status: {data.get('status')} - {data.get('error_message', '')}")
                continue

            rows = data.get("rows", [])
            if not rows or not rows[0].get("elements"):
                continue

            elements = rows[0]["elements"]
            for (original_idx, dest_coords), element in zip(batch, elements):
                if element.get("status") == "OK":
                    distance_meters = element.get("distance", {}).get("value", 0)
                    duration_seconds = element.get("duration", {}).get("value", 0)

                    road_km = round(distance_meters / 1000.0, 2)
                    travel_min = round(duration_seconds / 60.0, 1)

                    val = {
                        "road_distance_km": road_km,
                        "travel_time_minutes": travel_min,
                    }
                    results[original_idx] = val

                    # Store in cache
                    dest_key = (round(dest_coords[0], 4), round(dest_coords[1], 4))
                    _distance_matrix_cache[(origin_key, dest_key)] = val

        except Exception as e:
            logger.warning(f"Failed to query Google Distance Matrix API: {e}")

    return results


def get_road_distance_and_time(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> Tuple[float, float, float]:
    """
    Calculates distance and travel time between origin and destination:
    1. Attempts real Google Maps Distance Matrix API.
    2. Gracefully falls back to Haversine * road-winding factor and average city speed.

    Returns:
        (straight_distance_km, road_distance_km, travel_time_minutes)
    """
    straight_dist = haversine_distance_km(lat1, lon1, lat2, lon2)

    # Attempt Google Maps Distance Matrix API
    gmaps_res = fetch_google_distance_matrix((lat1, lon1), [(lat2, lon2)])
    if gmaps_res and gmaps_res[0] is not None:
        road_dist = gmaps_res[0]["road_distance_km"]
        travel_time = gmaps_res[0]["travel_time_minutes"]
        return round(straight_dist, 2), road_dist, travel_time

    # Fallback to mathematical road-winding factor
    road_dist = straight_dist * settings.ROAD_WINDING_FACTOR
    travel_time = estimate_travel_time_minutes(road_dist)
    return round(straight_dist, 2), round(road_dist, 2), travel_time


def batch_calculate_distances_and_times(
    origin: Tuple[float, float],
    destinations: List[Tuple[float, float]]
) -> List[Dict[str, float]]:
    """
    Efficiently computes straight distance, road distance, and travel time for a list of destinations.
    Uses Google Maps Distance Matrix batch query where possible, with automatic Haversine fallback.

    Returns:
        List of dicts:
        [
            {
                "straight_distance_km": float,
                "road_distance_km": float,
                "travel_time_minutes": float,
                "source": "google_maps" | "haversine_estimate"
            },
            ...
        ]
    """
    if not destinations:
        return []

    # Attempt Google Maps Distance Matrix batch lookup
    gmaps_results = fetch_google_distance_matrix(origin, destinations)

    output: List[Dict[str, float]] = []
    for idx, (dest_lat, dest_lng) in enumerate(destinations):
        straight_dist = haversine_distance_km(origin[0], origin[1], dest_lat, dest_lng)

        if gmaps_results and gmaps_results[idx] is not None:
            output.append({
                "straight_distance_km": round(straight_dist, 2),
                "road_distance_km": gmaps_results[idx]["road_distance_km"],
                "travel_time_minutes": gmaps_results[idx]["travel_time_minutes"],
                "source": "google_maps",
            })
        else:
            road_dist = straight_dist * settings.ROAD_WINDING_FACTOR
            travel_time = estimate_travel_time_minutes(road_dist)
            output.append({
                "straight_distance_km": round(straight_dist, 2),
                "road_distance_km": round(road_dist, 2),
                "travel_time_minutes": travel_time,
                "source": "haversine_estimate",
            })

    return output


def estimate_road_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, float]:
    """
    Backward-compatible function. Returns: (straight_distance_km, road_distance_km)
    Leverages Google Distance Matrix if available, else Haversine * winding factor.
    """
    straight_dist, road_dist, _ = get_road_distance_and_time(lat1, lon1, lat2, lon2)
    return straight_dist, road_dist


def estimate_travel_time_minutes(road_distance_km: float, avg_speed_kmh: float = None) -> float:
    """
    Estimates transit driving time in minutes based on expected urban/highway speeds.
    """
    speed = avg_speed_kmh or settings.AVERAGE_CITY_SPEED_KMH
    time_hours = road_distance_km / max(1.0, speed)
    return round(time_hours * 60.0, 1)


def build_google_maps_navigate_url(
    dest_lat: float, dest_lng: float, origin_lat: float = None, origin_lng: float = None
) -> str:
    """
    Builds an external Google Maps turn-by-turn navigation deep-link.
    """
    if origin_lat is not None and origin_lng is not None:
        return f"https://www.google.com/maps/dir/?api=1&origin={origin_lat},{origin_lng}&destination={dest_lat},{dest_lng}&travelmode=driving"
    return f"https://www.google.com/maps/dir/?api=1&destination={dest_lat},{dest_lng}&travelmode=driving"
