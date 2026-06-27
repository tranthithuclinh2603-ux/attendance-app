const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, chat);

module.exports = router;
