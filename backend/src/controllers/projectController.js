const db = require('../config/db');

exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    // SECURITY: Get tenantId from the verified token, not the request body
    const { tenantId, id: userId } = req.user; 

    const result = await db.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, description, status || 'active', userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // SECURITY: Filter by tenant_id to ensure Data Isolation
    const result = await db.query(
      `SELECT p.*, u.full_name as creator_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.tenant_id = $1 
       ORDER BY p.created_at DESC`,
      [tenantId]
    );

    res.status(200).json({ success: true, data: { projects: result.rows } });
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};