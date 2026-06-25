import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Calendar, Clock, BookOpen, XCircle,
  Trophy, BarChart2, RefreshCw, Bell, Home, User,
  ClipboardList, ChevronLeft, ChevronRight, Moon, Sun, LogOut,
  GraduationCap, Lock, Eye, EyeOff, Check, AlertCircle,
} from 'lucide-react';
import { attendanceAPI, sessionAPI, timetableAPI, authAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import LeaveModal from './LeaveModal';

// ── Helpers ───────────────────────────────────────────
const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  late:    { label: 'Muộn',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  absent:  { label: 'Vắng',   color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
};
const DAY_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL  = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
function todayDow() { const d = new Date().getDay(); return d === 0 ? null : d + 1; }

const BORDER_COLORS = [
  'border-l-blue-500','border-l-violet-500','border-l-emerald-500',
  'border-l-orange-500','border-l-rose-500','border-l-teal-500',
];
const DOT_COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-orange-500','bg-rose-500','bg-teal-500'];
function subjectIdx(subject) {
  let h = 0; for (const c of subject) h = ((h << 5) - h) + c.charCodeAt(0);
  return Math.abs(h) % BORDER_COLORS.length;
}

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = { success:'bg-indigo-600', warning:'bg-yellow-500', error:'bg-red-500' };
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${bg[type]||bg.success} whitespace-nowrap`}>
      {message}
    </div>
  );
}

// ── Thẻ môn học ───────────────────────────────────────
function ClassCard({ entry }) {
  const idx = subjectIdx(entry.subject);
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 ${BORDER_COLORS[idx]} shadow-sm px-4 py-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800 dark:text-white">{entry.subject}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} /> {entry.startTime} – {entry.endTime}
            </span>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${DOT_COLORS[idx].replace('bg-','bg-').replace('500','100')} text-${DOT_COLORS[idx].split('-')[1]}-600`}>
          Ca {entry.period}
        </span>
      </div>
    </div>
  );
}

// ── Lịch học: Hôm nay ────────────────────────────────
function TodayView({ timetable }) {
  const dow = todayDow();
  const entries = timetable.filter(e => e.dayOfWeek === dow).sort((a,b) => a.period - b.period);
  const dateStr = new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <p className="text-xs text-gray-400 capitalize">{dateStr}</p>
      </div>
      {entries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm py-12 text-center">
          <Calendar size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm font-medium">Hôm nay không có lịch học</p>
          <p className="text-gray-400 text-xs mt-1">Chuyển sang tab Tuần để xem lịch cả tuần</p>
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

  function getWeekDates(offset) {
    const now = new Date();
    const d = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - (d - 1) + offset * 7);
    return [2,3,4,5,6,7].map((dow, i) => {
      const dt = new Date(mon); dt.setDate(mon.getDate() + i);
      return { dow, date: dt };
    });
  }

  const weekDates = getWeekDates(weekOffset);
  const today = new Date();
  const isToday = (d) => d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
  const hasClass = (dow) => timetable.some(e => e.dayOfWeek === dow);
  const entries = timetable.filter(e => e.dayOfWeek === selectedDow).sort((a,b) => a.period - b.period);

  const wStart = weekDates[0].date;
  const wEnd   = weekDates[5].date;
  const weekLabel = `${wStart.getDate()}/${wStart.getMonth()+1} – ${wEnd.getDate()}/${wEnd.getMonth()+1}/${wEnd.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setWeekOffset(w=>w-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button onClick={() => { setWeekOffset(0); setSelectedDow(todayDow()||2); }}
              className="text-xs text-indigo-500 font-medium">Tuần này</button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w=>w+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day chips */}
      <div className="grid grid-cols-6 gap-1.5">
        {weekDates.map(({ dow, date }) => {
          const active = dow === selectedDow;
          const today_ = isToday(date);
          const hasC = hasClass(dow);
          return (
            <button key={dow} onClick={() => setSelectedDow(dow)}
              className={`flex flex-col items-center py-2.5 rounded-2xl transition-all ${
                active ? 'bg-indigo-600 text-white shadow-md' :
                today_ ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm'
              }`}>
              <span className="text-xs font-medium">{DAY_SHORT[dow]}</span>
              <span className="text-sm font-bold mt-0.5">{date.getDate()}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                hasC ? (active ? 'bg-white/60' : 'bg-indigo-400') : 'opacity-0'
              }`} />
            </button>
          );
        })}
      </div>

      {/* Classes */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">{DAY_FULL[selectedDow]}</p>
        {entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm py-8 text-center">
            <p className="text-gray-400 text-sm">Không có lịch học</p>
          </div>
        ) : (
          <div className="space-y-2.5">{entries.map((e,i) => <ClassCard key={i} entry={e} />)}</div>
        )}
      </div>
    </div>
  );
}

// ── Lịch học: Tháng ──────────────────────────────────
function MonthView({ timetable }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const base = new Date();
  const displayDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const Y = displayDate.getFullYear(), M = displayDate.getMonth();

  const daysInMonth = new Date(Y, M+1, 0).getDate();
  const firstDow    = (() => { const d = new Date(Y,M,1).getDay(); return d===0?7:d; })();

  const dateDow = (day) => { const d = new Date(Y,M,day).getDay(); return d===0?null:d+1; };
  const hasClass = (day) => { const dow=dateDow(day); return dow && timetable.some(e=>e.dayOfWeek===dow); };
  const isToday  = (day) => { const t=new Date(); return day===t.getDate()&&M===t.getMonth()&&Y===t.getFullYear(); };
  const isSel    = (day) => day===selectedDate.getDate()&&M===selectedDate.getMonth()&&Y===selectedDate.getFullYear();

  const selDow = selectedDate.getDay()===0?null:selectedDate.getDay()+1;
  const selEntries = timetable.filter(e=>e.dayOfWeek===selDow).sort((a,b)=>a.period-b.period);
  const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setMonthOffset(o=>o-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronLeft size={18}/></button>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{MONTHS[M]} {Y}</p>
        <button onClick={() => setMonthOffset(o=>o+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronRight size={18}/></button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-7 mb-2">
          {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${d==='CN'?'text-red-400':'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDow-1).fill(null).map((_,i)=><div key={`b${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day=i+1, sel=isSel(day), tod=isToday(day), hasC=hasClass(day);
            const isSun=new Date(Y,M,day).getDay()===0;
            return (
              <button key={day} onClick={()=>setSelectedDate(new Date(Y,M,day))}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${sel?'bg-indigo-600':tod?'bg-indigo-50 dark:bg-indigo-900/20':'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                <span className={`text-sm font-medium ${sel?'text-white':tod?'text-indigo-600':isSun?'text-red-400':'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${hasC?(sel?'bg-white/60':'bg-indigo-400'):'opacity-0'}`}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
          {selectedDate.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'})}
        </p>
        {selEntries.length===0
          ? <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm py-6 text-center"><p className="text-gray-400 text-sm">Không có lịch học</p></div>
          : <div className="space-y-2.5">{selEntries.map((e,i)=><ClassCard key={i} entry={e}/>)}</div>
        }
      </div>
    </div>
  );
}

// ── Biểu đồ 7 ngày ───────────────────────────────────
function WeekChart({ history }) {
  const days = [];
  for (let i=6; i>=0; i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const key=d.toISOString().split('T')[0];
    const label=d.toLocaleDateString('vi-VN',{weekday:'short'});
    const record=history.find(h=>h.date===key);
    days.push({key,label,status:record?.status||null});
  }
  const colorMap={present:'bg-emerald-400',late:'bg-yellow-400',absent:'bg-red-400'};
  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 h-24">
        {days.map(d=>(
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-16">
              <div className={`w-full rounded-t-lg ${colorMap[d.status]||'bg-gray-100 dark:bg-gray-700'}`} style={{height:d.status?'100%':'12%'}}/>
            </div>
            <span className="text-xs text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {[['bg-emerald-400','Có mặt'],['bg-yellow-400','Muộn'],['bg-red-400','Vắng']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${c}`}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline Profile ────────────────────────────────────
function ProfileTab({ user, onUpdateUser, onLogout, dark, setDark }) {
  const [name, setName]         = useState(user?.name || '');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [pw, setPw]             = useState({ current:'', newPw:'', confirm:'' });
  const [showEye, setShowEye]   = useState({ current:false, newPw:false, confirm:false });
  const [pwMsg, setPwMsg]       = useState({ text:'', ok:true });
  const [pwSaving, setPwSaving] = useState(false);

  const avatarLetter = (user?.name || 'S')[0].toUpperCase();

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    setSaving(true); setSaveMsg('');
    try {
      await authAPI.updateProfile({ name: name.trim() });
      onUpdateUser?.(name.trim(), user?.avatar);
      setSaveMsg('Đã cập nhật tên');
    } catch { setSaveMsg('Lỗi cập nhật'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const changePassword = async () => {
    if (!pw.current || !pw.newPw || !pw.confirm) { setPwMsg({text:'Vui lòng điền đủ thông tin',ok:false}); return; }
    if (pw.newPw !== pw.confirm) { setPwMsg({text:'Mật khẩu mới không khớp',ok:false}); return; }
    if (pw.newPw.length < 6)    { setPwMsg({text:'Mật khẩu tối thiểu 6 ký tự',ok:false}); return; }
    setPwSaving(true); setPwMsg({text:'',ok:true});
    try {
      await authAPI.changePassword({ currentPassword: pw.current, newPassword: pw.newPw });
      setPwMsg({text:'Đổi mật khẩu thành công',ok:true});
      setPw({current:'',newPw:'',confirm:''});
      setShowPw(false);
    } catch (err) {
      setPwMsg({text: err.response?.data?.message || 'Mật khẩu hiện tại không đúng', ok:false});
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg({text:'',ok:true}), 3000);
  };

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowEye(p=>({...p,[field]:!p[field]}))} className="text-gray-400 hover:text-gray-600 p-1">
      {showEye[field] ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Avatar + identity */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
              : avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">{user?.name}</p>
            <p className="text-indigo-100 text-sm">{user?.mssv}</p>
            <p className="text-indigo-100 text-xs mt-0.5">Lớp: {user?.classId}</p>
          </div>
        </div>
      </div>

      {/* Thông tin */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Thông tin cá nhân</p>
        </div>

        {/* MSSV - readonly */}
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <label className="text-xs text-gray-400 mb-1 block">Mã sinh viên</label>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.mssv || '—'}</p>
        </div>

        {/* Lớp - readonly */}
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <label className="text-xs text-gray-400 mb-1 block">Lớp</label>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.classId || '—'}</p>
        </div>

        {/* Tên - editable */}
        <div className="px-4 py-3">
          <label className="text-xs text-gray-400 mb-1.5 block">Họ và tên</label>
          <div className="flex gap-2">
            <input value={name} onChange={e=>setName(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <button onClick={saveName} disabled={saving || name.trim()===user?.name}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all">
              <Check size={14}/> {saving ? '...' : 'Lưu'}
            </button>
          </div>
          {saveMsg && <p className="text-xs text-emerald-600 mt-1.5">{saveMsg}</p>}
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowPw(p=>!p)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Lock size={14} className="text-indigo-600"/>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">Đổi mật khẩu</p>
          </div>
          <ChevronRight size={16} className={`text-gray-300 transition-transform ${showPw?'rotate-90':''}`}/>
        </button>

        {showPw && (
          <div className="px-4 pb-4 space-y-3 border-t dark:border-gray-700 pt-3">
            {[
              { field:'current', label:'Mật khẩu hiện tại' },
              { field:'newPw',   label:'Mật khẩu mới' },
              { field:'confirm', label:'Xác nhận mật khẩu mới' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <input
                    type={showEye[field] ? 'text' : 'password'}
                    value={pw[field]}
                    onChange={e => setPw(p=>({...p,[field]:e.target.value}))}
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent dark:text-white focus:outline-none"
                  />
                  <EyeBtn field={field}/>
                </div>
              </div>
            ))}

            {pwMsg.text && (
              <div className={`flex items-center gap-2 text-xs ${pwMsg.ok?'text-emerald-600':'text-red-500'}`}>
                {pwMsg.ok ? <Check size={13}/> : <AlertCircle size={13}/>} {pwMsg.text}
              </div>
            )}

            <button onClick={changePassword} disabled={pwSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
              {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        )}
      </div>

      {/* Giao diện + Đăng xuất */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setDark(d=>!d)}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {dark ? <Sun size={14} className="text-yellow-500"/> : <Moon size={14} className="text-gray-500"/>}
          </div>
          <p className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-white">
            Giao diện {dark ? 'tối' : 'sáng'}
          </p>
          {/* Toggle */}
          <div className={`w-10 h-6 rounded-full transition-colors relative ${dark?'bg-indigo-600':'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${dark?'translate-x-5':'translate-x-1'}`}/>
          </div>
        </button>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut size={14} className="text-red-500"/>
          </div>
          <p className="text-sm font-medium text-red-500">Đăng xuất</p>
        </button>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────
export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [mainTab, setMainTab]     = useState('home');
  const [schedView, setSchedView] = useState('today');
  const [dark, setDark]           = useState(() => localStorage.getItem('darkMode') === 'true');

  const [timetable, setTimetable]           = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSessionBanner, setNewSessionBanner] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod] = useState('');
  const [toast, setToast]       = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [showLeave, setShowLeave]   = useState(false);
  const prevSessionIds = useRef(new Set());
  const trackingRef    = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const showToast = (msg, type='success') => setToast({ message:msg, type });

  const fetchHistory = useCallback(async () => {
    try { const r = await attendanceAPI.getHistory({}); setHistory(r.data.data || []); }
    catch {} finally { setLoading(false); }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const r = await attendanceAPI.getLeaderboard(user.classId);
      setLeaderboard(r.data.data || []); setLbPeriod(r.data.period || '');
    } catch {}
  }, [user?.classId]);

  const fetchTimetable = useCallback(async () => {
    if (!user?.classId) return;
    try { const r = await timetableAPI.get(user.classId); setTimetable(r.data.timetable || []); }
    catch {}
  }, [user?.classId]);

  const fetchActiveSessions = useCallback(async (silent=false) => {
    if (!user?.classId) return;
    if (!silent) setSessionsLoading(true);
    try {
      const r = await sessionAPI.getActive(user.classId);
      const sessions = r.data.sessions || [];
      const currentIds = new Set(sessions.map(s=>s.sessionId));
      const newS = sessions.filter(s=>!prevSessionIds.current.has(s.sessionId));
      if (newS.length > 0 && prevSessionIds.current.size > 0) {
        setNewSessionBanner(newS[0]);
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

  const startLocationTracking = useCallback((session) => {
    if (trackingRef.current) clearInterval(trackingRef.current);
    const send = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        sessionAPI.updateLocation(session.sessionId, {
          lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:pos.coords.accuracy,
        }).catch(()=>{});
      }, ()=>{}, { timeout:10000, maximumAge:30000 });
    };
    send();
    trackingRef.current = setInterval(send, 10*60*1000);
  }, []);
  useEffect(() => () => { if (trackingRef.current) clearInterval(trackingRef.current); }, []);

  const handleSuccess = (status) => {
    setShowModal(false);
    if (selectedSession && (status==='present'||status==='late')) startLocationTracking(selectedSession);
    setSelectedSession(null);
    showToast(status==='late' ? 'Điểm danh muộn!' : 'Điểm danh thành công!', status==='late'?'warning':'success');
    fetchHistory(); fetchLeaderboard(); fetchActiveSessions();
  };

  const stats = {
    total:   history.length,
    present: history.filter(h=>h.status==='present').length,
    late:    history.filter(h=>h.status==='late').length,
    absent:  history.filter(h=>h.status==='absent').length,
  };
  const rate = stats.total > 0 ? Math.round(((stats.present+stats.late)/stats.total)*100) : 0;

  // ── Pages ─────────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-4">
      {/* App brand + greeting */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-3xl p-5 text-white shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-4 opacity-80">
          <GraduationCap size={18}/>
          <span className="text-sm font-bold tracking-widest uppercase">Điểm Danh</span>
        </div>
        {/* User */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
              : (user?.name?.[0]||'S').toUpperCase()}
          </div>
          <div>
            <p className="text-indigo-100 text-xs">Xin chào,</p>
            <p className="font-bold text-lg leading-tight">{user?.name}</p>
            <p className="text-indigo-200 text-xs">{user?.mssv} · Lớp {user?.classId}</p>
          </div>
        </div>
        {/* Rate */}
        <div>
          <div className="flex justify-between text-xs text-indigo-100 mb-1.5">
            <span>Tỷ lệ điểm danh</span>
            <span className="font-bold text-white">{rate}%</span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{width:`${rate}%`}}/>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {label:'Tổng', value:stats.total, tw:'text-indigo-600'},
          {label:'Có mặt', value:stats.present, tw:'text-emerald-600'},
          {label:'Muộn', value:stats.late, tw:'text-yellow-500'},
          {label:'Vắng', value:stats.absent, tw:'text-red-500'},
        ].map(({label,value,tw}) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 text-center">
            <p className={`text-2xl font-bold ${tw}`}>{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            Phiên điểm danh hôm nay
          </p>
          <button onClick={fetchActiveSessions} disabled={sessionsLoading} className="text-gray-400 hover:text-gray-600 p-1">
            <RefreshCw size={14} className={sessionsLoading?'animate-spin':''}/>
          </button>
        </div>
        {sessionsLoading ? (
          <div className="py-6 text-center text-gray-400 text-sm">Đang kiểm tra...</div>
        ) : activeSessions.length === 0 ? (
          <div className="py-6 text-center">
            <Clock size={22} className="mx-auto text-gray-200 dark:text-gray-700 mb-1.5"/>
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
                <button onClick={()=>{setSelectedSession(session);setShowModal(true);}}
                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-semibold">
                  <Camera size={13}/> Điểm danh
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave */}
      <button onClick={()=>setShowLeave(true)}
        className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 shadow-sm flex items-center justify-center gap-3 transition-all">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <BookOpen size={16} className="text-indigo-600"/>
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
        {[['today','Hôm nay'],['week','Tuần'],['month','Tháng']].map(([key,label]) => (
          <button key={key} onClick={()=>setSchedView(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              schedView===key ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            {label}
          </button>
        ))}
      </div>
      {schedView==='today' && <TodayView timetable={timetable}/>}
      {schedView==='week'  && <WeekView  timetable={timetable}/>}
      {schedView==='month' && <MonthView timetable={timetable}/>}
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-indigo-500"/> 7 ngày qua
        </h4>
        <WeekChart history={history}/>
      </div>

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
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase">
                <tr>{['Ngày','Giờ','Trạng thái'].map(h=><th key={h} className="px-4 py-2.5 text-left">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((item,i) => {
                  const s = STATUS_CONFIG[item.status]||STATUS_CONFIG.absent;
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.date}</td>
                      <td className="px-4 py-3 text-gray-400">{item.time}</td>
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Trophy size={15} className="text-yellow-500"/> Xếp hạng lớp
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Tuần này · {lbPeriod}</p>
        </div>
        {leaderboard.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.map((item,i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${item.mssv===user?.mssv?'bg-indigo-50 dark:bg-indigo-900/20':''}`}>
                <span className="w-6 text-center text-sm font-bold text-gray-300">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${item.mssv===user?.mssv?'text-indigo-600 dark:text-indigo-400':'text-gray-800 dark:text-white'}`}>
                    {item.name} {item.mssv===user?.mssv&&<span className="text-xs opacity-50">(Bạn)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{item.present}/{item.total} buổi</p>
                </div>
                <span className={`font-bold text-sm ${item.rate>=80?'text-emerald-600':item.rate>=60?'text-yellow-500':'text-red-500'}`}>{item.rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const pageTitles = { home:'Trang chủ', schedule:'Lịch học', attendance:'Điểm danh', profile:'Cá nhân' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-indigo-600"/>
          <p className="font-bold text-sm text-gray-900 dark:text-white">{pageTitles[mainTab]}</p>
        </div>
        {activeSessions.length > 0 && mainTab !== 'home' && (
          <button onClick={()=>setMainTab('home')}
            className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            {activeSessions.length} phiên mở
          </button>
        )}
      </div>

      {/* Session banner */}
      {newSessionBanner && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto max-w-sm w-full">
            <Bell size={16} className="shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs">Phiên điểm danh vừa mở!</p>
              <p className="text-indigo-100 text-xs truncate">{newSessionBanner.subject}</p>
            </div>
            <button onClick={()=>{setSelectedSession(newSessionBanner);setShowModal(true);setNewSessionBanner(null);}}
              className="bg-white text-indigo-600 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0">
              Điểm danh
            </button>
            <button onClick={()=>setNewSessionBanner(null)} className="text-white/60 hover:text-white shrink-0"><XCircle size={14}/></button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {mainTab==='home'       && renderHome()}
        {mainTab==='schedule'   && renderSchedule()}
        {mainTab==='attendance' && renderAttendance()}
        {mainTab==='profile'    && (
          <ProfileTab user={user} onUpdateUser={onUpdateUser} onLogout={onLogout} dark={dark} setDark={setDark}/>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { key:'home',       Icon:Home,         label:'Trang chủ' },
            { key:'schedule',   Icon:Calendar,      label:'Lịch học' },
            { key:'attendance', Icon:ClipboardList, label:'Điểm danh' },
            { key:'profile',    Icon:User,          label:'Cá nhân' },
          ].map(({ key, Icon, label }) => {
            const active = mainTab === key;
            return (
              <button key={key} onClick={()=>setMainTab(key)}
                className="flex flex-col items-center gap-0.5 px-4 py-1">
                <div className={`p-2 rounded-xl transition-all ${active?'bg-indigo-100 dark:bg-indigo-900/40':''}`}>
                  <Icon size={20} className={active?'text-indigo-600 dark:text-indigo-400':'text-gray-400'}/>
                </div>
                <span className={`text-xs font-medium ${active?'text-indigo-600 dark:text-indigo-400':'text-gray-400'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showModal && (
        <AttendanceModal classId={user?.classId} session={selectedSession}
          onClose={()=>{setShowModal(false);setSelectedSession(null);}}
          onSuccess={handleSuccess}/>
      )}
      {showLeave && <LeaveModal user={user} onClose={()=>setShowLeave(false)}/>}
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
