"""
Database Seeding Script for IntelliCharge.
Loads curated MMR/Palghar station records and populates historical queue snapshots.
"""

import json
import os
import sys
from pathlib import Path

# Add backend directory AND project root to sys.path so all imports resolve
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR))  # Needed for data.generator import

from app.core.database import SessionLocal, engine, Base
from app.models.station import Station
from app.models.queue import QueueSnapshot
from app.models.user import User
from app.core.security import get_password_hash
from app.ml.train import train_wait_time_model

# Import queue generator from data directory
from data.generator.queue_generator import generate_synthetic_dataset


def seed_database():
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    raw_stations_path = BASE_DIR / "data" / "raw" / "mmr_palghar_stations.json"
    queue_history_path = BASE_DIR / "data" / "synthetic_queue_history.json"
    model_output_path = BASE_DIR / "data" / "models" / "wait_time_model.joblib"
    pipeline_output_path = BASE_DIR / "data" / "models" / "feature_pipeline.joblib"

    if not raw_stations_path.exists():
        print(f"Error: {raw_stations_path} does not exist!")
        return

    print("Loading stations...")
    with open(raw_stations_path, "r", encoding="utf-8") as f:
        stations_data = json.load(f)

    # Insert or update stations
    st_count = 0
    for st_dict in stations_data:
        existing = db.query(Station).filter(Station.id == st_dict["id"]).first()
        c_types_str = ",".join(st_dict.get("connector_types", []))
        amenities_str = json.dumps(st_dict.get("amenities", []))

        if not existing:
            st = Station(
                id=st_dict["id"],
                name=st_dict["name"],
                operator=st_dict.get("operator", "Unknown"),
                latitude=st_dict["latitude"],
                longitude=st_dict["longitude"],
                address=st_dict.get("address", ""),
                city_region=st_dict.get("city_region", "MMR"),
                connector_types=c_types_str,
                charger_count=st_dict.get("charger_count", 4),
                power_kw=st_dict.get("power_kw", 50.0),
                pricing_per_kwh=st_dict.get("pricing_per_kwh", 16.0),
                amenities=amenities_str,
                source=st_dict.get("source", "OpenChargeMap"),
            )
            db.add(st)
            st_count += 1
        else:
            existing.name = st_dict["name"]
            existing.operator = st_dict.get("operator", "Unknown")
            existing.latitude = st_dict["latitude"]
            existing.longitude = st_dict["longitude"]
            existing.address = st_dict.get("address", "")
            existing.city_region = st_dict.get("city_region", "MMR")
            existing.connector_types = c_types_str
            existing.charger_count = st_dict.get("charger_count", 4)
            existing.power_kw = st_dict.get("power_kw", 50.0)
            existing.pricing_per_kwh = st_dict.get("pricing_per_kwh", 16.0)
            existing.amenities = amenities_str

    db.commit()
    print(f"Successfully seeded/updated {len(stations_data)} charging stations.")

    # Seed default demo user for testing & grading
    demo_user = db.query(User).filter(User.email == "demo@intellicharge.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@intellicharge.ai",
            hashed_password=get_password_hash("password123"),
            name="Demo Driver",
        )
        db.add(demo_user)
        db.commit()
        print("Seeded default demo user (demo@intellicharge.ai / password123)")

    # Generate synthetic queue history if missing
    if not queue_history_path.exists():
        print("Generating synthetic 75-day queue history dataset...")
        generate_synthetic_dataset(str(raw_stations_path), str(queue_history_path), days=75)

    # Load synthetic snapshots into DB
    with open(queue_history_path, "r", encoding="utf-8") as f:
        snapshots_data = json.load(f)

    existing_snaps = db.query(QueueSnapshot).count()
    if existing_snaps == 0:
        print(f"Seeding {len(snapshots_data)} queue snapshots into SQLite DB...")
        # Batch insert for speed
        batch_size = 5000
        for i in range(0, len(snapshots_data), batch_size):
            batch = snapshots_data[i : i + batch_size]
            db_objs = [
                QueueSnapshot(
                    station_id=item["station_id"],
                    timestamp=item["timestamp"],
                    hour_of_day=item["hour_of_day"],
                    day_of_week=item["day_of_week"],
                    occupied_chargers=item["occupied_chargers"],
                    wait_minutes=item["wait_minutes"],
                )
                for item in batch
            ]
            db.bulk_save_objects(db_objs)
            db.commit()
        print("Completed bulk insert of queue snapshots.")
    else:
        print(f"Database already contains {existing_snaps} queue snapshots.")

    db.close()

    # Train and evaluate ML Model
    print("Training ML wait-time prediction model...")
    metrics = train_wait_time_model(str(queue_history_path), str(model_output_path), str(pipeline_output_path))
    print(f"Model training finished: {metrics}")


if __name__ == "__main__":
    seed_database()
