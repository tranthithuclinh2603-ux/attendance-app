const { db } = require('../models/firebase');

// Giờ bắt đầu & muộn tính theo phút từ 00:00
const CLASS_START_MINUTES = 8 * 60 + 45; // 8:45
const LATE_THRESHOLD_MINUTES = 15; // muộn sau 15 phút

const getStatus = (timestamp) => {
  if (!timestamp) return 'absent';
  const date = new Date(timestamp);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
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
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const attendanceKey = `${classId}_${dateKey}`;

    // Check if already checked in
    const existing = await db.ref(`attendance/${attendanceKey}/${uid}`).once('value');
    if (existing.exists() && existing.val().status !== 'absent') {
      return res.status(409).json({ success: false, message: 'Bạn đã điểm danh rồi' });
    }

    const status = getStatus(now.toISOString());
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
            ? new Date(record.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
    const dateKey = date || new Date().toISOString().split('T')[0];
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
          ? new Date(record.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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

module.exports = { checkin, getHistory, getClassAttendance, updateAttendance, deleteAttendance };
