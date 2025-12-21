const db = require('../config/db');
const { logAction } = require('../services/auditService');

// API 12: Create Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { tenantId, id: userId } = req.user;

    // 1. Check Limits
    const tenantRes = await db.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
    const maxProjects = tenantRes.rows[0].max_projects;
    const countRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    
    if (parseInt(countRes.rows[0].count) >= maxProjects) {
        return res.status(403).json({ success: false, message: 'Project limit reached' });
    }

    // 2. Create
    const result = await db.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, description, status || 'active', userId]
    );

    await logAction(tenantId, userId, 'CREATE_PROJECT', 'project', result.rows[0].id);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 13: List Projects
exports.getProjects = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Pagination & Filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let query = `
        SELECT p.*, u.full_name as creator_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as "taskCount",
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as "completedTaskCount"
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIdx = 2;

    if (status) { query += ` AND p.status = $${paramIdx++}`; params.push(status); }
    if (search) { query += ` AND p.name ILIKE $${paramIdx++}`; params.push(`%${search}%`); }

    // Total Count
    const countQuery = query.replace(/SELECT[\s\S]+FROM projects p/, 'SELECT COUNT(*) FROM projects p');
    const countRes = await db.query(countQuery.split('ORDER')[0], params); // Remove order by for count
    const total = parseInt(countRes.rows[0].count);

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        projects: result.rows,
        total,
        pagination: { currentPage: page, totalPages: Math.ceil(total/limit), limit }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 14: Update Project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, id: userId, role } = req.user;

    // Check Existence & Ownership
    const projCheck = await db.query('SELECT created_by FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projCheck.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    // Auth: Tenant Admin OR Creator
    if (role !== 'tenant_admin' && projCheck.rows[0].created_by !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await db.query(
      `UPDATE projects SET 
       name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING id, name, description, status, updated_at`,
      [name, description, status, projectId, tenantId]
    );

    await logAction(tenantId, userId, 'UPDATE_PROJECT', 'project', projectId);
    res.status(200).json({ success: true, message: 'Project updated successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 15: Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId, id: userId, role } = req.user;

    const projCheck = await db.query('SELECT created_by FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projCheck.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    if (role !== 'tenant_admin' && projCheck.rows[0].created_by !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    await db.query('DELETE FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    await logAction(tenantId, userId, 'DELETE_PROJECT', 'project', projectId);

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};