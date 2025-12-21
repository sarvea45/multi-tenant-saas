-- 1. Super Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES 
(uuid_generate_v4(), NULL, 'superadmin@system.com', '$2b$10$REPLACE_WITH_HASH_FOR_Admin@123', 'System Super Admin', 'super_admin');

-- 2. Demo Tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Demo Company', 'demo', 'active', 'pro', 25, 15);

-- 3. Tenant Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'admin@demo.com', '$2b$10$REPLACE_WITH_HASH_FOR_Demo@123', 'Demo Admin', 'tenant_admin');

-- 4. Regular Users
INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'user1@demo.com', '$2b$10$REPLACE_WITH_HASH_FOR_User@123', 'User One', 'user'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'user2@demo.com', '$2b$10$REPLACE_WITH_HASH_FOR_User@123', 'User Two', 'user');

-- 5. Projects
INSERT INTO projects (id, tenant_id, name, description, status, created_by) VALUES 
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Project Alpha', 'First demo project', 'active', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
(uuid_generate_v4(), 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Project Beta', 'Second demo project', 'active', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- 6. Tasks
INSERT INTO tasks (project_id, tenant_id, title, status, priority, assigned_to) VALUES 
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Initial Task', 'todo', 'high', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');