const express = require('express');
const router = express.Router();
const { verifyToken, verifyTeacher } = require('../middleware/auth');
const {
  register, login, resetPassword, updateProfile, updateAvatar, updateClass, bulkRegister,
  saveWebAuthnCredential, loginWebAuthn, saveFaceDescriptors, getMyFaceDescriptors,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/login-webauthn', loginWebAuthn);
router.post('/reset-password', resetPassword);
router.post('/bulk-register', verifyTeacher, bulkRegister);
router.put('/profile', verifyToken, updateProfile);
router.put('/avatar', verifyToken, updateAvatar);
router.put('/class', verifyToken, updateClass);
router.post('/webauthn', verifyToken, saveWebAuthnCredential);
router.get('/face', verifyToken, getMyFaceDescriptors);
router.post('/face', verifyToken, saveFaceDescriptors);

module.exports = router;
