import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, selectinload

load_dotenv()

from db.models import Region, Prefecture, Area

DATABASE_URL = os.environ["DATABASE_URL"]
FRONTEND_URL = os.environ["FRONTEND_URL"]

engine = create_engine(DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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