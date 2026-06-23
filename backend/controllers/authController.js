const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/firebase');

const register = async (req, res) => {
  try {
    const { name, email, mssv, classId, password, role = 'student', teachingClasses } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    if (role === 'student' && !mssv) {
      return res.status(400).json({ success: false, message: 'MSSV là bắt buộc cho sinh viên' });
    }

    // Check email exists
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (snapshot.exists()) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = `uid_${Date.now()}`;

    const userData = {
      name,
      email,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    if (role === 'student') {
      userData.mssv = mssv;
      userData.classId = classId || '';
    } else {
      userData.teachingClasses = teachingClasses || ['ATTT1', 'ATTT2'];
    }

    await db.ref(`users/${uid}`).set(userData);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: { id: uid, name, email, role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
    }

    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    let uid, userData;
    snapshot.forEach((child) => {
      uid = child.key;
      userData = child.val();
    });

    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { uid, email, role: userData.role, name: userData.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        classId: userData.classId || null,
        mssv: userData.mssv || null,
        teachingClasses: userData.teachingClasses || null,
        avatar: userData.avatar || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu mới là bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' });
    }

    const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống' });
    }

    let uid;
    snapshot.forEach((child) => { uid = child.key; });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.ref(`users/${uid}/passwordHash`).set(passwordHash);

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên không được để trống' });
    }

    await db.ref(`users/${uid}/name`).set(name.trim());
    res.json({ success: true, message: 'Cập nhật thành công', name: name.trim() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { uid } = req.user;
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ success: false, message: 'Không có ảnh' });
    await db.ref(`users/${uid}/avatar`).set(avatar);
    res.json({ success: true, message: 'Cập nhật ảnh thành công' });
  } catch (error) {
    console.error('Avatar error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { uid, role } = req.user;
    if (role !== 'student') return res.status(403).json({ success: false, message: 'Chỉ sinh viên mới được đổi lớp' });
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ success: false, message: 'Thiếu mã lớp' });
    await db.ref(`users/${uid}/classId`).set(classId);
    res.json({ success: true, message: 'Cập nhật lớp thành công', classId });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const bulkRegister = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || !students.length) {
      return res.status(400).json({ success: false, message: 'Danh sách sinh viên trống' });
    }

    const results = [];
    for (const s of students) {
      if (!s.name || !s.email || !s.mssv || !s.classId) {
        results.push({ email: s.email || '?', status: 'error', message: 'Thiếu thông tin' });
        continue;
      }
      try {
        const snap = await db.ref('users').orderByChild('email').equalTo(s.email).once('value');
        if (snap.exists()) {
          results.push({ email: s.email, name: s.name, status: 'skip', message: 'Email đã tồn tại' });
          continue;
        }
        const passwordHash = await bcrypt.hash(s.password || '123456', 10);
        const uid = `uid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db.ref(`users/${uid}`).set({
          name: s.name, email: s.email, mssv: s.mssv, classId: s.classId,
          role: 'student', passwordHash, createdAt: new Date().toISOString(),
        });
        results.push({ email: s.email, name: s.name, status: 'success' });
      } catch {
        results.push({ email: s.email, name: s.name, status: 'error', message: 'Lỗi tạo tài khoản' });
      }
    }

    const created = results.filter(r => r.status === 'success').length;
    res.json({ success: true, message: `Tạo thành công ${created}/${students.length} tài khoản`, results });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { register, login, resetPassword, updateProfile, updateAvatar, updateClass, bulkRegister };
