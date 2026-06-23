const { db } = require('../models/firebase');

// Phụ huynh xem thông tin con
const getChildInfo = async (req, res) => {
  try {
    const { linkedStudentId } = req.user;
    if (!linkedStudentId) return res.status(400).json({ success: false, message: 'Chưa liên kết với sinh viên nào' });

    const snap = await db.ref(`users/${linkedStudentId}`).once('value');
    if (!snap.exists()) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });

    const u = snap.val();
    res.json({
      success: true,
      child: { id: linkedStudentId, name: u.name, email: u.email, mssv: u.mssv, classId: u.classId, avatar: u.avatar || null },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Phụ huynh xem lịch sử điểm danh của con
const getChildAttendance = async (req, res) => {
  try {
    const { linkedStudentId } = req.user;
    if (!linkedStudentId) return res.status(400).json({ success: false, message: 'Chưa liên kết sinh viên' });

    const snap = await db.ref('attendance').orderByChild('uid').equalTo(linkedStudentId).once('value');
    const records = [];
    snap.forEach((c) => records.push({ id: c.key, ...c.val() }));
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Tính thống kê
    const stats = { total: records.length, present: 0, late: 0, absent: 0, excused: 0 };
    records.forEach((r) => { if (stats[r.status] !== undefined) stats[r.status]++; });

    res.json({ success: true, records, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getChildInfo, getChildAttendance };
