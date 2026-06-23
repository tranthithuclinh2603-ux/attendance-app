const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const {
  checkin,
  getHistory,
  getClassAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');

router.post('/checkin', verifyToken, checkin);
router.get('/history', verifyToken, getHistory);
router.get('/class/:classId', verifyTeacher, getClassAttendance);
router.put('/:attendanceId', verifyTeacher, updateAttendance);
router.delete('/:attendanceId', verifyTeacher, deleteAttendance);

module.exports = router;
