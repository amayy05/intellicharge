"""
Pydantic schemas for the Conversational AI Agent Layer.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.recommend import RankedStationCard


class AgentQueryRequest(BaseModel):
    message: str = Field(..., description="User's natural language question or request")
    lat: Optional[float] = Field(None, description="Optional user latitude")
    lng: Optional[float] = Field(None, description="Optional user longitude")
    battery_pct: Optional[float] = Field(None, description="Optional current battery percentage")
    connector_type: Optional[str] = Field(None, description="Optional connector preference")


class ToolExecutionLog(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result_summary: str


class AgentQueryResponse(BaseModel):
    status: str = "success"
    query: str
    reasoned_answer: str
    recommended_station: Optional[RankedStationCard] = None
    alternative_stations: List[RankedStationCard] = []
    tool_executions: List[ToolExecutionLog] = []
    key_factors_cited: List[str] = []
