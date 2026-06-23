import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, BookOpen, Calendar, LogOut } from 'lucide-react';
import { parentAPI } from '../services/api';

const STATUS = {
  present: { label: 'Có mặt', icon: '✅', cls: 'text-green-600 bg-green-50' },
  late:    { label: 'Muộn',   icon: '⏰', cls: 'text-yellow-600 bg-yellow-50' },
  absent:  { label: 'Vắng',   icon: '❌', cls: 'text-red-600 bg-red-50' },
  excused: { label: 'Có phép',icon: '📋', cls: 'text-indigo-600 bg-indigo-50' },
};

export default function ParentDashboard({ user, onLogout }) {
  const [child, setChild] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [childRes, attRes] = await Promise.all([parentAPI.getChild(), parentAPI.getChildAttendance()]);
        setChild(childRes.data.child);
        setRecords(attRes.data.records || []);
        setStats(attRes.data.stats || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const attendanceRate = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* NavBar */}
      <nav className="bg-purple-600 dark:bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">👨‍👩‍👧</span> Cổng Phụ Huynh
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 px-3 py-2 rounded-lg text-sm">
          <LogOut size={16} /> Đăng xuất
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !child ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Chưa liên kết với sinh viên</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng đăng ký lại với MSSV của con</p>
          </div>
        ) : (
          <>
            {/* Child info card */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-md">
              <p className="text-purple-200 text-sm mb-1">Thông tin con của bạn</p>
              <div className="flex items-center gap-4">
                {child.avatar ? (
                  <img src={child.avatar} alt="avatar" className="w-16 h-16 rounded-full border-4 border-white/30 object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {child.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{child.name}</h2>
                  <p className="text-purple-100 text-sm">MSSV: {child.mssv} · Lớp: {child.classId}</p>
                  <p className="text-purple-100 text-xs mt-0.5">{child.email}</p>
                </div>
              </div>
              {/* Attendance rate bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-purple-200 mb-1">
                  <span>Tỷ lệ điểm danh</span>
                  <span className="font-bold text-white">{attendanceRate}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${attendanceRate >= 80 ? 'bg-green-400' : attendanceRate >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                {attendanceRate < 80 && (
                  <p className="text-yellow-300 text-xs mt-1">⚠️ Tỷ lệ điểm danh thấp hơn 80% — cần chú ý!</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Tổng', value: stats.total, color: 'blue', Icon: BookOpen },
                { label: 'Có mặt', value: stats.present, color: 'green', Icon: CheckCircle },
                { label: 'Muộn', value: stats.late, color: 'yellow', Icon: Clock },
                { label: 'Vắng', value: stats.absent, color: 'red', Icon: XCircle },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-sm">
                  <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-gray-700 flex items-center gap-2">
                <Calendar size={18} className="text-purple-500" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Lịch sử điểm danh</h3>
              </div>
              {records.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu điểm danh</p>
              ) : (
                <div className="divide-y dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {records.map((r) => {
                    const s = STATUS[r.status] || STATUS.absent;
                    return (
                      <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{r.date}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Lớp {r.classId} · {r.time || '—'}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.icon} {s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
