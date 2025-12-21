# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin
* **Description:** The owner of the SaaS platform.
* **Responsibilities:** Managing the system health, onboarding new tenants (organizations), and managing subscription plans.
* **Goals:** Ensure the system is running smoothly and profitable.
* **Pain Points:** Dealing with manual tenant onboarding or fixing data issues across tenants.

### 1.2 Tenant Admin
* **Description:** The manager/owner of a specific organization (Tenant) using the SaaS.
* **Responsibilities:** Managing their team members (users), creating high-level projects, and overseeing billing.
* **Goals:** Efficiently manage their team's workflow and projects.
* **Pain Points:** Unauthorized users seeing sensitive project data; hitting plan limits unexpectedly.

### 1.3 End User
* **Description:** An employee working for a Tenant.
* **Responsibilities:** Completing tasks assigned to them.
* **Goals:** Know clearly what to work on and update status easily.
* **Pain Points:** Confusing interface, seeing irrelevant projects from other teams.

---

## 2. Functional Requirements

### Authentication Module
* **FR-001:** The system shall allow a Super Admin to register a new Tenant with a unique subdomain.
* **FR-002:** The system shall allow users to log in using Email, Password, and Tenant Subdomain.
* **FR-003:** The system shall authenticate users via JWT tokens valid for 24 hours.
* **FR-004:** The system shall prevent users from logging into a tenant they do not belong to.

### Tenant Management Module
* **FR-005:** The system shall allow Super Admins to view a list of all tenants.
* **FR-006:** The system shall allow Tenant Admins to view their own tenant's details and subscription status.
* **FR-007:** The system shall enforce unique email addresses *within* a tenant (but allow duplicates across tenants).

### User Management Module
* **FR-008:** The system shall allow Tenant Admins to create new users (Team Members).
* **FR-009:** The system shall allow Tenant Admins to assign roles (`tenant_admin` or `user`) to new accounts.
* **FR-010:** The system shall prevent Tenant Admins from creating more users than their Subscription Plan allows.

### Project & Task Management Module
* **FR-011:** The system shall allow authorized users to create Projects.
* **FR-012:** The system shall allow users to create Tasks linked to a specific Project.
* **FR-013:** The system shall allow assigning a Task to a specific User within the same Tenant.
* **FR-014:** The system shall prevent creation of Projects if the Tenant has reached their plan limit.
* **FR-015:** The system shall allow updating the status of a Task (Todo -> In Progress -> Done).

---

## 3. Non-Functional Requirements

### Performance
* **NFR-001:** All API responses for standard CRUD operations must complete in under 500ms.

### Security
* **NFR-002:** All user passwords must be hashed using Bcrypt before storage.
* **NFR-003:** No API endpoint (except login/register) shall be accessible without a valid Bearer Token.

### Scalability
* **NFR-004:** The database schema must use indexes on `tenant_id` to ensure query performance does not degrade as the number of tenants increases.

### Availability
* **NFR-005:** The system must be containerized (Docker) to ensure it can be restarted or deployed to any cloud provider with 99.9% uptime.