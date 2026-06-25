const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const {
  openSession, closeSession, getActiveSessions, getSessionsToday,
  checkinSession, getSessionAttendance, updateSessionAttendance,
  getSessionHistory, exportExcel,
} = require('../controllers/sessionController');

router.post('/', verifyTeacher, openSession);
router.put('/:sessionId/close', verifyTeacher, closeSession);
router.get('/active/:classId', verifyToken, getActiveSessions);
router.get('/today/:classId', verifyTeacher, getSessionsToday);
router.get('/history/:classId', verifyTeacher, getSessionHistory);
router.get('/export/:classId', verifyTeacher, exportExcel);
router.get('/:sessionId/attendance', verifyTeacher, getSessionAttendance);
router.put('/:sessionId/attendance/:uid', verifyTeacher, updateSessionAttendance);
router.post('/:sessionId/checkin', verifyToken, checkinSession);

module.exports = router;
