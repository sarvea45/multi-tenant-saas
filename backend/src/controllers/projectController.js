const db = require('../config/db');
const { logAction } = require('../services/auditService');

// Plan Limits Helper
const PLAN_LIMITS = {
  free: { projects: 3 },
  pro: { projects: 15 },
  enterprise: { projects: 50 }
};

// API 12: Create Project (With Limit Check & Audit)
exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { tenantId, id: userId } = req.user; 

    // 1. Get Tenant Plan
    const tenantRes = await db.query('SELECT subscription_plan FROM tenants WHERE id = $1', [tenantId]);
    const plan = tenantRes.rows[0].subscription_plan;
    const maxProjects = PLAN_LIMITS[plan]?.projects || 3;

    // 2. Check Current Count
    const countRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    const currentCount = parseInt(countRes.rows[0].count);

    if (currentCount >= maxProjects) {
        return res.status(403).json({ success: false, message: `Project limit reached for ${plan} plan` });
    }

    // 3. Create Project
    const result = await db.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, description, status || 'active', userId]
    );

    const newProject = result.rows[0];

    // 4. Audit Log
    await logAction(tenantId, userId, 'CREATE_PROJECT', 'project', newProject.id);

    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 13: List Projects
exports.getProjects = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await db.query(
      `SELECT p.*, u.full_name as creator_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.tenant_id = $1 ORDER BY p.created_at DESC`,
      [tenantId]
    );
    res.status(200).json({ success: true, data: { projects: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 14: Update Project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, id: userId } = req.user;

    const result = await db.query(
      `UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status)
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [name, description, status, projectId, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    
    await logAction(tenantId, userId, 'UPDATE_PROJECT', 'project', projectId);
    
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 15: Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId, id: userId } = req.user;

    const result = await db.query('DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id', [projectId, tenantId]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    
    await logAction(tenantId, userId, 'DELETE_PROJECT', 'project', projectId);

    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};