import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import QRCheckinPage from './pages/QRCheckinPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    // Apply saved dark mode
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleUpdateUser = (newName, newAvatar) => {
    const updated = { ...user, name: newName ?? user?.name, avatar: newAvatar ?? user?.avatar };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/student" element={<StudentPage user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />} />
        <Route path="/teacher" element={<TeacherPage user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />} />
        <Route path="/qr" element={<QRCheckinPage />} />
        <Route
          path="/"
          element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
