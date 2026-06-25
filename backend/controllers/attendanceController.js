const { db } = require('../models/firebase');

// Vietnam = UTC+7
function toVN(date) {
  return new Date(date.getTime() + 7 * 3600 * 1000);
}
function vnDateKey(date) {
  return toVN(date).toISOString().split('T')[0]; // YYYY-MM-DD theo giờ VN
}
function vnTimeStr(date) {
  const vn = toVN(date);
  return `${String(vn.getUTCHours()).padStart(2,'0')}:${String(vn.getUTCMinutes()).padStart(2,'0')}`;
}

// Giờ bắt đầu & muộn tính theo phút từ 00:00 (giờ VN)
const CLASS_START_MINUTES = 8 * 60 + 45; // 8:45
const LATE_THRESHOLD_MINUTES = 15; // muộn sau 15 phút

const getStatus = (timestamp) => {
  if (!timestamp) return 'absent';
  const vn = toVN(new Date(timestamp));
  const totalMinutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  if (totalMinutes <= CLASS_START_MINUTES + LATE_THRESHOLD_MINUTES) return 'present';
  return 'late';
};

const checkin = async (req, res) => {
  try {
    const { classId, imageBase64, gpsLat, gpsLng, timestamp } = req.body;
    const { uid, name } = req.user;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId là bắt buộc' });
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const dateKey = vnDateKey(now); // ngày theo giờ VN
    const attendanceKey = `${classId}_${dateKey}`;

    // Check if already checked in
    const existing = await db.ref(`attendance/${attendanceKey}/${uid}`).once('value');
    if (existing.exists() && existing.val().status !== 'absent') {
      return res.status(409).json({ success: false, message: 'Bạn đã điểm danh rồi' });
    }

    const status = getStatus(now.toISOString());
    const timeStr = vnTimeStr(now); // giờ:phút theo giờ VN

    const record = {
      timestamp: now.toISOString(),
      status,
      name,
    };

    if (gpsLat) record.gpsLat = gpsLat;
    if (gpsLng) record.gpsLng = gpsLng;
    if (imageBase64) record.hasImage = true;

    await db.ref(`attendance/${attendanceKey}/${uid}`).set(record);

    const statusMsg = status === 'present' ? 'Có mặt' : 'Muộn';
    res.json({
      success: true,
      status,
      message: `Điểm danh thành công lúc ${timeStr} - ${statusMsg}`,
      attendanceId: `${attendanceKey}_${uid}`,
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi điểm danh' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { uid } = req.user;
    const { classId, date } = req.query;

    const snapshot = await db.ref('attendance').once('value');
    const allAttendance = snapshot.val() || {};
    const history = [];

    for (const [key, records] of Object.entries(allAttendance)) {
      const [keyClass, keyDate] = key.split('_');
      if (classId && keyClass !== classId) continue;
      if (date && keyDate !== date) continue;

      const record = records[uid];
      if (record) {
        history.push({
          date: keyDate,
          time: record.timestamp
            ? vnTimeStr(new Date(record.timestamp))
            : '-',
          classId: keyClass,
          status: record.status,
        });
      }
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử' });
  }
};

const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const dateKey = date || vnDateKey(new Date());
    const attendanceKey = `${classId}_${dateKey}`;

    // Get all students in class
    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(classId).once('value');
    const attendanceSnap = await db.ref(`attendance/${attendanceKey}`).once('value');

    const attendanceData = attendanceSnap.val() || {};
    const result = [];

    studentsSnap.forEach((child) => {
      const uid = child.key;
      const student = child.val();
      if (student.role !== 'student') return;

      const record = attendanceData[uid];
      result.push({
        uid,
        studentId: student.mssv,
        name: student.name,
        status: record?.status || 'absent',
        time: record?.timestamp
          ? vnTimeStr(new Date(record.timestamp))
          : '-',
        attendanceId: `${attendanceKey}_${uid}`,
      });
    });

    result.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    const validStatuses = ['present', 'late', 'absent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // attendanceId format: ATTT1_2026-06-23_uid_xxx
    const parts = attendanceId.split('_');
    const uid = parts.slice(2).join('_');
    const attendanceKey = `${parts[0]}_${parts[1]}`;

    await db.ref(`attendance/${attendanceKey}/${uid}/status`).set(status);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const parts = attendanceId.split('_');
    const uid = parts.slice(2).join('_');
    const attendanceKey = `${parts[0]}_${parts[1]}`;

    await db.ref(`attendance/${attendanceKey}/${uid}`).remove();
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(classId).once('value');
    const studentStats = {};
    studentsSnap.forEach((child) => {
      const uid = child.key;
      const student = child.val();
      if (student.role !== 'student') return;
      studentStats[uid] = { name: student.name, mssv: student.mssv, present: 0, total: 0 };
    });

    for (const date of dates) {
      const snap = await db.ref(`attendance/${classId}_${date}`).once('value');
      const data = snap.val() || {};
      for (const uid of Object.keys(studentStats)) {
        studentStats[uid].total++;
        const record = data[uid];
        if (record && (record.status === 'present' || record.status === 'late')) {
          studentStats[uid].present++;
        }
      }
    }

    const ranking = Object.values(studentStats)
      .map((s) => ({ ...s, rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate || b.present - a.present)
      .slice(0, 10);

    res.json({ success: true, data: ranking, period: `${dates[0]} → ${dates[6]}` });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const getAbsenceAlerts = async (req, res) => {
  try {
    const { classId } = req.params;
    const today = new Date();
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const studentsSnap = await db.ref('users').orderByChild('classId').equalTo(classId).once('value');
    const studentAttendance = {};
    studentsSnap.forEach((child) => {
      const uid = child.key;
      const student = child.val();
      if (student.role !== 'student') return;
      studentAttendance[uid] = { name: student.name, mssv: student.mssv, records: [] };
    });

    for (const date of dates) {
      const snap = await db.ref(`attendance/${classId}_${date}`).once('value');
      const data = snap.val() || {};
      for (const uid of Object.keys(studentAttendance)) {
        const record = data[uid];
        studentAttendance[uid].records.push({ date, status: record?.status || 'absent' });
      }
    }

    const alerts = [];
    for (const [uid, student] of Object.entries(studentAttendance)) {
      let consecutive = 0;
      for (let i = student.records.length - 1; i >= 0; i--) {
        if (student.records[i].status === 'absent') consecutive++;
        else break;
      }
      if (consecutive >= 2) {
        alerts.push({ uid, name: student.name, mssv: student.mssv, consecutiveAbsent: consecutive });
      }
    }

    alerts.sort((a, b) => b.consecutiveAbsent - a.consecutiveAbsent);
    res.json({ success: true, data: alerts });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const manualCheckin = async (req, res) => {
  try {
    const { classId, studentUid, status, date } = req.body;
    if (!classId || !studentUid || !status) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }

    const validStatuses = ['present', 'late', 'absent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const dateKey = date || vnDateKey(new Date());
    const attendanceKey = `${classId}_${dateKey}`;

    const studentSnap = await db.ref(`users/${studentUid}`).once('value');
    if (!studentSnap.exists()) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
    }
    const student = studentSnap.val();

    const record = {
      timestamp: new Date(`${dateKey}T08:45:00`).toISOString(),
      status,
      name: student.name,
      manualEntry: true,
    };

    await db.ref(`attendance/${attendanceKey}/${studentUid}`).set(record);
    res.json({ success: true, message: `Đã thêm điểm danh cho ${student.name}` });
  } catch (error) {
    console.error('Manual checkin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const qrCheckin = async (req, res) => {
  try {
    const { classId, date } = req.body;
    const { uid, name } = req.user;
    if (!classId) return res.status(400).json({ success: false, message: 'classId là bắt buộc' });

    const dateKey = date || vnDateKey(new Date());
    const attendanceKey = `${classId}_${dateKey}`;

    const existing = await db.ref(`attendance/${attendanceKey}/${uid}`).once('value');
    if (existing.exists() && existing.val().status !== 'absent') {
      return res.status(409).json({ success: false, message: 'Bạn đã điểm danh rồi' });
    }

    const now = new Date();
    const status = getStatus(now.toISOString());
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    await db.ref(`attendance/${attendanceKey}/${uid}`).set({
      timestamp: now.toISOString(), status, name, method: 'qr',
    });

    res.json({ success: true, status, message: `Điểm danh QR thành công lúc ${timeStr} — ${status === 'present' ? 'Có mặt' : 'Muộn'}` });
  } catch (err) {
    console.error('QR checkin error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { checkin, getHistory, getClassAttendance, updateAttendance, deleteAttendance, getLeaderboard, getAbsenceAlerts, manualCheckin, qrCheckin };
