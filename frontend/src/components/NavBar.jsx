import React, { useState, useEffect } from 'react';
import { LogOut, GraduationCap, Moon, Sun } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function NavBar({ user, onLogout, onUpdateUser }) {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showProfile, setShowProfile] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);

  // Sync avatar khi user prop thay đổi (login thiết bị khác)
  useEffect(() => {
    setLocalAvatar(user?.avatar || null);
  }, [user?.avatar]);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const handleUpdateName = (newName) => {
    onUpdateUser?.(newName, localAvatar);
    setShowProfile(false);
  };

  const handleUpdateAvatar = (newAvatar) => {
    setLocalAvatar(newAvatar);
    onUpdateUser?.(user?.name, newAvatar);
  };

  const handleUpdateClass = (newClassId) => {
    onUpdateUser?.(user?.name, localAvatar, newClassId);
  };

  return (
    <>
      <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} />
          <span className="font-semibold text-lg hidden sm:block">Điểm Danh Sinh Viên</span>
          <span className="font-semibold sm:hidden">Điểm Danh</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 bg-blue-700 dark:bg-gray-700 hover:bg-blue-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title={dark ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 bg-blue-700 dark:bg-gray-700 hover:bg-blue-800 dark:hover:bg-gray-600 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
              {localAvatar ? (
                <img src={localAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="hidden sm:block text-sm max-w-[90px] truncate">{user?.name}</span>
          </button>

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
          user={{ ...user, avatar: localAvatar }}
          onClose={() => setShowProfile(false)}
          onUpdateName={handleUpdateName}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateClass={handleUpdateClass}
        />
      )}
    </>
  );
}
