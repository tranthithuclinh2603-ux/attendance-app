const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const {
  checkin, getHistory, getClassAttendance, updateAttendance, deleteAttendance,
  getLeaderboard, getAbsenceAlerts, manualCheckin, qrCheckin, getWeeklyStats, getRangeReport,
} = require('../controllers/attendanceController');

router.post('/checkin', verifyToken, checkin);
router.post('/qr-checkin', verifyToken, qrCheckin);
router.post('/manual', verifyTeacher, manualCheckin);
router.get('/history', verifyToken, getHistory);
router.get('/leaderboard/:classId', verifyToken, getLeaderboard);
router.get('/class/:classId', verifyTeacher, getClassAttendance);
router.get('/alerts/:classId', verifyTeacher, getAbsenceAlerts);
router.get('/weekly/:classId', verifyTeacher, getWeeklyStats);
router.get('/report/:classId', verifyTeacher, getRangeReport);
router.put('/:attendanceId', verifyTeacher, updateAttendance);
router.delete('/:attendanceId', verifyTeacher, deleteAttendance);

module.exports = router;
