
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import json
import shutil
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


# ==========================================
# CONFIGURATION
# ==========================================

BASE = Path(__file__).resolve().parent
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
DB_FILE = BASE / "data.json"

app = FastAPI(
    title="Election Field Management API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
        "https://booth-management-232.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def now():
    return datetime.now(timezone.utc).isoformat()


def initial_data():
    return {
        "users": [
            {
                "id": "u1",
                "name": "Aarav Sharma",
                "username": "aarav",
                "password": "field123",
                "role": "user",
                "area": "Ward 04",
                "status": "active",
                "lat": 30.3398,
                "lng": 76.3869,
                "last_seen": now()
            },
            {
                "id": "u2",
                "name": "Simran Kaur",
                "username": "simran",
                "password": "field123",
                "role": "user",
                "area": "Ward 07",
                "status": "active",
                "lat": 30.3470,
                "lng": 76.4000,
                "last_seen": now()
            },
            {
                "id": "u3",
                "name": "Rahul Verma",
                "username": "rahul",
                "password": "field123",
                "role": "user",
                "area": "Village North",
                "status": "offline",
                "lat": 30.3300,
                "lng": 76.3700,
                "last_seen": None
            }
        ],

        "entries": [
            {
                "id": "e1",
                "title": "Community visit summary",
                "area": "Ward 04",
                "notes": "Met local residents; follow-up requested.",
                "created_by": "u1",
                "created_by_name": "Aarav Sharma",
                "created_at": now(),
                "files": [],
                "lat": 30.3398,
                "lng": 76.3869,
                "status": "Pending"
            },
            {
                "id": "e2",
                "title": "Field observation",
                "area": "Ward 07",
                "notes": "Uploaded field notes for review.",
                "created_by": "u2",
                "created_by_name": "Simran Kaur",
                "created_at": now(),
                "files": [],
                "lat": 30.3470,
                "lng": 76.4000,
                "status": "Approved"
            }
        ],

        "tasks": [
            {
                "id": "t1",
                "title": "Complete assigned area visit",
                "area": "Ward 04",
                "assigned_to": "u1",
                "due_date": "2026-11-10",
                "status": "In Progress"
            },
            {
                "id": "t2",
                "title": "Submit field observations",
                "area": "Ward 07",
                "assigned_to": "u2",
                "due_date": "2026-11-12",
                "status": "Pending"
            }
        ],

        "activity": []
    }


def save_db(data):
    DB_FILE.write_text(
        json.dumps(data, indent=2),
        encoding="utf-8"
    )


def load_db():
    if not DB_FILE.exists():
        save_db(initial_data())

    return json.loads(
        DB_FILE.read_text(encoding="utf-8")
    )


def public_user(user):
    return {
        key: value
        for key, value in user.items()
        if key != "password"
    }


# ==========================================
# REQUEST MODELS
# ==========================================

class LoginBody(BaseModel):
    username: str
    password: str


class LocationBody(BaseModel):
    user_id: str
    lat: float
    lng: float


class UserBody(BaseModel):
    name: str
    username: str
    password: str
    area: str = ""


class ProfileUpdateBody(BaseModel):
    name: str
    area: str = ""


class TaskBody(BaseModel):
    title: str
    area: str
    assigned_to: str
    due_date: str = ""


class StatusBody(BaseModel):
    status: str
    comment: str = ""


# ==========================================
# HOME
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Election Field Management API is running",
        "docs": "/docs"
    }


# ==========================================
# LOGIN
# ==========================================

@app.post("/api/login")
def login(body: LoginBody):
    db = load_db()

    user = next(
        (
            u for u in db["users"]
            if u["username"] == body.username
            and u["password"] == body.password
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "user": public_user(user)
    }


# ==========================================
# DASHBOARD
# ==========================================

@app.get("/api/dashboard")
def dashboard():
    db = load_db()

    return {
        "users": [
            public_user(u)
            for u in db["users"]
        ],

        "entries": sorted(
            db["entries"],
            key=lambda x: x["created_at"],
            reverse=True
        ),

        "tasks": db["tasks"],

        "activity": sorted(
            db["activity"],
            key=lambda x: x["created_at"],
            reverse=True
        )[:12],

        "stats": {
            "total_users": len(db["users"]),

            "active_users": sum(
                1 for u in db["users"]
                if u["status"] == "active"
            ),

            "total_entries": len(db["entries"]),

            "pending_review": sum(
                1 for e in db["entries"]
                if e["status"] == "Pending"
            ),

            "tasks_open": sum(
                1 for t in db["tasks"]
                if t["status"] != "Completed"
            )
        }
    }


# ==========================================
# FIELD USER PROFILE
# ==========================================

@app.get("/api/users/{user_id}/profile")
def get_user_profile(user_id: str):
    db = load_db()

    user = next(
        (
            u for u in db["users"]
            if u["id"] == user_id
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user_entries = [
        e for e in db["entries"]
        if e["created_by"] == user_id
    ]

    user_tasks = [
        t for t in db["tasks"]
        if t["assigned_to"] == user_id
    ]

    return {
        "profile": public_user(user),

        "statistics": {
            "total_entries": len(user_entries),

            "approved_entries": sum(
                1 for e in user_entries
                if e["status"] == "Approved"
            ),

            "pending_entries": sum(
                1 for e in user_entries
                if e["status"] == "Pending"
            ),

            "rejected_entries": sum(
                1 for e in user_entries
                if e["status"] == "Rejected"
            ),

            "total_tasks": len(user_tasks),

            "completed_tasks": sum(
                1 for t in user_tasks
                if t["status"] == "Completed"
            )
        },

        "recent_entries": sorted(
            user_entries,
            key=lambda x: x["created_at"],
            reverse=True
        )[:10],

        "assigned_tasks": user_tasks
    }


# ==========================================
# UPDATE FIELD USER PROFILE
# ==========================================

@app.patch("/api/users/{user_id}/profile")
def update_user_profile(
    user_id: str,
    body: ProfileUpdateBody
):
    db = load_db()

    user = next(
        (
            u for u in db["users"]
            if u["id"] == user_id
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not body.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    user["name"] = body.name.strip()
    user["area"] = body.area.strip()

    # Update name in existing entries
    for entry in db["entries"]:
        if entry["created_by"] == user_id:
            entry["created_by_name"] = user["name"]

    db["activity"].append({
        "id": uuid.uuid4().hex[:8],
        "message": f"{user['name']} updated their profile",
        "created_at": now()
    })

    save_db(db)

    return {
        "message": "Profile updated successfully",
        "profile": public_user(user)
    }


# ==========================================
# ADD FIELD USER
# ==========================================

@app.post("/api/users")
def add_user(body: UserBody):
    db = load_db()

    if any(
        u["username"] == body.username
        for u in db["users"]
    ):
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    user = {
        "id": "u" + uuid.uuid4().hex[:7],
        "name": body.name,
        "username": body.username,
        "password": body.password,
        "role": "user",
        "area": body.area,
        "status": "offline",
        "lat": None,
        "lng": None,
        "last_seen": None
    }

    db["users"].append(user)

    db["activity"].append({
        "id": uuid.uuid4().hex[:8],
        "message": f"Admin created field user {body.name}",
        "created_at": now()
    })

    save_db(db)

    return public_user(user)


# ==========================================
# UPDATE LOCATION
# ==========================================

@app.post("/api/location")
def update_location(body: LocationBody):
    db = load_db()

    user = next(
        (
            u for u in db["users"]
            if u["id"] == body.user_id
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.update({
        "lat": body.lat,
        "lng": body.lng,
        "status": "active",
        "last_seen": now()
    })

    save_db(db)

    return {
        "ok": True,
        "last_seen": user["last_seen"]
    }


# ==========================================
# CREATE FIELD ENTRY
# ==========================================

@app.post("/api/entries")
async def create_entry(
    user_id: str = Form(...),
    title: str = Form(...),
    area: str = Form(""),
    notes: str = Form(""),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    files: list[UploadFile] = File(default=[])
):
    db = load_db()

    user = next(
        (
            u for u in db["users"]
            if u["id"] == user_id
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    saved_files = []

    for upload in files:
        if not upload.filename:
            continue

        ext = Path(upload.filename).suffix[:12]
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / safe_name

        with dest.open("wb") as f:
            shutil.copyfileobj(upload.file, f)

        saved_files.append({
            "name": upload.filename,
            "url": f"/uploads/{safe_name}",
            "content_type": upload.content_type
        })

    entry = {
        "id": "e" + uuid.uuid4().hex[:7],
        "title": title,
        "area": area or user.get("area", ""),
        "notes": notes,
        "created_by": user_id,
        "created_by_name": user["name"],
        "created_at": now(),
        "files": saved_files,
        "lat": lat,
        "lng": lng,
        "status": "Pending"
    }

    db["entries"].append(entry)

    db["activity"].append({
        "id": uuid.uuid4().hex[:8],
        "message": f"{user['name']} submitted “{title}”",
        "created_at": now()
    })

    save_db(db)

    return entry


# ==========================================
# CREATE TASK
# ==========================================

@app.post("/api/tasks")
def create_task(body: TaskBody):
    db = load_db()

    if not any(
        u["id"] == body.assigned_to
        for u in db["users"]
    ):
        raise HTTPException(
            status_code=404,
            detail="Assigned user not found"
        )

    task = {
        "id": "t" + uuid.uuid4().hex[:7],
        "title": body.title,
        "area": body.area,
        "assigned_to": body.assigned_to,
        "due_date": body.due_date,
        "status": "Pending"
    }

    db["tasks"].append(task)

    save_db(db)

    return task


# ==========================================
# REVIEW ENTRY
# ==========================================

@app.patch("/api/entries/{entry_id}")
def review_entry(
    entry_id: str,
    body: StatusBody
):
    if body.status not in [
        "Approved",
        "Rejected",
        "Pending"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    db = load_db()

    entry = next(
        (
            e for e in db["entries"]
            if e["id"] == entry_id
        ),
        None
    )

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Entry not found"
        )

    entry["status"] = body.status
    entry["review_comment"] = body.comment

    db["activity"].append({
        "id": uuid.uuid4().hex[:8],
        "message": f"Entry “{entry['title']}” marked {body.status}",
        "created_at": now()
    })

    save_db(db)

    return entry


# ==========================================
# RUN SERVER
# ==========================================

# Start using:
# uvicorn main:app --reload


# ==========================================
# ANONYMOUS PUBLIC OPINION SURVEY
# ==========================================
# Set SURVEY_ADMIN_KEY in your environment before production use.
# No IP address, name, phone number, email or browser fingerprint is stored.
import os
import csv
import io
from fastapi import Header
from fastapi.responses import StreamingResponse

SURVEY_FILE = BASE / "survey_responses.json"
SURVEY_ADMIN_KEY = os.getenv("SURVEY_ADMIN_KEY", "change-this-survey-admin-key")
SURVEY_CONFIG_FILE = BASE / "survey_config.json"

DEFAULT_SURVEY_CONFIG = {
    "enabled": True,
    "title": "PUNJAB PUBLIC OPINION & DEVELOPMENT SURVEY",
    "intro": "Understanding Public Issues, Governance, Political Perceptions & Future Expectations"
}

class SurveySubmission(BaseModel):
    answers: dict
    consent: bool

class SurveyConfigUpdate(BaseModel):
    enabled: bool = True
    title: str
    intro: str

def load_survey_responses():
    if not SURVEY_FILE.exists():
        SURVEY_FILE.write_text("[]", encoding="utf-8")
    try:
        data = json.loads(SURVEY_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        raise HTTPException(status_code=500, detail="Survey storage could not be read")

def load_survey_config():
    if not SURVEY_CONFIG_FILE.exists():
        SURVEY_CONFIG_FILE.write_text(json.dumps(DEFAULT_SURVEY_CONFIG, indent=2), encoding="utf-8")
    try:
        config = json.loads(SURVEY_CONFIG_FILE.read_text(encoding="utf-8"))
        return {**DEFAULT_SURVEY_CONFIG, **config}
    except (json.JSONDecodeError, OSError):
        return DEFAULT_SURVEY_CONFIG.copy()

def require_survey_admin(x_admin_key: str = Header(default="")):
    if not SURVEY_ADMIN_KEY or SURVEY_ADMIN_KEY == "change-this-survey-admin-key":
        raise HTTPException(status_code=503, detail="Set a strong SURVEY_ADMIN_KEY environment variable first")
    if not __import__("hmac").compare_digest(x_admin_key, SURVEY_ADMIN_KEY):
        raise HTTPException(status_code=401, detail="Invalid survey admin key")

@app.get("/api/survey/config")
def survey_public_config():
    config = load_survey_config()
    return {"enabled": config["enabled"], "title": config["title"], "intro": config["intro"]}

@app.post("/api/survey/responses")
def submit_survey(body: SurveySubmission):
    config = load_survey_config()
    if not config.get("enabled", True):
        raise HTTPException(status_code=403, detail="Survey is currently closed")
    if not body.consent:
        raise HTTPException(status_code=400, detail="Consent is required")
    answers = body.answers or {}
    district = str(answers.get("district", "")).strip()
    age = answers.get("age")
    if not district:
        raise HTTPException(status_code=422, detail="District / area is required")
    try:
        age_value = int(age)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Valid age is required")
    if age_value < 18 or age_value > 110:
        raise HTTPException(status_code=422, detail="Survey is for adults aged 18 or above")
    # Limit payload size and reject unexpected non-JSON values.
    if len(json.dumps(answers, ensure_ascii=False)) > 30000:
        raise HTTPException(status_code=413, detail="Survey response is too large")
    receipt = uuid.uuid4().hex[:10].upper()
    record = {
        "id": uuid.uuid4().hex,
        "receipt_code": receipt,
        "created_at": now(),
        "answers": answers
    }
    records = load_survey_responses()
    records.append(record)
    SURVEY_FILE.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "receipt_code": receipt, "message": "Response submitted"}

@app.get("/api/survey/admin")
def survey_admin_data(x_admin_key: str = Header(default="")):
    require_survey_admin(x_admin_key)
    records = load_survey_responses()
    records.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return {"total": len(records), "responses": records, "config": load_survey_config()}

@app.put("/api/survey/admin/config")
def update_survey_config(body: SurveyConfigUpdate, x_admin_key: str = Header(default="")):
    require_survey_admin(x_admin_key)
    config = {"enabled": body.enabled, "title": body.title.strip()[:180], "intro": body.intro.strip()[:300]}
    SURVEY_CONFIG_FILE.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "config": config}
