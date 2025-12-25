# Multi-Tenant SaaS Platform

A production-ready, Dockerized SaaS application for Project & Task Management. This platform supports multiple organizations (tenants) with strict data isolation, role-based access control (RBAC), and subscription limits.

## 🚀 Features
* **Multi-Tenancy:** Strict data isolation using `tenant_id`.
* **Authentication:** JWT-based stateless auth with strict Role-Based Access Control.
* **Dockerized:** Full stack (DB + Backend + Frontend) spins up with one command.
* **Automatic Seeding:** Database automatically initializes with demo data on startup.
* **Dashboard:** React-based frontend for managing projects and tasks.

## ⚙️ Installation & Setup

### Prerequisites
* Docker Desktop installed and running.

### Quick Start
1.  Navigate to the root directory.
2.  Run the application:
    ```bash
    docker-compose up --build -d
    ```
3.  Wait ~30 seconds for the database to initialize.
4.  Open **http://localhost:3000** in your browser.

### Test Credentials
| Role | Subdomain | Email | Password |
| :--- | :--- | :--- | :--- |
| **Tenant Admin** | `demo` | `admin@demo.com` | `Demo@123` |
| **Super Admin** | `system`| `superadmin@system.com` | `Admin@123` |
| **Regular User** | `demo` | `user1@demo.com` | `User@123` |

## 📂 Project Structure
* `backend/`: Express.js API
* `frontend/`: React.js App
* `database/`: Init SQL script (Schema + Seeds)
* `docs/`: Architecture & Research documentation
* `docker-compose.yml`: Orchestration
## Live Demo Link
*  https://youtu.be/wGqKkeCt2DE *