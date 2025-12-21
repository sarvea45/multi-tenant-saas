const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
// Note: We import two routers from taskRoutes for Nested vs Independent logic
const { router: taskRoutes, projectRouter: projectTaskRoutes } = require('./routes/taskRoutes');

dotenv.config();
const app = express();

// 1. Strict CORS (Required for Step 5.1 compliance)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// 2. Health Check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) { res.status(500).json({ status: 'error' }); }
});

// 3. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);

// Project Routes
app.use('/api/projects', projectRoutes);

// Nested Task Routes (Creation & Listing)
// Matches: POST /api/projects/:projectId/tasks
app.use('/api/projects/:projectId/tasks', projectTaskRoutes);

// Independent Task Routes (Updates & Status)
// Matches: PUT /api/tasks/:taskId
app.use('/api/tasks', taskRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));