# Research Document
## Multi-Tenancy Approach
We chose **Shared Database, Shared Schema** for this project.
* **Pros:** Cost-effective, easy to manage schema updates, simplest for small-to-medium SaaS.
* **Cons:** Requires strict logical isolation (WHERE tenant_id = ?).
* **Justification:** Postgres handles indexing efficiently, making this performant for our needs.

## Tech Stack
* **Node/Express:** Fast I/O, great for real-time APIs.
* **React:** Component-based UI, ideal for dashboards.
* **PostgreSQL:** Reliable relational data integrity.