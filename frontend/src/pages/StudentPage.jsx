import React from 'react';
import { Navigate } from 'react-router-dom';
import StudentDashboard from '../components/StudentDashboard';

export default function StudentPage({ user, onLogout }) {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'student') return <Navigate to="/teacher" />;
  return <StudentDashboard user={user} onLogout={onLogout} />;
}
