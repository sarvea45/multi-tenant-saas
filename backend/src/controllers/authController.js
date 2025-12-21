const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// API 1: Tenant Registration (Transaction: Tenant + Admin)
exports.registerTenant = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // 1. Create Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan) 
       VALUES ($1, $2, 'active', 'free') RETURNING id`,
      [tenantName, subdomain]
    );
    const tenantId = tenantRes.rows[0].id;

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // 3. Create Admin User
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4, 'tenant_admin') RETURNING id, email, full_name, role`,
      [tenantId, adminEmail, hashedPassword, adminFullName]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: { tenantId, subdomain, adminUser: userRes.rows[0] }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    // Handle unique constraint violation (409)
    if (error.code === '23505') { 
        return res.status(409).json({ success: false, message: 'Subdomain or Email already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// API 2: Login
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;
  try {
    const query = `
      SELECT u.*, t.subdomain 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1`;
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = result.rows[0];

    // Check Subdomain (Skip for super_admin)
    if (user.role !== 'super_admin' && user.subdomain !== tenantSubdomain) {
      return res.status(404).json({ success: false, message: 'User not found in this tenant' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: user.tenant_id }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Get Current User (Me)
exports.getMe = async (req, res) => {
  try {
    const userRes = await db.query(
        `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id,
                t.name as tenant_name, t.subscription_plan
         FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = $1`, 
        [req.user.userId]
    );
    
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: userRes.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 4: Logout
exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};