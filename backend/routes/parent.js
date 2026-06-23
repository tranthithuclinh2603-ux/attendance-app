const express = require('express');
const router = express.Router();
const { verifyParent } = require('../middleware/auth');
const { getChildInfo, getChildAttendance } = require('../controllers/parentController');

router.get('/child', verifyParent, getChildInfo);
router.get('/child/attendance', verifyParent, getChildAttendance);

module.exports = router;
