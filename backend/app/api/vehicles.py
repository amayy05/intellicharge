from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.vehicle import EVVehicle
from app.models.user import User
from app.api.deps import get_optional_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


class VehicleCreate(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_name: str
    battery_capacity_kwh: float
    max_charging_power_kw: float
    connector_type: str


class VehicleResponse(VehicleCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


def get_or_create_demo_user(db: Session) -> User:
    """Helper to ensure a fallback demo user exists for unauthenticated demo sessions."""
    demo_user = db.query(User).filter(User.email == "demo@intellicharge.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@intellicharge.ai",
            hashed_password=get_password_hash("password123"),
            name="Demo Driver",
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    return demo_user


@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Save an EV profile. Associated with logged-in user if token provided, else demo user."""
    user = current_user or get_or_create_demo_user(db)
    
    db_vehicle = EVVehicle(
        user_id=user.id,
        model_name=vehicle.model_name,
        battery_capacity_kwh=vehicle.battery_capacity_kwh,
        max_charging_power_kw=vehicle.max_charging_power_kw,
        connector_type=vehicle.connector_type,
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get vehicles belonging to the current user (or demo user if unauthenticated)."""
    user = current_user or get_or_create_demo_user(db)
    return db.query(EVVehicle).filter(EVVehicle.user_id == user.id).all()
