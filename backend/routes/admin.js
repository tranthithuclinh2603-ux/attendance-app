const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const { getSchoolStats, getAllUsers, getUserStats, getUsageStats } = require('../controllers/adminController');

router.get('/stats', verifyAdmin, getSchoolStats);
router.get('/users', verifyAdmin, getAllUsers);
router.get('/user-stats', verifyAdmin, getUserStats);
router.get('/usage-stats', verifyAdmin, getUsageStats);

module.exports = router;
