import React, { useState, useEffect } from 'react';
import { LogOut, GraduationCap, Moon, Sun, UserCircle } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function NavBar({ user, onLogout, onUpdateUser }) {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const handleUpdateName = (newName) => {
    if (onUpdateUser) onUpdateUser(newName);
    setShowProfile(false);
  };

  return (
    <>
      <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} />
          <span className="font-semibold text-lg hidden sm:block">Điểm Danh Sinh Viên</span>
          <span className="font-semibold text-lg sm:hidden">Điểm Danh</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 bg-blue-700 dark:bg-gray-700 hover:bg-blue-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title={dark ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile button */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 bg-blue-700 dark:bg-gray-700 hover:bg-blue-800 dark:hover:bg-gray-600 px-2.5 py-2 rounded-lg text-sm transition-colors"
          >
            <UserCircle size={16} />
            <span className="hidden sm:block max-w-[100px] truncate">{user?.name}</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-blue-700 dark:bg-gray-700 hover:bg-blue-800 dark:hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateName={handleUpdateName}
        />
      )}
    </>
  );
}
