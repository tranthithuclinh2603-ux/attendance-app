const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const { getSchoolStats, getAllUsers, getUserStats } = require('../controllers/adminController');

router.get('/stats', verifyAdmin, getSchoolStats);
router.get('/users', verifyAdmin, getAllUsers);
router.get('/user-stats', verifyAdmin, getUserStats);

module.exports = router;
