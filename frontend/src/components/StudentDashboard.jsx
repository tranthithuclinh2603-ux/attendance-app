import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Calendar, Clock, BookOpen, CheckCircle, XCircle, Trophy, BarChart2, RefreshCw, Bell, MapPin } from 'lucide-react';
import { attendanceAPI, sessionAPI, timetableAPI } from '../services/api';
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

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const PERIOD_TIMES = ['', '07:00–09:30', '09:45–12:15', '12:45–15:15', '15:30–18:00'];

function TimetableTab({ classId }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    timetableAPI.get(classId)
      .then(res => setTimetable(res.data.timetable || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  // Lấy thứ hôm nay (1=T2…7=CN)
  // App dùng 2=Thứ2(Mon)...7=Thứ7(Sat). getDay(): 0=Sun,1=Mon,...,6=Sat
  const rawDow = new Date().getDay();
  const todayDow = rawDow === 0 ? null : rawDow + 1;

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Đang tải lịch học...</div>;
  if (!timetable.length) return (
    <div className="py-10 text-center text-gray-400 text-sm">
      <Calendar size={32} className="mx-auto mb-2 opacity-30" />
      Giảng viên chưa nhập thời khóa biểu
    </div>
  );

  // Group by dayOfWeek
  const byDay = {};
  timetable.forEach(e => {
    if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = [];
    byDay[e.dayOfWeek].push(e);
  });
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="p-4 space-y-3">
      {days.map(day => (
        <div key={day} className={`rounded-xl border overflow-hidden ${day === todayDow ? 'border-blue-400 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className={`px-3 py-2 flex items-center gap-2 ${day === todayDow ? 'bg-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            <span className="text-sm font-semibold">{DAY_NAMES[day]}</span>
            {day === todayDow && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Hôm nay</span>}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {byDay[day].sort((a,b) => a.period - b.period).map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${day === todayDow ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  C{e.period}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{e.subject}</p>
                  <p className="text-xs text-gray-400">{PERIOD_TIMES[e.period]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [showModal, setShowModal] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSessionBanner, setNewSessionBanner] = useState(null); // banner khi có phiên mới
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const prevSessionIds = useRef(new Set()); // track phiên đã biết để phát hiện phiên mới

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

  const fetchActiveSessions = useCallback(async (silent = false) => {
    if (!user?.classId) return;
    if (!silent) setSessionsLoading(true);
    try {
      const res = await sessionAPI.getActive(user.classId);
      const sessions = res.data.sessions || [];

      // Phát hiện phiên mới — so sánh với lần fetch trước
      const currentIds = new Set(sessions.map(s => s.sessionId));
      const newSessions = sessions.filter(s => !prevSessionIds.current.has(s.sessionId));
      if (newSessions.length > 0 && prevSessionIds.current.size > 0) {
        // Chỉ hiện banner nếu không phải lần load đầu tiên
        setNewSessionBanner(newSessions[0]);
        setTimeout(() => setNewSessionBanner(null), 8000);
      }
      prevSessionIds.current = currentIds;
      setActiveSessions(sessions);
    } catch { setActiveSessions([]); }
    if (!silent) setSessionsLoading(false);
  }, [user?.classId]);

  // Polling phiên mỗi 60 giây
  useEffect(() => {
    fetchHistory();
    fetchLeaderboard();
    fetchActiveSessions();
    const interval = setInterval(() => fetchActiveSessions(true), 60000);
    return () => clearInterval(interval);
  }, [fetchHistory, fetchLeaderboard, fetchActiveSessions]);

  // GPS tracking định kỳ: khi đang trong phiên (đã điểm danh) → gửi vị trí mỗi 10 phút
  const trackingSessionRef = useRef(null);
  const startLocationTracking = useCallback((session) => {
    if (trackingSessionRef.current) clearInterval(trackingSessionRef.current);
    const sendLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        sessionAPI.updateLocation(session.sessionId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }).catch(() => {});
      }, () => {}, { timeout: 10000, maximumAge: 30000 });
    };
    sendLocation(); // gửi ngay
    trackingSessionRef.current = setInterval(sendLocation, 10 * 60 * 1000); // mỗi 10 phút
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (trackingSessionRef.current) {
      clearInterval(trackingSessionRef.current);
      trackingSessionRef.current = null;
    }
  }, []);

  // Dừng tracking khi unmount
  useEffect(() => () => stopLocationTracking(), [stopLocationTracking]);

  const handleSuccess = (status) => {
    setShowModal(false);
    // Bắt đầu tracking GPS nếu điểm danh thành công trong phiên
    if (selectedSession && (status === 'present' || status === 'late')) {
      startLocationTracking(selectedSession);
    }
    setSelectedSession(null);
    if (status === 'late') {
      showToast('Điểm danh muộn! Vui lòng đến đúng giờ hơn.', 'warning');
    } else {
      showToast('Điểm danh thành công! Chúc bạn học tốt.');
    }
    fetchHistory();
    fetchLeaderboard();
    fetchActiveSessions();
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

      {/* Banner phiên mới mở */}
      {newSessionBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto max-w-sm w-full animate-bounce-in">
            <Bell size={18} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Phiên điểm danh đã mở!</p>
              <p className="text-blue-100 text-xs truncate">{newSessionBanner.subject} · Ca {newSessionBanner.period} ({newSessionBanner.startTime})</p>
            </div>
            <button
              onClick={() => { setSelectedSession(newSessionBanner); setShowModal(true); setNewSessionBanner(null); }}
              className="shrink-0 bg-white text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-50"
            >
              Điểm danh
            </button>
            <button onClick={() => setNewSessionBanner(null)} className="text-white/60 hover:text-white">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

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

        {/* Sessions + actions */}
        <div className="space-y-3">
          {/* Phiên đang mở */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">Phiên điểm danh hôm nay</p>
              <button onClick={fetchActiveSessions} disabled={sessionsLoading} className="text-gray-400 hover:text-gray-600 p-1">
                <RefreshCw size={14} className={sessionsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {sessionsLoading ? (
              <div className="py-5 text-center text-gray-400 text-sm">Đang kiểm tra phiên...</div>
            ) : activeSessions.length === 0 ? (
              <div className="py-5 text-center text-gray-400 text-sm">
                <Clock size={24} className="mx-auto mb-1.5 opacity-40" />
                Chưa có phiên điểm danh nào đang mở
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {activeSessions.map(session => (
                  <div key={session.sessionId} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">{session.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Ca {session.period} · {session.startTime}–{session.endTime}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedSession(session); setShowModal(true); }}
                      className="shrink-0 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      <Camera size={15} />
                      Điểm danh
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nút xin nghỉ */}
          <button
            onClick={() => setShowLeave(true)}
            className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-2xl py-4 shadow-md flex items-center justify-center gap-3 transition-all"
          >
            <BookOpen size={22} />
            <div className="text-left">
              <p className="font-bold text-sm">XIN NGHỈ PHÉP</p>
              <p className="text-indigo-100 text-xs">Nộp giấy tờ xin nghỉ</p>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b dark:border-gray-700">
            {[
              { key: 'history', label: 'Lịch sử' },
              { key: 'timetable', label: 'Lịch học' },
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

          {/* Timetable tab */}
          {activeTab === 'timetable' && <TimetableTab classId={user?.classId} />}

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
          session={selectedSession}
          onClose={() => { setShowModal(false); setSelectedSession(null); }}
          onSuccess={handleSuccess}
        />
      )}

      {showLeave && <LeaveModal user={user} onClose={() => setShowLeave(false)} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
