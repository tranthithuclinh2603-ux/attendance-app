const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const { register, login, resetPassword, updateProfile, updateAvatar, bulkRegister } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/bulk-register', verifyTeacher, bulkRegister);
router.put('/profile', verifyToken, updateProfile);
router.put('/avatar', verifyToken, updateAvatar);

module.exports = router;
