const { db } = require('../models/firebase');
const XLSX = require('xlsx');

function toVN(date) { return new Date(date.getTime() + 7 * 3600 * 1000); }
function vnDateKey(date) { return toVN(date).toISOString().split('T')[0]; }
function vnTimeStr(date) {
  const vn = toVN(date);
  return `${String(vn.getUTCHours()).padStart(2,'0')}:${String(vn.getUTCMinutes()).padStart(2,'0')}`;
}

function getAttendanceStatus(timestamp, sessionStartTime, lateAfterMinutes = 15) {
  if (!timestamp) return 'absent';
  const vn = toVN(new Date(timestamp));
  const checkinMinutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  const [sh, sm] = sessionStartTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  return checkinMinutes <= startMinutes + lateAfterMinutes ? 'present' : 'late';
}

// Tạo/mở phiên điểm danh (giảng viên)
const openSession = async (req, res) => {
  try {
    const { uid, name } = req.user;
    const { classId, subject, period, startTime, endTime, lateAfterMinutes, openedBy } = req.body;

    if (!classId || !subject || !startTime) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin phiên học' });
    }

    const now = new Date();
    const date = vnDateKey(now);

    // Kiểm tra đã có phiên mở cho lớp + ca này chưa
    const existingSnap = await db.ref('sessions')
      .orderByChild('classId').equalTo(classId).once('value');
    let duplicate = false;
    existingSnap.forEach((c) => {
      const s = c.val();
      if (s.date === date && s.period === period && s.status === 'open') duplicate = true;
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Đã có phiên điểm danh đang mở cho ca này' });
    }

    const sessionId = `session_${classId}_${date}_${period || Date.now()}`;
    const session = {
      sessionId,
      classId,
      subject,
      teacherId: uid,
      teacherName: name,
      date,
      period: period || null,
      startTime: startTime || '07:00',
      endTime: endTime || '09:30',
      lateAfterMinutes: lateAfterMinutes || 15,
      openedAt: now.toISOString(),
      closedAt: null,
      status: 'open',
      openedBy: openedBy || 'manual',
    };

    await db.ref(`sessions/${sessionId}`).set(session);
    res.json({ success: true, message: 'Đã mở phiên điểm danh', session });
  } catch (err) {
    console.error('openSession error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Đóng phiên (giảng viên)
const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const snap = await db.ref(`sessions/${sessionId}`).once('value');
    if (!snap.exists()) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên' });

    const now = new Date();
    await db.ref(`sessions/${sessionId}`).update({ status: 'closed', closedAt: now.toISOString() });

    // Đánh "vắng" tất cả sinh viên chưa điểm danh
    const session = snap.val();
    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(session.classId).once('value');
    const attendanceSnap = await db.ref(`sessionAttendance/${sessionId}`).once('value');
    const attended = attendanceSnap.val() || {};
    const updates = {};
    studentsSnap.forEach((c) => {
      const s = c.val();
      if (s.role !== 'student') return;
      if (!attended[c.key]) {
        updates[`${c.key}/status`] = 'absent';
        updates[`${c.key}/name`] = s.name;
      }
    });
    if (Object.keys(updates).length) {
      await db.ref(`sessionAttendance/${sessionId}`).update(updates);
    }

    res.json({ success: true, message: 'Đã đóng phiên điểm danh' });
  } catch (err) {
    console.error('closeSession error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy phiên đang mở của lớp (sinh viên dùng để biết có thể điểm danh không)
const getActiveSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    const today = vnDateKey(new Date());

    const snap = await db.ref('sessions').orderByChild('classId').equalTo(classId).once('value');
    const sessions = [];
    snap.forEach((c) => {
      const s = c.val();
      if (s.date === today && s.status === 'open') sessions.push(s);
    });

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy tất cả phiên hôm nay của lớp (giảng viên)
const getSessionsToday = async (req, res) => {
  try {
    const { classId } = req.params;
    const today = vnDateKey(new Date());

    const snap = await db.ref('sessions').orderByChild('classId').equalTo(classId).once('value');
    const sessions = [];
    snap.forEach((c) => {
      const s = c.val();
      if (s.date === today) sessions.push(s);
    });
    sessions.sort((a, b) => (a.period || 0) - (b.period || 0));

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Điểm danh vào phiên (sinh viên)
const checkinSession = async (req, res) => {
  try {
    const { uid, name } = req.user;
    const { sessionId } = req.params;
    const { imageBase64, gpsLat, gpsLng } = req.body;

    const sessionSnap = await db.ref(`sessions/${sessionId}`).once('value');
    if (!sessionSnap.exists()) {
      return res.status(404).json({ success: false, message: 'Phiên không tồn tại' });
    }
    const session = sessionSnap.val();
    if (session.status !== 'open') {
      return res.status(410).json({ success: false, message: 'Phiên điểm danh đã đóng' });
    }

    const existing = await db.ref(`sessionAttendance/${sessionId}/${uid}`).once('value');
    if (existing.exists() && existing.val().status !== 'absent') {
      return res.status(409).json({ success: false, message: 'Bạn đã điểm danh phiên này rồi' });
    }

    const now = new Date();
    const status = getAttendanceStatus(now.toISOString(), session.startTime, session.lateAfterMinutes);
    const timeStr = vnTimeStr(now);

    const record = { timestamp: now.toISOString(), status, name };
    if (gpsLat) record.gpsLat = gpsLat;
    if (gpsLng) record.gpsLng = gpsLng;
    if (imageBase64) record.hasImage = true;

    await db.ref(`sessionAttendance/${sessionId}/${uid}`).set(record);

    const statusMsg = status === 'present' ? 'Có mặt' : 'Muộn';
    res.json({
      success: true,
      status,
      message: `Điểm danh thành công lúc ${timeStr} - ${statusMsg}`,
    });
  } catch (err) {
    console.error('checkinSession error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy danh sách điểm danh của phiên (giảng viên)
const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionSnap = await db.ref(`sessions/${sessionId}`).once('value');
    if (!sessionSnap.exists()) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên' });
    const session = sessionSnap.val();

    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(session.classId).once('value');
    const attendanceSnap = await db.ref(`sessionAttendance/${sessionId}`).once('value');
    const attendanceData = attendanceSnap.val() || {};

    const result = [];
    studentsSnap.forEach((c) => {
      const s = c.val();
      if (s.role !== 'student') return;
      const record = attendanceData[c.key];
      result.push({
        uid: c.key,
        studentId: s.mssv,
        name: s.name,
        status: record?.status || 'absent',
        time: record?.timestamp ? vnTimeStr(new Date(record.timestamp)) : '-',
      });
    });
    result.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));

    res.json({ success: true, session, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật điểm danh trong phiên (giảng viên)
const updateSessionAttendance = async (req, res) => {
  try {
    const { sessionId, uid } = req.params;
    const { status } = req.body;
    const valid = ['present', 'late', 'absent'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });

    await db.ref(`sessionAttendance/${sessionId}/${uid}/status`).set(status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lịch sử phiên (giảng viên) — theo khoảng ngày
const getSessionHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const { from, to } = req.query;
    const fromDate = from || vnDateKey(new Date(Date.now() - 30 * 86400000));
    const toDate = to || vnDateKey(new Date());

    const snap = await db.ref('sessions').orderByChild('classId').equalTo(classId).once('value');
    const sessions = [];
    snap.forEach((c) => {
      const s = c.val();
      if (s.date >= fromDate && s.date <= toDate) sessions.push(s);
    });
    sessions.sort((a, b) => b.date.localeCompare(a.date) || (a.period || 0) - (b.period || 0));

    // Đếm điểm danh mỗi phiên
    const result = await Promise.all(sessions.map(async (s) => {
      const attSnap = await db.ref(`sessionAttendance/${s.sessionId}`).once('value');
      const att = attSnap.val() || {};
      const present = Object.values(att).filter(r => r.status === 'present').length;
      const late = Object.values(att).filter(r => r.status === 'late').length;
      const absent = Object.values(att).filter(r => r.status === 'absent').length;
      return { ...s, present, late, absent, total: present + late + absent };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Export Excel — ma trận sinh viên x phiên
const exportExcel = async (req, res) => {
  try {
    const { classId } = req.params;
    const { from, to } = req.query;
    const fromDate = from || vnDateKey(new Date(Date.now() - 30 * 86400000));
    const toDate = to || vnDateKey(new Date());

    // Lấy phiên trong khoảng ngày
    const sessionsSnap = await db.ref('sessions').orderByChild('classId').equalTo(classId).once('value');
    const sessions = [];
    sessionsSnap.forEach((c) => {
      const s = c.val();
      if (s.date >= fromDate && s.date <= toDate) sessions.push(s);
    });
    sessions.sort((a, b) => a.date.localeCompare(b.date) || (a.period || 0) - (b.period || 0));

    // Lấy sinh viên
    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(classId).once('value');
    const students = [];
    studentsSnap.forEach((c) => {
      const s = c.val();
      if (s.role === 'student') students.push({ uid: c.key, name: s.name, mssv: s.mssv });
    });
    students.sort((a, b) => (a.mssv || '').localeCompare(b.mssv || ''));

    // Lấy điểm danh tất cả phiên
    const allAtt = {};
    await Promise.all(sessions.map(async (s) => {
      const snap = await db.ref(`sessionAttendance/${s.sessionId}`).once('value');
      allAtt[s.sessionId] = snap.val() || {};
    }));

    // Build header
    const statusLabel = { present: 'Có mặt', late: 'Muộn', absent: 'Vắng' };
    const headers = ['MSSV', 'Họ tên', ...sessions.map(s => `${s.date}\n${s.subject}\nCa ${s.period || '-'}`), 'Tổng có mặt', 'Tổng muộn', 'Tổng vắng'];

    const rows = students.map((st) => {
      let totalPresent = 0, totalLate = 0, totalAbsent = 0;
      const statusCells = sessions.map((s) => {
        const rec = allAtt[s.sessionId][st.uid];
        const status = rec?.status || 'absent';
        if (status === 'present') totalPresent++;
        else if (status === 'late') totalLate++;
        else totalAbsent++;
        return statusLabel[status];
      });
      return [st.mssv || '', st.name, ...statusCells, totalPresent, totalLate, totalAbsent];
    });

    const wsData = [headers, ...rows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [{ wch: 12 }, { wch: 25 }, ...sessions.map(() => ({ wch: 16 })), { wch: 12 }, { wch: 10 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, `Điểm danh ${classId}`);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="diemdanh_${classId}_${fromDate}_${toDate}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('exportExcel error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xuất Excel' });
  }
};

// Sinh viên gửi vị trí định kỳ trong phiên
const updateLocation = async (req, res) => {
  try {
    const { uid, name } = req.user;
    const { sessionId } = req.params;
    const { lat, lng, accuracy } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Thiếu tọa độ' });

    const sessionSnap = await db.ref(`sessions/${sessionId}`).once('value');
    if (!sessionSnap.exists() || sessionSnap.val().status !== 'open') {
      return res.status(410).json({ success: false, message: 'Phiên đã đóng' });
    }

    // Tính khoảng cách tới trường (Haversine)
    const SCHOOL = { lat: 10.813308852984058, lng: 106.77209163591941 };
    const R = 6371000;
    const dLat = (lat - SCHOOL.lat) * Math.PI / 180;
    const dLng = (lng - SCHOOL.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(SCHOOL.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
    const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    const inZone = distance <= 300; // 300m tolerance cho tracking

    await db.ref(`sessionLocations/${sessionId}/${uid}`).set({
      name, lat, lng, accuracy: accuracy || null,
      distance, inZone,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, distance, inZone });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Giảng viên lấy vị trí realtime tất cả sinh viên trong phiên
const getSessionLocations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const snap = await db.ref(`sessionLocations/${sessionId}`).once('value');
    const locations = snap.val() || {};
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { openSession, closeSession, getActiveSessions, getSessionsToday, checkinSession, getSessionAttendance, updateSessionAttendance, getSessionHistory, exportExcel, updateLocation, getSessionLocations };
