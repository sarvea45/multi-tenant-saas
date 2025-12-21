# Research Document: Multi-Tenant SaaS Architecture

## 1. Multi-Tenancy Analysis

### Introduction
Multi-tenancy is a software architecture where a single instance of software runs on a server and serves multiple tenants (organizations). A tenant is a group of users who share a common access with specific privileges to the software instance.

### Comparison of Multi-Tenancy Approaches

There are three primary database architectures for multi-tenancy:

| Feature | Shared Database, Shared Schema | Shared Database, Separate Schema | Separate Database |
| :--- | :--- | :--- | :--- |
| **Description** | All tenants share the same database and tables. A `tenant_id` column associates every record with a specific tenant. | All tenants share the same database, but each tenant has its own set of tables (schema). | Each tenant has their own dedicated database instance. |
| **Data Isolation** | **Lowest.** Relies entirely on application logic (WHERE clauses) to filter data. High risk of data leakage if code fails. | **Medium.** Database-level security (schemas) provides a logical barrier. Harder to accidentally cross-contaminate data. | **Highest.** Physical separation of data. Impossible to access another tenant's data without a separate connection. |
| **Scalability (Tenants)** | **High.** Can support thousands of tenants easily on a single DB instance. | **Medium.** The database has a limit on the number of schemas/tables it can manage efficiently. | **Low.** Each new tenant requires a new DB instance, consuming significant system resources (RAM/CPU). |
| **Cost** | **Lowest.** Uses resources most efficiently. One DB instance for everyone. | **Medium.** Overhead increases with schema count. | **Highest.** High infrastructure cost per tenant. |
| **Maintenance** | **Simple.** Schema updates (migrations) run once for all tenants. | **Complex.** Migrations must run separately for every single schema. | **Complex.** Migrations must run on every single database instance. |
| **Customization** | **None.** All tenants must use the exact same schema. | **Possible.** Can have custom columns per tenant schema. | **High.** Can have completely different schemas for different tenants. |

### Selected Approach: Shared Database + Shared Schema

**Justification:**
For this project, we have chosen the **Shared Database + Shared Schema** approach.

1.  **Efficiency & Cost:** This is the most resource-efficient model. Since we are targeting a SaaS application that could potentially scale to hundreds of small organizations (tenants), spinning up a separate database or schema for each would be resource-prohibitive and overkill for the "start-up" phase.
2.  **Simplified Development:** Managing migrations is significantly easier. We run `init.sql` once, and the system is ready.
3.  **Docker Compatibility:** Running a single PostgreSQL container is straightforward. Attempting to orchestrate dynamic database creation inside a Docker container adds unnecessary complexity to the DevOps pipeline.
4.  **Performance:** Modern PostgreSQL indices on the `tenant_id` column make querying highly efficient, mitigating the performance concern of large tables.

---

## 2. Technology Stack Justification

### Backend: Node.js with Express
* **Why:** Node.js is built on Chrome's V8 JavaScript engine, offering non-blocking, event-driven I/O. This is ideal for SaaS applications that handle many concurrent requests (like task updates). Express is a minimalist framework that allows for rapid API development without the boilerplate of heavier frameworks like NestJS or Django.
* **Alternatives:** Python (Django/Flask) was considered but Node.js offers better JSON handling native to Javascript, which streamlines the API development process.

### Frontend: React.js
* **Why:** React's component-based architecture is perfect for a dashboard-heavy application. The Virtual DOM ensures that updates (like moving a task from "Todo" to "Done") are snappy. The vast ecosystem of libraries (React Router, Axios) accelerates development.
* **Alternatives:** Angular (too steep learning curve) or Vue.js. React was chosen for its ubiquity and "Learn Once, Write Anywhere" philosophy.

### Database: PostgreSQL 15
* **Why:** PostgreSQL is the gold standard for open-source relational databases. It offers robust support for complex queries, transactions (ACID compliance), and indexing, which are critical for the multi-tenant `tenant_id` filtering. It handles concurrent writes better than MySQL in many scenarios.
* **Alternatives:** MySQL or MongoDB. MongoDB (NoSQL) was rejected because relational integrity (Foreign Keys between Users, Projects, Tasks) is crucial for this data model.

### Authentication: JWT (JSON Web Tokens)
* **Why:** JWT allows for **stateless** authentication. The server does not need to store session data in memory or a database (like Redis), making the application easier to scale horizontally. The token itself carries the user's `role` and `tenant_id`, allowing immediate authorization checks without a DB lookup on every single middleware call.
* **Alternatives:** Session-based auth (cookies). Rejected because it requires server-side state storage, which complicates containerization and scaling.

### Containerization: Docker & Docker Compose
* **Why:** Ensures consistency across development and production environments. "It works on my machine" issues are eliminated because the OS, libraries, and dependencies are packaged together. `docker-compose` allows us to orchestrate the DB, Backend, and Frontend as a single unit.

---

## 3. Security Considerations

### 1. Data Isolation Strategy
We enforce isolation at the **Application Layer** via Middleware.
* **Mechanism:** Every incoming request passes through an `authMiddleware`. This extracts the `tenant_id` from the JWT.
* **Enforcement:** All subsequent database queries MUST include `WHERE tenant_id = req.user.tenantId`. This is not optional; it is a hard rule in the controller logic.

### 2. Authentication & Authorization
* **Authentication:** We use `bcrypt` to salt and hash passwords. We never store plain-text passwords. Login exchanges credentials for a signed JWT.
* **Authorization:** Role-Based Access Control (RBAC) is implemented.
    * `Super Admin`: Can access all tenant data.
    * `Tenant Admin`: Can manage users and projects within their own `tenant_id`.
    * `User`: Can only view/edit tasks they are assigned to or projects they belong to.

### 3. Password Hashing
We use `bcrypt` with a salt round of 10. This makes rainbow table attacks infeasible. Even if the database is leaked, the passwords remain secure.

### 4. API Security
* **CORS (Cross-Origin Resource Sharing):** configured to only accept requests from our specific Frontend URL.
* **Input Validation:** Although basic, we ensure inputs are checked to prevent SQL injection (handled largely by parameterized queries in `pg` library).
* **Environment Variables:** Secrets like `JWT_SECRET` and `DB_PASSWORD` are never hardcoded; they are injected via Docker environment variables.

### 5. Transport Security
In a production environment, all traffic would be encrypted via **HTTPS/TLS** to prevent Man-in-the-Middle attacks where an attacker could intercept the JWT token.