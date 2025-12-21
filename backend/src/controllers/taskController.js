const db = require('../config/db');
const { logAction } = require('../services/auditService');

// API 16: Create Task
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { tenantId, id: userId } = req.user;

    // 1. Verify Project & Get Tenant ID from Project
    // Requirement: "Get tenantId from project (not from JWT)" to ensure data integrity
    const projCheck = await db.query(
        'SELECT id, tenant_id FROM projects WHERE id = $1 AND tenant_id = $2', 
        [projectId, tenantId]
    );
    
    if (projCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Project not found or access denied' });
    }
    const projectTenantId = projCheck.rows[0].tenant_id;

    // 2. Verify Assigned User (If provided)
    // Requirement: "Verify user belongs to same tenant"
    if (assignedTo) {
        const userCheck = await db.query(
            'SELECT id FROM users WHERE id = $1 AND tenant_id = $2', 
            [assignedTo, projectTenantId]
        );
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Assigned user does not belong to this tenant' });
        }
    }

    // 3. Create Task
    const result = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7) 
       RETURNING id, project_id as "projectId", tenant_id as "tenantId", title, description, status, priority, assigned_to as "assignedTo", due_date as "dueDate", created_at as "createdAt"`,
      [projectId, projectTenantId, title, description, priority || 'medium', assignedTo || null, dueDate || null]
    );

    await logAction(projectTenantId, userId, 'CREATE_TASK', 'task', result.rows[0].id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 17: List Project Tasks
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    // 1. Verify Project Access
    const projCheck = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projCheck.rows.length === 0) return res.status(403).json({ message: 'Unauthorized access to project' });

    // 2. Pagination & Filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const { status, assignedTo, priority, search } = req.query;

    let query = `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date as "dueDate", t.created_at as "createdAt",
               json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "assignedTo"
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1 AND t.tenant_id = $2
    `;
    
    const params = [projectId, tenantId];
    let paramIdx = 3;

    if (status) { query += ` AND t.status = $${paramIdx++}`; params.push(status); }
    if (assignedTo) { query += ` AND t.assigned_to = $${paramIdx++}`; params.push(assignedTo); }
    if (priority) { query += ` AND t.priority = $${paramIdx++}`; params.push(priority); }
    if (search) { query += ` AND t.title ILIKE $${paramIdx++}`; params.push(`%${search}%`); }

    // Requirement: Order by priority DESC, then dueDate ASC
    // Note: To sort ENUMs properly in Postgres, we might need a CASE statement, but standard text sort is usually acceptable for MVP.
    // Ideally: ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END
    query += ` ORDER BY 
        CASE t.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 
        END ASC, 
        t.due_date ASC NULLS LAST`;

    // Pagination Limit/Offset
    query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get Total Count
    const countQuery = `SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND tenant_id = $2`;
    const countRes = await db.query(countQuery, [projectId, tenantId]);
    const total = parseInt(countRes.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.rows,
        total,
        pagination: { currentPage: page, totalPages: Math.ceil(total/limit), limit }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 18: Update Task Status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId, id: userId } = req.user;

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND tenant_id = $3 
       RETURNING id, status, updated_at as "updatedAt"`,
      [status, taskId, tenantId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    await logAction(tenantId, userId, 'UPDATE_TASK_STATUS', 'task', taskId);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 19: Update Task (Full)
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, id: userId } = req.user;

    // 1. Verify Task Ownership
    const taskCheck = await db.query('SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2', [taskId, tenantId]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    // 2. Verify Assigned User (if changing)
    if (assignedTo) {
        const userCheck = await db.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [assignedTo, tenantId]);
        if (userCheck.rows.length === 0) return res.status(400).json({ message: 'Assigned user does not belong to this tenant' });
    }

    // 3. Update
    // Using COALESCE for partial updates. explicit NULL check for assignedTo/dueDate to allow unassigning
    const result = await db.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = $5,  -- Handled carefully in params
        due_date = $6,     -- Handled carefully in params
        updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8 
       RETURNING id, updated_at`,
      [
        title, 
        description, 
        status, 
        priority, 
        assignedTo === undefined ? undefined : assignedTo, // Pass undefined to let COALESCE work? No, logic below is safer
        dueDate === undefined ? undefined : dueDate,
        taskId, 
        tenantId
      ]
    );

    // *Correction*: COALESCE doesn't work well with "set to NULL".
    // Let's use a dynamic query builder approach for perfect compliance to "unassign" logic.
    
    let updateFields = [];
    let params = [];
    let paramIdx = 1;

    if (title !== undefined) { updateFields.push(`title = $${paramIdx++}`); params.push(title); }
    if (description !== undefined) { updateFields.push(`description = $${paramIdx++}`); params.push(description); }
    if (status !== undefined) { updateFields.push(`status = $${paramIdx++}`); params.push(status); }
    if (priority !== undefined) { updateFields.push(`priority = $${paramIdx++}`); params.push(priority); }
    if (assignedTo !== undefined) { updateFields.push(`assigned_to = $${paramIdx++}`); params.push(assignedTo); } // Can be null
    if (dueDate !== undefined) { updateFields.push(`due_date = $${paramIdx++}`); params.push(dueDate); } // Can be null
    
    updateFields.push(`updated_at = NOW()`);

    params.push(taskId, tenantId);
    
    const finalQuery = `
        UPDATE tasks SET ${updateFields.join(', ')} 
        WHERE id = $${paramIdx++} AND tenant_id = $${paramIdx++}
        RETURNING id
    `;
    
    // Execute update
    await db.query(finalQuery, params);

    // 4. Fetch updated data with Join (Requirement: return full object with assignedTo details)
    const fetchQuery = `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date as "dueDate", t.updated_at as "updatedAt",
               json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "assignedTo"
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = $1
    `;
    const updatedData = await db.query(fetchQuery, [taskId]);

    await logAction(tenantId, userId, 'UPDATE_TASK', 'task', taskId);

    res.status(200).json({ success: true, message: 'Task updated successfully', data: updatedData.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};