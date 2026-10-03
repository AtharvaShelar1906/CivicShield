# System Architecture: Secure Citizen Grievance Intelligence System

## 1. Overview
The **Secure Citizen Grievance Intelligence System** is an end-to-end civic complaint management and resolution platform aligned with **United Nations Sustainable Development Goal 16 (Peace, Justice and Strong Institutions)**.

It empowers citizens to register and track civic grievances while providing municipal and state authorities with an AI/NLP-driven intelligence layer for categorization, severity estimation, duplicate complaint clustering, and anomaly detection.

---

## 2. High-Level Architecture Diagram

```
                 +-----------------------------------+
                 |         Citizen / Authority       |
                 |               Browser             |
                 +-----------------+-----------------+
                                   |
                          HTTP / REST (JSON)
                                   |
                 +-----------------v-----------------+
                 |         React + Vite SPA          |
                 |          (Port: 5173)             |
                 +-----------------+-----------------+
                                   |
                          HTTP / REST (JSON)
                                   |
                 +-----------------v-----------------+
                 |      Node.js / Express API        |
                 |          (Port: 5000)             |
                 |  - JWT Auth & RBAC Middleware     |
                 |  - Helmet & Rate Limiting         |
                 |  - Audit Logging Controller       |
                 +--------+-----------------+--------+
                          |                 |
        Prisma ORM Queries|                 | HTTP Requests
                          |                 |
        +-----------------v----+   +--------v----------------------+
        | PostgreSQL Database  |   | Python FastAPI ML Service     |
        |     (Port: 5432)     |   |         (Port: 8000)          |
        |  - Users & Roles     |   |  - NLP Categorization         |
        |  - Grievances        |   |  - Severity / Priority        |
        |  - Analyses          |   |  - Similarity & Duplication   |
        |  - Audit Logs        |   |  - Anomaly / Spam Detection   |
        +----------------------+   +-------------------------------+
```

---

## 3. Component Breakdown

### 3.1 Frontend (`/frontend`)
- **Framework:** React 18, Vite
- **Routing:** React Router v6
- **Network Client:** Axios
- **Styling:** Vanilla CSS design system (dark modern theme, responsive, accessible)
- **Role Portals:**
  - Citizen Portal: Grievance submission, history, tracking, AI category & duplicate notices.
  - Authority Portal: Grievance triage dashboard, filtering, status updates, analytics, audit log inspection.

### 3.2 Backend API (`/backend`)
- **Runtime:** Node.js, Express.js
- **ORM:** Prisma ORM connected to PostgreSQL
- **Security:**
  - Helmet for secure HTTP response headers
  - Express-Rate-Limit for brute-force mitigation
  - Bcrypt.js for salted password hashing
  - JWT for stateless authenticated sessions with role-based claims
  - Centralized error and audit logging

### 3.3 Intelligence / ML Service (`/intelligence-service`)
- **Framework:** Python 3.11, FastAPI, Pydantic
- **Functionality:**
  - Internal REST endpoints consumed by the Express backend
  - Complaint text categorization into civic domains (e.g., Sanitation, Roads, Electricity, Water)
  - Severity & priority assessment based on urgency keywords, impact, and safety risks
  - Semantic duplicate and similarity detection against recent localized grievances
  - Anomaly and abuse detection

### 3.4 Database (`PostgreSQL`)
- Relational integrity, constraints, foreign keys, and indexes managed through Prisma schema and migrations.
- Stores normalized models: `User`, `Grievance`, `Category`, `GrievanceAnalysis`, `GrievanceSimilarity`, `AuditLog`.

---

## 4. Network and Container Communication
When running under Docker Compose:
- Backend connects to PostgreSQL at `postgres:5432`.
- Backend connects to ML Service at `http://intelligence-service:8000`.
- Frontend runs on `http://localhost:5173` and routes API requests to `http://localhost:5000/api`.
