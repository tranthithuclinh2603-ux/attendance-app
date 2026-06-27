import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Calendar, Clock, BookOpen, XCircle,
  Trophy, BarChart2, RefreshCw, Bell, Home, User,
  ClipboardList, ChevronLeft, ChevronRight, Moon, Sun, LogOut,
  GraduationCap, Lock, Eye, EyeOff, Check, AlertCircle,
  Mail, Hash, Edit2, Fingerprint,
} from 'lucide-react';
import { attendanceAPI, sessionAPI, timetableAPI, authAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import LeaveModal from './LeaveModal';
import ChatBox from './ChatBox';

// ── Helpers ───────────────────────────────────────────
const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  late:    { label: 'Muộn',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  absent:  { label: 'Vắng',   color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
};
const DAY_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL  = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
function todayDow() { const d = new Date().getDay(); return d === 0 ? null : d + 1; }

// Số tuần theo kiểu nhà trường (Tuần 1 = tuần có thứ 2 đầu tiên của năm)
function getSchoolWeek(date) {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay() || 7;
  const daysToFirstMon = jan1Day === 1 ? 0 : (8 - jan1Day);
  const firstMon = new Date(year, 0, 1 + daysToFirstMon);
  const inputDay = date.getDay() || 7;
  const thisMon = new Date(date);
  thisMon.setDate(date.getDate() - (inputDay - 1));
  const diff = Math.floor((thisMon - firstMon) / (7 * 24 * 3600 * 1000));
  return Math.max(1, diff + 1);
}

const BORDER_COLORS = ['border-l-blue-500','border-l-violet-500','border-l-emerald-500','border-l-orange-500','border-l-rose-500','border-l-teal-500'];
const BADGE_STYLES  = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-orange-100 text-orange-700','bg-rose-100 text-rose-700','bg-teal-100 text-teal-700'];
const DOT_COLORS    = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-orange-500','bg-rose-500','bg-teal-500'];
function subjectIdx(s) { let h=0; for(const c of s) h=((h<<5)-h)+c.charCodeAt(0); return Math.abs(h)%BORDER_COLORS.length; }

// ── Toast ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = { success:'bg-indigo-600', warning:'bg-amber-500', error:'bg-red-500' };
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${bg[type]||bg.success} whitespace-nowrap`}>
      {message}
    </div>
  );
}

// ── Thẻ môn học ───────────────────────────────────────
function ClassCard({ entry }) {
  const i = subjectIdx(entry.subject);
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 ${BORDER_COLORS[i]} shadow-sm px-4 py-3.5 flex items-center gap-4`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 dark:text-white">{entry.subject}</p>
        <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
          <Clock size={11}/> {entry.startTime} – {entry.endTime}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl ${BADGE_STYLES[i]}`}>Ca {entry.period}</span>
    </div>
  );
}

function EmptySchedule({ hint }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm py-12 text-center">
      <Calendar size={34} className="mx-auto text-gray-200 dark:text-gray-700 mb-3"/>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Không có lịch học</p>
      {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}

// ── Lịch học: Hôm nay ────────────────────────────────
function TodayView({ timetable }) {
  const dow     = todayDow();
  const entries = timetable.filter(e => e.dayOfWeek === dow).sort((a,b) => a.period - b.period);
  const dateStr = new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 px-1 flex items-center gap-2 capitalize">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"/>
        {dateStr}
      </p>
      {entries.length === 0
        ? <EmptySchedule hint="Chuyển sang Tuần để xem lịch cả tuần"/>
        : entries.map((e,i) => <ClassCard key={i} entry={e}/>)
      }
    </div>
  );
}

// ── Lịch học: Tuần ───────────────────────────────────
function WeekView({ timetable }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDow, setSelectedDow] = useState(todayDow() || 2);

  function getWeekDates(offset) {
    const now = new Date(), d = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - (d-1) + offset*7);
    return [2,3,4,5,6,7].map((dow, i) => {
      const dt = new Date(mon); dt.setDate(mon.getDate()+i); return { dow, date: dt };
    });
  }

  const weekDates  = getWeekDates(weekOffset);
  const today      = new Date();
  const isToday    = (d) => d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
  const hasClass   = (dow) => timetable.some(e => e.dayOfWeek === dow);
  const entries    = timetable.filter(e => e.dayOfWeek === selectedDow).sort((a,b) => a.period-b.period);
  const weekNum    = getSchoolWeek(weekDates[0].date);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={() => setWeekOffset(w=>w-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronLeft size={18}/></button>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tuần {weekNum}, {weekDates[0].date.getFullYear()}</p>
        <button onClick={() => setWeekOffset(w=>w+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronRight size={18}/></button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {weekDates.map(({ dow, date }) => {
          const active = dow === selectedDow, today_ = isToday(date), hasC = hasClass(dow);
          return (
            <button key={dow} onClick={() => setSelectedDow(dow)}
              className={`flex flex-col items-center py-2.5 rounded-2xl transition-all ${active?'bg-indigo-600 text-white shadow-md':today_?'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600':'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm'}`}>
              <span className="text-xs font-medium">{DAY_SHORT[dow]}</span>
              <span className="text-sm font-bold mt-0.5">{date.getDate()}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${hasC?(active?'bg-white/60':'bg-indigo-400'):'opacity-0'}`}/>
            </button>
          );
        })}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">{DAY_FULL[selectedDow]}</p>
        {entries.length === 0
          ? <EmptySchedule/>
          : <div className="space-y-2.5">{entries.map((e,i) => <ClassCard key={i} entry={e}/>)}</div>
        }
      </div>
    </div>
  );
}

// ── Lịch học: Tháng ──────────────────────────────────
function MonthView({ timetable }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const base = new Date();
  const dsp  = new Date(base.getFullYear(), base.getMonth()+monthOffset, 1);
  const Y = dsp.getFullYear(), M = dsp.getMonth();
  const daysInMonth = new Date(Y,M+1,0).getDate();
  const firstDow    = (() => { const d=new Date(Y,M,1).getDay(); return d===0?7:d; })();
  const dateDow  = (day) => { const d=new Date(Y,M,day).getDay(); return d===0?null:d+1; };
  const hasClass = (day) => { if (!timetable.length) return false; const dow=dateDow(day); return !!dow && timetable.some(e=>e.dayOfWeek===dow); };
  const isToday  = (day) => { const t=new Date(); return day===t.getDate()&&M===t.getMonth()&&Y===t.getFullYear(); };
  const isSel    = (day) => day===selectedDate.getDate()&&M===selectedDate.getMonth()&&Y===selectedDate.getFullYear();
  const selDow   = selectedDate.getDay()===0?null:selectedDate.getDay()+1;
  const selEnt   = timetable.filter(e=>e.dayOfWeek===selDow).sort((a,b)=>a.period-b.period);
  const MONTHS   = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-3 py-2.5 shadow-sm">
        <button onClick={()=>setMonthOffset(o=>o-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronLeft size={18}/></button>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{MONTHS[M]} {Y}</p>
        <button onClick={()=>setMonthOffset(o=>o+1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><ChevronRight size={18}/></button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-7 mb-2">
          {['T2','T3','T4','T5','T6','T7','CN'].map(d=><div key={d} className={`text-center text-xs font-semibold py-1 ${d==='CN'?'text-red-400':'text-gray-400'}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDow-1).fill(null).map((_,i)=><div key={`b${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const day=i+1, sel=isSel(day), tod=isToday(day), hasC=hasClass(day);
            const isSun=new Date(Y,M,day).getDay()===0;
            return (
              <button key={day} onClick={()=>setSelectedDate(new Date(Y,M,day))}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${sel?'bg-indigo-600':tod?'bg-indigo-50 dark:bg-indigo-900/20':'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}>
                <span className={`text-sm font-medium ${sel?'text-white':tod?'text-indigo-600':isSun?'text-red-400':'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${hasC?(sel?'bg-white/60':'bg-indigo-400'):'opacity-0'}`}/>
              </button>
            );
          })}
        </div>
        {timetable.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">● Ngày có lịch học theo TKB tuần</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
          {selectedDate.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'})}
        </p>
        {selEnt.length===0
          ? <EmptySchedule/>
          : <div className="space-y-2.5">{selEnt.map((e,i)=><ClassCard key={i} entry={e}/>)}</div>
        }
      </div>
    </div>
  );
}

// ── Biểu đồ ──────────────────────────────────────────
function WeekChart({ history }) {
  const days = [];
  for (let i=6; i>=0; i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const key=d.toISOString().split('T')[0];
    const label=d.toLocaleDateString('vi-VN',{weekday:'short'});
    days.push({key,label,status:history.find(h=>h.date===key)?.status||null});
  }
  const colorMap={present:'bg-emerald-400',late:'bg-amber-400',absent:'bg-red-400'};
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-1.5 h-24">
        {days.map(d=>(
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-16">
              <div className={`w-full rounded-t-lg ${colorMap[d.status]||'bg-gray-100 dark:bg-gray-700'}`} style={{height:d.status?'100%':'10%'}}/>
            </div>
            <span className="text-[10px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap">
        {[['bg-emerald-400','Có mặt'],['bg-amber-400','Muộn'],['bg-red-400','Vắng']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${c}`}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile Tab (giống ảnh) ───────────────────────────
function ProfileTab({ user, onUpdateUser, onLogout, dark, setDark }) {
  const [editName, setEditName]   = useState(false);
  const [name, setName]           = useState(user?.name || '');
  const [saving, setSaving]       = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [pw, setPw]               = useState({ current:'', newPw:'', confirm:'' });
  const [showEye, setShowEye]     = useState({ current:false, newPw:false, confirm:false });
  const [pwMsg, setPwMsg]         = useState({ text:'', ok:true });
  const [pwSaving, setPwSaving]   = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef();

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const size = 150;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.width, img.height);
        const ox = (img.width-s)/2, oy = (img.height-s)/2;
        ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        try { await authAPI.updateAvatar({ avatar: base64 }); onUpdateUser?.(user?.name, base64); }
        catch {}
        setAvatarLoading(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveName = async () => {
    if (!name.trim() || name.trim()===user?.name) { setEditName(false); return; }
    setSaving(true);
    try { await authAPI.updateProfile({ name: name.trim() }); onUpdateUser?.(name.trim(), user?.avatar); }
    catch {}
    setSaving(false); setEditName(false);
  };

  const changePassword = async () => {
    if (!pw.current||!pw.newPw||!pw.confirm) { setPwMsg({text:'Vui lòng điền đủ thông tin',ok:false}); return; }
    if (pw.newPw!==pw.confirm)               { setPwMsg({text:'Mật khẩu mới không khớp',ok:false}); return; }
    if (pw.newPw.length<6)                   { setPwMsg({text:'Mật khẩu tối thiểu 6 ký tự',ok:false}); return; }
    setPwSaving(true); setPwMsg({text:'',ok:true});
    try {
      await authAPI.changePassword({ currentPassword:pw.current, newPassword:pw.newPw });
      setPwMsg({text:'Đổi mật khẩu thành công!',ok:true});
      setPw({current:'',newPw:'',confirm:''}); setShowPw(false);
    } catch(err) {
      setPwMsg({text:err.response?.data?.message||'Mật khẩu hiện tại không đúng',ok:false});
    }
    setPwSaving(false);
    setTimeout(()=>setPwMsg({text:'',ok:true}),3000);
  };

  const EyeBtn = ({field}) => (
    <button type="button" onClick={()=>setShowEye(p=>({...p,[field]:!p[field]}))} className="p-1.5 text-gray-400 hover:text-gray-600">
      {showEye[field]?<EyeOff size={15}/>:<Eye size={15}/>}
    </button>
  );

  const InfoRow = ({ icon: Icon, label, value, onEdit }) => (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b dark:border-gray-700/60 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-indigo-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {onEdit && editName && label==='Họ và tên' ? (
          <div className="flex gap-2 items-center">
            <input value={name} onChange={e=>setName(e.target.value)} autoFocus
              className="flex-1 text-sm font-semibold bg-transparent border-b border-indigo-400 text-gray-800 dark:text-white focus:outline-none py-0.5"/>
            <button onClick={saveName} disabled={saving} className="text-indigo-500 p-1"><Check size={16}/></button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{value || '—'}</p>
        )}
      </div>
      {onEdit && (
        <button onClick={()=>{ if(label==='Họ và tên'){setEditName(true);setName(user?.name||'');} }}
          className="shrink-0 p-1.5 text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400 transition-colors">
          <Edit2 size={14}/>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Top gradient hero — full-width break out of px-4 */}
      <div className="bg-gradient-to-b from-indigo-600 via-indigo-500 to-indigo-400 -mx-4 pt-6 pb-8 px-4 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-3">
          <div onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-white/30 cursor-pointer shadow-lg">
            {avatarLoading ? (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <RefreshCw size={20} className="text-white animate-spin"/>
              </div>
            ) : user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                {(user?.name||'S')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div onClick={handleAvatarClick}
            className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer">
            <Camera size={13} className="text-indigo-600"/>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
        </div>
        <p className="text-white/70 text-xs mb-2">Bấm vào ảnh để thay đổi</p>
        <p className="text-white font-bold text-xl">{user?.name}</p>
        <span className="inline-block mt-2 bg-white/20 text-white text-xs px-4 py-1 rounded-full font-medium">
          Sinh viên
        </span>
      </div>

      {/* Info rows */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <InfoRow icon={User}  label="Họ và tên" value={user?.name}  onEdit />
        <InfoRow icon={Mail}  label="Email"     value={user?.email} />
        <InfoRow icon={Hash}  label="MSSV"      value={user?.mssv}  />
        <InfoRow icon={GraduationCap} label="Lớp" value={user?.classId} />
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={()=>setShowPw(p=>!p)}
          className="w-full flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-indigo-500"/>
          </div>
          <p className="flex-1 text-left text-sm font-semibold text-gray-800 dark:text-white">Đổi mật khẩu</p>
          <ChevronRight size={16} className={`text-gray-300 transition-transform ${showPw?'rotate-90':''}`}/>
        </button>

        {showPw && (
          <div className="px-4 pb-4 space-y-3 border-t dark:border-gray-700">
            {[{f:'current',l:'Mật khẩu hiện tại'},{f:'newPw',l:'Mật khẩu mới'},{f:'confirm',l:'Xác nhận mật khẩu mới'}].map(({f,l})=>(
              <div key={f}>
                <label className="text-xs text-gray-400 mb-1 block">{l}</label>
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 bg-gray-50 dark:bg-gray-700/50">
                  <input type={showEye[f]?'text':'password'} value={pw[f]}
                    onChange={e=>setPw(p=>({...p,[f]:e.target.value}))}
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent dark:text-white focus:outline-none"/>
                  <EyeBtn field={f}/>
                </div>
              </div>
            ))}
            {pwMsg.text && (
              <div className={`flex items-center gap-2 text-xs ${pwMsg.ok?'text-emerald-600':'text-red-500'}`}>
                {pwMsg.ok?<Check size={13}/>:<AlertCircle size={13}/>} {pwMsg.text}
              </div>
            )}
            <button onClick={changePassword} disabled={pwSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
              {pwSaving?'Đang lưu...':'Xác nhận đổi mật khẩu'}
            </button>
          </div>
        )}
      </div>

      {/* Sinh trắc học */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-4 py-4">
        <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 dark:border-indigo-800 py-3.5 rounded-2xl text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
          <Fingerprint size={18}/> Đăng ký sinh trắc học
        </button>
      </div>

      {/* Cài đặt + Đăng xuất */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={()=>setDark(d=>!d)}
          className="w-full flex items-center gap-3 px-4 py-4 border-b dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            {dark?<Sun size={16} className="text-amber-500"/>:<Moon size={16} className="text-gray-500"/>}
          </div>
          <p className="flex-1 text-left text-sm font-semibold text-gray-800 dark:text-white">Giao diện {dark?'tối':'sáng'}</p>
          <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${dark?'bg-indigo-600':'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${dark?'translate-x-[22px]':'translate-x-1'}`}/>
          </div>
        </button>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <LogOut size={16} className="text-red-500"/>
          </div>
          <p className="text-sm font-semibold text-red-500">Đăng xuất</p>
        </button>
      </div>

      <div className="h-8"/>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────
export default function StudentDashboard({ user, onLogout, onUpdateUser }) {
  const [mainTab, setMainTab]     = useState('home');
  const [schedView, setSchedView] = useState('today');
  const [dark, setDark]           = useState(() => localStorage.getItem('darkMode')==='true');

  const [timetable, setTimetable]             = useState([]);
  const [activeSessions, setActiveSessions]   = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSessionBanner, setNewSessionBanner] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod]   = useState('');
  const [toast, setToast]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const prevSessionIds = useRef(new Set());
  const trackingRef    = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const showToast = (msg, type='success') => setToast({message:msg,type});

  const fetchHistory = useCallback(async () => {
    try { const r=await attendanceAPI.getHistory({}); setHistory(r.data.data||[]); }
    catch{} finally{setLoading(false);}
  },[]);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.classId) return;
    try { const r=await attendanceAPI.getLeaderboard(user.classId); setLeaderboard(r.data.data||[]); setLbPeriod(r.data.period||''); }
    catch{}
  },[user?.classId]);

  const fetchTimetable = useCallback(async () => {
    if (!user?.classId) return;
    try { const r=await timetableAPI.get(user.classId); setTimetable(r.data.timetable||[]); }
    catch{}
  },[user?.classId]);

  const fetchActiveSessions = useCallback(async (silent=false) => {
    if (!user?.classId) return;
    if (!silent) setSessionsLoading(true);
    try {
      const r=await sessionAPI.getActive(user.classId);
      const sessions=r.data.sessions||[];
      const cur=new Set(sessions.map(s=>s.sessionId));
      const newS=sessions.filter(s=>!prevSessionIds.current.has(s.sessionId));
      if (newS.length>0&&prevSessionIds.current.size>0) { setNewSessionBanner(newS[0]); setTimeout(()=>setNewSessionBanner(null),8000); }
      prevSessionIds.current=cur; setActiveSessions(sessions);
    } catch{setActiveSessions([]);}
    if (!silent) setSessionsLoading(false);
  },[user?.classId]);

  useEffect(()=>{
    fetchHistory(); fetchLeaderboard(); fetchTimetable(); fetchActiveSessions();
    const iv=setInterval(()=>fetchActiveSessions(true),60000);
    return ()=>clearInterval(iv);
  },[fetchHistory,fetchLeaderboard,fetchTimetable,fetchActiveSessions]);

  const startLocationTracking = useCallback((session)=>{
    if (trackingRef.current) clearInterval(trackingRef.current);
    const send=()=>{
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos=>{
        sessionAPI.updateLocation(session.sessionId,{lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy}).catch(()=>{});
      },()=>{},{timeout:10000,maximumAge:30000});
    };
    send(); trackingRef.current=setInterval(send,10*60*1000);
  },[]);
  useEffect(()=>()=>{if(trackingRef.current)clearInterval(trackingRef.current);},[]);

  const handleSuccess = (status)=>{
    setShowModal(false);
    if (selectedSession&&(status==='present'||status==='late')) startLocationTracking(selectedSession);
    setSelectedSession(null);
    showToast(status==='late'?'Điểm danh muộn!':'Điểm danh thành công!',status==='late'?'warning':'success');
    fetchHistory(); fetchLeaderboard(); fetchActiveSessions();
  };

  const stats={
    total:history.length,
    present:history.filter(h=>h.status==='present').length,
    late:history.filter(h=>h.status==='late').length,
    absent:history.filter(h=>h.status==='absent').length,
  };
  const rate=stats.total>0?Math.round(((stats.present+stats.late)/stats.total)*100):0;

  // ── Home ─────────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
            {user?.avatar?<img src={user.avatar} alt="" className="w-full h-full object-cover"/>:(user?.name||'S')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-indigo-100 text-xs">Xin chào,</p>
            <p className="font-bold text-lg leading-tight truncate">{user?.name}</p>
            <p className="text-indigo-200 text-xs">{user?.mssv} · {user?.classId}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{rate}%</p>
            <p className="text-indigo-200 text-xs">điểm danh</p>
          </div>
        </div>
        <div className="bg-white/15 rounded-full h-1.5">
          <div className="bg-white rounded-full h-1.5 transition-all" style={{width:`${rate}%`}}/>
        </div>
        <p className="text-indigo-200 text-xs mt-2 text-right">
          {new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {l:'Tổng',     v:stats.total,   from:'from-slate-500',   to:'to-slate-600'},
          {l:'Có mặt',   v:stats.present, from:'from-emerald-500', to:'to-emerald-600'},
          {l:'Muộn',     v:stats.late,    from:'from-amber-500',   to:'to-amber-600'},
          {l:'Vắng',     v:stats.absent,  from:'from-rose-500',    to:'to-rose-600'},
        ].map(({l,v,from,to})=>(
          <div key={l} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-3 text-center shadow-sm`}>
            <p className="text-2xl font-bold text-white">{v}</p>
            <p className="text-white/70 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Phiên học */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">Phiên điểm danh hôm nay</p>
          </div>
          <button onClick={fetchActiveSessions} disabled={sessionsLoading} className="text-gray-400 hover:text-gray-600 p-1">
            <RefreshCw size={14} className={sessionsLoading?'animate-spin':''}/>
          </button>
        </div>
        {sessionsLoading?(
          <div className="py-7 text-center text-gray-400 text-sm">Đang kiểm tra...</div>
        ):activeSessions.length===0?(
          <div className="py-7 text-center">
            <Clock size={22} className="mx-auto text-gray-200 dark:text-gray-700 mb-1.5"/>
            <p className="text-gray-400 text-sm">Chưa có phiên nào đang mở</p>
          </div>
        ):(
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activeSessions.map(session=>(
              <div key={session.sessionId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{session.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ca {session.period} · {session.startTime}–{session.endTime}</p>
                </div>
                <button onClick={()=>{setSelectedSession(session);setShowModal(true);}}
                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-300">
                  <Camera size={13}/> Điểm danh
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Xin nghỉ */}
      <button onClick={()=>setShowLeave(true)}
        className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70 border border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 shadow-sm flex items-center gap-3 px-4 transition-all">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-indigo-600"/>
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm text-gray-800 dark:text-white">Xin nghỉ phép</p>
          <p className="text-xs text-gray-400">Gửi đơn xin nghỉ buổi học</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 ml-auto"/>
      </button>
    </div>
  );

  // ── Schedule ─────────────────────────────────────
  const renderSchedule = () => (
    <div className="space-y-4">
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
        {[['today','Hôm nay'],['week','Tuần'],['month','Tháng']].map(([k,l])=>(
          <button key={k} onClick={()=>setSchedView(k)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${schedView===k?'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm':'text-gray-500 dark:text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>
      {schedView==='today' && <TodayView timetable={timetable}/>}
      {schedView==='week'  && <WeekView  timetable={timetable}/>}
      {schedView==='month' && <MonthView timetable={timetable}/>}
    </div>
  );

  // ── Attendance ───────────────────────────────────
  const renderAttendance = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-indigo-500"/> 7 ngày qua
        </p>
        <WeekChart history={history}/>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">Lịch sử — {stats.total} buổi</p>
          <button onClick={fetchHistory} className="text-indigo-500 text-xs font-medium">Làm mới</button>
        </div>
        {loading?(
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ):history.length===0?(
          <div className="py-8 text-center text-gray-400 text-sm">Chưa có lịch sử điểm danh</div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-400 uppercase">
                <tr>{['Ngày','Giờ','Trạng thái'].map(h=><th key={h} className="px-4 py-2.5 text-left">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((item,i)=>{
                  const s=STATUS_CONFIG[item.status]||STATUS_CONFIG.absent;
                  return(
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{item.date}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{item.time}</td>
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
            <Trophy size={15} className="text-amber-500"/> Xếp hạng lớp
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Tuần này · {lbPeriod}</p>
        </div>
        {leaderboard.length===0?(
          <div className="py-6 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
        ):(
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.map((item,i)=>(
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${item.mssv===user?.mssv?'bg-indigo-50 dark:bg-indigo-900/20':''}`}>
                <span className={`w-6 text-center text-sm font-bold ${i===0?'text-amber-400':i===1?'text-gray-400':i===2?'text-orange-400':'text-gray-300'}`}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${item.mssv===user?.mssv?'text-indigo-600 dark:text-indigo-400':'text-gray-800 dark:text-white'}`}>
                    {item.name} {item.mssv===user?.mssv&&<span className="text-xs opacity-50">(Bạn)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{item.present}/{item.total} buổi</p>
                </div>
                <span className={`font-bold text-sm ${item.rate>=80?'text-emerald-600':item.rate>=60?'text-amber-500':'text-red-500'}`}>{item.rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Layout ───────────────────────────────────────
  const NAV = [
    {key:'home',       Icon:Home,         label:'Trang chủ'},
    {key:'schedule',   Icon:Calendar,      label:'Lịch học'},
    {key:'attendance', Icon:ClipboardList, label:'Điểm danh'},
    {key:'profile',    Icon:User,          label:'Cá nhân'},
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Sticky header — luôn hiện ĐIỂM DANH */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-300">
            <GraduationCap size={16} className="text-white"/>
          </div>
          <span className="font-black text-base text-gray-900 dark:text-white tracking-wide">ĐIỂM DANH</span>
        </div>
        {activeSessions.length>0 && mainTab!=='home' && (
          <button onClick={()=>setMainTab('home')}
            className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            {activeSessions.length} phiên
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

      {/* Page */}
      <div className="max-w-lg mx-auto py-5 px-4">
        {mainTab==='home'       && renderHome()}
        {mainTab==='schedule'   && renderSchedule()}
        {mainTab==='attendance' && renderAttendance()}
        {mainTab==='profile'    && <ProfileTab user={user} onUpdateUser={onUpdateUser} onLogout={onLogout} dark={dark} setDark={setDark}/>}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-2 py-1.5">
        <div className="max-w-lg mx-auto flex justify-around">
          {NAV.map(({key,Icon,label})=>{
            const active=mainTab===key;
            return(
              <button key={key} onClick={()=>setMainTab(key)} className="flex flex-col items-center gap-0.5 py-1.5 px-4 relative">
                {active && <span className="absolute -top-1.5 w-8 h-1 bg-indigo-600 rounded-full"/>}
                <Icon size={21} className={active?'text-indigo-600 dark:text-indigo-400':'text-gray-400'}/>
                <span className={`text-xs font-medium ${active?'text-indigo-600 dark:text-indigo-400':'text-gray-400'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showModal && (
        <AttendanceModal classId={user?.classId} session={selectedSession}
          onClose={()=>{setShowModal(false);setSelectedSession(null);}} onSuccess={handleSuccess}/>
      )}
      {showLeave && <LeaveModal user={user} onClose={()=>setShowLeave(false)}/>}
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      <ChatBox user={user}/>
    </div>
  );
}
