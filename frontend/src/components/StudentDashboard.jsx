import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Calendar, Clock, BookOpen, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import NavBar from './NavBar';

const STATUS_CONFIG = {
  present: { label: 'Có mặt', icon: '✅', color: 'text-green-600 bg-green-50' },
  late: { label: 'Muộn', icon: '⏰', color: 'text-yellow-600 bg-yellow-50' },
  absent: { label: 'Vắng', icon: '❌', color: 'text-red-600 bg-red-50' },
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium transition-all animate-bounce-in
      ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await attendanceAPI.getHistory({});
      setHistory(res.data.data || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const res = await attendanceAPI.getLeaderboard(user.classId);
      setLeaderboard(res.data.data || []);
      setLbPeriod(res.data.period || '');
    } catch {
      // keep empty
    }
  }, [user?.classId]);

  useEffect(() => {
    fetchHistory();
    fetchLeaderboard();
  }, [fetchHistory, fetchLeaderboard]);

  const handleSuccess = () => {
    setShowModal(false);
    showToast('Điểm danh thành công! 🎉');
    fetchHistory();
    fetchLeaderboard();
  };

  const stats = {
    total: history.length,
    present: history.filter((h) => h.status === 'present').length,
    late: history.filter((h) => h.status === 'late').length,
    absent: history.filter((h) => h.status === 'absent').length,
  };
  const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Greeting card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-md">
          <p className="text-blue-100 text-sm mb-1">{today}</p>
          <h2 className="text-2xl font-bold mb-3">Xin chào, {user?.name}! 👋</h2>
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <BookOpen size={14} />
              <span>MSSV: {user?.mssv || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <Calendar size={14} />
              <span>Lớp: {user?.classId || 'N/A'}</span>
            </div>
          </div>
          {/* Attendance rate bar */}
          <div>
            <div className="flex justify-between text-xs text-blue-100 mb-1">
              <span>Tỷ lệ điểm danh</span>
              <span className="font-bold text-white">{attendanceRate}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Tổng', value: stats.total, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'Có mặt', value: stats.present, color: 'green', bg: 'bg-green-50', text: 'text-green-600' },
            { label: 'Muộn', value: stats.late, color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-600' },
            { label: 'Vắng', value: stats.absent, color: 'red', bg: 'bg-red-50', text: 'text-red-600' },
          ].map(({ label, value, bg, text }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Check-in button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-6 shadow-md flex flex-col items-center gap-2 transition-all"
        >
          <Camera size={40} />
          <span className="text-xl font-bold">ĐIỂM DANH NGAY</span>
          <span className="text-blue-100 text-sm">GPS + Nhận diện khuôn mặt</span>
        </button>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            {[
              { key: 'history', label: '📋 Lịch sử', icon: Clock },
              { key: 'leaderboard', label: '🏆 Bảng xếp hạng', icon: Trophy },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* History tab */}
          {activeTab === 'history' && (
            <div>
              <div className="px-5 py-3 border-b flex justify-between items-center">
                <span className="text-sm text-gray-500">Tổng {stats.total} buổi</span>
                <button onClick={fetchHistory} className="text-blue-500 text-sm hover:underline">
                  Làm mới
                </button>
              </div>
              {loading ? (
                <div className="py-10 text-center text-gray-400">Đang tải...</div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Chưa có lịch sử điểm danh</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Ngày</th>
                        <th className="px-4 py-3 text-left">Giờ</th>
                        <th className="px-4 py-3 text-left">Lớp</th>
                        <th className="px-4 py-3 text-left">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((item, i) => {
                        const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">{item.date}</td>
                            <td className="px-4 py-3 text-gray-600">{item.time}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.classId}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                                {s.icon} {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="px-5 py-3 border-b">
                <p className="text-xs text-gray-400">Tuần này ({lbPeriod}) — Lớp {user?.classId}</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Chưa có dữ liệu tuần này</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leaderboard.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-5 py-3.5 ${item.mssv === user?.mssv ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-xl w-8 text-center">{MEDALS[i] || `${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${item.mssv === user?.mssv ? 'text-blue-700' : 'text-gray-800'}`}>
                          {item.name} {item.mssv === user?.mssv && <span className="text-xs text-blue-500">(Bạn)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{item.mssv} · {item.present}/{item.total} buổi</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${item.rate >= 80 ? 'text-green-600' : item.rate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AttendanceModal
          classId={user?.classId}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
