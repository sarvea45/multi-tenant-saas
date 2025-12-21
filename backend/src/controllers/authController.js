const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  try {
    // 1. Find User & Verify Tenant
    const query = `
      SELECT u.*, t.subdomain 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1`;
    
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 2. Check Subdomain (Skip check for super_admin)
    if (user.role !== 'super_admin') {
       if (user.subdomain !== tenantSubdomain) {
         return res.status(404).json({ success: false, message: 'User not found in this tenant' });
       }
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};