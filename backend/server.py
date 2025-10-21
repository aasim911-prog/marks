from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password: str
    role: str  # "teacher" or "student"
    roll_number: Optional[str] = None
    semester: Optional[int] = None

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    roll_number: Optional[str] = None
    semester: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    semester: int
    credits: int

class SubjectCreate(BaseModel):
    name: str
    code: str
    semester: int
    credits: int

class Marks(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    subject_id: str
    internal1: float
    internal2: float
    internal3: float
    final_exam: float
    total: float
    semester: int

class MarksCreate(BaseModel):
    student_id: str
    subject_id: str
    internal1: float
    internal2: float
    internal3: float
    final_exam: float
    semester: int

class MarksUpdate(BaseModel):
    internal1: float
    internal2: float
    internal3: float
    final_exam: float

# Authentication Routes
@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["password"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    return {"user": user, "message": "Login successful"}

# User Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user_obj = User(**user_data.model_dump())
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users(role: Optional[str] = None):
    query = {"role": role} if role else {}
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Subject Routes
@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject_data: SubjectCreate):
    subject_obj = Subject(**subject_data.model_dump())
    doc = subject_obj.model_dump()
    await db.subjects.insert_one(doc)
    return subject_obj

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(semester: Optional[int] = None):
    query = {"semester": semester} if semester else {}
    subjects = await db.subjects.find(query, {"_id": 0}).to_list(1000)
    return subjects

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    # Also delete associated marks
    await db.marks.delete_many({"subject_id": subject_id})
    return {"message": "Subject deleted successfully"}

@api_router.put("/subjects/{subject_id}", response_model=Subject)
async def update_subject(subject_id: str, subject_data: SubjectCreate):
    result = await db.subjects.update_one(
        {"id": subject_id},
        {"$set": subject_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    return subject

# Marks Routes
@api_router.post("/marks", response_model=Marks)
async def create_marks(marks_data: MarksCreate):
    # Check if marks already exist for this student and subject
    existing = await db.marks.find_one({
        "student_id": marks_data.student_id,
        "subject_id": marks_data.subject_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Marks already exist for this student and subject")
    
    # Calculate total (best 2 of 3 internals + final)
    internals = sorted([marks_data.internal1, marks_data.internal2, marks_data.internal3], reverse=True)
    total = sum(internals[:2]) + marks_data.final_exam
    
    marks_obj = Marks(
        **marks_data.model_dump(),
        total=total
    )
    doc = marks_obj.model_dump()
    await db.marks.insert_one(doc)
    return marks_obj

@api_router.get("/marks", response_model=List[Marks])
async def get_marks(student_id: Optional[str] = None, semester: Optional[int] = None):
    query = {}
    if student_id:
        query["student_id"] = student_id
    if semester:
        query["semester"] = semester
    
    marks = await db.marks.find(query, {"_id": 0}).to_list(1000)
    return marks

@api_router.put("/marks/{marks_id}", response_model=Marks)
async def update_marks(marks_id: str, marks_data: MarksUpdate):
    # Recalculate total
    internals = sorted([marks_data.internal1, marks_data.internal2, marks_data.internal3], reverse=True)
    total = sum(internals[:2]) + marks_data.final_exam
    
    update_data = marks_data.model_dump()
    update_data["total"] = total
    
    result = await db.marks.update_one(
        {"id": marks_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Marks not found")
    
    marks = await db.marks.find_one({"id": marks_id}, {"_id": 0})
    return marks

@api_router.delete("/marks/{marks_id}")
async def delete_marks(marks_id: str):
    result = await db.marks.delete_one({"id": marks_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Marks not found")
    return {"message": "Marks deleted successfully"}

# Performance calculation
@api_router.get("/performance/{student_id}")
async def get_performance(student_id: str):
    # Get all marks for the student
    marks_list = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    if not marks_list:
        return {"semesters": [], "cgpa": 0}
    
    # Group by semester
    semester_data = {}
    for mark in marks_list:
        sem = mark["semester"]
        if sem not in semester_data:
            semester_data[sem] = []
        semester_data[sem].append(mark)
    
    # Calculate SGPA for each semester
    result_semesters = []
    total_credits = 0
    weighted_sum = 0
    
    for sem in sorted(semester_data.keys()):
        sem_marks = semester_data[sem]
        sem_credits = 0
        sem_weighted_sum = 0
        
        for mark in sem_marks:
            # Get subject credits
            subject = await db.subjects.find_one({"id": mark["subject_id"]}, {"_id": 0})
            if subject:
                credits = subject["credits"]
                # Convert total to grade point (max: best 2 internals (80) + final (100) = 180)
                # Convert percentage to 10-point scale
                percentage = (mark["total"] / 180) * 100
                # Convert percentage to grade point (10-point scale)
                if percentage >= 90:
                    grade_point = 10
                elif percentage >= 80:
                    grade_point = 9
                elif percentage >= 70:
                    grade_point = 8
                elif percentage >= 60:
                    grade_point = 7
                elif percentage >= 50:
                    grade_point = 6
                elif percentage >= 40:
                    grade_point = 5
                else:
                    grade_point = 0
                
                sem_credits += credits
                sem_weighted_sum += grade_point * credits
        
        sgpa = sem_weighted_sum / sem_credits if sem_credits > 0 else 0
        
        result_semesters.append({
            "semester": sem,
            "sgpa": round(sgpa, 2),
            "credits": sem_credits
        })
        
        total_credits += sem_credits
        weighted_sum += sem_weighted_sum
    
    cgpa = weighted_sum / total_credits if total_credits > 0 else 0
    
    return {
        "semesters": result_semesters,
        "cgpa": round(cgpa, 2)
    }

# Get detailed marks with subject info
@api_router.get("/detailed-marks/{student_id}")
async def get_detailed_marks(student_id: str):
    marks_list = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    detailed = []
    for mark in marks_list:
        subject = await db.subjects.find_one({"id": mark["subject_id"]}, {"_id": 0})
        if subject:
            detailed.append({
                **mark,
                "subject_name": subject["name"],
                "subject_code": subject["code"],
                "credits": subject["credits"]
            })
    
    return detailed

# Initialize demo data
@api_router.post("/init-demo-data")
async def init_demo_data():
    # Check if data already exists
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        return {"message": "Demo data already exists"}
    
    # Create teacher
    teacher = User(
        name="Dr. Kumar",
        email="teacher@aiml.edu",
        password="teacher",
        role="teacher"
    )
    await db.users.insert_one(teacher.model_dump())
    
    # Create students
    students = [
        User(
            name="Rahul Sharma",
            email="rahul@student.edu",
            password="student",
            role="student",
            roll_number="AIML001",
            semester=1
        ),
        User(
            name="Priya Patel",
            email="priya@student.edu",
            password="student",
            role="student",
            roll_number="AIML002",
            semester=1
        ),
        User(
            name="Amit Kumar",
            email="amit@student.edu",
            password="student",
            role="student",
            roll_number="AIML003",
            semester=1
        )
    ]
    
    for student in students:
        await db.users.insert_one(student.model_dump())
    
    # Create sample subjects for semester 1
    subjects = [
        Subject(name="Machine Learning Fundamentals", code="AIML101", semester=1, credits=4),
        Subject(name="Python Programming", code="AIML102", semester=1, credits=4),
        Subject(name="Mathematics for AI", code="AIML103", semester=1, credits=3),
        Subject(name="Data Structures", code="AIML104", semester=1, credits=4)
    ]
    
    for subject in subjects:
        await db.subjects.insert_one(subject.model_dump())
    
    return {"message": "Demo data initialized successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()