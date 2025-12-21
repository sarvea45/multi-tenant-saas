# API Documentation

## Authentication Module

### 1. Register Tenant
* **Endpoint:** `POST /api/auth/register-tenant`
* **Auth:** Public
* **Body:** `{ "tenantName": "Acme", "subdomain": "acme", "adminEmail": "admin@acme.com", "adminPassword": "password123", "adminFullName": "John Doe" }`
* **Response:** `201 Created`

### 2. Login
* **Endpoint:** `POST /api/auth/login`
* **Auth:** Public
* **Body:** `{ "email": "admin@demo.com", "password": "Demo@123", "tenantSubdomain": "demo" }`
* **Response:** `200 OK` (Returns JWT Token)

### 3. Get Current User
* **Endpoint:** `GET /api/auth/me`
* **Auth:** Bearer Token
* **Response:** `200 OK` (User details + Tenant Info)

---

## Tenant Management

### 5. Get Tenant Details
* **Endpoint:** `GET /api/tenants/:id`
* **Auth:** Tenant Admin / Super Admin
* **Response:** `200 OK` (Includes stats: totalUsers, totalProjects)

### 7. List All Tenants
* **Endpoint:** `GET /api/tenants`
* **Auth:** Super Admin ONLY
* **Response:** `200 OK` (List of all registered tenants)

---

## User Management

### 8. Add User
* **Endpoint:** `POST /api/tenants/:tenantId/users`
* **Auth:** Tenant Admin
* **Body:** `{ "email": "user@demo.com", "password": "password", "fullName": "User Name", "role": "user" }`
* **Response:** `201 Created`

### 9. List Users
* **Endpoint:** `GET /api/tenants/:tenantId/users`
* **Auth:** Member of Tenant
* **Response:** `200 OK`

---

## Project Management

### 12. Create Project
* **Endpoint:** `POST /api/projects`
* **Auth:** Any User
* **Body:** `{ "name": "New Project", "description": "Details...", "status": "active" }`
* **Response:** `201 Created`

### 13. List Projects
* **Endpoint:** `GET /api/projects`
* **Auth:** Any User
* **Response:** `200 OK` (Filtered by user's tenant)

---

## Task Management

### 16. Create Task
* **Endpoint:** `POST /api/projects/:projectId/tasks`
* **Auth:** Any User
* **Body:** `{ "title": "Fix Bug", "priority": "high", "assignedTo": "uuid" }`
* **Response:** `201 Created`

### 18. Update Task Status
* **Endpoint:** `PATCH /api/tasks/:taskId/status`
* **Auth:** Any User
* **Body:** `{ "status": "in_progress" }`
* **Response:** `200 OK`