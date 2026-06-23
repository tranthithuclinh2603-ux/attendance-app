import React from 'react';
import { Navigate } from 'react-router-dom';
import TeacherDashboard from '../components/TeacherDashboard';

export default function TeacherPage({ user, onLogout, onUpdateUser }) {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'teacher') return <Navigate to="/student" />;
  return <TeacherDashboard user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />;
}
