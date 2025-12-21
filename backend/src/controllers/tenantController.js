const db = require('../config/db');

// API 5: Get Tenant Details
exports.getTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    // Auth Check: Must be super_admin OR belong to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 6: Update Tenant
exports.updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan } = req.body;

    // Auth Check
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    // Only super_admin can change status/plan
    if (req.user.role !== 'super_admin' && (status || subscriptionPlan)) {
        return res.status(403).json({ success: false, message: 'Only Super Admin can change plan/status' });
    }

    const result = await db.query(
      `UPDATE tenants SET name = COALESCE($1, name), status = COALESCE($2, status), subscription_plan = COALESCE($3, subscription_plan)
       WHERE id = $4 RETURNING *`,
      [name, status, subscriptionPlan, tenantId]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
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
    const result = await db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: { tenants: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};