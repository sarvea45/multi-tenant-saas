# Technical Specification
## Setup
1. Install Docker.
2. Run `docker-compose up`.

## Database Schema
* **Tenants:** Stores organization details.
* **Users:** Stores credentials, linked to Tenant.
* **Projects:** Linked to Tenant.