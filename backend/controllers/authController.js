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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};

module.exports = { register, login };
