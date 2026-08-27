"""
AI Agent Service for IntelliCharge.
Orchestrates tool calling (nearby search, wait prediction, ranking)
and provides reasoned, natural-language recommendations using Ollama (llama3.2)
with automatic fallback to rule-based parsing and templated responses.
"""

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core import ollama_client
from app.models.station import Station
from app.ml.predictor import get_wait_time_predictor
from app.services.distance import estimate_road_distance_km, estimate_travel_time_minutes
from app.services.ranking import compute_station_recommendations
from app.schemas.agent import AgentQueryResponse, ToolExecutionLog
from app.schemas.recommend import RankedStationCard

logger = logging.getLogger(__name__)

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


def _match_landmark_coords(text: str) -> Optional[Tuple[Tuple[float, float], str]]:
    """Helper to match text against known landmark presets."""
    t_lower = text.lower()
    for landmark, coords in LANDMARK_COORDINATES.items():
        if landmark in t_lower:
            return coords, landmark.title()
    return None


def _normalize_connector(raw: Optional[str]) -> Optional[str]:
    """Normalizes connector string to standard catalog value."""
    if not raw:
        return None
    c_lower = raw.lower().strip()
    if c_lower in ("all", "any"):
        return None
    if "ccs" in c_lower or "ccs2" in c_lower:
        return "CCS2"
    elif "type 2" in c_lower or "type2" in c_lower:
        return "Type 2"
    elif "chademo" in c_lower:
        return "CHAdeMO"
    elif "bharat" in c_lower or "gb/t" in c_lower:
        return "Bharat DC-001"
    return None


# ─────────────────────────────────────────────────────────────
# Pass 1: Intent Extraction (Ollama with regex fallback)
# ─────────────────────────────────────────────────────────────

def ollama_extract_intent(query: str) -> Optional[Dict[str, Any]]:
    """
    Pass 1: Asks Ollama (llama3.2) to extract structured driver intent as JSON.
    Returns dict if successful, None on error/timeout.
    """
    system_prompt = (
        "You are an intent parser for an EV charging network assistant in Mumbai/Palghar, Maharashtra, India. "
        "Extract the driver's intent from their query into a JSON object with EXACTLY these keys:\n"
        '- "battery_pct": integer or float (percentage between 1 and 100, or null if not mentioned)\n'
        '- "location_name": string (city, area, landmark, or campus name mentioned, or null if not mentioned)\n'
        '- "connector_type": string ("CCS2", "Type 2", "CHAdeMO", "Bharat DC-001", or null if not mentioned)\n\n'
        "Output strictly valid JSON with no markdown formatting, no code blocks, and no extra explanation."
    )

    try:
        raw_text = ollama_client.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            timeout=15,
        )

        # Clean any potential markdown code blocks
        clean_text = raw_text.strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text)
            clean_text = re.sub(r"\s*```$", "", clean_text)

        parsed = json.loads(clean_text)
        return parsed
    except Exception as e:
        logger.warning(f"Ollama intent extraction failed or unavailable, falling back to regex: {e}")
        return None


def parse_query_intent(
    query: str,
    default_lat: Optional[float] = None,
    default_lng: Optional[float] = None,
    default_battery: Optional[float] = None,
    default_connector: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Extracts battery %, location, and connector type from user input.
    Uses Ollama llama3.2 extraction first, with full regex fallback.
    """
    ollama_res = ollama_extract_intent(query)
    parsed_by = "ollama (llama3.2)" if ollama_res else "regex fallback"

    target_battery = None
    target_connector = None
    target_lat = default_lat
    target_lng = default_lng
    matched_loc = None

    if ollama_res:
        # Extract battery %
        raw_soc = ollama_res.get("battery_pct")
        if raw_soc is not None:
            try:
                target_battery = float(raw_soc)
            except (ValueError, TypeError):
                pass

        # Extract connector
        raw_conn = ollama_res.get("connector_type")
        if raw_conn:
            target_connector = _normalize_connector(str(raw_conn))

        # Extract location
        loc_str = ollama_res.get("location_name")
        if loc_str:
            coords_match = _match_landmark_coords(str(loc_str))
            if coords_match:
                (target_lat, target_lng), matched_loc = coords_match

    # Fallback to regex & rule-based parser if Ollama didn't find specific fields
    q_lower = query.lower()

    if target_battery is None:
        battery_match = re.search(r"(\d{1,3})\s*%", q_lower)
        if not battery_match:
            battery_match = re.search(r"(?:battery|charge|soc|level|at|with)\s*(?:is|at|of)?\s*(\d{1,3})", q_lower)
        if battery_match:
            target_battery = float(battery_match.group(1))
        else:
            target_battery = default_battery or 30.0

    target_battery = max(1.0, min(100.0, float(target_battery)))

    if target_connector is None:
        target_connector = _normalize_connector(q_lower) or default_connector

    if target_lat is None or target_lng is None:
        coords_match = _match_landmark_coords(q_lower)
        if coords_match:
            (target_lat, target_lng), matched_loc = coords_match
        else:
            target_lat, target_lng = 19.6967, 72.7699
            matched_loc = "SJCEM Palghar (Default)"

    return {
        "lat": target_lat,
        "lng": target_lng,
        "battery_pct": target_battery,
        "connector_type": target_connector,
        "location_label": matched_loc or "Detected Location",
        "parsed_by": parsed_by,
    }


# ─────────────────────────────────────────────────────────────
# Pass 2: Conversational Response Generation (Ollama with template fallback)
# ─────────────────────────────────────────────────────────────

def _build_template_response(
    top_st: RankedStationCard,
    target_battery: float,
    estimated_range_km: float,
) -> Tuple[str, List[str]]:
    """Builds rule-based template response when Ollama is unavailable."""
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
        f"• **Battery Safety:** With **{target_battery}% battery** (estimated {estimated_range_km} km range), you will arrive with **~{top_st.breakdown.battery_after_arrival_pct}%** remaining."
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

    return "\n".join(reasoning_lines), factors


def ollama_generate_response(
    query: str,
    top_st: RankedStationCard,
    alternatives: List[RankedStationCard],
    target_battery: float,
    estimated_range_km: float,
) -> Optional[str]:
    """
    Pass 2: Generates a natural, conversational recommendation using Ollama (llama3.2)
    injected with real ML wait-time and ranking facts.
    """
    alt_summary = "\n".join(
        [
            f"- {alt.station_name} ({alt.operator}): {alt.breakdown.road_distance_km} km away, {alt.breakdown.predicted_wait_minutes} min predicted wait, {alt.power_kw} kW"
            for alt in alternatives[:3]
        ]
    ) or "None in direct range"

    why_chosen = (
        "Closest operational station with minimal queue delay."
        if top_st.breakdown.is_closest
        else f"Bypassed closer station due to long queues; saves ~{top_st.breakdown.time_saved_vs_closest_min} mins in total travel + wait time."
    )

    system_prompt = (
        "You are IntelliCharge, an AI assistant for EV drivers in Mumbai and Maharashtra. "
        "You have just executed real-time queue prediction models and optimal routing calculations. "
        "Provide a clear, natural, and conversational recommendation in 3 to 4 concise sentences.\n\n"
        "FACTS FROM ML PIPELINE:\n"
        f"- Top Recommendation: {top_st.station_name} ({top_st.operator})\n"
        f"- Predicted Arrival Queue Wait: {top_st.breakdown.predicted_wait_minutes} minutes\n"
        f"- Road Distance: {top_st.breakdown.road_distance_km} km (Drive time: {top_st.breakdown.travel_time_minutes} mins)\n"
        f"- Battery on Arrival: ~{top_st.breakdown.battery_after_arrival_pct}% (Starting battery: {target_battery}%, est. range {estimated_range_km} km)\n"
        f"- Charger Specs: {top_st.power_kw} kW ({', '.join(top_st.connector_types)})\n"
        f"- Why Chosen: {why_chosen}\n"
        f"- Alternative stations considered:\n{alt_summary}\n\n"
        "GUIDELINES:\n"
        "1. State the top recommendation first, followed by predicted wait and drive time.\n"
        "2. Explain why it was selected (low congestion, time saved, or safe battery arrival).\n"
        "3. Keep tone direct, professional, and reassuring for an EV driver on the road.\n"
        "4. STRICT CONSTRAINT: Do NOT hallucinate or alter any numbers, names, or values. Use only the exact facts above."
    )

    user_message = f"Driver query: \"{query}\""

    try:
        reply = ollama_client.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            timeout=25,
        )
        return reply.strip()
    except Exception as e:
        logger.warning(f"Ollama response generation failed, using template: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# Main Agent Query Execution
# ─────────────────────────────────────────────────────────────

def execute_agent_query(
    db: Session,
    message: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    battery_pct: Optional[float] = None,
    connector_type: Optional[str] = None,
) -> AgentQueryResponse:
    """
    Processes a conversational EV charging query through tool orchestration
    and two-pass Ollama intelligence with robust fallback.
    """
    tool_logs: List[ToolExecutionLog] = []

    # Step 1: Parse user intent (Pass 1)
    intent = parse_query_intent(message, lat, lng, battery_pct, connector_type)
    target_lat = intent["lat"]
    target_lng = intent["lng"]
    target_battery = intent["battery_pct"]
    target_connector = intent["connector_type"]
    parsed_by = intent.get("parsed_by", "system")

    tool_logs.append(
        ToolExecutionLog(
            tool_name="parse_intent",
            arguments={"query": message, "engine": parsed_by},
            result_summary=f"Extracted [{parsed_by}]: Location=({target_lat:.4f}, {target_lng:.4f}) [{intent['location_label']}], Battery={target_battery}%, Connector={target_connector or 'Any'}",
        )
    )

    # Step 2: Tool - get_nearby_stations & rank_stations (ML Pipeline)
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

    # Step 4: Generate reasoned explanation (Pass 2)
    template_answer, factors = _build_template_response(
        top_st, target_battery, recommendation_res.estimated_range_km
    )

    # Try Pass 2 with Ollama (llama3.2)
    ollama_answer = ollama_generate_response(
        query=message,
        top_st=top_st,
        alternatives=alternatives,
        target_battery=target_battery,
        estimated_range_km=recommendation_res.estimated_range_km,
    )

    if ollama_answer:
        reasoned_answer = ollama_answer
        gen_engine = "ollama (llama3.2)"
    else:
        reasoned_answer = template_answer
        gen_engine = "template fallback"

    tool_logs.append(
        ToolExecutionLog(
            tool_name="generate_reasoning",
            arguments={"engine": gen_engine, "station": top_st.station_name},
            result_summary=f"Generated reasoned recommendation via {gen_engine}.",
        )
    )

    return AgentQueryResponse(
        status="success",
        query=message,
        reasoned_answer=reasoned_answer,
        recommended_station=top_st,
        alternative_stations=alternatives,
        tool_executions=tool_logs,
        key_factors_cited=factors,
    )

