const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, getAllTenants } = require('../controllers/tenantController');
const { addUser, getUsers } = require('../controllers/userController'); // Import User logic here
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Tenant Management
router.get('/', getAllTenants);         // API 7
router.get('/:tenantId', getTenant);    // API 5
router.put('/:tenantId', updateTenant); // API 6

// User Management (Nested under Tenants)
// Matches: POST /api/tenants/:tenantId/users (API 8)
router.post('/:tenantId/users', addUser); 
// Matches: GET /api/tenants/:tenantId/users (API 9)
router.get('/:tenantId/users', getUsers); 

module.exports = router;