const { db } = require('../models/firebase');

// Thống kê toàn trường
const getSchoolStats = async (req, res) => {
  try {
    const [usersSnap, attSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('attendance').once('value'),
    ]);

    const users = {};
    let totalStudents = 0, totalTeachers = 0;
    const classCounts = {};

    usersSnap.forEach((c) => {
      const u = c.val();
      users[c.key] = u;
      if (u.role === 'student') {
        totalStudents++;
        if (u.classId) classCounts[u.classId] = (classCounts[u.classId] || 0) + 1;
      }
      if (u.role === 'teacher') totalTeachers++;
    });

    // Thống kê điểm danh theo lớp
    const classStats = {};
    attSnap.forEach((c) => {
      const a = c.val();
      if (!a.classId) return;
      if (!classStats[a.classId]) classStats[a.classId] = { present: 0, late: 0, absent: 0, total: 0 };
      classStats[a.classId].total++;
      if (a.status === 'present') classStats[a.classId].present++;
      else if (a.status === 'late') classStats[a.classId].late++;
      else classStats[a.classId].absent++;
    });

    // Tỷ lệ vắng theo lớp, sắp xếp giảm dần
    const classRanking = Object.entries(classStats).map(([classId, s]) => ({
      classId,
      studentCount: classCounts[classId] || 0,
      ...s,
      attendanceRate: s.total ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
      absenceRate: s.total ? Math.round((s.absent / s.total) * 100) : 0,
    })).sort((a, b) => b.absenceRate - a.absenceRate);

    // Thống kê 7 ngày gần nhất (theo giờ VN UTC+7)
    const toVN = (d) => new Date(d.getTime() + 7 * 3600 * 1000);
    const today = new Date();
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toVN(d).toISOString().slice(0, 10);
      let present = 0, late = 0, absent = 0;
      attSnap.forEach((c) => {
        const a = c.val();
        if (a.date === dateStr) {
          if (a.status === 'present') present++;
          else if (a.status === 'late') late++;
          else absent++;
        }
      });
      daily.push({ date: dateStr, present, late, absent, total: present + late + absent });
    }

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses: Object.keys(classStats).length,
        totalAttendance: attSnap.numChildren(),
      },
      classRanking,
      daily,
    });
  } catch (err) {
    console.error('getSchoolStats error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
  try {
    const snap = await db.ref('users').once('value');
    const users = [];
    snap.forEach((c) => {
      const u = c.val();
      users.push({ id: c.key, name: u.name, email: u.email, role: u.role, classId: u.classId, mssv: u.mssv, createdAt: u.createdAt });
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getSchoolStats, getAllUsers };
