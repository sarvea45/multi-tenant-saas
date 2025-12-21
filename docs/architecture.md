# System Architecture
The application uses a 3-tier containerized architecture:
1. **Frontend Container:** React app serving static assets.
2. **Backend Container:** Express API handling logic and Auth.
3. **Database Container:** PostgreSQL storage.

**Data Flow:**
User -> Frontend -> API (JWT Auth) -> Database (Filtered by TenantID).