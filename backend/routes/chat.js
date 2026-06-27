const express = require('express');
const router = express.Router();
const { chat, testChat } = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

router.get('/test', testChat);      // test không cần auth: GET /api/chat/test
router.post('/', verifyToken, chat);

module.exports = router;
