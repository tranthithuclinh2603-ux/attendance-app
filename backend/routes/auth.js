const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { register, login, resetPassword, updateProfile, updateAvatar } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.put('/profile', verifyToken, updateProfile);
router.put('/avatar', verifyToken, updateAvatar);

module.exports = router;
