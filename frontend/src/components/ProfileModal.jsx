import React, { useState, useRef } from 'react';
import { X, Mail, BookOpen, GraduationCap, Edit2, Check, Camera } from 'lucide-react';
import { authAPI } from '../services/api';

function resizeImage(file, maxSize = 120) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
  });
}

export default function ProfileModal({ user, onClose, onUpdateName, onUpdateAvatar }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);
  const fileRef = useRef();

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authAPI.updateProfile({ name: name.trim() });
      onUpdateName(name.trim());
      showMsg('✅ Cập nhật tên thành công!');
      setEditingName(false);
    } catch {
      showMsg('❌ Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showMsg('❌ Vui lòng chọn file ảnh'); return; }

    setAvatarLoading(true);
    try {
      const base64 = await resizeImage(file, 120);
      await authAPI.updateAvatar({ avatar: base64 });
      setLocalAvatar(base64);
      onUpdateAvatar?.(base64);
      showMsg('✅ Cập nhật ảnh thành công!');
    } catch {
      showMsg('❌ Tải ảnh thất bại');
    } finally {
      setAvatarLoading(false);
    }
  };

  const rows = [
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
            {/* Avatar */}
            <div className="relative group">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-4 border-white/30 hover:border-white/60 transition-all"
              >
                {localAvatar ? (
                  <img src={localAvatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer shadow"
              >
                <Camera size={12} className="text-blue-600" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="text-xs text-blue-100">Bấm vào ảnh để thay đổi</p>
            <p className="font-semibold text-lg">{user?.name}</p>
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full">
              {user?.role === 'teacher' ? '👩‍🏫 Giảng viên' : '🎓 Sinh viên'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {msg && (
            <div className={`text-sm px-3 py-2 rounded-lg text-center ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg}
            </div>
          )}

          {/* Editable name row */}
          <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0 text-blue-500 font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 dark:text-gray-500">Họ và tên</p>
              {editingName ? (
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  className="text-sm font-medium text-gray-800 dark:text-white bg-transparent border-b border-blue-400 outline-none w-full"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user?.name || '—'}</p>
              )}
            </div>
            {editingName ? (
              <button onClick={saveName} disabled={saving} className="text-green-500 hover:text-green-600 shrink-0">
                <Check size={18} />
              </button>
            ) : (
              <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-blue-500 shrink-0">
                <Edit2 size={15} />
              </button>
            )}
          </div>

          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={15} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{value || '—'}</p>
              </div>
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
