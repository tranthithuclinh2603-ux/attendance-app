const { db } = require('../models/firebase');

// Sinh viên gửi đơn xin nghỉ phép (có ảnh giấy khám bệnh)
const submitLeave = async (req, res) => {
  try {
    const { uid, name } = req.user;
    const { classId, date, reason, imageBase64 } = req.body;
    if (!classId || !date) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const leaveId = `leave_${Date.now()}_${uid.slice(-5)}`;
    await db.ref(`leaves/${leaveId}`).set({
      studentUid: uid,
      studentName: name,
      classId,
      date,
      reason: reason || '',
      imageBase64: imageBase64 || null,
      status: 'pending', // pending | approved | rejected
      submittedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Gửi đơn xin nghỉ thành công', leaveId });
  } catch (err) {
    console.error('submitLeave error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Giáo viên lấy danh sách đơn của lớp
const getLeaves = async (req, res) => {
  try {
    const { classId } = req.params;
    const snap = await db.ref('leaves').orderByChild('classId').equalTo(classId).once('value');
    const leaves = [];
    snap.forEach((c) => leaves.push({ id: c.key, ...c.val() }));
    // Sắp xếp mới nhất trên đầu
    leaves.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Sinh viên xem đơn của mình
const getMyLeaves = async (req, res) => {
  try {
    const { uid } = req.user;
    const snap = await db.ref('leaves').orderByChild('studentUid').equalTo(uid).once('value');
    const leaves = [];
    snap.forEach((c) => leaves.push({ id: c.key, ...c.val() }));
    leaves.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Giáo viên duyệt / từ chối đơn
const reviewLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, note } = req.body; // status: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const snap = await db.ref(`leaves/${leaveId}`).once('value');
    if (!snap.exists()) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const leave = snap.val();

    await db.ref(`leaves/${leaveId}`).update({
      status,
      note: note || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.name,
    });

    // Nếu duyệt: ghi vào attendance với status 'excused' (nghỉ có phép)
    if (status === 'approved') {
      const attId = `att_${leave.studentUid}_${leave.classId}_${leave.date}`;
      const existing = await db.ref(`attendance/${attId}`).once('value');
      if (!existing.exists()) {
        await db.ref(`attendance/${attId}`).set({
          uid: leave.studentUid,
          classId: leave.classId,
          date: leave.date,
          status: 'excused',
          method: 'leave',
          leaveId,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Cập nhật nếu đã có bản ghi (ví dụ đã bị đánh vắng)
        await db.ref(`attendance/${attId}`).update({ status: 'excused', leaveId });
      }

      // Kiểm tra hạn mức nghỉ (20% = tối đa 0.2 * tổng buổi)
      // Đếm số buổi excused trong học kỳ
      const allAtt = await db.ref('attendance')
        .orderByChild('uid').equalTo(leave.studentUid).once('value');
      let excusedCount = 0, totalCount = 0;
      allAtt.forEach((a) => {
        const v = a.val();
        if (v.classId === leave.classId) {
          totalCount++;
          if (v.status === 'excused') excusedCount++;
        }
      });

      const quota20pct = Math.floor(totalCount * 0.2) || 3; // tối thiểu 3 buổi
      const remaining = quota20pct - excusedCount;

      return res.json({
        success: true,
        message: 'Đã duyệt đơn',
        quota: { total: totalCount, excused: excusedCount, max: quota20pct, remaining: Math.max(0, remaining) },
      });
    }

    res.json({ success: true, message: status === 'approved' ? 'Đã duyệt đơn' : 'Đã từ chối đơn' });
  } catch (err) {
    console.error('reviewLeave error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { submitLeave, getLeaves, getMyLeaves, reviewLeave };
