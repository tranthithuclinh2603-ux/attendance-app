const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const { submitLeave, getLeaves, getMyLeaves, reviewLeave } = require('../controllers/leaveController');

router.post('/', verifyToken, submitLeave);
router.get('/my', verifyToken, getMyLeaves);
router.get('/class/:classId', verifyTeacher, getLeaves);
router.put('/:leaveId/review', verifyTeacher, reviewLeave);

module.exports = router;
