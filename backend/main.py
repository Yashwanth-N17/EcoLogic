import os
import shutil
import uuid
import requests
import json
from datetime import date, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import ocr
import notifications
import seed
import crawler

# Create database tables
Base.metadata.create_all(bind=engine)

# Helper to upsert scholarships into the DB
def save_scholarships(data: list[dict], db: Session) -> int:
    """Upsert scholarship dicts into the DB. Returns number of newly inserted rows."""
    new_count = 0
    for item in data:
        existing = db.query(models.Scholarship).filter(models.Scholarship.id == item["id"]).first()
        if existing:
            for key in ["title", "provider", "description", "amount", "deadline",
                        "eligibility_criteria", "required_documents", "application_link",
                        "tags", "is_verified"]:
                setattr(existing, key, item.get(key, getattr(existing, key)))
        else:
            db.add(models.Scholarship(**item))
            new_count += 1
    db.commit()
    return new_count

app = FastAPI(
    title="ScholarMate API",
    description="Backend API supporting EcoLogic ScholarMate dashboard for first-generation students in India",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
# Ensure uploads directory exists
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# Run crawler on startup
@app.on_event("startup")
def startup_event():
    # Load .env file if it exists
    env_paths = [".env", "backend/.env", "../.env"]
    for path in env_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")
    
    db = next(get_db())
    try:
        results = crawler.crawl_scholarships()
        saved = save_scholarships(results, db)
        print(f"[Startup] Saved {saved} new scholarships")
    except Exception as e:
        print(f"Startup crawler error: {e}")
    finally:
        db.close()

@app.post("/crawl")
def trigger_crawl():
    try:
        results = crawler.crawl_scholarships()
        new_saved = save_scholarships(results, next(get_db()))
        return {"status": "success", "new_scholarships": new_saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crawler error: {e}")

# Directory for file uploads
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper dependency to retrieve the current student using X-Student-Id header
def get_current_student(
    x_student_id: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
) -> models.Student:
    if not x_student_id:
        raise HTTPException(status_code=400, detail="X-Student-Id header is missing")
    
    student = db.query(models.Student).filter(models.Student.id == x_student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found. Please onboarding again.")
    return student

# --- Auth Endpoints ---

@app.post("/auth/signup", response_model=schemas.StudentResponse)
def signup(email: str = Form(...), name: str = Form(...), phone: str = Form(...), db: Session = Depends(get_db)):
    # Check if student exists
    existing = db.query(models.Student).filter(models.Student.email == email).first()
    if existing:
        return existing
    
    new_student = models.Student(
        name=name,
        email=email,
        phone=phone,
        is_first_gen=True,
        preferred_language="en"
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@app.post("/auth/login", response_model=schemas.StudentResponse)
def login(email: str = Form(...), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Email not registered.")
    return student

# --- Student Profile Endpoints ---

@app.get("/students/me", response_model=schemas.StudentResponse)
def get_me(student: models.Student = Depends(get_current_student)):
    return student

@app.post("/students/me", response_model=schemas.StudentResponse)
def create_profile(profile_data: schemas.StudentCreate, db: Session = Depends(get_db)):
    """
    Creates a new student profile on onboarding completion.
    Generates a UUID and returns the profile.
    Updates the existing record if the email is already registered.
    """
    if profile_data.email:
        existing = db.query(models.Student).filter(models.Student.email == profile_data.email).first()
        if existing:
            for field, value in profile_data.dict(exclude_unset=True).items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing

    new_student = models.Student(
        name=profile_data.name,
        email=profile_data.email,
        phone=profile_data.phone,
        is_first_gen=profile_data.is_first_gen,
        state=profile_data.state,
        course=profile_data.course,
        year_of_study=profile_data.year_of_study or 1,
        annual_family_income=profile_data.annual_family_income,
        category=profile_data.category or "General",
        disability_status=profile_data.disability_status or False,
        gender=profile_data.gender,
        preferred_language=profile_data.preferred_language or "en",
        score=profile_data.score
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@app.put("/students/me", response_model=schemas.StudentResponse)
def update_profile(
    profile_data: schemas.StudentUpdate, 
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Updates the current student profile fields.
    """
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    return student

# --- Scholarship Endpoints ---

@app.get("/scholarships", response_model=List[schemas.ScholarshipResponse])
def get_scholarships(db: Session = Depends(get_db)):
    return db.query(models.Scholarship).all()

@app.get("/scholarships/{scholarship_id}", response_model=schemas.ScholarshipResponse)
def get_scholarship(scholarship_id: str, db: Session = Depends(get_db)):
    sch = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return sch

@app.get("/scholarships/{scholarship_id}/eligibility")
def check_eligibility(
    scholarship_id: str,
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    sch = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    criteria = sch.eligibility_criteria or {}
    score = 100
    details = {}

    # 1. GPA
    if criteria.get("gpaMin") and student.score is not None:
        user_score = float(student.score)
        user_gpa = user_score / 10.0 if user_score > 10.0 else user_score
        if user_gpa < criteria["gpaMin"]:
            score -= 20
            details["gpa"] = f"GPA {user_gpa} is below required {criteria['gpaMin']}"
        else:
            details["gpa"] = "Eligible"
            
    # 2. First Gen
    if criteria.get("firstGenRequired") and not student.is_first_gen:
        score -= 25
        details["first_gen"] = "First-generation status required"
    else:
        details["first_gen"] = "Eligible"

    # 3. Income
    if criteria.get("incomeMax") and student.annual_family_income is not None:
        if float(student.annual_family_income) > criteria["incomeMax"]:
            score -= 25
            details["income"] = f"Income exceeds maximum ₹{criteria['incomeMax']}"
        else:
            details["income"] = "Eligible"

    # 4. Caste/Category
    if criteria.get("casteRequired") and student.category:
        if student.category not in criteria["casteRequired"]:
            score -= 30
            details["category"] = f"Scheme limited to categories: {criteria['casteRequired']}"
        else:
            details["category"] = "Eligible"

    # 5. Gender
    if criteria.get("genderRequired") and student.gender:
        if criteria["genderRequired"] != student.gender:
            score -= 30
            details["gender"] = f"Exclusively for gender: {criteria['genderRequired']}"
        else:
            details["gender"] = "Eligible"

    # 6. Domicile
    if criteria.get("stateResidency") and student.state:
        if student.state not in criteria["stateResidency"]:
            score -= 20
            details["state"] = f"Exclusively for residents of: {criteria['stateResidency']}"
        else:
            details["state"] = "Eligible"

    match_percent = max(0, score)
    return {"scholarship_id": scholarship_id, "match_score": match_percent, "checks": details}

# --- Application Endpoints ---

@app.get("/applications", response_model=List[schemas.ApplicationResponse])
def get_applications(
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return db.query(models.Application).filter(models.Application.student_id == student.id).all()

@app.post("/applications", response_model=schemas.ApplicationResponse)
def create_or_update_application(
    app_data: schemas.ApplicationCreate,
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Fetch scholarship to check requirements
    sch = db.query(models.Scholarship).filter(models.Scholarship.id == app_data.scholarship_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    # Calculate progress percent based on completed requirements
    total_reqs = len(sch.required_documents or [])
    checked_count = sum(1 for v in (app_data.checklist or {}).values() if v)
    
    progress = int((checked_count / total_reqs) * 100) if total_reqs > 0 else 0
    if app_data.status == "Submitted":
        progress = 100

    # Look for existing application
    existing_app = db.query(models.Application).filter(
        models.Application.student_id == student.id,
        models.Application.scholarship_id == app_data.scholarship_id
    ).first()

    now_time = datetime.utcnow()

    if existing_app:
        old_status = existing_app.status
        existing_app.status = app_data.status or existing_app.status
        existing_app.checklist = app_data.checklist if app_data.checklist is not None else existing_app.checklist
        existing_app.essay = app_data.essay if app_data.essay is not None else existing_app.essay
        existing_app.progress_percent = progress
        existing_app.updated_at = now_time
        
        if app_data.status == "Submitted" and old_status != "Submitted":
            existing_app.applied_at = now_time
            # Trigger real/mock WhatsApp notification
            notifications.send_whatsapp_notification(
                db=db,
                student_name=student.name,
                student_phone=student.phone or "+919740512345",
                scholarship_title=sch.title,
                student_id=student.id,
                scholarship_id=sch.id
            )
        
        db.commit()
        db.refresh(existing_app)
        return existing_app
    else:
        new_app = models.Application(
            student_id=student.id,
            scholarship_id=app_data.scholarship_id,
            status=app_data.status,
            progress_percent=progress,
            checklist=app_data.checklist,
            essay=app_data.essay,
            applied_at=now_time if app_data.status == "Submitted" else None,
            updated_at=now_time
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        if app_data.status == "Submitted":
            notifications.send_whatsapp_notification(
                db=db,
                student_name=student.name,
                student_phone=student.phone or "+919740512345",
                scholarship_title=sch.title,
                student_id=student.id,
                scholarship_id=sch.id
            )
            
        return new_app

@app.patch("/applications/{scholarship_id}", response_model=schemas.ApplicationResponse)
def patch_application(
    scholarship_id: str,
    app_patch: schemas.ApplicationUpdate,
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(
        models.Application.student_id == student.id,
        models.Application.scholarship_id == scholarship_id
    ).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    old_status = app_record.status

    if app_patch.status is not None:
        app_record.status = app_patch.status
    if app_patch.checklist is not None:
        app_record.checklist = app_patch.checklist
    if app_patch.essay is not None:
        app_record.essay = app_patch.essay
    if app_patch.progress_percent is not None:
        app_record.progress_percent = app_patch.progress_percent

    # Re-calculate progress if checklist changed
    if app_patch.checklist is not None:
        sch = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
        if sch:
            total_reqs = len(sch.required_documents or [])
            checked_count = sum(1 for v in app_record.checklist.values() if v)
            app_record.progress_percent = int((checked_count / total_reqs) * 100) if total_reqs > 0 else 0

    if app_record.status == "Submitted" and old_status != "Submitted":
        app_record.applied_at = datetime.utcnow()
        sch = db.query(models.Scholarship).filter(models.Scholarship.id == scholarship_id).first()
        notifications.send_whatsapp_notification(
            db=db,
            student_name=student.name,
            student_phone=student.phone or "+919740512345",
            scholarship_title=sch.title if sch else "Scholarship",
            student_id=student.id,
            scholarship_id=scholarship_id
        )

    db.commit()
    db.refresh(app_record)
    return app_record

# --- Document Endpoints ---

@app.post("/documents/upload", response_model=schemas.DocumentUploadResponse)
def upload_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Accepts file upload, runs Tesseract OCR to extract family income / GPA,
    saves the document URL, and returns the extracted values.
    """
    # 1. Save file locally
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1]
    saved_filename = f"{student.id}_{doc_type}_{file_id}.{file_ext}"
    saved_filepath = os.path.join(UPLOAD_DIR, saved_filename)

    try:
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write uploaded file: {str(e)}")

    # Read bytes for OCR
    try:
        with open(saved_filepath, "rb") as f:
            file_bytes = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    # 2. Perform PyTesseract OCR extraction
    text_content = ocr.perform_ocr_on_file(file_bytes, file.filename)
    extracted_income, extracted_score = ocr.parse_ocr_results(text_content, file.filename)

    # 3. Create document record in database
    db_document = models.Document(
        student_id=student.id,
        doc_type=doc_type,
        file_url=saved_filepath,
        uploaded_at=datetime.utcnow()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # Return results
    msg = "Document uploaded successfully."
    if extracted_income is not None:
        msg += f" Extracted income: ₹{extracted_income:,.2f}."
    if extracted_score is not None:
        msg += f" Extracted score: {extracted_score}."

    # Map database response to schema
    doc_response = schemas.DocumentResponse.from_orm(db_document)

    return schemas.DocumentUploadResponse(
        document=doc_response,
        extracted_income=extracted_income,
        extracted_score=extracted_score,
        message=msg
    )

@app.get("/documents", response_model=List[schemas.DocumentResponse])
def get_documents(
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    return db.query(models.Document).filter(models.Document.student_id == student.id).all()

# --- Chatbot RAG Route ---

@app.post("/chatbot/query", response_model=schemas.ChatResponse)
def query_chatbot(
    query: schemas.ChatQuery,
    x_student_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Answers: 'Am I eligible for X?', 'What documents do I need?', 'Explain this term'.
    Uses Gemini API for intelligent, context-aware student mentoring. Falls back to static keywords on failure.
    """
    student = None
    if x_student_id:
        student = db.query(models.Student).filter(models.Student.id == x_student_id).first()

    scholarships = db.query(models.Scholarship).all()
    
    applications = []
    if student:
        applications = db.query(models.Application).filter(models.Application.student_id == student.id).all()

    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        student_info = "No student profile loaded yet."
        if student:
            student_info = (
                f"Name: {student.name or 'N/A'}\n"
                f"Email: {student.email or 'N/A'}\n"
                f"Phone: {student.phone or 'N/A'}\n"
                f"First-Generation Student: {student.is_first_gen}\n"
                f"State: {student.state or 'N/A'}\n"
                f"Course/Level: {student.course or 'N/A'}\n"
                f"Year of Study: {student.year_of_study or 'N/A'}\n"
                f"Annual Family Income: ₹{student.annual_family_income or 0}\n"
                f"Category: {student.category or 'N/A'}\n"
                f"Disability Status: {student.disability_status}\n"
                f"Gender: {student.gender or 'N/A'}\n"
                f"Academic Score/CGPA: {student.score or 'N/A'}"
            )
        
        apps_info = "No active scholarship applications."
        if student and applications:
            apps_list = []
            for app in applications:
                sch_title = app.scholarship.title if app.scholarship else "Unknown Scholarship"
                apps_list.append(
                    f"- {sch_title} (Status: {app.status}, Progress: {app.progress_percent}%, Checklist: {app.checklist})"
                )
            apps_info = "\n".join(apps_list)

        sch_list = []
        for s in scholarships:
            sch_list.append(
                f"- ID: {s.id}\n"
                f"  Title: {s.title}\n"
                f"  Provider: {s.provider or 'N/A'}\n"
                f"  Amount: ₹{s.amount or 0}\n"
                f"  Deadline: {s.deadline.strftime('%Y-%m-%d') if s.deadline else 'N/A'}\n"
                f"  Eligibility: {s.eligibility_criteria}\n"
                f"  Required Documents: {[d.get('name') for d in (s.required_documents or [])]}"
            )
        sch_info = "\n\n".join(sch_list)

        prompt = (
            "You are Sarah Jenkins, an empathetic, encouraging, and highly knowledgeable AI College & Scholarship Mentor. "
            "Your target audience is students, especially first-generation college students from low-income families in India. "
            "Be friendly, structured, clear, and action-oriented. Provide step-by-step guidance. Use markdown (bullet points, bold text) for readability.\n\n"
            "If the student profile is available, greet them by name, tailor your advice to their state, category, income, or grade, "
            "and check if they are eligible for the scholarships in the database. Use their details to answer accurately.\n\n"
            "If the student asks about a specific document (e.g. Income Certificate, Aadhaar Seeding, Domicile, Bonafide), "
            "give them practical advice on how to get it (e.g. via state digital portals like Seva Sindhu, Aaple Sarkar, e-District, or college administration).\n\n"
            "Here is the context:\n"
            "=== STUDENT PROFILE ===\n"
            f"{student_info}\n\n"
            "=== STUDENT'S APPLICATIONS ===\n"
            f"{apps_info}\n\n"
            "=== AVAILABLE SCHOLARSHIPS IN SYSTEM ===\n"
            f"{sch_info}\n\n"
            "=== USER MESSAGE ===\n"
            f"{query.message}\n\n"
            "Response (Reply directly to the student in their preferred language or the language of their query. "
            "Always maintain your identity as Sarah Jenkins. Keep your answer under 3-4 short paragraphs):"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                resp_json = response.json()
                reply_text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
                if reply_text:
                    return schemas.ChatResponse(reply=reply_text.strip())
        except Exception as e:
            print(f"[Chatbot Error] Gemini API call failed: {e}")

    # --- FALLBACK KEYWORD-BASED RAG ---
    msg = query.message.lower()
    reply = ""

    # Check for simple greetings
    words = msg.translate(str.maketrans("", "", "!?,.")).split()
    is_greeting_only = len(words) <= 3 and any(w in ["hello", "hi", "hey", "namaste", "नमस्ते", "ನಮಸ್ತೆ"] for w in words)
    
    if is_greeting_only:
        if any(w in ["ನಮಸ್ತೆ"] for w in words):
            reply = "ನಮಸ್ತೆ! ನಾನು ಸಾರಾ, ನಿಮ್ಮ ಕಾಲೇಜು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಮಾರ್ಗದರ್ಶಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
        elif any(w in ["नमस्ते"] for w in words):
            reply = "नमस्ते! मैं सारा हूँ, आपकी कॉलेज और स्कॉलरशिप मेंटॉर। मैं आपकी क्या मदद कर सकती हूँ?"
        else:
            reply = "Hello! I am Sarah, your AI College & Scholarship Mentor. How can I help you today?"
    # Check for specific FAQ keywords first
    elif "income" in msg or "tehsildar" in msg or "certificate" in msg:
        reply = (
            "To get a Tehsildar Income Certificate, you must apply through your state's digital service portal "
            "(such as Seva Sindhu in Karnataka, MahaOnline in Maharashtra, or e-District in Delhi/UP) or visit your nearest "
            "Common Service Centre (CSC). You'll need parent identity proofs, land records, or a signed self-declaration form."
        )
    elif "aadhaar" in msg or "seeding" in msg or "link" in msg or "dbt" in msg:
        reply = (
            "Aadhaar Seeding links your bank account to your 12-digit Aadhaar card so that Direct Benefit Transfer (DBT) "
            "scholarships can arrive securely. To link, download the 'Aadhaar Seeding Consent Form', fill it out, and "
            "submit it physically at your bank branch, requesting them to map it on NPCI."
        )
    elif "bonafide" in msg or "college" in msg or "principal" in msg:
        reply = (
            "A Bonafide Student Certificate is issued by your college administration. Write a simple request letter "
            "(you can generate one instantly in the 'Auto-Document Generator' tab!), attach your college ID and fee receipt, "
            "and submit it at the clerk's counter. It takes about 2-3 working days for the Principal/Registrar to stamp and sign it."
        )
    elif "essay" in msg or "draft" in msg or "review" in msg:
        if len(query.message.split()) > 15:
            reply = (
                "This is a wonderful draft! I love how you highlight your first-generation college background and family goals. "
                "To make it stand out to reviewers: 1. Clearly state how the scholarship money (e.g. books, hostel, tuition) will "
                "ease your parents' burden. 2. End with a strong sentence describing how you plan to help other students. Excellent job!"
            )
        else:
            reply = "I would be happy to review your scholarship essay! Please paste your draft essay here, and I'll give you feedback."
    else:
        # Search the database for matching scholarships
        matched_sch = []
        for sch in scholarships:
            if sch.id in msg or sch.title.lower() in msg or (sch.provider and sch.provider.lower() in msg):
                matched_sch.append(sch)
        
        if matched_sch:
            sch = matched_sch[0]
            deadline_str = sch.deadline.strftime("%d %B %Y") if sch.deadline else "N/A"
            criteria = sch.eligibility_criteria or {}
            income_max = criteria.get("incomeMax")
            gpa_min = criteria.get("gpaMin")
            caste_req = criteria.get("casteRequired")
            
            criteria_str = f"GPA >= {gpa_min}" if gpa_min else ""
            if income_max:
                criteria_str += f", Family Income < ₹{income_max:,}"
            if caste_req:
                criteria_str += f", Category: {', '.join(caste_req)}"
            
            reply = (
                f"I found the '{sch.title}' in our database. It is provided by {sch.provider or 'the official portal'}. "
                f"The award amount is ₹{sch.amount:,}. The deadline to apply is {deadline_str}. "
                f"Key eligibility criteria: {criteria_str or 'Open'}. "
                f"You will need the following documents: {', '.join([d.get('name') for d in (sch.required_documents or [])])}."
            )
        else:
            # --- EXTENDED LOCAL KEYWORD MATCHING (IF NOT SPECIFIC SCHOLARSHIP) ---
            if any(kw in msg for kw in ["best", "recommend", "match", "eligible", "which", "find"]):
                reply = (
                    "To find the best scholarships, please complete your student profile on the dashboard. "
                    "Our system automatically matches your CGPA/grades, state of residence, family income, and category "
                    "to show you exact matches you qualify for. Navigate to the main dashboard to see your eligible scholarships list!"
                )
            elif any(kw in msg for kw in ["step", "how to apply", "process", "procedure", "how do i", "how can i apply", "guideline"]):
                reply = (
                    "Here is how to apply step-by-step:\n"
                    "1. Find matching schemes in the 'Scholarships' tab.\n"
                    "2. Read the eligibility rules (GPA, caste, and income limits).\n"
                    "3. Gather your documents (Income certificate, Bonafide letter, bank statement).\n"
                    "4. Ensure your bank account is seeded with Aadhaar for DBT transfer.\n"
                    "5. Apply on the official NSP/provider portal before the closing date."
                )
            elif any(kw in msg for kw in ["deadline", "closing date", "last date", "due date", "when to apply"]):
                reply = (
                    "You can find the closing date/deadline for each scheme listed in the 'Scholarships' tab. "
                    "It is highly recommended to submit your application and upload verified certificates at least "
                    "a week before the deadline to prevent issues from portal traffic congestion."
                )
            else:
                # General fallback response
                reply = (
                    "I'm here to help you navigate your college and scholarship applications! "
                    "You can ask me questions like:\n"
                    "- \"How do I link my **Aadhaar** to my bank account?\"\n"
                    "- \"What are the steps to get an **Income Certificate**?\"\n"
                    "- \"How can I request a **Bonafide Certificate** from my college?\"\n"
                    "- \"Which scholarship is the **best scholarship** for me?\"\n"
                    "- \"What are the **steps to apply**?\"\n"
                    "Or paste your draft essay here and I'll review it for you!"
                )

    return schemas.ChatResponse(reply=reply)

from pydantic import BaseModel

class TranslateQuery(BaseModel):
    text: str
    target_lang: str

@app.post("/chatbot/translate")
def translate_text(query: TranslateQuery):
    """
    Translates a chatbot message dynamically into a target language using Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        lang_names = {"en": "English", "hi": "Hindi", "kn": "Kannada"}
        target_name = lang_names.get(query.target_lang, "English")
        
        prompt = (
            f"Translate the following text to {target_name}. "
            "Maintain the tone and meaning, but return ONLY the direct translation. "
            "Do not add any greetings, preambles, notes, quotes, or markdown wrappers.\n\n"
            f"Text to translate:\n{query.text}"
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                resp_json = response.json()
                reply_text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
                if reply_text:
                    return {"translated_text": reply_text.strip()}
        except Exception as e:
            print(f"[Translate Error] Gemini translation failed: {e}")
            
    # Fallback to local heuristic translations or the original text
    text_lower = query.text.lower()
    if query.target_lang == "hi":
        if "bonafide" in text_lower:
            return {"translated_text": "बोनाफाइड सर्टिफिकेट आपके कॉलेज द्वारा जारी किया जाने वाला एक दस्तावेज है जो यह प्रमाणित करता है कि आप वहां के नियमित छात्र हैं।"}
        if "income" in text_lower:
            return {"translated_text": "आय प्रमाण पत्र (Income Certificate) एक आधिकारिक सरकारी दस्तावेज है जो आपकी पारिवारिक आय को प्रमाणित करता है।"}
    elif query.target_lang == "kn":
        if "bonafide" in text_lower:
            return {"translated_text": "ಬೋನಾಫೈಡ್ ಪ್ರಮಾಣಪತ್ರವು ನೀವು ಕಾಲೇಜಿನ ವಿದ್ಯಾರ್ಥಿ ಎಂದು ಸಾಬೀತುಪಡಿಸುವ ಅಧಿಕೃತ ದಾಖಲೆಯಾಗಿದೆ."}
        if "income" in text_lower:
            return {"translated_text": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರವು ನಿಮ್ಮಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯವನ್ನು ಅಧಿಕೃತವಾಗಿ ದೃಢೀಕರಿಸುವ ದಾಖಲೆಯಾಗಿದೆ."}
            
    return {"translated_text": query.text}

# --- Notification Log Endpoint (WhatsApp Outbox) ---

@app.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Fetches the notification logs (WhatsApp and in-app alerts) for the current student.
    Matches the Bell icon sidebar outbox feed in App.jsx.
    """
    return db.query(models.Notification).filter(
        models.Notification.student_id == student.id
    ).order_by(models.Notification.sent_at.desc()).all()

# --- Daily Scholarship Scanner (Simulated Background Task) ---
import asyncio

async def daily_scholarship_scanner():
    """
    Simulated crawler that runs every 24 hours to scan scholarship portals
    (NSP, Buddy4Study, NGO, Private CSR foundations) and populate/update the DB.
    """
    # Wait for the app to initialize
    await asyncio.sleep(5)
    
    while True:
        print("[Crawler Scanner] Initiating daily internet portal crawl scanning...")
        db = next(get_db())
        try:
            crawl_title = "Tata Trust First-Gen Engineering Fellowship"
            existing = db.query(models.Scholarship).filter(models.Scholarship.title == crawl_title).first()
            
            if not existing:
                print(f"[Crawler Scanner] Discovered new program: '{crawl_title}'. Anchoring to database...")
                new_sch = models.Scholarship(
                    id="tata-firstgen-fellowship",
                    title=crawl_title,
                    provider="Tata Trusts Foundation",
                    description="Special CSR grant for first-generation students pursuing undergraduate engineering courses in India.",
                    amount=50000.00,
                    deadline=date(2026, 9, 30),
                    eligibility_criteria={
                        "gpaMin": 8.0,
                        "incomeMax": 350000.00,
                        "casteRequired": ["General", "OBC", "SC", "ST", "EWS"],
                        "firstGenOnly": True
                    },
                    required_documents=[
                        {"id": "aadhaar", "name": "Aadhaar Card"},
                        {"id": "income", "name": "Income Certificate"},
                        {"id": "marksheet_12", "name": "Class 12 Marksheet"}
                    ],
                    application_link="https://www.tatatrusts.org"
                )
                db.add(new_sch)
                db.commit()
                print("[Crawler Scanner] Database updated successfully with newly crawled listings.")
            else:
                print("[Crawler Scanner] Portal sync complete. No new listings found today.")
        except Exception as e:
            print(f"[Crawler Scanner Error] failed to write crawled listings: {str(e)}")
        
        # Sleep for 24 hours
        await asyncio.sleep(86400)

@app.on_event("startup")
async def startup_event():
    # Start the daily scanner background task
    asyncio.create_task(daily_scholarship_scanner())
