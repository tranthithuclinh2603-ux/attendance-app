const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const { getSchoolStats, getAllUsers } = require('../controllers/adminController');

router.get('/stats', verifyAdmin, getSchoolStats);
router.get('/users', verifyAdmin, getAllUsers);

module.exports = router;
