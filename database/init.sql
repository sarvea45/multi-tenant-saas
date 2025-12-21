-- 1. Create Tables
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255),
    entity_id VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed Data (Placeholders - we will update these in a moment)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'superadmin@system.com', '$2b$10$11Eh.k7OgA0UZesgaKaSQ.iyHcU8Z8zOkhsQVSO.Sx4SwTSSsGnnK', 'System Admin', 'super_admin');

INSERT INTO tenants (id, name, subdomain, status, subscription_plan)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Demo Company', 'demo', 'active', 'pro');

INSERT INTO users (tenant_id, email, password_hash, full_name, role)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'admin@demo.com', '$2b$10$UzDty8a/zF1kXZDZRPKabe1ScF8xTENjAA/hhyLJKzoQD7yE1QLlm', 'Demo Admin', 'tenant_admin');

INSERT INTO users (tenant_id, email, password_hash, full_name, role)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'user1@demo.com', '$2b$10$pzqe7mspbO21MZM6Sgch8OEiDEKGkCqgtdNoiDEcO.M/Q5oj/zGI6', 'User One', 'user');

INSERT INTO projects (id, tenant_id, name, description, created_by)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Project Alpha', 'Demo Project', (SELECT id FROM users WHERE email='admin@demo.com'));

INSERT INTO tasks (project_id, tenant_id, title, status, priority)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Initial Task', 'todo', 'high');