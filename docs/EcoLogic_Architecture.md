# Team EcoLogic — First-Generation Student Navigator
## Complete System Architecture (Hackathon Build Spec)

---

## 1. PROBLEM STATEMENT
Build a first-generation college student navigator that tracks scholarship deadlines, eligibility, and application steps in one place.

---

## 2. TECH STACK (recommended for 24hr build)

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase for instant hosted DB + Auth) |
| Auth | Supabase Auth (email/OTP) |
| AI/Chatbot | Anthropic Claude API (RAG over scholarship DB) |
| OCR | Tesseract / Google Vision API (for document auto-extract) |
| Notifications | Twilio (SMS/WhatsApp) + SMTP (email) / Firebase Cloud Messaging (push) |
| Hosting | Frontend → Vercel/Netlify; Backend → Render/Railway |
| File Storage | Supabase Storage / Cloudinary |
| Scheduler | Cron job (APScheduler in FastAPI) for deadline reminders |

> Swap any layer for what your team is already comfortable with — priority is a working demo, not perfect stack.

---

## 3. SYSTEM ARCHITECTURE (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React PWA)                        │
│  Student Dashboard | Scholarship Feed | Chatbot | Admin Panel    │
└───────────────────────────┬───────────────────────────────────────┘
                            │ REST API (JSON) / WebSocket (chat)
┌───────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                       │
│  Auth | Scholarships | Eligibility | Applications | Notify | RAG  │
└──┬─────────┬─────────┬─────────┬─────────┬─────────┬────────────┘
   │         │         │         │         │         │
┌──▼──┐ ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ ┌─▼──────┐ ┌▼─────────┐
│Auth │ │Scholar-│ │Eligib- │ │Applica-│ │Notify  │ │AI Chatbot│
│Svc  │ │ship DB │ │ility   │ │tion    │ │Engine  │ │(Claude   │
│     │ │Service │ │Engine  │ │Tracker │ │(Cron+  │ │RAG)      │
│     │ │        │ │        │ │        │ │Twilio) │ │          │
└──┬──┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
   │        │          │          │          │           │
   └────────┴──────────┴──────────┴──────────┴───────────┘
                            │
                  ┌─────────▼──────────┐
                  │   PostgreSQL DB     │
                  │  (Supabase hosted)  │
                  └─────────────────────┘
```

---

## 4. CORE MODULES (mapped to MVP features)

### Module A — Auth & Profile
- Student signup/login (email/OTP via Supabase Auth)
- Profile builder: academic info, income, category, state, course, disability status
- First-gen self-declaration checkbox
- Multi-language toggle (English/Kannada/Hindi)

### Module B — Scholarship Database & Discovery
- `scholarships` table seeded with curated dataset (NSP, state govt, private/NGO — scrape or manually compile ~30-50 real entries for demo)
- Search + filter (amount, deadline, category, state, course)
- Tag system: `first_gen`, `merit`, `need_based`, `minority`, `disability`, `state`, `central`

### Module C — Eligibility Engine
- Rule-based matcher: compares student profile fields against scholarship `eligibility_criteria` JSON
- Returns match % score
- Flags missing profile fields blocking eligibility check

### Module D — Deadline & Reminder System
- Cron job (daily) scans `applications` + `scholarships.deadline`
- Sends reminders at 7/3/1 day marks via Email + SMS/WhatsApp (Twilio)
- In-app notification bell + color-coded urgency badges

### Module E — Application Tracker
- `applications` table: student_id, scholarship_id, status (saved/in_progress/applied/result_pending/won/rejected)
- Step checklist per scholarship (auto-generated from `required_documents` field)
- Progress bar %

### Module F — AI Chatbot (RAG)
- Claude API call with system prompt + retrieved scholarship context (vector search optional, or simple keyword retrieval for hackathon speed)
- Answers: "Am I eligible for X?", "What documents do I need?", "Explain this term"

### Module G — Admin/NGO Panel (optional stretch)
- Simple form to add/edit scholarship listings
- Moderation flag for verified vs unverified entries

---

## 5. DATABASE SCHEMA (PostgreSQL)

```sql
-- Users / Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  is_first_gen BOOLEAN DEFAULT TRUE,
  state TEXT,
  course TEXT,
  year_of_study INT,
  annual_family_income NUMERIC,
  category TEXT,              -- General/OBC/SC/ST/EWS
  disability_status BOOLEAN DEFAULT FALSE,
  gender TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT now()
);

-- Scholarships
CREATE TABLE scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT,               -- Govt/NGO/Private/University
  description TEXT,
  amount NUMERIC,
  deadline DATE,
  eligibility_criteria JSONB,  -- {max_income, category[], state[], course[], min_percentage}
  required_documents TEXT[],
  application_link TEXT,
  tags TEXT[],                 -- ['first_gen','merit','state']
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Applications (tracker)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  scholarship_id UUID REFERENCES scholarships(id),
  status TEXT DEFAULT 'saved', -- saved/in_progress/applied/result_pending/won/rejected
  progress_percent INT DEFAULT 0,
  applied_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

-- Documents uploaded by student
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  doc_type TEXT,                -- income_cert/caste_cert/marksheet/aadhaar
  file_url TEXT,
  expiry_date DATE,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  scholarship_id UUID REFERENCES scholarships(id),
  channel TEXT,                 -- email/sms/whatsapp/push
  sent_at TIMESTAMP DEFAULT now(),
  message TEXT
);
```

---

## 6. API ENDPOINTS (FastAPI routes)

```
POST   /auth/signup
POST   /auth/login
GET    /students/me
PUT    /students/me                     -- update profile

GET    /scholarships                    -- list + filter/search
GET    /scholarships/{id}
POST   /scholarships                    -- admin add
GET    /scholarships/{id}/eligibility   -- returns match % for current student

GET    /applications                    -- list current student's applications
POST   /applications                    -- save/apply to a scholarship
PATCH  /applications/{id}                -- update status/progress

POST   /documents/upload
GET    /documents

POST   /chatbot/query                   -- {message} -> Claude RAG response

GET    /notifications
POST   /notifications/send-reminders     -- cron-triggered internally
```

---

## 7. ELIGIBILITY ENGINE LOGIC (pseudo-code)

```python
def calculate_match(student, scholarship):
    criteria = scholarship.eligibility_criteria
    score = 0
    total = 0

    checks = [
        ("max_income", student.annual_family_income <= criteria.get("max_income", float('inf'))),
        ("category", student.category in criteria.get("category", [student.category])),
        ("state", student.state in criteria.get("state", [student.state])),
        ("course", student.course in criteria.get("course", [student.course])),
        ("first_gen", "first_gen" not in scholarship.tags or student.is_first_gen),
    ]
    for name, passed in checks:
        total += 1
        if passed:
            score += 1

    return round((score / total) * 100)
```

---

## 8. AI CHATBOT (RAG) FLOW

1. Student asks a question in chat widget
2. Backend retrieves top-3 relevant scholarships (keyword match on title/tags/description, or use embeddings if time permits)
3. Construct prompt:
   ```
   System: You are a helpful assistant for first-generation college students navigating scholarships in India. Be simple, encouraging, and clear.
   Context: [retrieved scholarship JSON]
   Student profile: [student JSON]
   Question: {user_message}
   ```
4. Call Claude API (`claude-sonnet-4-6`), stream response back to frontend

---

## 9. FRONTEND PAGE STRUCTURE

```
/                     → Landing page
/signup, /login        → Auth
/onboarding             → Profile builder (multi-step form)
/dashboard              → Personalized feed + match scores + urgency badges
/scholarships           → Browse + filter + search
/scholarships/:id        → Detail page + eligibility checker + checklist
/applications            → Tracker (kanban: saved/in_progress/applied/result)
/chatbot                 → Floating widget on all pages
/profile                 → Edit profile, documents
/admin (optional)        → Add/verify scholarships
```

---

## 10. SUGGESTED 24-HR BUILD ORDER (for your team of 4)

| Hours | Task | Owner suggestion |
|---|---|---|
| 0-2 | Repo setup, DB schema, seed 30 scholarships | Person A |
| 2-6 | Auth + profile builder (frontend+backend) | Person B |
| 2-6 | Scholarship list/filter/detail API + UI | Person C |
| 6-10 | Eligibility engine + match score UI | Person A |
| 6-10 | Application tracker (CRUD + kanban UI) | Person D |
| 10-14 | Chatbot integration (Claude API) | Person B + C |
| 14-17 | Reminder system (cron + Twilio/email) | Person A |
| 17-20 | Polish UI, responsive, dark mode, language toggle | All |
| 20-22 | Testing, bug fixes, deploy | All |
| 22-24 | README, slides, script, rehearse demo | All |

---

## 11. README.md REQUIREMENTS (per submission rules)
Make sure final repo README includes:
- Problem Statement
- Team Details (Team EcoLogic, 4 members, guide: Prof. Swetha P M)
- Technology Stack (from section 2 above)
- Installation Steps (clone, env vars, `pip install -r requirements.txt`, `npm install`, run commands)
- Project Description (objective + key features delivered)

---

## 12. STRETCH FEATURES (only if time remains)
OCR document auto-extract, DigiLocker integration, WhatsApp bot, gamification badges, multi-student family accounts, scam-scholarship detector, voice search — pull from your earlier 100-idea list as bonus mentions in the pitch, not required in code.

---

*This architecture is designed to be handed directly to a coding agent (e.g., Claude Code) for scaffolding. Each module/table/endpoint above can be implemented incrementally and demoed independently if time runs short.*
