import React, { useEffect } from 'react';
import LoginForm from '../components/LoginForm';

export default function LoginPage({ onLogin }) {
  useEffect(() => {
    // Force light mode on login page
    document.documentElement.classList.remove('dark');
  }, []);

  return <LoginForm onLogin={onLogin} />;
}
