"""
API endpoint for the Conversational AI Agent.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse
from app.services.agent_service import execute_agent_query

router = APIRouter(prefix="/agent", tags=["AI Agent"])


@router.post("/query", response_model=AgentQueryResponse)
def query_agent(
    payload: AgentQueryRequest,
    db: Session = Depends(get_db),
):
    """
    Accepts a natural-language query and runs tool orchestration to produce
    a reasoned recommendation citing wait-times, distance, and battery safety.
    """
    return execute_agent_query(
        db=db,
        message=payload.message,
        lat=payload.lat,
        lng=payload.lng,
        battery_pct=payload.battery_pct,
        connector_type=payload.connector_type,
    )
