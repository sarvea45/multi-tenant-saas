
# Technical Specification

## 1. Project Structure

The project is organized as a monorepo containing both Backend and Frontend services, orchestrated by Docker.

---

## 1.1 Backend Structure (`/backend`)

Built with Node.js and Express.

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection pool (pg)
│   ├── controllers/           # Business logic for each module
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── tenantController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification & role checks
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── tenantRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── auditService.js    # Logic for writing to audit_logs
│   ├── utils/
│   │   └── generateHash.js    # Utility for password hashing
│   └── server.js              # App entry point
├── .env.example               # Template for environment variables
├── Dockerfile                 # Production container definition
└── package.json               # Dependencies
````

---

## 1.2 Frontend Structure (`/frontend`)

Built with React.js (Create React App).

```text
frontend/
├── public/                    # Static assets (index.html, robots.txt)
├── src/
│   ├── App.js                 # Main application component (SPA logic)
│   ├── App.css                # Styles
│   ├── index.js               # React entry point
│   └── ...                    # Helper components
├── Dockerfile                 # Production container definition
└── package.json               # Dependencies
```

---

## 1.3 Database (`/database`)

```text
database/
└── init.sql                   # SQL script: schema creation + seed data
```

---

## 2. Development Setup Guide

### 2.1 Prerequisites

* Docker Desktop (latest version) installed and running
* Git for version control
* (Optional) Node.js v18+ if running locally without Docker

---

### 2.2 Environment Variables

The system is pre-configured to work out-of-the-box with Docker.
Critical variables are injected via `docker-compose.yml`:

* `DB_HOST=database`
* `DB_PORT=5432`
* `DB_NAME=saas_db`
* `JWT_SECRET` (Set to a secure string in production)
* `FRONTEND_URL=http://frontend:3000`

---

### 2.3 Installation Steps

#### Clone the Repository

```bash
git clone https://github.com/sarvea45/multi-tenant-saas.git
cd multi-tenant-saas
```

#### Start the Application (Docker)

This single command builds images, creates the network, starts the database, runs migrations and seed data, and launches the backend and frontend.

```bash
docker-compose up --build -d
```

#### Verify Status

```bash
docker-compose ps
```

---

## 2.4 How to Run Locally (Verification)

### Access the Application

```
http://localhost:3000
```

### Login with Demo Credentials

* **Subdomain:** demo
* **Email:** [admin@demo.com](mailto:admin@demo.com)
* **Password:** Demo@123

---

## 2.5 How to Run Tests

### Functional Testing (Manual)

Since this is a containerized submission, testing is performed by validating endpoints against the `submission.json` data.

#### Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### Test Data Isolation

1. Login as `admin@demo.com` → Create a project
2. Login as `superadmin@system.com` → Verify you can see it
3. Login as a new tenant admin → Verify you **CANNOT** see the demo project

---

