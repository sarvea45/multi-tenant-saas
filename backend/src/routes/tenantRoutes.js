const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, getAllTenants } = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllTenants);         // API 7
router.get('/:tenantId', getTenant);    // API 5
router.put('/:tenantId', updateTenant); // API 6

module.exports = router;
