const express = require('express');

// 1. Router for Independent Task operations (e.g., /api/tasks/:id)
const router = express.Router(); 

// 2. Router for Project-Nested operations (e.g., /api/projects/:projectId/tasks)
// mergeParams: true is CRITICAL to access :projectId from the parent router
const projectRouter = express.Router({ mergeParams: true }); 

const { 
  createTask, 
  getTasks, 
  updateTask, 
  updateTaskStatus 
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Apply Auth Middleware
router.use(protect);
projectRouter.use(protect);

// --- Nested Routes (Accessed via /api/projects/:projectId/tasks) ---
projectRouter.post('/', createTask); // API 16
projectRouter.get('/', getTasks);    // API 17

// --- Independent Routes (Accessed via /api/tasks) ---
router.patch('/:taskId/status', updateTaskStatus); // API 18
router.put('/:taskId', updateTask);                // API 19

// Export both routers
module.exports = { router, projectRouter };