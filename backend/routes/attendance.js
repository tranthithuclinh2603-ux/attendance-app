const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const {
  checkin,
  getHistory,
  getClassAttendance,
  updateAttendance,
  deleteAttendance,
  getLeaderboard,
  getAbsenceAlerts,
  manualCheckin,
} = require('../controllers/attendanceController');

router.post('/checkin', verifyToken, checkin);
router.post('/manual', verifyTeacher, manualCheckin);
router.get('/history', verifyToken, getHistory);
router.get('/leaderboard/:classId', verifyToken, getLeaderboard);
router.get('/class/:classId', verifyTeacher, getClassAttendance);
router.get('/alerts/:classId', verifyTeacher, getAbsenceAlerts);
router.put('/:attendanceId', verifyTeacher, updateAttendance);
router.delete('/:attendanceId', verifyTeacher, deleteAttendance);

module.exports = router;
