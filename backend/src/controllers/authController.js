const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/auditService');

// API 1: Tenant Registration
// Requirement: Transaction, Hash Password, Default Plan
exports.registerTenant = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // 1. Create Tenant (Default: 'free' plan, 'active' status)
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects) 
       VALUES ($1, $2, 'active', 'free', 5, 3) RETURNING id`,
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

    // 4. Audit Log (Inside transaction)
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'REGISTER_TENANT', 'tenant', $3)`,
      [tenantId, userRes.rows[0].id, tenantId]
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
    // Requirement: 409 for duplicate subdomain/email
    if (error.code === '23505') { 
        return res.status(409).json({ success: false, message: 'Subdomain or Email already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// API 2: User Login
// Requirement: Verify tenant status, user status, password match
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;
  
  try {
    // Join Users and Tenants to check statuses
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

    // Requirement: Verify user belongs to tenant (skip for super_admin)
    if (user.role !== 'super_admin') {
       if (user.subdomain !== tenantSubdomain) {
         return res.status(404).json({ success: false, message: 'Tenant not found or user does not belong to it' });
       }
       // Requirement: 403 Account suspended/inactive
       if (user.tenant_status !== 'active' || !user.is_active) {
         return res.status(403).json({ success: false, message: 'Account suspended or inactive' });
       }
    }

    // Requirement: Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Optional: Log successful login
    await logAction(user.tenant_id, user.id, 'LOGIN', 'session', null);

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
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Get Current User
// Requirement: Return user + tenant info, NO password hash
exports.getMe = async (req, res) => {
  try {
    const userRes = await db.query(
        `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.is_active,
                t.id as t_id, t.name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
         FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = $1`, 
        [req.user.userId]
    );
    
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    
    const row = userRes.rows[0];
    
    // Structure response exactly as requested
    const data = {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        isActive: row.is_active,
        tenant: {
            id: row.t_id,
            name: row.name,
            subdomain: row.subdomain,
            subscriptionPlan: row.subscription_plan,
            maxUsers: row.max_users,
            maxProjects: row.max_projects
        }
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 4: Logout
// Requirement: Log action in audit_logs
exports.logout = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    
    // Log the logout action
    await logAction(tenantId, userId, 'LOGOUT', 'user', userId);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};