const db = require('../config/db');
const bcrypt = require('bcrypt');
const { logAction } = require('../services/auditService');

const PLAN_LIMITS = {
  free: { users: 5 },
  pro: { users: 25 },
  enterprise: { users: 100 }
};

// API 8: Add User (With Limit Check)
exports.addUser = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const { tenantId, id: currentUserId } = req.user;

    // 1. Check Plan Limits
    const tenantRes = await db.query('SELECT subscription_plan FROM tenants WHERE id = $1', [tenantId]);
    const plan = tenantRes.rows[0].subscription_plan;
    const maxUsers = PLAN_LIMITS[plan]?.users || 5;

    const countRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    if (parseInt(countRes.rows[0].count) >= maxUsers) {
        return res.status(403).json({ success: false, message: `User limit reached for ${plan} plan` });
    }

    // 2. Check Email Unique
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (userCheck.rows.length > 0) return res.status(409).json({ success: false, message: 'Email exists in tenant' });

    // 3. Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, created_at`,
      [tenantId, email, hashedPassword, fullName, role || 'user']
    );

    await logAction(tenantId, currentUserId, 'CREATE_USER', 'user', newUser.rows[0].id);

    res.status(201).json({ success: true, data: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 9: List Users
exports.getUsers = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await db.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    res.status(200).json({ success: true, data: { users: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role } = req.body;
    const { tenantId, id: currentUserId } = req.user;

    const result = await db.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role)
       WHERE id = $3 AND tenant_id = $4 RETURNING id, full_name, role`,
      [fullName, role, userId, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    await logAction(tenantId, currentUserId, 'UPDATE_USER', 'user', userId);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 11: Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, id: currentUserId } = req.user;

    if (userId === currentUserId) return res.status(400).json({ message: 'Cannot delete self' });

    const result = await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [userId, tenantId]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await logAction(tenantId, currentUserId, 'DELETE_USER', 'user', userId);

    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};