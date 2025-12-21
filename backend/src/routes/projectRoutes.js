const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { validateProject } = require('../middleware/validationMiddleware');
// ...
router.route('/').post(validateProject, createProject);
router.use(protect);

router.route('/')
  .get(getProjects)     // API 13
  .post(createProject); // API 12

router.route('/:projectId')
  .put(updateProject)   // API 14
  .delete(deleteProject); // API 15

module.exports = router;