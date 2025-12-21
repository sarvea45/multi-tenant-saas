const db = require('../config/db');
const bcrypt = require('bcrypt');

// API 8: Add User to Tenant
exports.addUser = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const { tenantId } = req.user; // Get from JWT

    // 1. Check if email already exists in this tenant
    const userCheck = await db.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert User
    const newUser = await db.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, created_at`,
      [tenantId, email, hashedPassword, fullName, role || 'user']
    );

    res.status(201).json({ success: true, data: newUser.rows[0] });
  } catch (error) {
    console.error('Add User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 9: List Tenant Users
exports.getUsers = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await db.query(
      `SELECT id, email, full_name, role, created_at 
       FROM users 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.status(200).json({ success: true, data: { users: result.rows } });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role } = req.body;
    const { tenantId } = req.user;

    // Security: Ensure user belongs to this tenant
    const check = await db.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const result = await db.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role)
       WHERE id = $3 AND tenant_id = $4 RETURNING id, full_name, role`,
      [fullName, role, userId, tenantId]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 11: Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId } = req.user;

    // Security: Prevent deleting self
    if (userId === req.user.userId) {
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};