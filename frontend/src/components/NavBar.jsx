import React from 'react';
import { LogOut, GraduationCap } from 'lucide-react';

export default function NavBar({ user, onLogout }) {
  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <GraduationCap size={24} />
        <span className="font-semibold text-lg">Điểm Danh Sinh Viên</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-90 hidden sm:block">{user?.name}</span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
