import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayCircle, StopCircle, RefreshCw, Download, ChevronDown, ChevronUp, Calendar, Clock, MapPin, CheckCircle, XCircle, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { sessionAPI, timetableAPI } from '../services/api';
import * as XLSX from 'xlsx';

const SCHOOL = { lat: 10.813308852984058, lng: 106.77209163591941 };

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

// ── Bản đồ vị trí realtime ────────────────────────────
function LocationMap({ sessionId }) {
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await sessionAPI.getLocations(sessionId);
      setLocations(res.data.locations || {});
    } catch { }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh mỗi 30s
    return () => clearInterval(interval);
  }, [load]);

  const list = Object.entries(locations).map(([uid, loc]) => ({ uid, ...loc }));
  const inZone = list.filter(l => l.inZone).length;
  const outZone = list.filter(l => !l.inZone).length;

  const openGoogleMaps = (lat, lng, name) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=17`, '_blank');
  };

  if (loading) return <div className="py-6 text-center text-gray-400 text-sm">Đang tải vị trí...</div>;
  if (!list.length) return (
    <div className="py-6 text-center text-gray-400 text-sm">
      <MapPin size={28} className="mx-auto mb-1.5 opacity-30" />
      Chưa có vị trí nào được gửi
    </div>
  );

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-green-600"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/> Trong trường: {inZone}</span>
        <span className="flex items-center gap-1.5 text-red-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/> Ngoài trường: {outZone}</span>
        <button onClick={load} className="ml-auto text-gray-400 hover:text-gray-600"><RefreshCw size={12} /></button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
        {list.map(loc => (
          <div key={loc.uid} className="flex items-center gap-3 px-3 py-2.5">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${loc.inZone ? 'bg-green-500' : 'bg-red-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{loc.name}</p>
              <p className="text-xs text-gray-400">{loc.inZone ? `Trong trường` : `Ngoài trường`} · cách {loc.distance}m · {loc.updatedAt ? new Date(new Date(loc.updatedAt).getTime() + 7*3600000).toISOString().slice(11,16) : ''}</p>
            </div>
            <button
              onClick={() => openGoogleMaps(loc.lat, loc.lng, loc.name)}
              className="shrink-0 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <MapPin size={12} /> Xem
            </button>
          </div>
        ))}
      </div>
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
  const [cardTab, setCardTab] = useState('attendance'); // 'attendance' | 'location'
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
      {expanded && (
        <div>
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            {[{ key: 'attendance', label: 'Điểm danh' }, { key: 'location', label: 'Vị trí' }].map(t => (
              <button key={t.key} onClick={() => setCardTab(t.key)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${cardTab === t.key ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {cardTab === 'attendance' && <SessionAttendanceList session={session} />}
          {cardTab === 'location' && <LocationMap sessionId={session.sessionId} />}
        </div>
      )}
    </div>
  );
}

// ── Mapping Excel → dữ liệu TKB ───────────────────────
const DAY_MAP = {
  '2': 2, 'thu 2': 2, 'thứ 2': 2, 'thu hai': 2, 'thứ hai': 2, 'monday': 2, 'mon': 2,
  '3': 3, 'thu 3': 3, 'thứ 3': 3, 'thu ba': 3, 'thứ ba': 3, 'tuesday': 3, 'tue': 3,
  '4': 4, 'thu 4': 4, 'thứ 4': 4, 'thu tu': 4, 'thứ tư': 4, 'wednesday': 4, 'wed': 4,
  '5': 5, 'thu 5': 5, 'thứ 5': 5, 'thu nam': 5, 'thứ năm': 5, 'thursday': 5, 'thu': 5,
  '6': 6, 'thu 6': 6, 'thứ 6': 6, 'thu sau': 6, 'thứ sáu': 6, 'friday': 6, 'fri': 6,
  '7': 7, 'thu 7': 7, 'thứ 7': 7, 'thu bay': 7, 'thứ bảy': 7, 'saturday': 7, 'sat': 7,
};
const PERIOD_MAP = {
  '1': 1, 'ca 1': 1, 'ca1': 1, '1st': 1,
  '2': 2, 'ca 2': 2, 'ca2': 2, '2nd': 2,
  '3': 3, 'ca 3': 3, 'ca3': 3, '3rd': 3,
  '4': 4, 'ca 4': 4, 'ca4': 4, '4th': 4,
};
function parseDay(val) { return DAY_MAP[String(val ?? '').toLowerCase().trim()] ?? null; }
function parsePeriod(val) { return PERIOD_MAP[String(val ?? '').toLowerCase().trim()] ?? null; }

// ── Thẻ TKB ────────────────────────────────────────────
function TimetableEditor({ classId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [importPreview, setImportPreview] = useState(null); // rows từ Excel chờ xác nhận
  const [importError, setImportError] = useState('');
  const fileRef = useRef();

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

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 3000);
  };

  const handleSave = async (entriesToSave = entries) => {
    setSaving(true);
    try {
      await timetableAPI.save(classId, entriesToSave);
      showMsg(`Đã lưu ${entriesToSave.length} ca học`);
      setImportPreview(null);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi lưu TKB', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Tải file mẫu Excel ─────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Thu', 'Ca', 'Mon hoc', 'Gio bat dau', 'Gio ket thuc'],
      [2, 1, 'Lap trinh Web', '07:00', '09:30'],
      [2, 2, 'Co so du lieu', '09:45', '12:15'],
      [3, 1, 'Tieng Anh', '07:00', '09:30'],
      [4, 3, 'Lap trinh Mobile', '12:45', '15:15'],
      [5, 2, 'Quan tri mang', '09:45', '12:15'],
      [6, 4, 'Do an tot nghiep', '15:30', '18:00'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 6 }, { wch: 25 }, { wch: 14 }, { wch: 14 }];

    // Ghi chú hướng dẫn ở sheet 2
    const guide = [
      ['HUONG DAN DIEN FILE TKB'],
      [''],
      ['Cot Thu:', '2=Thu 2, 3=Thu 3, 4=Thu 4, 5=Thu 5, 6=Thu 6, 7=Thu 7'],
      ['Cot Ca:', '1=Ca1 (07:00-09:30), 2=Ca2 (09:45-12:15), 3=Ca3 (12:45-15:15), 4=Ca4 (15:30-18:00)'],
      ['Cot Mon hoc:', 'Ten mon hoc chinh xac'],
      ['Cot Gio bat dau:', 'Dinh dang HH:MM, vi du 07:00 (co the bo trong de dung mac dinh theo ca)'],
      ['Cot Gio ket thuc:', 'Dinh dang HH:MM, vi du 09:30 (co the bo trong de dung mac dinh theo ca)'],
      [''],
      ['Luu y:', 'Co the them nhieu dong, moi dong la 1 ca hoc trong tuan'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(guide);
    ws2['!cols'] = [{ wch: 20 }, { wch: 60 }];

    XLSX.utils.book_append_sheet(wb, ws, 'ThoiKhoaBieu');
    XLSX.utils.book_append_sheet(wb, ws2, 'HuongDan');
    XLSX.writeFile(wb, `mau_tkb_${classId}.xlsx`);
  };

  // ── Đọc file Excel TKB ─────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Bỏ hàng tiêu đề
        const dataRows = rows.slice(1).filter(r => r.some(c => c !== ''));
        if (!dataRows.length) { setImportError('File không có dữ liệu hoặc sai định dạng.'); return; }

        const parsed = [];
        const errors = [];
        dataRows.forEach((row, idx) => {
          const [rawDay, rawPeriod, subject, startTime, endTime] = row;
          const dayOfWeek = parseDay(rawDay);
          const period = parsePeriod(rawPeriod);

          if (!dayOfWeek) { errors.push(`Dòng ${idx + 2}: Thứ "${rawDay}" không hợp lệ`); return; }
          if (!period) { errors.push(`Dòng ${idx + 2}: Ca "${rawPeriod}" không hợp lệ`); return; }
          if (!String(subject || '').trim()) { errors.push(`Dòng ${idx + 2}: Thiếu tên môn học`); return; }

          const periodDefault = PERIODS.find(p => p.period === period);
          parsed.push({
            dayOfWeek,
            period,
            subject: String(subject).trim(),
            startTime: String(startTime || '').trim() || periodDefault?.startTime || '07:00',
            endTime: String(endTime || '').trim() || periodDefault?.endTime || '09:30',
            lateAfterMinutes: 15,
          });
        });

        if (!parsed.length) {
          setImportError('Không đọc được dòng nào hợp lệ.\n' + errors.slice(0, 3).join('\n'));
          return;
        }
        setImportPreview({ rows: parsed, errors });
      } catch {
        setImportError('Không đọc được file. Vui lòng dùng đúng file Excel mẫu.');
      }
      // Reset input
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Đang tải TKB...</div>;

  // ── Preview sau khi import ──────────────────────────
  if (importPreview) {
    const DAY_LABELS_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-green-600" />
          <p className="font-semibold text-sm text-gray-800 dark:text-white">Xem trước — {importPreview.rows.length} ca học từ file</p>
        </div>

        {importPreview.errors.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Bỏ qua {importPreview.errors.length} dòng lỗi:</p>
            {importPreview.errors.slice(0, 3).map((e, i) => <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">{e}</p>)}
            {importPreview.errors.length > 3 && <p className="text-xs text-yellow-500">...và {importPreview.errors.length - 3} dòng khác</p>}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Thứ', 'Ca', 'Môn học', 'Giờ'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {importPreview.rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{DAY_LABELS_SHORT[r.dayOfWeek]}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">Ca {r.period}</td>
                  <td className="px-3 py-2 text-gray-800 dark:text-white">{r.subject}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.startTime}–{r.endTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setImportPreview(null)}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Hủy
          </button>
          <button onClick={() => { setEntries(importPreview.rows); handleSave(importPreview.rows); }} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? 'Đang lưu...' : `Lưu ${importPreview.rows.length} ca học`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header + actions */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">TKB lớp {classId}</p>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium">
            <Download size={12} /> Tải mẫu
          </button>
          <label className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer">
            <Upload size={12} /> Import Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </label>
          <button onClick={addEntry}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1.5 rounded-lg font-medium">
            + Thêm
          </button>
        </div>
      </div>

      {/* Hướng dẫn import khi chưa có TKB */}
      {entries.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center space-y-2">
          <FileSpreadsheet size={28} className="mx-auto text-blue-400" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Chưa có thời khóa biểu</p>
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Nhấn <strong>Tải mẫu</strong> để tải file Excel, điền TKB vào rồi nhấn <strong>Import Excel</strong>
          </p>
          <p className="text-xs text-blue-400">Hoặc nhấn <strong>+ Thêm</strong> để nhập tay từng ca</p>
        </div>
      )}

      {importError && (
        <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 whitespace-pre-line">{importError}</p>
        </div>
      )}

      {/* Danh sách ca */}
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

      {msg.text && (
        <p className={`text-xs text-center ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
      )}
      {entries.length > 0 && (
        <button onClick={() => handleSave()} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
          {saving ? 'Đang lưu...' : `Lưu ${entries.length} ca học`}
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
