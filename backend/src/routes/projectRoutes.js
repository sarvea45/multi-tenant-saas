const express = require('express');
const router = express.Router();
const { createProject, getProjects } = require('../controllers/projectController');
const { createTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes here are protected by JWT
router.use(protect);

// Project Endpoints
// URL: /api/projects
router.route('/')
  .get(getProjects)
  .post(createProject);

// Task Endpoints (Nested under projects)
// URL: /api/projects/:projectId/tasks
router.route('/:projectId/tasks')
  .post(createTask)
  .get(getTasks);

module.exports = router;