import React, { useState, useEffect, useCallback } from 'react';
import { PlayCircle, StopCircle, RefreshCw, Download, ChevronDown, ChevronUp, Calendar, Clock, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { sessionAPI, timetableAPI } from '../services/api';

const PERIODS = [
  { period: 1, label: 'Ca 1', startTime: '07:00', endTime: '09:30' },
  { period: 2, label: 'Ca 2', startTime: '09:45', endTime: '12:15' },
  { period: 3, label: 'Ca 3', startTime: '12:45', endTime: '15:15' },
  { period: 4, label: 'Ca 4', startTime: '15:30', endTime: '18:00' },
];

const STATUS_STYLE = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-600',
};
const STATUS_LABEL = { present: 'Có mặt', late: 'Muộn', absent: 'Vắng' };

// ── Mở phiên thủ công ──────────────────────────────────
function OpenSessionForm({ classId, onOpened }) {
  const [subject, setSubject] = useState('');
  const [period, setPeriod] = useState(1);
  const [lateAfter, setLateAfter] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sel = PERIODS.find(p => p.period === period);

  const handleOpen = async () => {
    if (!subject.trim()) { setError('Nhập tên môn học'); return; }
    setLoading(true); setError('');
    try {
      await sessionAPI.open({
        classId, subject: subject.trim(),
        period, startTime: sel.startTime, endTime: sel.endTime,
        lateAfterMinutes: lateAfter, openedBy: 'manual',
      });
      onOpened();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi mở phiên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Mở phiên thủ công</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Tên môn học</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="VD: Lập trình Web"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ca học</label>
          <select value={period} onChange={e => setPeriod(+e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PERIODS.map(p => <option key={p.period} value={p.period}>{p.label} ({p.startTime}–{p.endTime})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Muộn sau (phút)</label>
          <input type="number" value={lateAfter} onChange={e => setLateAfter(+e.target.value)} min={0} max={60}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button onClick={handleOpen} disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
        <PlayCircle size={16} />
        {loading ? 'Đang mở...' : 'Mở phiên điểm danh'}
      </button>
    </div>
  );
}

// ── Danh sách điểm danh của một phiên ─────────────────
function SessionAttendanceList({ session }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.getAttendance(session.sessionId);
      setData(res.data.data || []);
    } catch { }
    setLoading(false);
  }, [session.sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (uid, status) => {
    await sessionAPI.updateAttendance(session.sessionId, uid, status);
    setData(prev => prev.map(r => r.uid === uid ? { ...r, status } : r));
  };

  if (loading) return <div className="py-6 text-center text-gray-400 text-sm">Đang tải...</div>;

  const present = data.filter(r => r.status === 'present').length;
  const late = data.filter(r => r.status === 'late').length;
  const absent = data.filter(r => r.status === 'absent').length;

  return (
    <div>
      <div className="flex gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900/30 text-xs font-medium text-gray-500">
        <span className="text-green-600">Có mặt: {present}</span>
        <span className="text-yellow-600">Muộn: {late}</span>
        <span className="text-red-600">Vắng: {absent}</span>
        <span className="ml-auto">Tổng: {data.length}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
        {data.map(r => (
          <div key={r.uid} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.name}</p>
              <p className="text-xs text-gray-400">{r.studentId} · {r.time}</p>
            </div>
            <select value={r.status} onChange={e => handleStatusChange(r.uid, e.target.value)}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-blue-400 ${STATUS_STYLE[r.status]}`}>
              <option value="present">Có mặt</option>
              <option value="late">Muộn</option>
              <option value="absent">Vắng</option>
            </select>
          </div>
        ))}
        {data.length === 0 && <p className="py-6 text-center text-gray-400 text-sm">Chưa có ai điểm danh</p>}
      </div>
    </div>
  );
}

// ── Thẻ phiên hôm nay ──────────────────────────────────
function SessionCard({ session, onClose, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = async () => {
    if (!window.confirm(`Đóng phiên "${session.subject}" - Ca ${session.period}?`)) return;
    setClosing(true);
    try {
      await sessionAPI.close(session.sessionId);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đóng phiên');
    } finally {
      setClosing(false);
    }
  };

  const isOpen = session.status === 'open';

  return (
    <div className={`border rounded-xl overflow-hidden ${isOpen ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${isOpen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{session.subject}</p>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isOpen ? 'Đang mở' : 'Đã đóng'}
            </span>
            {session.openedBy === 'auto' && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">TKB</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Ca {session.period} · {session.startTime}–{session.endTime}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOpen && (
            <button onClick={handleClose} disabled={closing}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60">
              <StopCircle size={13} />
              {closing ? '...' : 'Đóng'}
            </button>
          )}
          <button onClick={() => setExpanded(p => !p)} className="text-gray-400 hover:text-gray-600 p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {expanded && <SessionAttendanceList session={session} />}
    </div>
  );
}

// ── Thẻ TKB ────────────────────────────────────────────
function TimetableEditor({ classId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const DAY_LABELS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  useEffect(() => {
    setLoading(true);
    timetableAPI.get(classId)
      .then(res => setEntries(res.data.timetable || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  const addEntry = () => {
    setEntries(prev => [...prev, { dayOfWeek: 2, period: 1, subject: '', startTime: '07:00', endTime: '09:30', lateAfterMinutes: 15 }]);
  };

  const updateEntry = (i, field, value) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const removeEntry = (i) => setEntries(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await timetableAPI.save(classId, entries);
      setMsg('Đã lưu thời khóa biểu');
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Lỗi lưu TKB');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Đang tải TKB...</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thời khóa biểu lớp {classId}</p>
        <button onClick={addEntry} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-medium">+ Thêm ca</button>
      </div>

      {entries.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">Chưa có TKB. Nhấn "+ Thêm ca" để bắt đầu.</p>
      )}

      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-xs text-gray-400 mb-0.5 block">Thứ</label>
              <select value={e.dayOfWeek} onChange={ev => updateEntry(i, 'dayOfWeek', +ev.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-xs">
                {[2,3,4,5,6,7].map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-0.5 block">Ca</label>
              <select value={e.period} onChange={ev => updateEntry(i, 'period', +ev.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-xs">
                {PERIODS.map(p => <option key={p.period} value={p.period}>{p.label} ({p.startTime})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-0.5 block">Môn học</label>
              <div className="flex gap-2">
                <input value={e.subject} onChange={ev => updateEntry(i, 'subject', ev.target.value)}
                  placeholder="VD: Lập trình Web"
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1.5 text-xs" />
                <button onClick={() => removeEntry(i)} className="text-red-400 hover:text-red-600 px-2 text-xs">Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {msg && <p className={`text-xs ${msg.includes('Lỗi') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      {entries.length > 0 && (
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
          {saving ? 'Đang lưu...' : 'Lưu thời khóa biểu'}
        </button>
      )}
    </div>
  );
}

// ── Lịch sử & xuất Excel ───────────────────────────────
function SessionHistory({ classId }) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.getHistory(classId, { from, to });
      setData(res.data.data || []);
    } catch { }
    setLoading(false);
  }, [classId, from, to]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await sessionAPI.exportExcel(classId, { from, to });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `diemdanh_${classId}_${from}_${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Từ ngày</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Đến ngày</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-3 py-2 rounded-lg text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Lọc
        </button>
        <button onClick={handleExport} disabled={exporting || data.length === 0}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
          <Download size={14} />
          {exporting ? 'Đang xuất...' : 'Xuất Excel'}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">Không có phiên nào trong khoảng thời gian này</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Ngày', 'Ca', 'Môn học', 'Loại', 'Có mặt', 'Muộn', 'Vắng', 'Trạng thái'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.map(s => (
                <tr key={s.sessionId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{s.date}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">Ca {s.period || '-'}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-white">{s.subject}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.openedBy === 'auto' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.openedBy === 'auto' ? 'TKB' : 'Thủ công'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-green-600 font-medium">{s.present}</td>
                  <td className="px-3 py-2.5 text-yellow-600 font-medium">{s.late}</td>
                  <td className="px-3 py-2.5 text-red-600 font-medium">{s.absent}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main SessionPanel ───────────────────────────────────
export default function SessionPanel({ classId }) {
  const [tab, setTab] = useState('today');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoOpening, setAutoOpening] = useState(false);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.getToday(classId);
      setSessions(res.data.sessions || []);
    } catch { }
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    if (tab === 'today') loadSessions();
  }, [tab, loadSessions]);

  const handleAutoOpen = async () => {
    setAutoOpening(true); setAutoMsg('');
    try {
      const res = await timetableAPI.autoOpen(classId);
      setAutoMsg(res.data.message);
      loadSessions();
      setTimeout(() => setAutoMsg(''), 4000);
    } catch (err) {
      setAutoMsg(err.response?.data?.message || 'Không có TKB hoặc lỗi server');
      setTimeout(() => setAutoMsg(''), 4000);
    } finally {
      setAutoOpening(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        {[
          { key: 'today', label: 'Hôm nay' },
          { key: 'history', label: 'Lịch sử & Xuất' },
          { key: 'timetable', label: 'Thời khóa biểu' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Hôm nay */}
      {tab === 'today' && (
        <div className="space-y-3">
          {/* Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleAutoOpen} disabled={autoOpening}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              <Calendar size={14} />
              {autoOpening ? 'Đang mở...' : 'Mở theo TKB'}
            </button>
            <button onClick={() => setShowOpenForm(p => !p)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <PlayCircle size={14} />
              Mở thủ công
            </button>
            <button onClick={loadSessions} disabled={loading}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-3 py-2 rounded-lg text-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            {autoMsg && (
              <p className={`text-xs px-3 py-1.5 rounded-lg ${autoMsg.includes('Đã mở') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {autoMsg}
              </p>
            )}
          </div>

          {showOpenForm && (
            <OpenSessionForm classId={classId} onOpened={() => { setShowOpenForm(false); loadSessions(); }} />
          )}

          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Đang tải phiên...</div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chưa có phiên điểm danh nào hôm nay</p>
              <p className="text-gray-400 text-xs mt-1">Nhấn "Mở theo TKB" hoặc "Mở thủ công"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <SessionCard key={s.sessionId} session={s}
                  onClose={loadSessions}
                  onRefresh={loadSessions}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && <SessionHistory classId={classId} />}
      {tab === 'timetable' && <TimetableEditor classId={classId} />}
    </div>
  );
}
