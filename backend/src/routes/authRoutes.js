const express = require('express');
const router = express.Router();
const { registerTenant, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register-tenant', registerTenant); // API 1
router.post('/login', login);                   // API 2
router.get('/me', protect, getMe);              // API 3
router.post('/logout', protect, logout);        // API 4

module.exports = router;