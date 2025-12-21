const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/auditService');

// API 1: Tenant Registration
// Requirement: Transaction, Hash Password, Default Plan, Audit Log
exports.registerTenant = async (req, res) => {
  // Get a dedicated client for transaction
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // 1. Create Tenant (Default: 'free' plan, 'active' status)
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects) 
       VALUES ($1, $2, 'active', 'free', 5, 3) 
       RETURNING id`,
      [tenantName, subdomain]
    );
    const tenantId = tenantRes.rows[0].id;

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // 3. Create Admin User
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, 'tenant_admin', true) 
       RETURNING id, email, full_name, role`,
      [tenantId, adminEmail, hashedPassword, adminFullName]
    );
    const userId = userRes.rows[0].id;

    // 4. Audit Log (Manually inserting inside transaction to ensure atomicity)
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'REGISTER_TENANT', 'tenant', $3)`,
      [tenantId, userId, tenantId]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: { 
        tenantId, 
        subdomain, 
        adminUser: userRes.rows[0] 
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    // Handle Duplicate Key Error (Postgres code 23505)
    if (error.code === '23505') { 
        return res.status(409).json({ success: false, message: 'Subdomain or Email already exists' });
    }
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// API 2: User Login
// Requirement: Verify tenant status, user status, password match, JWT
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;
  
  try {
    // 1. Fetch User with Tenant Details
    const query = `
      SELECT u.*, t.subdomain, t.status as tenant_status
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1`;
    
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];

    // 2. Validation Logic
    // Skip subdomain check for super_admin (they can login anywhere)
    if (user.role !== 'super_admin') {
       // Check if user belongs to the requested subdomain
       if (user.subdomain !== tenantSubdomain) {
         return res.status(404).json({ success: false, message: 'Tenant not found or user does not belong to it' });
       }
       // Check if account/tenant is active
       if (user.tenant_status !== 'active' || !user.is_active) {
         return res.status(403).json({ success: false, message: 'Account suspended or inactive' });
       }
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 5. Log Action
    if (user.tenant_id) {
        await logAction(user.tenant_id, user.id, 'LOGIN', 'session', null);
    }

    res.status(200).json({
      success: true,
      data: {
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.full_name, 
          role: user.role, 
          tenantId: user.tenant_id 
        },
        token,
        expiresIn: 86400 // 24 hours in seconds
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Get Current User
// Requirement: Return user info + tenant info + Dashboard Stats (Fix applied for Super Admin)
exports.getMe = async (req, res) => {
  try {
    // 1. Fetch User and Tenant Info
    const userQuery = `
      SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.is_active,
             t.id as t_id, t.name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1`;
      
    const userRes = await db.query(userQuery, [req.user.userId]);
    
    if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const row = userRes.rows[0];

    // 2. Fetch Dashboard Stats
    let stats = { totalProjects: 0, totalTasks: 0 };
    
    if (row.role === 'super_admin') {
        // --- SUPER ADMIN: Count EVERYTHING ---
        const projectCount = await db.query('SELECT COUNT(*) FROM projects');
        const taskCount = await db.query('SELECT COUNT(*) FROM tasks');
        
        stats.totalProjects = parseInt(projectCount.rows[0].count);
        stats.totalTasks = parseInt(taskCount.rows[0].count);
    } else if (row.tenant_id) {
        // --- TENANT USER: Count only OWN tenant data ---
        const projectCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [row.tenant_id]);
        const taskCount = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [row.tenant_id]);
        
        stats.totalProjects = parseInt(projectCount.rows[0].count);
        stats.totalTasks = parseInt(taskCount.rows[0].count);
    }

    // 3. Construct Response
    const data = {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        isActive: row.is_active,
        tenant: {
            // Handle null tenant for Super Admin
            id: row.t_id || null,
            name: row.name || 'System',
            subdomain: row.subdomain || 'system',
            subscriptionPlan: row.subscription_plan || 'unlimited',
            maxUsers: row.max_users || 0,
            maxProjects: row.max_projects || 0,
            stats: stats 
        }
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 4: Logout
// Requirement: Log action
exports.logout = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    
    // Log the logout action (only if part of a tenant)
    if (tenantId && userId) {
        await logAction(tenantId, userId, 'LOGOUT', 'user', userId);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};