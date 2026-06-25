const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const { saveTimetable, getTimetable, autoOpenFromTimetable } = require('../controllers/timetableController');

router.post('/:classId', verifyTeacher, saveTimetable);
router.get('/:classId', verifyToken, getTimetable);
router.post('/:classId/auto-open', verifyTeacher, autoOpenFromTimetable);

module.exports = router;
