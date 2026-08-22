"""
Multi-Factor Recommendation and Battery-Aware Ranking Engine.
Evaluates candidates based on predicted arrival wait times, travel durations,
and battery reachability.
"""

import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.station import Station
from app.ml.predictor import get_wait_time_predictor
from app.services.distance import (
    estimate_road_distance_km,
    estimate_travel_time_minutes,
    build_google_maps_navigate_url,
)
from app.schemas.recommend import (
    RankedStationCard,
    StationScoreBreakdown,
    RecommendationResponse,
)


def compute_station_recommendations(
    db: Session,
    user_lat: float,
    user_lng: float,
    battery_pct: float,
    radius_km: float = 60.0,
    connector_type: Optional[str] = None,
) -> RecommendationResponse:
    """
    Ranks nearby charging stations considering arrival queue predictions and range safety.
    """
    predictor = get_wait_time_predictor()
    all_stations = db.query(Station).all()

    # Calculate remaining driving range
    max_range = settings.DEFAULT_EV_MAX_RANGE_KM
    remaining_range_km = (battery_pct / 100.0) * max_range

    candidates = []

    for st in all_stations:
        # Check connector type filter
        if connector_type and connector_type.strip():
            c_types = [c.strip().lower() for c in st.connector_types.split(",")]
            if connector_type.strip().lower() not in c_types:
                continue

        # Compute distance & transit time
        straight_dist, road_dist = estimate_road_distance_km(user_lat, user_lng, st.latitude, st.longitude)
        if straight_dist > radius_km:
            continue

        travel_time_min = estimate_travel_time_minutes(road_dist)
        is_reachable = road_dist <= remaining_range_km

        # Battery consumed during transit
        battery_consumed_pct = (road_dist / max_range) * 100.0
        battery_after_arrival = max(0.0, round(battery_pct - battery_consumed_pct, 1))

        # Estimate arrival time for wait prediction
        arrival_ts = datetime.now() + timedelta(minutes=travel_time_min)

        # ML Wait-time prediction
        pred_res = predictor.predict(
            station_id=st.id,
            arrival_time=arrival_ts,
            charger_count=st.charger_count,
        )
        predicted_wait = pred_res["predicted_wait_minutes"]
        total_time = round(travel_time_min + predicted_wait, 1)

        # Multi-factor composite score calculation (lower is better)
        # Factors: wait time (50%), travel time (35%), capacity bonus (15%)
        capacity_bonus = min(5.0, (st.charger_count / 4.0) * 1.5)
        power_bonus = min(4.0, (st.power_kw / 60.0) * 1.2)
        composite_score = (
            (settings.WEIGHT_WAIT_TIME * predicted_wait)
            + (settings.WEIGHT_TRAVEL_TIME * travel_time_min)
            - capacity_bonus
            - power_bonus
        )
        # If unreachable, heavily penalize score to ensure it drops to bottom
        if not is_reachable:
            composite_score += 1000.0

        candidates.append({
            "station": st,
            "straight_dist": straight_dist,
            "road_dist": road_dist,
            "travel_time_min": travel_time_min,
            "predicted_wait": predicted_wait,
            "total_time": total_time,
            "composite_score": round(composite_score, 2),
            "is_reachable": is_reachable,
            "battery_after_arrival": battery_after_arrival,
        })

    if not candidates:
        return RecommendationResponse(
            status="no_stations_found",
            user_location={"lat": user_lat, "lng": user_lng},
            battery_pct=battery_pct,
            estimated_range_km=round(remaining_range_km, 1),
            total_found=0,
            reachable_count=0,
            ranked_stations=[],
            summary_insight="No charging stations found matching the filter and search radius.",
        )

    # Identify the geographically closest station for comparison
    closest_item = min(candidates, key=lambda x: x["straight_dist"])
    closest_id = closest_item["station"].id
    closest_total_time = closest_item["total_time"]

    # Sort candidates by composite score (lowest first)
    candidates.sort(key=lambda x: x["composite_score"])

    ranked_cards: List[RankedStationCard] = []
    reachable_count = sum(1 for c in candidates if c["is_reachable"])

    for rank_idx, item in enumerate(candidates, start=1):
        st = item["station"]
        is_closest = (st.id == closest_id)
        time_saved = round(max(0.0, closest_total_time - item["total_time"]), 1)

        # Parse connector types and amenities
        c_types = [c.strip() for c in st.connector_types.split(",") if c.strip()]
        try:
            amenities = json.loads(st.amenities) if st.amenities.startswith("[") else [a.strip() for a in st.amenities.split(",")]
        except Exception:
            amenities = []

        # Tag determination
        tag = None
        if rank_idx == 1 and item["is_reachable"]:
            if is_closest:
                tag = "⭐ Best Overall (Closest & Low Wait)"
            elif time_saved > 5.0:
                tag = f"⚡ Recommended: Saves ~{int(time_saved)}m vs Nearest"
            else:
                tag = "⭐ Best Overall Choice"
        elif is_closest:
            tag = "📍 Geographically Nearest"
        elif not item["is_reachable"]:
            tag = "⚠️ Out of Battery Range"

        breakdown = StationScoreBreakdown(
            predicted_wait_minutes=item["predicted_wait"],
            straight_distance_km=item["straight_dist"],
            road_distance_km=item["road_dist"],
            travel_time_minutes=item["travel_time_min"],
            total_time_minutes=item["total_time"],
            composite_score=item["composite_score"],
            is_reachable=item["is_reachable"],
            remaining_range_km=round(remaining_range_km, 1),
            battery_after_arrival_pct=item["battery_after_arrival"],
            is_closest=is_closest,
            time_saved_vs_closest_min=time_saved,
        )

        gmaps_url = build_google_maps_navigate_url(
            dest_lat=st.latitude,
            dest_lng=st.longitude,
            origin_lat=user_lat,
            origin_lng=user_lng,
        )

        ranked_cards.append(
            RankedStationCard(
                rank=rank_idx,
                station_id=st.id,
                station_name=st.name,
                operator=st.operator,
                address=st.address,
                city_region=st.city_region,
                latitude=st.latitude,
                longitude=st.longitude,
                connector_types=c_types,
                charger_count=st.charger_count,
                power_kw=st.power_kw,
                pricing_per_kwh=st.pricing_per_kwh,
                amenities=amenities,
                breakdown=breakdown,
                recommendation_tag=tag,
                google_maps_url=gmaps_url,
            )
        )

    # Generate summary insight
    top_st = ranked_cards[0] if ranked_cards else None
    if top_st and top_st.breakdown.is_reachable:
        if top_st.station_id == closest_id:
            insight = f"Top recommendation is {top_st.station_name} ({top_st.breakdown.road_distance_km} km away) with an estimated wait of {top_st.breakdown.predicted_wait_minutes} mins upon arrival."
        else:
            time_saved = top_st.breakdown.time_saved_vs_closest_min
            insight = f"Recommended {top_st.station_name} over the closest station because of shorter queue times, saving an estimated {time_saved} minutes in total trip time."
    else:
        insight = "Caution: Some stations are outside your safe battery range. Check reachability badges."

    return RecommendationResponse(
        status="success",
        user_location={"lat": user_lat, "lng": user_lng},
        battery_pct=battery_pct,
        estimated_range_km=round(remaining_range_km, 1),
        total_found=len(candidates),
        reachable_count=reachable_count,
        top_recommendation=top_st,
        ranked_stations=ranked_cards,
        summary_insight=insight,
    )
