from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import httpx
import numpy as np
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta
import secrets

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT tokens
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helper
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        del user["_id"]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # 'job_seeker' or 'recruiter'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileEducation(BaseModel):
    has_bachelors: bool = False
    bachelors_doc: Optional[str] = None  # base64
    has_masters: bool = False
    masters_doc: Optional[str] = None

class ProfileExperience(BaseModel):
    years: int = 0
    companies: List[dict] = []  # [{name, role}]

class ProfileLocation(BaseModel):
    country: str = ""
    state: str = ""
    city: str = ""
    show_only_city_jobs: bool = False

class ProfileCreate(BaseModel):
    education: ProfileEducation = ProfileEducation()
    certifications: List[str] = []  # base64 images
    experience: ProfileExperience = ProfileExperience()
    skills: str = ""
    projects: str = ""
    location: ProfileLocation = ProfileLocation()

class JobRequirements(BaseModel):
    bachelor_required: bool = False
    master_required: bool = False
    certification_required: bool = False
    notes: str = ""

class JobCreate(BaseModel):
    title: str
    company_name: str
    salary_min: int
    salary_max: int
    description: str
    short_note: str = ""
    country: str
    state: str
    city: str
    requirements: JobRequirements

class ApplicationAction(BaseModel):
    action: str  # 'shortlist' or 'reject'

# Create app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# NVIDIA Embedding Service
async def generate_embedding(text: str) -> List[float]:
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        return [0.0] * 1024
    
    url = "https://integrate.api.nvidia.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "input": [text[:8000]],  # Limit text length
        "model": "nvidia/nv-embedqa-e5-v5",
        "input_type": "query",
        "encoding_format": "float",
        "truncate": "END"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["embedding"]
    except Exception as e:
        logging.error(f"Embedding error: {e}")
    
    return [0.0] * 1024

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))

def resume_to_text(profile: dict) -> str:
    parts = []
    if profile.get("skills"):
        parts.append(f"Skills: {profile['skills']}")
    exp = profile.get("experience", {})
    if exp.get("years"):
        parts.append(f"Experience: {exp['years']} years")
    companies = exp.get("companies", [])
    if companies:
        company_text = ", ".join([f"{c.get('name', '')} as {c.get('role', '')}" for c in companies])
        parts.append(f"Previous work: {company_text}")
    edu = profile.get("education", {})
    if edu.get("has_bachelors"):
        parts.append("Has Bachelor's degree")
    if edu.get("has_masters"):
        parts.append("Has Master's degree")
    certs = profile.get("certifications", [])
    if certs:
        parts.append(f"Has {len(certs)} certifications")
    if profile.get("projects"):
        parts.append(f"Projects: {profile['projects']}")
    return ". ".join(parts)

def job_to_text(job: dict) -> str:
    parts = [
        f"Job title: {job.get('title', '')}",
        f"Company: {job.get('company_name', '')}",
        f"Description: {job.get('description', '')}"
    ]
    req = job.get("requirements", {})
    if req.get("bachelor_required"):
        parts.append("Requires Bachelor's degree")
    if req.get("master_required"):
        parts.append("Requires Master's degree")
    if req.get("certification_required"):
        parts.append("Requires certifications")
    if req.get("notes"):
        parts.append(f"Requirements: {req['notes']}")
    return ". ".join(parts)

async def compute_match_score(profile: dict, job: dict) -> dict:
    resume_text = resume_to_text(profile)
    job_text = job_to_text(job)
    
    # Check cached embeddings
    profile_id = profile.get("user_id")
    job_id = str(job.get("_id", job.get("id", "")))
    
    # Get or compute resume embedding
    cached_resume = await db.embeddings.find_one({"type": "resume", "ref_id": profile_id})
    if cached_resume:
        resume_embedding = cached_resume["embedding"]
    else:
        resume_embedding = await generate_embedding(resume_text)
        if profile_id:
            await db.embeddings.update_one(
                {"type": "resume", "ref_id": profile_id},
                {"$set": {"embedding": resume_embedding, "updated_at": datetime.now(timezone.utc)}},
                upsert=True
            )
    
    # Get or compute job embedding
    cached_job = await db.embeddings.find_one({"type": "job", "ref_id": job_id})
    if cached_job:
        job_embedding = cached_job["embedding"]
    else:
        job_embedding = await generate_embedding(job_text)
        if job_id:
            await db.embeddings.update_one(
                {"type": "job", "ref_id": job_id},
                {"$set": {"embedding": job_embedding, "updated_at": datetime.now(timezone.utc)}},
                upsert=True
            )
    
    similarity = cosine_similarity(resume_embedding, job_embedding)
    score = int(similarity * 100)
    
    # Generate reason
    reasons = []
    exp = profile.get("experience", {})
    if exp.get("years", 0) >= 2:
        reasons.append("relevant experience")
    if profile.get("skills"):
        reasons.append("matching skills")
    edu = profile.get("education", {})
    req = job.get("requirements", {})
    if req.get("bachelor_required") and edu.get("has_bachelors"):
        reasons.append("meets education requirements")
    
    reason = f"Based on {', '.join(reasons)}" if reasons else "General profile match"
    
    return {"score": max(0, min(100, score)), "reason": reason}

# Auth Routes
@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if data.role not in ["job_seeker", "recruiter"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    hashed = hash_password(data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": data.role,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create empty profile for job seekers
    if data.role == "job_seeker":
        await db.profiles.insert_one({
            "user_id": user_id,
            "education": {"has_bachelors": False, "has_masters": False},
            "certifications": [],
            "experience": {"years": 0, "companies": []},
            "skills": "",
            "projects": "",
            "location": {"country": "", "state": "", "city": "", "show_only_city_jobs": False},
            "created_at": datetime.now(timezone.utc)
        })
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": data.name, "role": data.role}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# Profile Routes
@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        return None
    return profile

@api_router.put("/profile")
async def update_profile(data: ProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can update profiles")
    
    profile_doc = data.model_dump()
    profile_doc["user_id"] = user["id"]
    profile_doc["updated_at"] = datetime.now(timezone.utc)
    
    await db.profiles.update_one(
        {"user_id": user["id"]},
        {"$set": profile_doc},
        upsert=True
    )
    
    # Invalidate cached embedding
    await db.embeddings.delete_one({"type": "resume", "ref_id": user["id"]})
    
    return {"message": "Profile updated"}

# Job Routes
@api_router.post("/jobs")
async def create_job(data: JobCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
    
    job_doc = data.model_dump()
    job_doc["recruiter_id"] = user["id"]
    job_doc["is_active"] = True
    job_doc["expiry_date"] = datetime.now(timezone.utc) + timedelta(days=60)
    job_doc["created_at"] = datetime.now(timezone.utc)
    
    result = await db.jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)
    
    return {"id": job_id, "message": "Job posted successfully"}

@api_router.get("/jobs")
async def get_jobs(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    jobs = await db.jobs.find({
        "is_active": True,
        "expiry_date": {"$gt": now}
    }, {"_id": 1, "title": 1, "company_name": 1, "salary_min": 1, "salary_max": 1,
        "description": 1, "short_note": 1, "country": 1, "state": 1, "city": 1,
        "requirements": 1, "recruiter_id": 1}).to_list(500)
    
    for job in jobs:
        job["id"] = str(job["_id"])
        del job["_id"]
    
    return jobs

@api_router.get("/jobs/recruiter")
async def get_recruiter_jobs(user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    jobs = await db.jobs.find({"recruiter_id": user["id"]}).to_list(500)
    
    result = []
    for job in jobs:
        job_id = str(job["_id"])
        applicant_count = await db.applications.count_documents({"job_id": job_id})
        result.append({
            "id": job_id,
            "title": job["title"],
            "company_name": job["company_name"],
            "is_active": job["is_active"],
            "applicant_count": applicant_count,
            "created_at": job["created_at"].isoformat() if isinstance(job["created_at"], datetime) else job["created_at"]
        })
    
    return result

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job["id"] = str(job["_id"])
    del job["_id"]
    return job

@api_router.post("/jobs/{job_id}/close")
async def close_job(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can close jobs")
    
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "recruiter_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Close job
    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": {"is_active": False}})
    
    # Remove pending applications (keep shortlisted)
    await db.applications.delete_many({"job_id": job_id, "status": "pending"})
    
    return {"message": "Job closed"}

# Matching Routes
@api_router.get("/matches")
async def get_matches(user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can access matches")
    
    # Get profile
    profile = await db.profiles.find_one({"user_id": user["id"]})
    if not profile:
        return []
    
    # Get rejected job IDs
    rejected = await db.rejected_jobs.find({"user_id": user["id"]}).to_list(1000)
    rejected_ids = [ObjectId(r["job_id"]) for r in rejected]
    
    # Get applied job IDs
    applied = await db.applications.find({"user_id": user["id"]}).to_list(1000)
    applied_ids = [ObjectId(a["job_id"]) for a in applied]
    
    # Get active jobs
    now = datetime.now(timezone.utc)
    query = {
        "is_active": True,
        "expiry_date": {"$gt": now},
        "_id": {"$nin": rejected_ids + applied_ids}
    }
    
    # Filter by city if enabled
    if profile.get("location", {}).get("show_only_city_jobs"):
        city = profile["location"].get("city", "")
        if city:
            query["city"] = city
    
    jobs = await db.jobs.find(query).to_list(100)
    
    # Compute match scores
    matches = []
    for job in jobs:
        match_result = await compute_match_score(profile, job)
        matches.append({
            "id": str(job["_id"]),
            "title": job["title"],
            "company_name": job["company_name"],
            "salary_min": job["salary_min"],
            "salary_max": job["salary_max"],
            "description": job["description"],
            "short_note": job.get("short_note", ""),
            "city": job["city"],
            "state": job["state"],
            "country": job["country"],
            "requirements": job["requirements"],
            "match_score": match_result["score"],
            "match_reason": match_result["reason"]
        })
    
    # Sort by match score
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches

@api_router.get("/alljobs")
async def get_all_jobs_for_seeker(user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can access this")
    
    # Get profile for city filter
    profile = await db.profiles.find_one({"user_id": user["id"]})
    
    # Get rejected job IDs
    rejected = await db.rejected_jobs.find({"user_id": user["id"]}).to_list(1000)
    rejected_ids = [ObjectId(r["job_id"]) for r in rejected]
    
    now = datetime.now(timezone.utc)
    query = {
        "is_active": True,
        "expiry_date": {"$gt": now},
        "_id": {"$nin": rejected_ids}
    }
    
    # Filter by city if enabled
    if profile and profile.get("location", {}).get("show_only_city_jobs"):
        city = profile["location"].get("city", "")
        if city:
            query["city"] = city
    
    jobs = await db.jobs.find(query).to_list(500)
    
    result = []
    for job in jobs:
        match_result = {"score": 0, "reason": ""}
        if profile:
            match_result = await compute_match_score(profile, job)
        
        result.append({
            "id": str(job["_id"]),
            "title": job["title"],
            "company_name": job["company_name"],
            "salary_min": job["salary_min"],
            "salary_max": job["salary_max"],
            "description": job["description"],
            "short_note": job.get("short_note", ""),
            "city": job["city"],
            "state": job["state"],
            "country": job["country"],
            "requirements": job["requirements"],
            "match_score": match_result["score"],
            "match_reason": match_result["reason"]
        })
    
    return result

# Application Routes
@api_router.post("/applications/{job_id}")
async def apply_to_job(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can apply")
    
    # Check if job exists
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "is_active": True})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or inactive")
    
    # Check if already applied
    existing = await db.applications.find_one({"job_id": job_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    # Get profile and compute match score
    profile = await db.profiles.find_one({"user_id": user["id"]})
    match_result = {"score": 0, "reason": ""}
    if profile:
        match_result = await compute_match_score(profile, job)
    
    app_doc = {
        "job_id": job_id,
        "user_id": user["id"],
        "status": "pending",
        "match_score": match_result["score"],
        "created_at": datetime.now(timezone.utc)
    }
    await db.applications.insert_one(app_doc)
    
    return {"message": "Applied successfully", "match_score": match_result["score"]}

@api_router.post("/reject/{job_id}")
async def reject_job(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can reject jobs")
    
    # Add to rejected list
    await db.rejected_jobs.update_one(
        {"user_id": user["id"], "job_id": job_id},
        {"$set": {"created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"message": "Job rejected"}

@api_router.get("/applications")
async def get_my_applications(user: dict = Depends(get_current_user)):
    if user["role"] != "job_seeker":
        raise HTTPException(status_code=403, detail="Only job seekers can access this")
    
    # Get non-rejected applications
    applications = await db.applications.find({
        "user_id": user["id"],
        "status": {"$ne": "rejected"}
    }).to_list(500)
    
    result = []
    for app in applications:
        job = await db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        if job:
            result.append({
                "id": str(app["_id"]),
                "job_id": app["job_id"],
                "title": job["title"],
                "company_name": job["company_name"],
                "status": app["status"],
                "match_score": app.get("match_score", 0),
                "applied_at": app["created_at"].isoformat() if isinstance(app["created_at"], datetime) else app["created_at"]
            })
    
    return result

# Recruiter Application Management
@api_router.get("/jobs/{job_id}/applicants")
async def get_job_applicants(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    # Verify job belongs to recruiter
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "recruiter_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    applications = await db.applications.find({"job_id": job_id}).to_list(500)
    
    result = []
    for app in applications:
        applicant = await db.users.find_one({"_id": ObjectId(app["user_id"])})
        profile = await db.profiles.find_one({"user_id": app["user_id"]})
        
        if applicant:
            # Clean profile data to remove ObjectId fields
            clean_profile = {}
            if profile:
                clean_profile = {k: v for k, v in profile.items() if k not in ['_id', 'user_id']}
            
            result.append({
                "application_id": str(app["_id"]),
                "user_id": app["user_id"],
                "name": applicant["name"],
                "email": applicant["email"],
                "status": app["status"],
                "match_score": app.get("match_score", 0),
                "profile": clean_profile,
                "applied_at": app["created_at"].isoformat() if isinstance(app["created_at"], datetime) else app["created_at"]
            })
    
    return result

@api_router.put("/applications/{app_id}/action")
async def update_application_status(app_id: str, data: ApplicationAction, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can perform this action")
    
    application = await db.applications.find_one({"_id": ObjectId(app_id)})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job belongs to recruiter
    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"]), "recruiter_id": user["id"]})
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if data.action == "shortlist":
        await db.applications.update_one({"_id": ObjectId(app_id)}, {"$set": {"status": "shortlisted"}})
    elif data.action == "reject":
        await db.applications.delete_one({"_id": ObjectId(app_id)})
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    return {"message": f"Application {data.action}ed"}

@api_router.get("/jobs/{job_id}/shortlist")
async def get_shortlisted(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "recruiter_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    applications = await db.applications.find({"job_id": job_id, "status": "shortlisted"}).to_list(500)
    
    result = []
    for app in applications:
        applicant = await db.users.find_one({"_id": ObjectId(app["user_id"])})
        profile = await db.profiles.find_one({"user_id": app["user_id"]})
        
        if applicant:
            # Clean profile data to remove ObjectId fields
            clean_profile = {}
            if profile:
                clean_profile = {k: v for k, v in profile.items() if k not in ['_id', 'user_id']}
            
            result.append({
                "application_id": str(app["_id"]),
                "user_id": app["user_id"],
                "name": applicant["name"],
                "email": applicant["email"],
                "match_score": app.get("match_score", 0),
                "profile": clean_profile
            })
    
    return result

@api_router.post("/jobs/{job_id}/ai-shortlist")
async def ai_shortlist(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can perform this action")
    
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "recruiter_id": user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get pending applications
    applications = await db.applications.find({"job_id": job_id, "status": "pending"}).to_list(500)
    
    if len(applications) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 applicants for AI shortlist")
    
    # Sort by match score and select top 20%
    applications.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    top_count = max(1, len(applications) // 5)  # 20%
    
    top_applicants = applications[:top_count]
    
    for app in top_applicants:
        await db.applications.update_one({"_id": app["_id"]}, {"$set": {"status": "shortlisted"}})
    
    return {"message": f"Shortlisted {top_count} candidates", "count": top_count}

# Root route
@api_router.get("/")
async def root():
    return {"message": "Jobswish API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Startup
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.profiles.create_index("user_id", unique=True)
    await db.applications.create_index([("job_id", 1), ("user_id", 1)], unique=True)
    await db.rejected_jobs.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    await db.embeddings.create_index([("type", 1), ("ref_id", 1)], unique=True)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@jobswish.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "recruiter",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    
    # Write test credentials
    import os as os_module
    os_module.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin/Recruiter Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: recruiter\n\n")
        f.write(f"## Auth Endpoints\n")
        f.write(f"- POST /api/auth/register\n")
        f.write(f"- POST /api/auth/login\n")
        f.write(f"- POST /api/auth/logout\n")
        f.write(f"- GET /api/auth/me\n")

@app.on_event("shutdown")
async def shutdown():
    client.close()
