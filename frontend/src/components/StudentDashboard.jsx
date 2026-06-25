import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Calendar, Clock, BookOpen, CheckCircle, XCircle,
  Trophy, BarChart2, RefreshCw, Bell, Home, User,
  ClipboardList, ChevronLeft, ChevronRight, Moon, Sun, LogOut,
} from 'lucide-react';
import { attendanceAPI, sessionAPI, timetableAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import LeaveModal from './LeaveModal';
import ProfileModal from './ProfileModal';

// ── Helpers ───────────────────────────────────────────
const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  late:    { label: 'Muộn',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  absent:  { label: 'Vắng',   color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
};

const DAY_SHORT  = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL   = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
// app: 2=Mon…7=Sat; getDay(): 0=Sun,1=Mon…6=Sat
function todayDow() { const d = new Date().getDay(); return d === 0 ? null : d + 1; }

const SUBJECT_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-rose-500 to-rose-600',
  'from-teal-500 to-teal-600',
];
function subjectColor(subject) {
  let h = 0; for (const c of subject) h = ((h << 5) - h) + c.charCodeAt(0);
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}
const BORDER_COLORS = [
  'border-l-blue-500','border-l-purple-500','border-l-emerald-500',
  'border-l-orange-500','border-l-rose-500','border-l-teal-500',
];
function subjectBorder(subject) {
  let h = 0; for (const c of subject) h = ((h << 5) - h) + c.charCodeAt(0);
  return BORDER_COLORS[Math.abs(h) % BORDER_COLORS.length];
}

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = { success: 'bg-indigo-600', warning: 'bg-yellow-500', error: 'bg-red-500' };
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${bg[type] || bg.success} whitespace-nowrap`}>
      {message}
    </div>
  );
}

// ── Thẻ môn học ───────────────────────────────────────
function ClassCard({ entry }) {
  const border = subjectBorder(entry.subject);
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 ${border} shadow-sm px-4 py-3.5 flex items-center gap-4`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{entry.subject}</p>
        <p className="text-xs text-gray-400 mt-0.5">{entry.startTime} – {entry.endTime}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Ca {entry.period}</p>
      </div>
    </div>
  );
}

// ── Lịch học: Ngày ───────────────────────────────────
function DayView({ timetable }) {
  const [date, setDate] = useState(new Date());
  const dow = date.getDay() === 0 ? null : date.getDay() + 1;
  const entries = timetable.filter(e => e.dayOfWeek === dow).sort((a,b) => a.period - b.period);

  const fmtDate = (d) => d.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
  const isToday = (d) => {
    const t = new Date(); return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear();
  };
  const go = (n) => { const d = new Date(date); d.setDate(d.getDate()+n); setDate(d); };

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
        <button onClick={() => go(-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{fmtDate(date)}</p>
          {isToday(date) && <span className="text-xs text-indigo-500 font-medium">Hôm nay</span>}
        </div>
        <button onClick={() => go(1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronRight size={18} />
        </button>
      </div>
      {/* Classes */}
      {entries.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm">Không có lịch học ngày này</p>
          {!isToday(date) && <button onClick={() => setDate(new Date())} className="mt-3 text-indigo-500 text-xs font-medium">Về hôm nay</button>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e, i) => <ClassCard key={i} entry={e} />)}
        </div>
      )}
    </div>
  );
}

// ── Lịch học: Tuần ───────────────────────────────────
function WeekView({ timetable }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDow, setSelectedDow] = useState(todayDow() || 2);

  // Tính ngày đầu tuần (Thứ 2)
  function getWeekDates(offset) {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1=Mon…7=Sun
    const mon = new Date(now); mon.setDate(now.getDate() - (dayOfWeek - 1) + offset * 7);
    return [2,3,4,5,6,7].map((dow, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      return { dow, date: d };
    });
  }

  const weekDates = getWeekDates(weekOffset);
  const today = new Date();
  const fmtMonth = (d) => `${d.getMonth()+1}/${d.getFullYear()}`;
  const weekLabel = `Th${weekDates[0].date.getDate()} – Th${weekDates[5].date.getDate()}, ${fmtMonth(weekDates[0].date)}`;

  const entries = timetable.filter(e => e.dayOfWeek === selectedDow).sort((a,b) => a.period - b.period);

  function isToday(d) {
    return d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
  }
  function hasClass(dow) { return timetable.some(e => e.dayOfWeek === dow); }

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setWeekOffset(w => w-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{weekLabel}</p>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-500 font-medium">Tuần này</button>}
        </div>
        <button onClick={() => setWeekOffset(w => w+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {weekDates.map(({ dow, date }) => {
          const active = dow === selectedDow;
          const today_ = isToday(date);
          const hasC = hasClass(dow);
          return (
            <button key={dow} onClick={() => setSelectedDow(dow)}
              className={`flex flex-col items-center min-w-[46px] py-2 px-1 rounded-2xl transition-all ${
                active ? 'bg-indigo-600 text-white shadow-md' :
                today_ ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
              <span className="text-xs font-medium">{DAY_SHORT[dow]}</span>
              <span className={`text-sm font-bold mt-0.5`}>{date.getDate()}</span>
              {hasC && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${active ? 'bg-white/70' : 'bg-indigo-400'}`} />}
            </button>
          );
        })}
      </div>

      {/* Classes */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{DAY_FULL[selectedDow]}</p>
        {entries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-sm">Không có lịch học</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e, i) => <ClassCard key={i} entry={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lịch học: Tháng ──────────────────────────────────
function MonthView({ timetable }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const baseDate = new Date();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + monthOffset;
  const displayDate = new Date(year, month, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();

  function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
  function getFirstDow(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 7 : d; } // 1=Mon..7=Sun

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDow = getFirstDow(displayYear, displayMonth); // 1=Mon..7=Sun
  const blanks = firstDow - 1; // cells before 1st

  function dateDow(day) {
    const d = new Date(displayYear, displayMonth, day).getDay();
    return d === 0 ? null : d + 1; // app: 2=Mon..7=Sat, null=Sun
  }
  function hasClass(day) { const dow = dateDow(day); return dow && timetable.some(e => e.dayOfWeek === dow); }
  function isToday(day) {
    const t = new Date(); return day===t.getDate() && displayMonth===t.getMonth() && displayYear===t.getFullYear();
  }
  function isSelected(day) {
    return day===selectedDate.getDate() && displayMonth===selectedDate.getMonth() && displayYear===selectedDate.getFullYear();
  }

  const selectedDow = selectedDate.getDay() === 0 ? null : selectedDate.getDay() + 1;
  const selectedEntries = timetable.filter(e => e.dayOfWeek === selectedDow).sort((a,b) => a.period - b.period);

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setMonthOffset(o => o-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{monthNames[displayMonth]} {displayYear}</p>
        <button onClick={() => setMonthOffset(o => o+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        {/* Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const today_ = isToday(day);
            const hasC = hasClass(day);
            const isSun = new Date(displayYear, displayMonth, day).getDay() === 0;
            return (
              <button key={day} onClick={() => setSelectedDate(new Date(displayYear, displayMonth, day))}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  selected ? 'bg-indigo-600' :
                  today_ ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                <span className={`text-sm leading-5 font-medium ${
                  selected ? 'text-white' :
                  today_ ? 'text-indigo-600' :
                  isSun ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'
                }`}>{day}</span>
                {hasC && <span className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white/70' : 'bg-indigo-400'}`} />}
                {!hasC && <span className="w-1.5 h-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day classes */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          {selectedDate.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit' })}
        </p>
        {selectedEntries.length === 0 ? (
          <div className="py-6 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <p className="text-gray-400 text-sm">Không có lịch học</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedEntries.map((e, i) => <ClassCard key={i} entry={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Biểu đồ 7 ngày ───────────────────────────────────
function WeekChart({ history }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('vi-VN', { weekday:'short' });
    const record = history.find(h => h.date === key);
    days.push({ key, label, status: record?.status || null });
  }
  const colorMap = { present:'bg-emerald-400', late:'bg-yellow-400', absent:'bg-red-400' };
  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 h-28">
        {days.map(d => (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-20">
              <div className={`w-full rounded-t-lg ${colorMap[d.status] || 'bg-gray-100 dark:bg-gray-700'}`}
                style={{ height: d.status ? '100%' : '15%' }} />
            </div>
            <span className="text-xs text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {[['bg-emerald-400','Có mặt'],['bg-yellow-400','Muộn'],['bg-red-400','Vắng'],['bg-gray-200','Không có']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full ${c}`} /> {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────
export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [mainTab, setMainTab]   = useState('home');
  const [schedView, setSchedView] = useState('week'); // day|week|month
  const [dark, setDark]         = useState(() => localStorage.getItem('darkMode') === 'true');

  const [timetable, setTimetable]       = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSessionBanner, setNewSessionBanner] = useState(null);
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [lbPeriod, setLbPeriod]         = useState('');
  const [toast, setToast]               = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [showLeave, setShowLeave]       = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const prevSessionIds = useRef(new Set());
  const trackingRef    = useRef(null);

  // dark mode
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const showToast = (msg, type='success') => setToast({ message:msg, type });

  // Fetch data
  const fetchHistory = useCallback(async () => {
    try { const res = await attendanceAPI.getHistory({}); setHistory(res.data.data || []); }
    catch {} finally { setLoading(false); }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const res = await attendanceAPI.getLeaderboard(user.classId);
      setLeaderboard(res.data.data || []); setLbPeriod(res.data.period || '');
    } catch {}
  }, [user?.classId]);

  const fetchTimetable = useCallback(async () => {
    if (!user?.classId) return;
    try { const res = await timetableAPI.get(user.classId); setTimetable(res.data.timetable || []); }
    catch {}
  }, [user?.classId]);

  const fetchActiveSessions = useCallback(async (silent=false) => {
    if (!user?.classId) return;
    if (!silent) setSessionsLoading(true);
    try {
      const res = await sessionAPI.getActive(user.classId);
      const sessions = res.data.sessions || [];
      const currentIds = new Set(sessions.map(s => s.sessionId));
      const newSess = sessions.filter(s => !prevSessionIds.current.has(s.sessionId));
      if (newSess.length > 0 && prevSessionIds.current.size > 0) {
        setNewSessionBanner(newSess[0]);
        setTimeout(() => setNewSessionBanner(null), 8000);
      }
      prevSessionIds.current = currentIds;
      setActiveSessions(sessions);
    } catch { setActiveSessions([]); }
    if (!silent) setSessionsLoading(false);
  }, [user?.classId]);

  useEffect(() => {
    fetchHistory(); fetchLeaderboard(); fetchTimetable(); fetchActiveSessions();
    const iv = setInterval(() => fetchActiveSessions(true), 60000);
    return () => clearInterval(iv);
  }, [fetchHistory, fetchLeaderboard, fetchTimetable, fetchActiveSessions]);

  // GPS tracking
  const startLocationTracking = useCallback((session) => {
    if (trackingRef.current) clearInterval(trackingRef.current);
    const send = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        sessionAPI.updateLocation(session.sessionId, {
          lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy,
        }).catch(() => {});
      }, () => {}, { timeout:10000, maximumAge:30000 });
    };
    send();
    trackingRef.current = setInterval(send, 10*60*1000);
  }, []);
  useEffect(() => () => { if (trackingRef.current) clearInterval(trackingRef.current); }, []);

  const handleSuccess = (status) => {
    setShowModal(false);
    if (selectedSession && (status==='present'||status==='late')) startLocationTracking(selectedSession);
    setSelectedSession(null);
    if (status==='late') showToast('Điểm danh muộn!','warning');
    else showToast('Điểm danh thành công!');
    fetchHistory(); fetchLeaderboard(); fetchActiveSessions();
  };

  const stats = {
    total:   history.length,
    present: history.filter(h => h.status==='present').length,
    late:    history.filter(h => h.status==='late').length,
    absent:  history.filter(h => h.status==='absent').length,
  };
  const rate = stats.total > 0 ? Math.round(((stats.present+stats.late)/stats.total)*100) : 0;

  // ── RENDER PAGES ─────────────────────────────────
  const renderHome = () => (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg">
        <p className="text-indigo-100 text-xs mb-1">
          {new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              : (user?.name?.[0] || 'S')
            }
          </div>
          <div>
            <p className="text-indigo-100 text-xs">Xin chào,</p>
            <p className="font-bold text-lg leading-tight">{user?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs mb-4 flex-wrap">
          <span className="bg-white/15 px-3 py-1 rounded-full">MSSV: {user?.mssv || 'N/A'}</span>
          <span className="bg-white/15 px-3 py-1 rounded-full">Lớp: {user?.classId || 'N/A'}</span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-indigo-100 mb-1.5">
            <span>Tỷ lệ điểm danh</span>
            <span className="font-bold text-white">{rate}%</span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width:`${rate}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label:'Tổng', value:stats.total, color:'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
          { label:'Có mặt', value:stats.present, color:'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label:'Muộn', value:stats.late, color:'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
          { label:'Vắng', value:stats.absent, color:'text-red-500 bg-red-50 dark:bg-red-900/20' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 text-center">
            <div className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Phiên điểm danh hôm nay
          </p>
          <button onClick={fetchActiveSessions} disabled={sessionsLoading} className="text-gray-400 hover:text-gray-600 p-1">
            <RefreshCw size={14} className={sessionsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        {sessionsLoading ? (
          <div className="py-6 text-center text-gray-400 text-sm">Đang kiểm tra...</div>
        ) : activeSessions.length === 0 ? (
          <div className="py-6 text-center">
            <Clock size={24} className="mx-auto text-gray-200 dark:text-gray-700 mb-1.5" />
            <p className="text-gray-400 text-sm">Chưa có phiên nào đang mở</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activeSessions.map(session => (
              <div key={session.sessionId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{session.subject}</p>
                  <p className="text-xs text-gray-400">Ca {session.period} · {session.startTime}–{session.endTime}</p>
                </div>
                <button onClick={() => { setSelectedSession(session); setShowModal(true); }}
                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-semibold">
                  <Camera size={14} /> Điểm danh
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave */}
      <button onClick={() => setShowLeave(true)}
        className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 shadow-sm flex items-center justify-center gap-3 transition-all">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <BookOpen size={18} className="text-indigo-600" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm text-gray-800 dark:text-white">Xin nghỉ phép</p>
          <p className="text-xs text-gray-400">Gửi đơn xin nghỉ buổi học</p>
        </div>
      </button>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
        {[['day','Ngày'],['week','Tuần'],['month','Tháng']].map(([key,label]) => (
          <button key={key} onClick={() => setSchedView(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              schedView===key ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}>
            {label}
          </button>
        ))}
      </div>
      {schedView === 'day'   && <DayView   timetable={timetable} />}
      {schedView === 'week'  && <WeekView  timetable={timetable} />}
      {schedView === 'month' && <MonthView timetable={timetable} />}
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-4">
      {/* Biểu đồ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-indigo-500" /> 7 ngày qua
        </h4>
        <WeekChart history={history} />
      </div>

      {/* History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">Lịch sử — {stats.total} buổi</p>
          <button onClick={fetchHistory} className="text-indigo-500 text-xs font-medium">Làm mới</button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Chưa có lịch sử</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  {['Ngày','Giờ','Trạng thái'].map(h => <th key={h} className="px-4 py-2.5 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((item, i) => {
                  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.date}</td>
                      <td className="px-4 py-3 text-gray-500">{item.time}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Trophy size={15} className="text-yellow-500" /> Xếp hạng lớp
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Tuần này ({lbPeriod})</p>
        </div>
        {leaderboard.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${item.mssv===user?.mssv ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                <span className="w-6 text-center text-sm font-bold text-gray-400">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${item.mssv===user?.mssv ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}`}>
                    {item.name} {item.mssv===user?.mssv && <span className="text-xs opacity-60">(Bạn)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{item.present}/{item.total} buổi</p>
                </div>
                <span className={`font-bold text-sm ${item.rate>=80?'text-emerald-600':item.rate>=60?'text-yellow-600':'text-red-500'}`}>{item.rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      {/* User card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : (user?.name?.[0] || 'S')
            }
          </div>
          <div>
            <p className="font-bold text-lg">{user?.name}</p>
            <p className="text-indigo-100 text-sm">{user?.mssv}</p>
            <p className="text-indigo-100 text-sm">Lớp: {user?.classId}</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 text-left transition-colors">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <User size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white">Chỉnh sửa hồ sơ</p>
            <p className="text-xs text-gray-400">Ảnh đại diện, tên, đổi mật khẩu</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button onClick={() => setDark(d => !d)}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {dark ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-gray-600" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white">Giao diện</p>
            <p className="text-xs text-gray-400">{dark ? 'Đang dùng tối' : 'Đang dùng sáng'}</p>
          </div>
          <div className={`w-10 h-5.5 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-gray-200'} relative`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>

      <button onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 py-3.5 rounded-2xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
        <LogOut size={16} /> Đăng xuất
      </button>
    </div>
  );

  const pages = { home: renderHome, schedule: renderSchedule, attendance: renderAttendance, profile: renderProfile };
  const pageTitles = { home:'Trang chủ', schedule:'Lịch học', attendance:'Điểm danh', profile:'Cá nhân' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <p className="font-bold text-base text-gray-900 dark:text-white">{pageTitles[mainTab]}</p>
        <div className="flex items-center gap-2">
          {activeSessions.length > 0 && mainTab !== 'home' && (
            <button onClick={() => setMainTab('home')}
              className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeSessions.length} phiên mở
            </button>
          )}
        </div>
      </div>

      {/* New session banner */}
      {newSessionBanner && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto max-w-sm w-full">
            <Bell size={16} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs">Phiên điểm danh vừa mở!</p>
              <p className="text-indigo-100 text-xs truncate">{newSessionBanner.subject}</p>
            </div>
            <button onClick={() => { setSelectedSession(newSessionBanner); setShowModal(true); setNewSessionBanner(null); }}
              className="shrink-0 bg-white text-indigo-600 px-2.5 py-1.5 rounded-xl text-xs font-bold">
              Điểm danh
            </button>
            <button onClick={() => setNewSessionBanner(null)} className="text-white/60 hover:text-white"><XCircle size={14} /></button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {pages[mainTab]?.()}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { key:'home',       icon:Home,         label:'Trang chủ' },
            { key:'schedule',   icon:Calendar,      label:'Lịch học' },
            { key:'attendance', icon:ClipboardList, label:'Điểm danh' },
            { key:'profile',    icon:User,          label:'Cá nhân' },
          ].map(({ key, icon: Icon, label }) => {
            const active = mainTab === key;
            return (
              <button key={key} onClick={() => setMainTab(key)}
                className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all">
                <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''}`}>
                  <Icon size={20} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
                </div>
                <span className={`text-xs font-medium ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <AttendanceModal classId={user?.classId} session={selectedSession}
          onClose={() => { setShowModal(false); setSelectedSession(null); }}
          onSuccess={handleSuccess} />
      )}
      {showLeave && <LeaveModal user={user} onClose={() => setShowLeave(false)} />}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)}
          onUpdateName={(n) => { onUpdateUser?.(n, user?.avatar); setShowProfile(false); }}
          onUpdateAvatar={(a) => onUpdateUser?.(user?.name, a)} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
