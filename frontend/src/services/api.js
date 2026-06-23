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
};

export default API;
