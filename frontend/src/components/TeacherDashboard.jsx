import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Download, Users, CheckCircle, Clock, XCircle, AlertTriangle, Search, BarChart2, FileText, PlusCircle, Grid, Upload } from 'lucide-react';
import LeavePanel from './LeavePanel';
import * as XLSX from 'xlsx';
import { attendanceAPI, authAPI } from '../services/api';
import AttendanceTable from './AttendanceTable';
import NavBar from './NavBar';
import QRModal from './QRModal';

const CLASSES = ['CĐTMDT28A','CĐTMDT28B','CĐTMDT28C','CĐTMDT28D','CĐTMDT28E','CĐTMDT28F','CĐTMDT28G','CĐTMDT28H','CĐTMDT28I'];

function ManualModal({ classId, date, onClose, onDone }) {
  const [students, setStudents] = useState([]);
  const [selectedUid, setSelectedUid] = useState('');
  const [status, setStatus] = useState('present');
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);

  useEffect(() => {
    attendanceAPI.getClassAttendance(classId, date)
      .then((res) => {
        setStudents(res.data.data || []);
        if (res.data.data?.length) setSelectedUid(res.data.data[0].uid);
      })
      .catch(() => {})
      .finally(() => setFetchingStudents(false));
  }, [classId, date]);

  const handleSave = async () => {
    if (!selectedUid) return;
    setLoading(true);
    try {
      await attendanceAPI.manualCheckin({ classId, studentUid: selectedUid, status, date });
      onDone();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm điểm danh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Thêm điểm danh thủ công</h3>
        <p className="text-xs text-gray-400 mb-4">Lớp: {classId} · Ngày: {date}</p>

        {fetchingStudents ? (
          <div className="py-4 text-center text-gray-400 text-sm">Đang tải danh sách...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sinh viên</label>
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.uid} value={s.uid}>{s.name} ({s.studentId})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">Có mặt</option>
                <option value="late">Muộn</option>
                <option value="absent">Vắng</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 py-2.5 rounded-xl text-sm font-medium dark:text-gray-200 transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedUid}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ classId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    attendanceAPI.getAbsenceAlerts(classId)
      .then((res) => setAlerts(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Đang kiểm tra...</div>;
  if (!alerts.length) return (
    <div className="py-8 text-center">
      <p className="text-gray-500 text-sm mt-2">Không có sinh viên nào cần cảnh báo</p>
    </div>
  );

  return (
    <div className="divide-y divide-gray-100">
      {alerts.map((a, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-yellow-50">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-sm">{a.name}</p>
            <p className="text-xs text-gray-500">{a.mssv}</p>
          </div>
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
            Vắng {a.consecutiveAbsent} buổi liên tiếp
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TeacherDashboard({ user, onLogout, onUpdateUser }) {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [showManual, setShowManual] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [bulkData, setBulkData] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileInputRef = useRef();

  const stats = {
    present: data.filter((d) => d.status === 'present').length,
    late: data.filter((d) => d.status === 'late').length,
    absent: data.filter((d) => d.status === 'absent').length,
    total: data.length,
  };

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name?.toLowerCase().includes(q) || item.studentId?.toLowerCase().includes(q);
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getClassAttendance(selectedClass, selectedDate);
      setData(res.data.data || []);
      setLastRefresh(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const exportExcel = () => {
    const sheetData = data.map((item, i) => ({
      STT: i + 1,
      'Họ tên': item.name,
      MSSV: item.studentId,
      'Trạng thái': item.status === 'present' ? 'Có mặt' : item.status === 'late' ? 'Muộn' : 'Vắng',
      'Giờ vào': item.time,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Điểm danh');
    XLSX.writeFile(wb, `Attendance_${selectedClass}_${selectedDate}.xlsx`);
  };

  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const handleBulkFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const students = rows.map((r) => ({
        name: r['Họ tên'] || r['Ho ten'] || r['name'] || '',
        email: r['Email'] || r['email'] || '',
        mssv: String(r['MSSV'] || r['mssv'] || ''),
        classId: r['Lớp'] || r['Lop'] || r['classId'] || selectedClass,
        password: String(r['Mật khẩu'] || r['Mat khau'] || r['password'] || '123456'),
      }));
      setBulkData(students);
      setBulkResult(null);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkData.length) return;
    setBulkLoading(true);
    try {
      const res = await authAPI.bulkRegister({ students: bulkData });
      setBulkResult(res.data);
    } catch (err) {
      setBulkResult({ success: false, message: err.response?.data?.message || 'Lỗi upload' });
    } finally {
      setBulkLoading(false);
    }
  };

  const exportPDF = () => {
    const statusLabel = (s) =>
      s === 'present' ? 'Có mặt' : s === 'late' ? 'Muộn' : 'Vắng';

    const rows = data.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.studentId}</td>
        <td class="${item.status === 'present' ? 'present' : item.status === 'late' ? 'late' : 'absent'}">${statusLabel(item.status)}</td>
        <td>${item.time}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Bảng điểm danh - ${selectedClass} - ${selectedDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 28px 32px; }
    h1 { font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .meta { font-size: 12px; margin-bottom: 4px; }
    .stats { font-size: 12px; margin: 10px 0 16px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #3b82f6; color: #fff; padding: 9px 10px; text-align: left; font-size: 12px; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .present { color: #16a34a; font-weight: 600; }
    .late    { color: #d97706; font-weight: 600; }
    .absent  { color: #dc2626; font-weight: 600; }
    @media print {
      body { padding: 16px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>Bảng Điểm Danh Sinh Viên</h1>
  <p class="meta">Lớp: <strong>${selectedClass}</strong> &nbsp;&nbsp; Ngày: <strong>${selectedDate}</strong></p>
  <p class="meta">Trường Cao Đẳng Kinh Tế Đối Ngoại</p>
  <p class="stats">Có mặt: ${stats.present} &nbsp;|&nbsp; Muộn: ${stats.late} &nbsp;|&nbsp; Vắng: ${stats.absent} &nbsp;|&nbsp; Tổng: ${stats.total}</p>
  <table>
    <thead><tr><th>STT</th><th>Họ tên</th><th>MSSV</th><th>Trạng thái</th><th>Giờ vào</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    // Đợi load xong rồi in
    win.onload = () => win.print();
    // Fallback nếu onload không fire (nội dung đồng bộ)
    setTimeout(() => { if (!win.closed) win.print(); }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-2xl font-bold mb-1">Xin chào, {user?.name}!</h2>
          <p className="text-blue-100 text-sm">Quản lý điểm danh - Giảng viên · Trường Cao Đẳng Kinh Tế Đối Ngoại</p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Ngày</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} /> Excel
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText size={16} /> PDF
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Grid size={16} /> QR
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng', value: stats.total, Icon: Users, color: 'blue', pctVal: 100 },
            { label: 'Có mặt', value: stats.present, Icon: CheckCircle, color: 'green', pctVal: pct(stats.present) },
            { label: 'Muộn', value: stats.late, Icon: Clock, color: 'yellow', pctVal: pct(stats.late) },
            { label: 'Vắng', value: stats.absent, Icon: XCircle, color: 'red', pctVal: pct(stats.absent) },
          ].map(({ label, value, Icon, color, pctVal }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
              <div className={`w-10 h-10 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3`}>
                <Icon size={20} className={`text-${color}-500`} />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
              <div className={`mt-2 h-1.5 rounded-full bg-${color}-100`}>
                <div className={`h-1.5 rounded-full bg-${color}-400`} style={{ width: `${pctVal}%` }} />
              </div>
              <p className={`text-${color}-500 text-xs font-medium mt-1`}>{pctVal}%</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b dark:border-gray-700">
            {[
              { key: 'list', label: 'Danh sách' },
              { key: 'alerts', label: 'Cảnh báo' },
              { key: 'stats', label: 'Thống kê' },
              { key: 'bulk', label: 'Bulk Upload' },
              { key: 'leave', label: 'Nghỉ phép' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* List tab */}
          {activeTab === 'list' && (
            <>
              <div className="px-5 py-3 border-b dark:border-gray-700 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc MSSV..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowManual(true)}
                  className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  <PlusCircle size={15} />
                  <span className="hidden sm:block">Thêm TT</span>
                </button>
                {lastRefresh && (
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">Cập nhật {lastRefresh}</span>
                )}
              </div>
              {loading ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500">Đang tải dữ liệu...</div>
              ) : (
                <AttendanceTable data={filteredData} onRefresh={fetchData} />
              )}
            </>
          )}

          {/* Alerts tab */}
          {activeTab === 'alerts' && (
            <>
              <div className="px-5 py-3 border-b dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Sinh viên vắng 2+ buổi liên tiếp trong 14 ngày gần nhất</p>
              </div>
              <AlertsPanel classId={selectedClass} />
            </>
          )}

          {/* Bulk Upload tab */}
          {activeTab === 'bulk' && (
            <div className="p-5 space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-blue-500" /> Tạo tài khoản hàng loạt từ Excel
              </h4>

              {/* Template download */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400 mb-2">File Excel cần có các cột:</p>
                <div className="flex flex-wrap gap-2">
                  {['Họ tên', 'Email', 'MSSV', 'Lớp', 'Mật khẩu'].map((c) => (
                    <span key={c} className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-mono">{c}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Mật khẩu mặc định: 123456 nếu để trống</p>
              </div>

              {/* Upload button */}
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleBulkFile} />
                <button
                  onClick={() => { fileInputRef.current?.click(); setBulkData([]); setBulkResult(null); }}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <Upload size={16} /> Chọn file Excel
                </button>
                {bulkData.length > 0 && !bulkResult && (
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkLoading}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {bulkLoading ? 'Đang tạo...' : `Tạo ${bulkData.length} tài khoản`}
                  </button>
                )}
              </div>

              {/* Preview table */}
              {bulkData.length > 0 && !bulkResult && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <tr>
                        {['#', 'Họ tên', 'Email', 'MSSV', 'Lớp'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {bulkData.slice(0, 10).map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 dark:text-white">{s.name}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{s.email}</td>
                          <td className="px-3 py-2 dark:text-white">{s.mssv}</td>
                          <td className="px-3 py-2 dark:text-white">{s.classId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkData.length > 10 && (
                    <p className="text-center text-xs text-gray-400 py-2">... và {bulkData.length - 10} sinh viên khác</p>
                  )}
                </div>
              )}

              {/* Results */}
              {bulkResult && (
                <div className="space-y-3">
                  <div className={`rounded-xl p-4 ${bulkResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className={`font-semibold text-sm ${bulkResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                      {bulkResult.message}
                    </p>
                  </div>
                  {bulkResult.results && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Tên</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {bulkResult.results.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 dark:text-white">{r.name}</td>
                              <td className="px-3 py-2 text-gray-500">{r.email}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                  r.status === 'success' ? 'bg-green-100 text-green-700' :
                                  r.status === 'skip' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {r.status === 'success' ? 'Thành công' : r.status === 'skip' ? 'Đã tồn tại' : r.message}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button onClick={() => { setBulkData([]); setBulkResult(null); }} className="text-blue-500 text-sm hover:underline">
                    Upload file mới
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Leave tab */}
          {activeTab === 'leave' && <LeavePanel classId={selectedClass} />}

          {/* Stats tab */}

          {activeTab === 'stats' && (
            <div className="p-5 space-y-5">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" />
                Thống kê lớp {selectedClass} — {selectedDate}
              </h4>

              {stats.total === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Không có dữ liệu cho ngày này</p>
              ) : (
                <div className="space-y-4">
                  {/* Attendance rate */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Tỷ lệ có mặt hôm nay</p>
                    <p className="text-3xl font-bold text-blue-600">{pct(stats.present + stats.late)}%</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.present + stats.late}/{stats.total} sinh viên</p>
                  </div>

                  {/* Bars */}
                  {[
                    { label: 'Có mặt', value: stats.present, color: 'bg-green-400', text: 'text-green-600' },
                    { label: 'Muộn', value: stats.late, color: 'bg-yellow-400', text: 'text-yellow-600' },
                    { label: 'Vắng', value: stats.absent, color: 'bg-red-400', text: 'text-red-600' },
                  ].map(({ label, value, color, text }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{label}</span>
                        <span className={`font-semibold ${text}`}>{value} người ({pct(value)}%)</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-3">
                        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct(value)}%` }} />
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center bg-green-50 rounded-xl py-3">
                      <p className="text-xl font-bold text-green-600">{pct(stats.present)}%</p>
                      <p className="text-xs text-gray-500">Đúng giờ</p>
                    </div>
                    <div className="text-center bg-yellow-50 rounded-xl py-3">
                      <p className="text-xl font-bold text-yellow-600">{pct(stats.late)}%</p>
                      <p className="text-xs text-gray-500">Muộn</p>
                    </div>
                    <div className="text-center bg-red-50 rounded-xl py-3">
                      <p className="text-xl font-bold text-red-600">{pct(stats.absent)}%</p>
                      <p className="text-xs text-gray-500">Vắng</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showQR && (
        <QRModal
          classId={selectedClass}
          date={selectedDate}
          onClose={() => setShowQR(false)}
        />
      )}

      {showManual && (
        <ManualModal
          classId={selectedClass}
          date={selectedDate}
          onClose={() => setShowManual(false)}
          onDone={fetchData}
        />
      )}
    </div>
  );
}
