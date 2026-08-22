"""
AI Agent Service for IntelliCharge.
Orchestrates tool calling (nearby search, wait prediction, ranking)
and provides reasoned, natural-language recommendations.
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.station import Station
from app.ml.predictor import get_wait_time_predictor
from app.services.distance import estimate_road_distance_km, estimate_travel_time_minutes
from app.services.ranking import compute_station_recommendations
from app.schemas.agent import AgentQueryResponse, ToolExecutionLog
from app.schemas.recommend import RankedStationCard


# Known landmark presets for natural language parsing
LANDMARK_COORDINATES = {
    "palghar": (19.6967, 72.7699),
    "sjcem": (19.6967, 72.7699),
    "st john": (19.6967, 72.7699),
    "manor": (19.7421, 72.9125),
    "boisar": (19.8032, 72.7541),
    "dahanu": (19.8821, 72.9351),
    "virar": (19.4612, 72.8124),
    "vasai": (19.3811, 72.8345),
    "naigaon": (19.3498, 72.8711),
    "thane": (19.2087, 72.9719),
    "ghodbunder": (19.2618, 72.9234),
    "bkc": (19.0657, 72.8682),
    "bandra": (19.0657, 72.8682),
    "andheri": (19.1197, 72.8576),
    "kurla": (19.0863, 72.8890),
    "borivali": (19.2307, 72.8421),
    "marine drive": (18.9322, 72.8234),
    "churchgate": (18.9322, 72.8234),
    "mumbai": (19.0760, 72.8777),
    "vashi": (19.0652, 72.9984),
    "panvel": (19.0142, 73.0953),
    "seawoods": (19.0196, 73.0182),
    "navi mumbai": (19.0330, 73.0297),
}


def parse_query_intent(
    query: str,
    default_lat: Optional[float] = None,
    default_lng: Optional[float] = None,
    default_battery: Optional[float] = None,
    default_connector: Optional[str] = None,
) -> Dict[str, Any]:
    """Extracts battery %, location, and connector type from user input."""
    q_lower = query.lower()

    # Extract battery %
    battery_match = re.search(r"(\d{1,3})\s*%", q_lower)
    if not battery_match:
        battery_match = re.search(r"(?:battery|charge|soc|level)\s*(?:is|at|of)?\s*(\d{1,3})", q_lower)
    
    battery_pct = float(battery_match.group(1)) if battery_match else (default_battery or 30.0)
    battery_pct = max(1.0, min(100.0, battery_pct))

    # Extract connector preference
    connector = default_connector
    if "ccs" in q_lower or "ccs2" in q_lower:
        connector = "CCS2"
    elif "type 2" in q_lower or "type2" in q_lower:
        connector = "Type 2"
    elif "chademo" in q_lower:
        connector = "CHAdeMO"
    elif "bharat" in q_lower:
        connector = "Bharat DC-001"

    # Extract location coordinates
    lat, lng = default_lat, default_lng
    matched_loc = None
    for landmark, coords in LANDMARK_COORDINATES.items():
        if landmark in q_lower:
            lat, lng = coords
            matched_loc = landmark.title()
            break

    # Fallback to SJCEM Palghar if coordinates not specified
    if lat is None or lng is None:
        lat, lng = 19.6967, 72.7699
        matched_loc = "SJCEM Palghar (Default)"

    return {
        "lat": lat,
        "lng": lng,
        "battery_pct": battery_pct,
        "connector_type": connector,
        "location_label": matched_loc,
    }


def execute_agent_query(
    db: Session,
    message: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    battery_pct: Optional[float] = None,
    connector_type: Optional[str] = None,
) -> AgentQueryResponse:
    """
    Processes a conversational EV charging query through tool orchestration.
    """
    tool_logs: List[ToolExecutionLog] = []

    # Step 1: Parse user intent
    intent = parse_query_intent(message, lat, lng, battery_pct, connector_type)
    target_lat = intent["lat"]
    target_lng = intent["lng"]
    target_battery = intent["battery_pct"]
    target_connector = intent["connector_type"]

    tool_logs.append(
        ToolExecutionLog(
            tool_name="parse_intent",
            arguments={"query": message},
            result_summary=f"Extracted: Location=({target_lat:.4f}, {target_lng:.4f}), Battery={target_battery}%, Connector={target_connector or 'Any'}",
        )
    )

    # Step 2: Tool - get_nearby_stations & rank_stations
    recommendation_res = compute_station_recommendations(
        db=db,
        user_lat=target_lat,
        user_lng=target_lng,
        battery_pct=target_battery,
        radius_km=45.0,
        connector_type=target_connector,
    )

    tool_logs.append(
        ToolExecutionLog(
            tool_name="get_nearby_stations_and_rank",
            arguments={
                "lat": target_lat,
                "lng": target_lng,
                "battery_pct": target_battery,
                "connector_type": target_connector,
            },
            result_summary=f"Found {recommendation_res.total_found} candidate stations ({recommendation_res.reachable_count} reachable within {recommendation_res.estimated_range_km} km range)",
        )
    )

    if not recommendation_res.ranked_stations:
        return AgentQueryResponse(
            status="no_match",
            query=message,
            reasoned_answer=f"I couldn't find any reachable charging stations near your current location ({intent.get('location_label', 'coordinates')}) matching {target_connector or 'your criteria'} with {target_battery}% battery. Try expanding your search radius or checking available AC slow points.",
            tool_executions=tool_logs,
            key_factors_cited=["No stations within battery range or radius filter."],
        )

    top_st = recommendation_res.top_recommendation
    alternatives = recommendation_res.ranked_stations[1:4]

    # Step 3: Tool - predict_wait detail for top stations
    tool_logs.append(
        ToolExecutionLog(
            tool_name="predict_wait_model",
            arguments={
                "station_id": top_st.station_id,
                "predicted_wait": f"{top_st.breakdown.predicted_wait_minutes} min",
            },
            result_summary=f"Predicted arrival queue wait: {top_st.breakdown.predicted_wait_minutes} min based on historical rush curve.",
        )
    )

    # Step 4: Build reasoned explanation
    factors = []
    reasoning_lines = []

    reasoning_lines.append(
        f"⚡ **Recommended Station:** **{top_st.station_name}** ({top_st.operator})"
    )
    reasoning_lines.append(
        f"• **Distance & Transit:** ~{top_st.breakdown.road_distance_km} km away (~{top_st.breakdown.travel_time_minutes} mins driving time via road)."
    )
    reasoning_lines.append(
        f"• **Arrival Queue:** **{top_st.breakdown.predicted_wait_minutes} mins predicted wait**."
    )
    reasoning_lines.append(
        f"• **Battery Safety:** With **{target_battery}% battery** (estimated {recommendation_res.estimated_range_km} km range), you will arrive with **~{top_st.breakdown.battery_after_arrival_pct}%** remaining."
    )

    factors.append(f"Predicted wait of {top_st.breakdown.predicted_wait_minutes} min")
    factors.append(f"Safe arrival SoC of {top_st.breakdown.battery_after_arrival_pct}%")

    if top_st.breakdown.is_closest:
        reasoning_lines.append(
            f"• **Why Picked:** This is the closest operational station and offers minimal queue congestion."
        )
        factors.append("Geographically optimal with minimal delay")
    else:
        time_saved = top_st.breakdown.time_saved_vs_closest_min
        reasoning_lines.append(
            f"• **Why Picked:** I bypassed the closest station because of anticipated high queue times. Taking this route saves you **~{time_saved} mins in total trip time**."
        )
        factors.append(f"Saves ~{time_saved}m total time vs congested closer station")

    if top_st.power_kw >= 60.0:
        reasoning_lines.append(
            f"• **Fast Charging:** Equipped with {top_st.power_kw} kW ultra-fast DC charger ({', '.join(top_st.connector_types)})."
        )

    reasoned_answer = "\n".join(reasoning_lines)

    return AgentQueryResponse(
        status="success",
        query=message,
        reasoned_answer=reasoned_answer,
        recommended_station=top_st,
        alternative_stations=alternatives,
        tool_executions=tool_logs,
        key_factors_cited=factors,
    )
