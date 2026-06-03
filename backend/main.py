import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, selectinload
from pydantic import BaseModel, EmailStr

load_dotenv()

from db.models import Region, Prefecture, Area, Subscription

DATABASE_URL = os.environ["DATABASE_URL"]
FRONTEND_URL = os.environ["FRONTEND_URL"]

engine = create_engine(DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/regions")
def get_regions():
    with Session(engine) as session:
        regions = (
            session.query(Region)
            .options(
                selectinload(Region.prefectures)
                .selectinload(Prefecture.areas)
                .selectinload(Area.snapshots)
            )
            .all()
        )
        return regions
    
class SubscribeRequest(BaseModel):
    email: EmailStr
    area_ids: list[int]
    
@app.post("/subscriptions")
def subscribe(body: SubscribeRequest):
    with Session(engine) as session:
        # Validate all area_ids exist
        areas = session.query(Area).filter(Area.id.in_(body.area_ids)).all()
        if len(areas) != len(body.area_ids):
            raise HTTPException(status_code=400, detail="One or more area IDs are invalid")

        # Find existing subscriptions for this email
        existing = (
            session.query(Subscription)
            .filter_by(email=body.email)
            .options(selectinload(Subscription.area))
            .all()
        )

        existing_area_ids = {sub.area_id for sub in existing}

        for area in areas:
            if area.id not in existing_area_ids:
                session.add(Subscription(email=body.email, area_id=area.id))

        session.commit()

        existing_names = {sub.area.name_ja for sub in existing}
        new_names = {area.name_ja for area in areas}
        all_names = list(existing_names | new_names)

        return {"subscribed_areas": all_names}

@app.get("/subscriptions/{email}")
def unsubscribe(email: str):
    with Session(engine) as session:
        session.query(Subscription).filter_by(email=email).delete()
        session.commit()
        return {"status": "unsubscribed"}