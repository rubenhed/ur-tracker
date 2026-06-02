import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from models import Base, Region, Prefecture

DATABASE_URL = os.environ["DATABASE_URL"]
REGION_NAME = "関東"
PREFECTURE_NAME = "東京都"

engine = create_engine(DATABASE_URL)


def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(engine)
    print("Done.")


def seed():
    with Session(engine) as session:
        region = session.query(Region).filter_by(name_ja=REGION_NAME).first()
        if not region:
            region = Region(name_ja=REGION_NAME)
            session.add(region)
            session.flush()
            print(f"Inserted region: {REGION_NAME}")
        else:
            print(f"Region already exists: {REGION_NAME}")

        prefecture = session.query(Prefecture).filter_by(name_ja=PREFECTURE_NAME).first()
        if not prefecture:
            prefecture = Prefecture(name_ja=PREFECTURE_NAME, region_id=region.id)
            session.add(prefecture)
            print(f"Inserted prefecture: {PREFECTURE_NAME}")
        else:
            print(f"Prefecture already exists: {PREFECTURE_NAME}")

        session.commit()
        print("Seeding complete.")


if __name__ == "__main__":
    create_tables()
    seed()