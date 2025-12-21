const express = require('express');
const router = express.Router();
const { updateTaskStatus, updateTask, createTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// These routes match /api/projects/:projectId/tasks (We need to merge params)
const projectRouter = express.Router({ mergeParams: true });
projectRouter.route('/')
  .post(createTask)  // API 16
  .get(getTasks);    // API 17

// These routes match /api/tasks/:taskId
router.patch('/:taskId/status', updateTaskStatus); // API 18
router.put('/:taskId', updateTask);               // API 19

module.exports = { router, projectRouter };