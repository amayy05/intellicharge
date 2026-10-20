from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime


DISCLAIMER_TEXT = (
    "Virtual estimate only — this does not reserve a physical charger. "
    "Station availability is not confirmed by the operator."
)


class QueueJoinRequest(BaseModel):
    vehicle_id: int
    current_soc: float = Field(..., ge=0.0, le=100.0)
    target_soc: float = Field(..., ge=0.0, le=100.0)
    expected_arrival_at: Optional[datetime] = None


class QueuePlanRequest(BaseModel):
    vehicle_id: int
    current_soc: float = Field(..., ge=0.0, le=100.0)
    target_soc: float = Field(..., ge=0.0, le=100.0)
    expected_arrival_at: Optional[datetime] = None


class QueueJoinResponse(BaseModel):
    status: str
    queue_entry_id: int
    station_id: Optional[str] = None
    vehicle_id: Optional[int] = None
    entry_status: str = "WAITING"
    estimated_duration_minutes: float
    estimated_wait_minutes: float
    estimated_start_time: datetime
    expected_arrival_at: Optional[datetime] = None
    checked_in_at: Optional[datetime] = None
    prediction_source: str = "virtual_queue"
    operator_verified: bool = False
    disclaimer: str = DISCLAIMER_TEXT
    model_config = ConfigDict(from_attributes=True)


class QueueStatusResponse(BaseModel):
    station_id: str
    active_sessions: int
    waiting_vehicles: int
    planned_requests: int = 0
    available_chargers: int
    total_chargers: int
    estimated_wait_minutes: float = 0.0
    prediction_source: str = "virtual_queue"
    operator_verified: bool = False
    notice: str = DISCLAIMER_TEXT
    model_config = ConfigDict(from_attributes=True)


class QueueEntryDetailResponse(BaseModel):
    id: int
    station_id: str
    vehicle_id: int
    user_id: Optional[int] = None
    status: str
    current_soc: Optional[float] = None
    target_soc: Optional[float] = None
    joined_at: datetime
    expected_arrival_at: Optional[datetime] = None
    checked_in_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    estimated_duration_minutes: float
    estimated_start_at: Optional[datetime] = None
    estimated_end_at: Optional[datetime] = None
    operator_verified: bool = False
    disclaimer: str = DISCLAIMER_TEXT
    model_config = ConfigDict(from_attributes=True)
