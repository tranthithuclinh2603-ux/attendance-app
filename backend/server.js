require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const adminRoutes = require('./routes/admin');
const parentRoutes = require('./routes/parent');
const sessionRoutes = require('./routes/sessions');
const timetableRoutes = require('./routes/timetable');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:3000', 'https://attendance-app-eight-sigma.vercel.app', 'https://diemdanhsv.io.vn', 'https://www.diemdanhsv.io.vn'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Attendance API is running', time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
