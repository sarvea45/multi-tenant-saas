const db = require('../config/db');
const bcrypt = require('bcrypt');
const { logAction } = require('../services/auditService');

// API 8: Add User to Tenant
exports.addUser = async (req, res) => {
  try {
    const { tenantId } = req.params; // From URL
    const { email, password, fullName, role } = req.body;
    const { id: adminId, role: requesterRole } = req.user;

    // Auth: Only tenant_admin
    if (requesterRole !== 'tenant_admin') return res.status(403).json({ message: 'Unauthorized' });
    if (req.user.tenantId !== tenantId) return res.status(403).json({ message: 'Cannot add users to other tenants' });

    // 1. Check Limits
    const tenantRes = await db.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
    const maxUsers = tenantRes.rows[0].max_users;
    const countRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    
    if (parseInt(countRes.rows[0].count) >= maxUsers) {
        return res.status(403).json({ success: false, message: 'Subscription limit reached' });
    }

    // 2. Check Unique Email
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (emailCheck.rows.length > 0) return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });

    // 3. Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING id, email, full_name, role, tenant_id as "tenantId", is_active as "isActive", created_at`,
      [tenantId, email, hashedPassword, fullName, role || 'user']
    );

    await logAction(tenantId, adminId, 'CREATE_USER', 'user', newUser.rows[0].id);

    res.status(201).json({ success: true, message: 'User created successfully', data: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 9: List Tenant Users
exports.getUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Auth: Must belong to tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    // Pagination & Search
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const roleFilter = req.query.role;

    let query = `SELECT id, email, full_name, role, is_active as "isActive", created_at FROM users WHERE tenant_id = $1`;
    const params = [tenantId];
    let paramIdx = 2;

    if (search) {
        query += ` AND (email ILIKE $${paramIdx} OR full_name ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
    }
    if (roleFilter) {
        query += ` AND role = $${paramIdx++}`;
        params.push(roleFilter);
    }

    // Get Total for Pagination
    const countRes = await db.query(query.replace('SELECT id, email, full_name, role, is_active as "isActive", created_at', 'SELECT COUNT(*)'), params);
    const total = parseInt(countRes.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        users: result.rows,
        total,
        pagination: { currentPage: page, totalPages: Math.ceil(total/limit), limit }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { id: requesterId, role: requesterRole, tenantId } = req.user;

    // Verify user exists in tenant
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    if (userCheck.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    // Authorization Logic
    const isSelf = (userId === requesterId);
    const isAdmin = (requesterRole === 'tenant_admin');

    if (!isSelf && !isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    // Build Update Query
    let query = 'UPDATE users SET updated_at = NOW()';
    const params = [userId, tenantId];
    let paramIdx = 3;

    // Anyone can update their own name
    if (fullName) {
        query += `, full_name = $${paramIdx++}`;
        params.push(fullName);
    }

    // Only Admin can update Role and Active status
    if (isAdmin) {
        if (role) { query += `, role = $${paramIdx++}`; params.push(role); }
        if (isActive !== undefined) { query += `, is_active = $${paramIdx++}`; params.push(isActive); }
    } else if (role || isActive !== undefined) {
        return res.status(403).json({ message: 'Only admins can update role/status' });
    }

    query += ` WHERE id = $1 AND tenant_id = $2 RETURNING id, full_name, role, updated_at`;
    
    const result = await db.query(query, params);
    
    await logAction(tenantId, requesterId, 'UPDATE_USER', 'user', userId);

    res.status(200).json({ success: true, message: 'User updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 11: Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { id: requesterId, role: requesterRole, tenantId } = req.user;

    if (requesterRole !== 'tenant_admin') return res.status(403).json({ message: 'Unauthorized' });
    if (userId === requesterId) return res.status(403).json({ message: 'Cannot delete self' });

    const result = await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [userId, tenantId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await logAction(tenantId, requesterId, 'DELETE_USER', 'user', userId);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};