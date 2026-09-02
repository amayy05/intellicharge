from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QueueJoinRequest(BaseModel):
    vehicle_id: int
    current_soc: float
    target_soc: float

class QueueJoinResponse(BaseModel):
    status: str
    queue_entry_id: int
    estimated_duration_minutes: float
    estimated_wait_minutes: float
    estimated_start_time: datetime

class QueueStatusResponse(BaseModel):
    station_id: str
    active_sessions: int
    waiting_vehicles: int
    available_chargers: int
    total_chargers: int
