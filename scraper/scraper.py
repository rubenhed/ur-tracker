print("[BOOT] scraper file started")

import os
import time
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

print("[BOOT] dotenv loaded")

from db.models import Area, Prefecture, Snapshot
print("[BOOT] db.models imported")

URL = "https://www.ur-net.go.jp/chintai/kanto/tokyo/area/"
PREFECTURE_NAME = "東京都"
INTERVAL_SECONDS = 120

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[BOOT] DB engine created")

@app.post("/scrape/run")
def trigger_scrape(background_tasks: BackgroundTasks):
    def job():
        try:
            run()
            print("[api] scrape run success")
        except Exception as e:
            print(f"[api] scrape run failed: {e}")

    background_tasks.add_task(job)
    return {"status": "started"}

def scrape() -> list[dict]:
    print(f"[scraper] Loading {URL} ...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function(
            "() => Array.from(document.querySelectorAll('label[for^=\"skcs_\"] span'))"
            ".some(s => s.innerText.trim() !== '-')"
        )
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")
    results = []
    for cb in soup.find_all("input", {"name": "skcs"}):
        label = soup.find("label", {"for": cb["id"]})
        name = label.find("em").get_text(strip=True)
        count = int(label.find("span").get_text(strip=True))
        results.append({"name": name, "vacant_rooms": count})

    print(f"[scraper] Scraped {len(results)} areas")
    return results


def save_to_db(results: list[dict]):
    with Session(engine) as session:
        prefecture = session.query(Prefecture).filter_by(name_ja=PREFECTURE_NAME).first()
        if not prefecture:
            print(f"[scraper] Prefecture {PREFECTURE_NAME} not found — did you run seed.py?")
            return

        updated = 0
        for result in results:
            # Get or create area
            area = session.query(Area).filter_by(name_ja=result["name"]).first()
            if not area:
                area = Area(name_ja=result["name"], prefecture_id=prefecture.id)
                session.add(area)
                session.flush()
                print(f"[scraper] New area: {result['name']}")

            # Check latest snapshot
            latest = (
                session.query(Snapshot)
                .filter_by(area_id=area.id)
                .order_by(Snapshot.recorded_at.desc())
                .first()
            )

            if latest is None or latest.vacant_rooms != result["vacant_rooms"]:
                snapshot = Snapshot(
                    area_id=area.id,
                    vacant_rooms=result["vacant_rooms"],
                    recorded_at=datetime.now(timezone.utc),
                )
                session.add(snapshot)
                updated += 1

        # Update prefecture last_checked_at
        prefecture.last_checked_at = datetime.now(timezone.utc)
        session.commit()
        print(f"[scraper] {updated} areas updated, {len(results) - updated} unchanged")


def run():
    results = scrape()
    save_to_db(results)
    total = sum(r["vacant_rooms"] for r in results)
    print(f"[scraper] Total vacant: {total} across {len(results)} areas")


def run_loop():
    print(f"[scraper] Starting loop every {INTERVAL_SECONDS}s")
    while True:
        try:
            run()
        except Exception as e:
            print(f"[scraper] Error: {e}")
        print(f"[scraper] Waiting {INTERVAL_SECONDS}s...")
        time.sleep(INTERVAL_SECONDS)

run_loop()