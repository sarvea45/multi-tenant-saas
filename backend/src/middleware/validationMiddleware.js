exports.validateRegister = (req, res, next) => {
  const { tenantName, subdomain, adminEmail, adminPassword } = req.body;
  if (!tenantName || !subdomain || !adminEmail || !adminPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (adminPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password, tenantSubdomain } = req.body;
  // Super admin doesn't need subdomain, so we check loosely
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  next();
};

exports.validateProject = (req, res, next) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: 'Project name is required' });
  }
  next();
};