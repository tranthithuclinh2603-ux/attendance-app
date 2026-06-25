const { db } = require('../models/firebase');

// Lưu thời khóa biểu của lớp (giảng viên)
const saveTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const { uid } = req.user;
    const { entries } = req.body;
    // entries: [{ dayOfWeek, period, subject, startTime, endTime, lateAfterMinutes }]

    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'entries phải là mảng' });
    }

    const data = {};
    entries.forEach((e) => {
      const key = `${e.dayOfWeek}_${e.period}`;
      data[key] = {
        dayOfWeek: e.dayOfWeek,   // 1=Thứ 2 ... 7=Chủ nhật
        period: e.period,          // 1-5
        subject: e.subject || '',
        startTime: e.startTime || '07:00',
        endTime: e.endTime || '09:30',
        lateAfterMinutes: e.lateAfterMinutes || 15,
        teacherId: uid,
        classId,
      };
    });

    await db.ref(`timetable/${classId}`).set(data);
    res.json({ success: true, message: 'Đã lưu thời khóa biểu' });
  } catch (err) {
    console.error('saveTimetable error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy thời khóa biểu của lớp
const getTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const snap = await db.ref(`timetable/${classId}`).once('value');
    const data = snap.val() || {};
    res.json({ success: true, timetable: Object.values(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Tự động mở phiên theo TKB hôm nay (giảng viên nhấn 1 nút)
const autoOpenFromTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const { uid, name } = req.user;

    const snap = await db.ref(`timetable/${classId}`).once('value');
    if (!snap.exists()) {
      return res.status(404).json({ success: false, message: 'Chưa có thời khóa biểu cho lớp này' });
    }

    // Thứ hôm nay theo giờ VN (1=Thứ 2, 7=Chủ nhật)
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
    // App dùng 2=Thứ2(Mon)...7=Thứ7(Sat). getUTCDay(): 0=Sun,1=Mon,...,6=Sat
    const rawDay = vnNow.getUTCDay();
    const dayOfWeek = rawDay === 0 ? null : rawDay + 1; // Mon→2, Tue→3,...,Sat→7, Sun→null
    const date = vnNow.toISOString().split('T')[0];

    const timetable = snap.val();
    const todayEntries = Object.values(timetable).filter(e => e.dayOfWeek === dayOfWeek);

    if (!dayOfWeek || todayEntries.length === 0) {
      return res.status(404).json({ success: false, message: 'Không có ca học nào hôm nay theo TKB' });
    }

    // Kiểm tra phiên đã mở chưa
    const existingSnap = await db.ref('sessions').orderByChild('classId').equalTo(classId).once('value');
    const existingToday = {};
    existingSnap.forEach((c) => {
      const s = c.val();
      if (s.date === date) existingToday[s.period] = true;
    });

    const opened = [];
    const skipped = [];

    for (const entry of todayEntries) {
      if (existingToday[entry.period]) {
        skipped.push(entry.period);
        continue;
      }
      const sessionId = `session_${classId}_${date}_${entry.period}`;
      await db.ref(`sessions/${sessionId}`).set({
        sessionId,
        classId,
        subject: entry.subject,
        teacherId: uid,
        teacherName: name,
        date,
        period: entry.period,
        startTime: entry.startTime,
        endTime: entry.endTime,
        lateAfterMinutes: entry.lateAfterMinutes || 15,
        openedAt: now.toISOString(),
        closedAt: null,
        status: 'open',
        openedBy: 'auto',
      });
      opened.push(entry.period);
    }

    const msg = opened.length
      ? `Đã mở ${opened.length} phiên tự động (ca ${opened.join(', ')})` + (skipped.length ? `. Bỏ qua ca đã mở: ${skipped.join(', ')}` : '')
      : `Tất cả phiên hôm nay đã được mở rồi`;

    res.json({ success: true, message: msg, opened, skipped });
  } catch (err) {
    console.error('autoOpenFromTimetable error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { saveTimetable, getTimetable, autoOpenFromTimetable };
