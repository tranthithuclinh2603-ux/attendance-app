import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Calendar, Clock, BookOpen, CheckCircle, XCircle, Trophy, BarChart2 } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import LeaveModal from './LeaveModal';
import NavBar from './NavBar';

const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'text-green-600 bg-green-50' },
  late: { label: 'Muộn', color: 'text-yellow-600 bg-yellow-50' },
  absent: { label: 'Vắng', color: 'text-red-600 bg-red-50' },
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium ${colors[type] || colors.success}`}>
      {message}
    </div>
  );
}

// Build last 7 days chart data from history
function buildChartData(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' });
    const record = history.find((h) => h.date === key);
    days.push({ key, label, status: record?.status || null });
  }
  return days;
}

function WeekChart({ history }) {
  const days = buildChartData(history);
  const statusColor = {
    present: 'bg-green-400',
    late: 'bg-yellow-400',
    absent: 'bg-red-400',
    null: 'bg-gray-200',
  };
  const statusLabel = { present: 'Có mặt', late: 'Muộn', absent: 'Vắng', null: 'Không có lịch' };

  return (
    <div className="p-5">
      <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-blue-500" />
        Điểm danh 7 ngày qua
      </h4>
      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((d) => (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-20">
              <div
                className={`w-full rounded-t-lg transition-all ${statusColor[d.status] || 'bg-gray-200 dark:bg-gray-600'}`}
                style={{ height: d.status ? '100%' : '20%' }}
                title={statusLabel[d.status]}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight">{d.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[['bg-green-400', 'Có mặt'], ['bg-yellow-400', 'Muộn'], ['bg-red-400', 'Vắng'], ['bg-gray-200', 'Không có lịch']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-3 h-3 rounded ${c}`} />
            {l}
          </div>
        ))}
      </div>

      {/* Day detail */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d.key} className="text-center">
            <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-sm
              ${d.status === 'present' ? 'bg-green-100 text-green-600' :
                d.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                d.status === 'absent' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
              {d.status === 'present' ? '✓' : d.status === 'late' ? 'M' : d.status === 'absent' ? '✗' : '·'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [showModal, setShowModal] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
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

  const handleSuccess = (status) => {
    setShowModal(false);
    if (status === 'late') {
      showToast('Điểm danh muộn! Vui lòng đến đúng giờ hơn.', 'warning');
    } else {
      showToast('Điểm danh thành công! Chúc bạn học tốt.');
    }
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
          <h2 className="text-2xl font-bold mb-3">Xin chào, {user?.name}!</h2>
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
          <div>
            <div className="flex justify-between text-xs text-blue-100 mb-1">
              <span>Tỷ lệ điểm danh</span>
              <span className="font-bold text-white">{attendanceRate}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Tổng', value: stats.total, text: 'text-blue-600' },
            { label: 'Có mặt', value: stats.present, text: 'text-green-600' },
            { label: 'Muộn', value: stats.late, text: 'text-yellow-600' },
            { label: 'Vắng', value: stats.absent, text: 'text-red-600' },
          ].map(({ label, value, text }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 text-center">
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-6 shadow-md flex flex-col items-center gap-2 transition-all"
          >
            <Camera size={36} />
            <span className="text-base font-bold">ĐIỂM DANH</span>
            <span className="text-blue-100 text-xs">GPS + Khuôn mặt</span>
          </button>
          <button
            onClick={() => setShowLeave(true)}
            className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-2xl py-6 shadow-md flex flex-col items-center gap-2 transition-all"
          >
            <BookOpen size={36} />
            <span className="text-base font-bold">XIN NGHỈ</span>
            <span className="text-indigo-100 text-xs">Nộp giấy tờ</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b dark:border-gray-700">
            {[
              { key: 'history', label: 'Lịch sử' },
              { key: 'chart', label: 'Biểu đồ' },
              { key: 'leaderboard', label: 'Xếp hạng' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* History tab */}
          {activeTab === 'history' && (
            <div>
              <div className="px-5 py-3 border-b dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tổng {stats.total} buổi</span>
                <button onClick={fetchHistory} className="text-blue-500 text-sm hover:underline">Làm mới</button>
              </div>
              {loading ? (
                <div className="py-10 text-center text-gray-400">Đang tải...</div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Chưa có lịch sử điểm danh</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Ngày</th>
                        <th className="px-4 py-3 text-left">Giờ</th>
                        <th className="px-4 py-3 text-left">Lớp</th>
                        <th className="px-4 py-3 text-left">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {history.map((item, i) => {
                        const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
                        return (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.date}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.time}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.classId}</td>
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

          {/* Chart tab */}
          {activeTab === 'chart' && <WeekChart history={history} />}

          {/* Leaderboard tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="px-5 py-3 border-b dark:border-gray-700">
                <p className="text-xs text-gray-400">Tuần này ({lbPeriod}) — Lớp {user?.classId}</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Chưa có dữ liệu tuần này</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-5 py-3.5 ${item.mssv === user?.mssv ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <span className="text-sm font-bold w-8 text-center text-gray-500">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${item.mssv === user?.mssv ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                          {item.name} {item.mssv === user?.mssv && <span className="text-xs text-blue-400">(Bạn)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{item.mssv} · {item.present}/{item.total} buổi</p>
                      </div>
                      <span className={`text-lg font-bold ${item.rate >= 80 ? 'text-green-600' : item.rate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {item.rate}%
                      </span>
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

      {showLeave && <LeaveModal user={user} onClose={() => setShowLeave(false)} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
