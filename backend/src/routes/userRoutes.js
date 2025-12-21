const express = require('express');
const router = express.Router();
const { addUser, getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes (Login required)
router.use(protect);

// Routes
router.route('/')
  .get(getUsers)   // List Users
  .post(addUser);  // Add User

router.route('/:userId')
  .put(updateUser)    // Update User
  .delete(deleteUser); // Delete User

module.exports = router;