const db = require('../config/db');

exports.logAction = async (tenantId, userId, action, entityType, entityId) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, userId, action, entityType, entityId]
    );
  } catch (error) {
    console.error('Audit Log Error:', error);
    // Don't block the main response if logging fails
  }
};