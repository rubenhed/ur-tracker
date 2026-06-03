print("[BOOT] scraper file started")

import os
import time
import resend
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, selectinload
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

print("[BOOT] dotenv loaded")

from db.models import Area, Prefecture, Snapshot, Subscription
print("[BOOT] db.models imported")

URL = "https://www.ur-net.go.jp/chintai/kanto/tokyo/area/"
PREFECTURE_NAME = "東京都"
INTERVAL_SECONDS = 120
FRONTEND_URL = os.environ["FRONTEND_URL"]

DATABASE_URL = os.environ["DATABASE_URL"]
resend.api_key = os.environ["RESEND_API_KEY"]

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
def trigger_scrape():
    print("[api] endpoint hit")
    run()
    print("[api] run finished")
    return {"status": "done"}

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


def notify_subscribers(session: Session, changes: list[dict]):
    if not changes:
        return

    changed_area_ids = [c["area_id"] for c in changes]
    change_map = {c["area_id"]: c for c in changes}

    subs = (
        session.query(Subscription)
        .filter(Subscription.area_id.in_(changed_area_ids))
        .all()
    )

    # Group changes by email
    emails: dict[str, list] = {}
    for sub in subs:
        emails.setdefault(sub.email, []).append(change_map[sub.area_id])

    for email, recipient_changes in emails.items():
        rows = "".join(
            f"<tr>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e2e8f0'>{c['area_name']}</td>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e2e8f0'>{c['old'] if c['old'] is not None else '-'}</td>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:{'#16a34a' if c['new'] > 0 else '#dc2626'}'>{c['new']}</td>"
            f"</tr>"
            for c in recipient_changes
        )

        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin-bottom:16px">UR Vacancy Update</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                    <tr style="background:#f8fafc">
                        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Area</th>
                        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Before</th>
                        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Now</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
            <p style="margin-top:24px;font-size:12px;color:#94a3b8">
                <a href="{FRONTEND_URL}/unsubscribe/{email}" style="color:#94a3b8">Unsubscribe</a>
            </p>
        </div>
        """

        resend.Emails.send({
            "from": "UR Tracker <onboarding@resend.dev>",
            "to": email,
            "subject": "UR Vacancy Update",
            "html": html,
        })
        print(f"[notifier] Sent to {email} ({len(recipient_changes)} changes)")


def save_to_db(results: list[dict]):
    with Session(engine) as session:
        prefecture = session.query(Prefecture).filter_by(name_ja=PREFECTURE_NAME).first()
        if not prefecture:
            print(f"[scraper] Prefecture {PREFECTURE_NAME} not found — did you run seed.py?")
            return

        increases = []
        updated = 0
        for result in results:
            area = session.query(Area).filter_by(name_ja=result["name"]).first()
            if not area:
                area = Area(name_ja=result["name"], prefecture_id=prefecture.id)
                session.add(area)
                session.flush()
                print(f"[scraper] New area: {result['name']}")

            latest = (
                session.query(Snapshot)
                .filter_by(area_id=area.id)
                .order_by(Snapshot.recorded_at.desc())
                .first()
            )

            if latest is None or latest.vacant_rooms != result["vacant_rooms"]:
                # Skip notifying on first ever snapshot
                if latest is not None and result["vacant_rooms"] > latest.vacant_rooms:
                    increases.append({
                        "area_id": area.id,
                        "area_name": result["name"],
                        "old": latest.vacant_rooms,
                        "new": result["vacant_rooms"],
                    })

                snapshot = Snapshot(
                    area_id=area.id,
                    vacant_rooms=result["vacant_rooms"],
                    recorded_at=datetime.now(timezone.utc),
                )
                session.add(snapshot)
                updated += 1

        prefecture.last_checked_at = datetime.now(timezone.utc)
        session.commit()
        print(f"[scraper] {updated} areas updated, {len(results) - updated} unchanged")

        notify_subscribers(session, increases)


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

# run_loop()