# Secure Citizen Grievance Intelligence System

> **A secure web-based citizen grievance management platform under UN SDG 16: Peace, Justice and Strong Institutions.**

---

## 1. Project Overview
The **Secure Citizen Grievance Intelligence System** allows citizens to submit civic complaints and enables municipal authorities to manage and resolve them effectively. An integrated machine learning and natural language processing intelligence layer automatically categorizes grievances, estimates severity/priority, detects duplicates/similar complaints, and highlights anomalous patterns.

---

## 2. Technology Stack

- **Frontend:** React, Vite, JavaScript, React Router, Axios, CSS (Port: `5173`)
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL, JWT, bcryptjs, Helmet, Rate Limiter (Port: `5000`)
- **Intelligence Service:** Python, FastAPI, Pydantic (Port: `8000`)
- **Database:** PostgreSQL 17 (Port: `5432`)
- **Infrastructure:** Docker, Docker Compose

---

## 3. Directory Structure

```text
PBL project/
├── .env.example              # Template for root environment variables
├── .gitignore                # Global git ignore definitions
├── docker-compose.yml        # Multi-container orchestration (Postgres, Backend, ML, Frontend)
├── README.md                 # Project documentation and quickstart
├── backend/
│   ├── .dockerignore
│   ├── .env.example          # Backend-specific environment variables template
│   ├── Dockerfile            # Node.js Alpine container definition
│   ├── package.json          # Node dependencies and scripts
│   ├── prisma/
│   │   └── schema.prisma     # Prisma ORM schema
│   └── src/
│       ├── app.js            # Express application with security middleware
│       └── server.js         # HTTP server entrypoint
├── docs/
│   └── architecture.md       # Detailed architectural design and network flow
├── frontend/
│   ├── .dockerignore
│   ├── .env.example          # Frontend environment variables template
│   ├── Dockerfile            # Vite development container definition
│   ├── index.html            # Main HTML document with custom typography
│   ├── package.json          # React dependencies and scripts
│   ├── vite.config.js        # Vite configuration
│   └── src/
│       ├── App.jsx           # Initialization status & health check view
│       ├── index.css         # Modern civic-tech design system styles
│       └── main.jsx          # React DOM entrypoint
└── intelligence-service/
    ├── .dockerignore
    ├── .env.example          # Intelligence service environment variables template
    ├── Dockerfile            # Python slim container definition
    ├── requirements.txt      # Python dependencies (FastAPI, Uvicorn, Pydantic)
    └── app/
        └── main.py           # FastAPI application entrypoint & health endpoint
```

---

## 4. Running the Initial Skeleton

### Option A: Using Docker Compose (Recommended)
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Build and start all services:
   ```bash
   docker compose up --build
   ```
3. Access the services:
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **Intelligence Service:** [http://localhost:8000/health](http://localhost:8000/health)
   - **API Documentation (FastAPI Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Running Locally Without Docker

#### 1. Start PostgreSQL
Ensure a local PostgreSQL instance is running on port 5432 with database `grievance_system_db`.

#### 2. Start Intelligence Service (FastAPI)
```bash
cd intelligence-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 3. Start Backend (Node.js)
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

#### 4. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

---

## 5. Development / Demo Seed Credentials

> [!WARNING]
> These credentials are strictly for local development and testing purposes. Passwords in the database are hashed with bcrypt.

| Role | Name | Email | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | System Administrator | `admin@grievance.gov.in` | `AdminPass123!` | Central IT & Governance Office |
| **AUTHORITY** | Inspector Rajesh Sharma | `authority.roads@grievance.gov.in` | `AuthorityPass123!` | Roads & Municipal Infrastructure |
| **AUTHORITY** | Officer Priya Patel | `authority.water@grievance.gov.in` | `AuthorityPass123!` | Water Supply & Sewage Board |
| **CITIZEN** | Aarav Mehta | `aarav.citizen@example.com` | `CitizenPass123!` | N/A |
| **CITIZEN** | Ananya Roy | `ananya.citizen@example.com` | `CitizenPass123!` | N/A |
| **CITIZEN** | Vikram Singh | `vikram.citizen@example.com` | `CitizenPass123!` | N/A |

---

## 6. Development Phases Roadmap
- [x] **Phase 1:** Project Structure, Docker Compose, Microservice Initialization
- [x] **Phase 2:** Prisma Schema, PostgreSQL Migrations, Demo/Seed Data
- [x] **Phase 3:** Authentication, JWT, Bcrypt, Role-Based Access Control (RBAC)
- [x] **Phase 4:** Grievance Submission, Status Management, Retrieval APIs
- [x] **Phase 5:** Intelligence Service: Categorization, Severity, Duplicate & Anomaly Detection
- [x] **Phase 6A:** Frontend Foundation + Authentication UI (Login, Registration, RBAC Guards)
- [x] **Phase 6B:** Citizen Grievance Experience + Backend Intelligence Integration (Dashboard, Submission, Advisory AI, Details, My Grievances)
- [x] **Phase 6C-1:** Authority Dashboard + Grievance Triage UI (Queue, Filtering, Priority/Category Triage, Assignment, Workflow State Machine)
- [x] **Phase 6C-2:** Admin Management Portal & System Governance (Live Metrics, User Registry & Status Toggling, Cross-Department Grievance Oversight, Audit Log Inspector)
- [ ] **Phase 7:** Audit Logs, Analytics, Security Hardening & Rate Limiting Verification
- [ ] **Phase 8:** End-to-End Testing & Docker Compose Verification

