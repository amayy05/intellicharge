from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.vehicle import EVVehicle

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

class VehicleCreate(BaseModel):
    model_config = { "protected_namespaces": () }
    model_name: str
    battery_capacity_kwh: float
    max_charging_power_kw: float
    connector_type: str

class VehicleResponse(VehicleCreate):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = EVVehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(EVVehicle).filter(EVVehicle.user_id == "demo_user").all()
