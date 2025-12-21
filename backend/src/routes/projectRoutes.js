const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  updateProject, 
  deleteProject 
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { validateProject } = require('../middleware/validationMiddleware');

// 1. Apply Authentication to ALL routes in this file
// This MUST come before any route definitions
router.use(protect);

// 2. Root Routes (/api/projects)
router.route('/')
  .post(validateProject, createProject) // API 12: Create (Protected + Validated)
  .get(getProjects);                    // API 13: List (Protected)

// 3. Specific Project Routes (/api/projects/:projectId)
router.route('/:projectId')
  .put(updateProject)    // API 14: Update
  .delete(deleteProject); // API 15: Delete

module.exports = router;