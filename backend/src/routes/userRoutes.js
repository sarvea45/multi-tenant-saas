const express = require('express');
const router = express.Router();
const { updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Direct User operations
router.put('/:userId', updateUser);    // API 10
router.delete('/:userId', deleteUser); // API 11

module.exports = router;