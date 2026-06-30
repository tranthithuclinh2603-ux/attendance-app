import axios from 'axios';

const API = axios.create({
  baseURL: 'https://attendance-app-production-3fac.up.railway.app/api',
  timeout: 10000,
});

// Tự động gắn token vào mỗi request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý lỗi 401 - tự động logout
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  updateProfile: (data) => API.put('/auth/profile', data),
  updateAvatar: (data) => API.put('/auth/avatar', data),
  updateClass: (data) => API.put('/auth/class', data),
  bulkRegister: (data) => API.post('/auth/bulk-register', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Attendance
export const attendanceAPI = {
  checkin: (data) => API.post('/attendance/checkin', data),
  getHistory: (params) => API.get('/attendance/history', { params }),
  getClassAttendance: (classId, date) =>
    API.get(`/attendance/class/${classId}`, { params: { date } }),
  updateAttendance: (attendanceId, status) =>
    API.put(`/attendance/${attendanceId}`, { status }),
  deleteAttendance: (attendanceId) => API.delete(`/attendance/${attendanceId}`),
  getLeaderboard: (classId) => API.get(`/attendance/leaderboard/${classId}`),
  getAbsenceAlerts: (classId) => API.get(`/attendance/alerts/${classId}`),
  getWeeklyStats: (classId, weeks) => API.get(`/attendance/weekly/${classId}`, { params: { weeks } }),
  manualCheckin: (data) => API.post('/attendance/manual', data),
  qrCheckin: (data) => API.post('/attendance/qr-checkin', data),
};

// WebAuthn & Face
export const biometricAPI = {
  saveWebAuthn: (data) => API.post('/auth/webauthn', data),
  loginWebAuthn: (data) => API.post('/auth/login-webauthn', data),
  saveFace: (data) => API.post('/auth/face', data),
  getMyFace: () => API.get('/auth/face'),
  saveStudentId: (data) => API.put('/auth/student-id', data),
};

// Admin
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: () => API.get('/admin/users'),
  getUserStats: () => API.get('/admin/user-stats'),
};

// Parent
export const parentAPI = {
  getChild: () => API.get('/parent/child'),
  getChildAttendance: () => API.get('/parent/child/attendance'),
};

// Sessions (Phiên điểm danh)
export const sessionAPI = {
  open: (data) => API.post('/sessions', data),
  close: (sessionId) => API.put(`/sessions/${sessionId}/close`),
  getActive: (classId) => API.get(`/sessions/active/${classId}`),
  getToday: (classId) => API.get(`/sessions/today/${classId}`),
  getHistory: (classId, params) => API.get(`/sessions/history/${classId}`, { params }),
  exportExcel: (classId, params) => API.get(`/sessions/export/${classId}`, { params, responseType: 'blob' }),
  getAttendance: (sessionId) => API.get(`/sessions/${sessionId}/attendance`),
  updateAttendance: (sessionId, uid, status) => API.put(`/sessions/${sessionId}/attendance/${uid}`, { status }),
  checkin: (sessionId, data) => API.post(`/sessions/${sessionId}/checkin`, data),
  updateLocation: (sessionId, data) => API.put(`/sessions/${sessionId}/location`, data),
  getLocations: (sessionId) => API.get(`/sessions/${sessionId}/locations`),
};

// Timetable (Thời khóa biểu)
export const timetableAPI = {
  save: (classId, entries) => API.post(`/timetable/${classId}`, { entries }),
  get: (classId) => API.get(`/timetable/${classId}`),
  autoOpen: (classId) => API.post(`/timetable/${classId}/auto-open`),
};

// Leave (Xin nghỉ phép)
export const leaveAPI = {
  submit: (data) => API.post('/leave', data),
  getMy: () => API.get('/leave/my'),
  getByClass: (classId) => API.get(`/leave/class/${classId}`),
  review: (leaveId, data) => API.put(`/leave/${leaveId}/review`, data),
};

// Chat AI
export const chatAPI = {
  send: (messages, userContext) => API.post('/chat', { messages, userContext }),
};

export default API;
