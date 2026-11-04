from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import json, shutil, uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE = Path(__file__).resolve().parent
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
DB_FILE = BASE / "data.json"

app = FastAPI(title="Election Field Management API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def now():
    return datetime.now(timezone.utc).isoformat()

def initial_data():
    return {
        "users": [
            {"id":"u1","name":"Aarav Sharma","username":"aarav","password":"field123","role":"user","area":"Ward 04","status":"active","lat":30.3398,"lng":76.3869,"last_seen":now()},
            {"id":"u2","name":"Simran Kaur","username":"simran","password":"field123","role":"user","area":"Ward 07","status":"active","lat":30.3470,"lng":76.4000,"last_seen":now()},
            {"id":"u3","name":"Rahul Verma","username":"rahul","password":"field123","role":"user","area":"Village North","status":"offline","lat":30.3300,"lng":76.3700,"last_seen":now()},
        ],
        "entries": [
            {"id":"e1","title":"Community visit summary","area":"Ward 04","notes":"Met local residents; follow-up requested.","created_by":"u1","created_by_name":"Aarav Sharma","created_at":now(),"files":[],"lat":30.3398,"lng":76.3869,"status":"Pending"},
            {"id":"e2","title":"Field observation","area":"Ward 07","notes":"Uploaded field notes for review.","created_by":"u2","created_by_name":"Simran Kaur","created_at":now(),"files":[],"lat":30.3470,"lng":76.4000,"status":"Approved"},
        ],
        "tasks": [
            {"id":"t1","title":"Complete assigned area visit","area":"Ward 04","assigned_to":"u1","due_date":"2026-11-10","status":"In Progress"},
            {"id":"t2","title":"Submit field observations","area":"Ward 07","assigned_to":"u2","due_date":"2026-11-12","status":"Pending"},
        ],
        "activity": []
    }

def load_db():
    if not DB_FILE.exists():
        save_db(initial_data())
    return json.loads(DB_FILE.read_text(encoding="utf-8"))

def save_db(data):
    DB_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

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

class TaskBody(BaseModel):
    title: str
    area: str
    assigned_to: str
    due_date: str = ""

class StatusBody(BaseModel):
    status: str
    comment: str = ""

@app.get("/")
def root():
    return {"message":"Election Field Management API is running","docs":"/docs"}

@app.post("/api/login")
def login(body: LoginBody):
    db = load_db()
    user = next((u for u in db["users"] if u["username"] == body.username and u["password"] == body.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Prototype only: production must use hashed passwords and secure session/JWT authentication.
    return {"user": {k:v for k,v in user.items() if k != "password"}}

@app.get("/api/dashboard")
def dashboard():
    db = load_db()
    return {
        "users": [{k:v for k,v in u.items() if k != "password"} for u in db["users"]],
        "entries": sorted(db["entries"], key=lambda x: x["created_at"], reverse=True),
        "tasks": db["tasks"],
        "activity": sorted(db["activity"], key=lambda x: x["created_at"], reverse=True)[:12],
        "stats": {
            "total_users": len(db["users"]),
            "active_users": sum(1 for u in db["users"] if u["status"] == "active"),
            "total_entries": len(db["entries"]),
            "pending_review": sum(1 for e in db["entries"] if e["status"] == "Pending"),
            "tasks_open": sum(1 for t in db["tasks"] if t["status"] != "Completed")
        }
    }

@app.post("/api/users")
def add_user(body: UserBody):
    db = load_db()
    if any(u["username"] == body.username for u in db["users"]):
        raise HTTPException(status_code=409, detail="Username already exists")
    user = {"id":"u"+uuid.uuid4().hex[:7],"name":body.name,"username":body.username,
            "password":body.password,"role":"user","area":body.area,"status":"offline",
            "lat":None,"lng":None,"last_seen":None}
    db["users"].append(user)
    db["activity"].append({"id":uuid.uuid4().hex[:8],"message":f"Admin created field user {body.name}","created_at":now()})
    save_db(db)
    return {k:v for k,v in user.items() if k != "password"}

@app.post("/api/location")
def update_location(body: LocationBody):
    db = load_db()
    user = next((u for u in db["users"] if u["id"] == body.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.update({"lat":body.lat,"lng":body.lng,"status":"active","last_seen":now()})
    save_db(db)
    return {"ok":True,"last_seen":user["last_seen"]}

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
    user = next((u for u in db["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    saved_files = []
    for upload in files:
        if not upload.filename:
            continue
        ext = Path(upload.filename).suffix[:12]
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / safe_name
        with dest.open("wb") as f:
            shutil.copyfileobj(upload.file, f)
        saved_files.append({"name":upload.filename,"url":f"/uploads/{safe_name}","content_type":upload.content_type})
    entry = {"id":"e"+uuid.uuid4().hex[:7],"title":title,"area":area or user.get("area",""),
             "notes":notes,"created_by":user_id,"created_by_name":user["name"],
             "created_at":now(),"files":saved_files,"lat":lat,"lng":lng,"status":"Pending"}
    db["entries"].append(entry)
    db["activity"].append({"id":uuid.uuid4().hex[:8],"message":f"{user['name']} submitted “{title}”","created_at":now()})
    save_db(db)
    return entry

@app.post("/api/tasks")
def create_task(body: TaskBody):
    db = load_db()
    if not any(u["id"] == body.assigned_to for u in db["users"]):
        raise HTTPException(status_code=404, detail="Assigned user not found")
    task = {"id":"t"+uuid.uuid4().hex[:7],"title":body.title,"area":body.area,
            "assigned_to":body.assigned_to,"due_date":body.due_date,"status":"Pending"}
    db["tasks"].append(task)
    save_db(db)
    return task

@app.patch("/api/entries/{entry_id}")
def review_entry(entry_id: str, body: StatusBody):
    if body.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db = load_db()
    entry = next((e for e in db["entries"] if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry["status"] = body.status
    entry["review_comment"] = body.comment
    db["activity"].append({"id":uuid.uuid4().hex[:8],"message":f"Entry “{entry['title']}” marked {body.status}","created_at":now()})
    save_db(db)
    return entry
