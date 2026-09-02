from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.queue_entry import QueueEntry
from app.models.vehicle import EVVehicle
from app.schemas.queue import QueueJoinRequest, QueueJoinResponse, QueueStatusResponse
from app.services.queue_engine import get_station_queue_status, estimate_queue_wait_time, recalculate_queue
from app.services.charging_math import calculate_charging_duration_minutes
from app.services.simulator import advance_time

router = APIRouter(prefix="/stations", tags=["Queue"])

@router.get("/{station_id}/queue", response_model=QueueStatusResponse)
def get_queue_status(station_id: str, db: Session = Depends(get_db)):
    status = get_station_queue_status(db, station_id)
    return QueueStatusResponse(station_id=station_id, **status)

@router.post("/{station_id}/queue/join", response_model=QueueJoinResponse)
def join_queue(station_id: str, request: QueueJoinRequest, db: Session = Depends(get_db)):
    # 1. Get vehicle details
    vehicle = db.query(EVVehicle).filter(EVVehicle.id == request.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # 2. Calculate duration
    # Assume charger is 50kW for MVP
    duration = calculate_charging_duration_minutes(
        battery_capacity_kwh=vehicle.battery_capacity_kwh,
        current_soc=request.current_soc,
        target_soc=request.target_soc,
        vehicle_max_power_kw=vehicle.max_charging_power_kw,
        charger_power_kw=50.0 
    )
    
    # 3. Get wait time
    wait_time, start_time = estimate_queue_wait_time(db, station_id, duration)
    
    # 4. Create Queue Entry
    entry = QueueEntry(
        station_id=station_id,
        vehicle_id=vehicle.id,
        estimated_duration_minutes=duration,
        estimated_start_at=start_time,
        estimated_end_at=start_time + __import__('datetime').timedelta(minutes=duration)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    # Recalculate just in case
    recalculate_queue(db, station_id)
    
    return QueueJoinResponse(
        status="success",
        queue_entry_id=entry.id,
        estimated_duration_minutes=duration,
        estimated_wait_minutes=wait_time,
        estimated_start_time=start_time
    )

@router.post("/{station_id}/queue/{entry_id}/leave")
def leave_queue(station_id: str, entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
        
    entry.status = "CANCELLED"
    db.commit()
    
    recalculate_queue(db, station_id)
    return {"status": "success", "message": "Left queue"}

# DEMO ENDPOINT
@router.post("/demo/tick")
def demo_tick(minutes: float = 5.0, db: Session = Depends(get_db)):
    """Advances time by X minutes for demo purposes"""
    advance_time(db, minutes)
    return {"status": "success", "message": f"Time advanced by {minutes} minutes"}
