import React, { useState } from 'react';
import { X, User, Mail, BookOpen, GraduationCap, Edit2, Check } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ProfileModal({ user, onClose, onUpdateName }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authAPI.updateProfile({ name: name.trim() });
      onUpdateName(name.trim());
      setMsg('Cập nhật thành công!');
      setEditingName(false);
      setTimeout(() => setMsg(''), 2500);
    } catch {
      setMsg('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { icon: User, label: 'Họ và tên', value: user?.name },
    { icon: Mail, label: 'Email', value: user?.email },
    ...(user?.role === 'student'
      ? [
          { icon: BookOpen, label: 'MSSV', value: user?.mssv },
          { icon: GraduationCap, label: 'Lớp', value: user?.classId },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full">
              {user?.role === 'teacher' ? '👩‍🏫 Giảng viên' : '🎓 Sinh viên'}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="p-5 space-y-3">
          {msg && (
            <div className={`text-sm px-3 py-2 rounded-lg text-center ${msg.includes('thành công') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {msg}
            </div>
          )}

          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={15} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                {label === 'Họ và tên' && editingName ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium text-gray-800 dark:text-white bg-transparent border-b border-blue-400 outline-none w-full"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{value || '—'}</p>
                )}
              </div>
              {label === 'Họ và tên' && (
                editingName ? (
                  <button onClick={saveName} disabled={saving} className="text-green-500 hover:text-green-600 shrink-0">
                    <Check size={18} />
                  </button>
                ) : (
                  <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-blue-500 shrink-0">
                    <Edit2 size={15} />
                  </button>
                )
              )}
            </div>
          ))}

          <button
            onClick={onClose}
            className="w-full mt-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
