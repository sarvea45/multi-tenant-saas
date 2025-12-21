const db = require('../config/db');

exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, status, priority } = req.body;
    const { tenantId } = req.user;

    // 1. SECURITY CHECK: Ensure the project belongs to the user's tenant
    const projectCheck = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, tenantId]
    );

    if (projectCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Project not found or unauthorized' });
    }

    // 2. Create Task
    const result = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, status, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, tenantId, title, status || 'todo', priority || 'medium']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    // Security Check
    const projectCheck = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, tenantId]
    );
    if (projectCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );

    res.status(200).json({ success: true, data: { tasks: result.rows } });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};