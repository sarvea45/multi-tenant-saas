const db = require('../config/db');
const { logAction } = require('../services/auditService');

// API 16: Create Task
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, id: userId } = req.user;

    // Verify Project Ownership
    const projCheck = await db.query('SELECT id FROM projects WHERE id=$1 AND tenant_id=$2', [projectId, tenantId]);
    if (projCheck.rows.length === 0) return res.status(403).json({ message: 'Project not found/Unauthorized' });

    const result = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [projectId, tenantId, title, status||'todo', priority||'medium', assignedTo, dueDate]
    );
    
    await logAction(tenantId, userId, 'CREATE_TASK', 'task', result.rows[0].id);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// API 17: List Project Tasks
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;
    
    const projCheck = await db.query('SELECT id FROM projects WHERE id=$1 AND tenant_id=$2', [projectId, tenantId]);
    if (projCheck.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

    const result = await db.query('SELECT * FROM tasks WHERE project_id=$1 ORDER BY created_at DESC', [projectId]);
    res.status(200).json({ success: true, data: { tasks: result.rows } });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// API 18: Update Task Status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId, id: userId } = req.user;

    const result = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, taskId, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    
    await logAction(tenantId, userId, 'UPDATE_TASK_STATUS', 'task', taskId);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// API 19: Update Task (Full)
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, id: userId } = req.user;

    const result = await db.query(
      `UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), 
       status=COALESCE($3,status), priority=COALESCE($4,priority), 
       assigned_to=COALESCE($5,assigned_to), due_date=COALESCE($6,due_date)
       WHERE id = $7 AND tenant_id = $8 RETURNING *`,
      [title, description, status, priority, assignedTo, dueDate, taskId, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    
    await logAction(tenantId, userId, 'UPDATE_TASK', 'task', taskId);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};