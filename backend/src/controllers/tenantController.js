const db = require('../config/db');
const { logAction } = require('../services/auditService');

// API 5: Get Tenant Details (With Stats)
exports.getTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Auth: User must belong to tenant OR be super_admin
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Get Tenant
    const tenantRes = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const tenant = tenantRes.rows[0];

    // Calculate Stats
    const userCount = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const projectCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    const taskCount = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

    const data = {
        ...tenant,
        stats: {
            totalUsers: parseInt(userCount.rows[0].count),
            totalProjects: parseInt(projectCount.rows[0].count),
            totalTasks: parseInt(taskCount.rows[0].count)
        }
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 6: Update Tenant
exports.updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan } = req.body;
    const { id: userId, role } = req.user;

    // Authorization Check
    if (role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Role-Based Field Restrictions
    if (role !== 'super_admin') {
        if (status || subscriptionPlan) {
            return res.status(403).json({ success: false, message: 'Only Super Admin can change plan or status' });
        }
    }

    const result = await db.query(
      `UPDATE tenants SET 
         name = COALESCE($1, name), 
         status = COALESCE($2, status), 
         subscription_plan = COALESCE($3, subscription_plan),
         updated_at = NOW()
       WHERE id = $4 RETURNING id, name, updated_at`,
      [name, status, subscriptionPlan, tenantId]
    );

    await logAction(tenantId, userId, 'UPDATE_TENANT', 'tenant', tenantId);

    res.status(200).json({ success: true, message: 'Tenant updated successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 7: List All Tenants (Super Admin Only)
exports.getAllTenants = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Super Admin only' });
    }

    // Pagination & Filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;
    const planFilter = req.query.subscriptionPlan;

    let query = `
        SELECT t.*, 
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users,
        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) as total_projects
        FROM tenants t WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (statusFilter) { query += ` AND status = $${paramIdx++}`; params.push(statusFilter); }
    if (planFilter) { query += ` AND subscription_plan = $${paramIdx++}`; params.push(planFilter); }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Get Total Count for Pagination
    const countRes = await db.query('SELECT COUNT(*) FROM tenants');
    const totalTenants = parseInt(countRes.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        tenants: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTenants / limit),
          totalTenants,
          limit
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};