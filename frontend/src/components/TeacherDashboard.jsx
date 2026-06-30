import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Download, Users, CheckCircle, Clock, XCircle, AlertTriangle, Search, BarChart2, FileText, PlusCircle, Grid, Upload, TrendingUp, TrendingDown, Award, CalendarRange } from 'lucide-react';
import LeavePanel from './LeavePanel';
import SessionPanel from './SessionPanel';
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

function ReportTab({ classId }) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!from || !to || from > to) { setError('Ngày không hợp lệ'); return; }
    setError(''); setLoading(true);
    try {
      const res = await attendanceAPI.getRangeReport(classId, from, to);
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi tải báo cáo');
    } finally { setLoading(false); }
  };

  const exportExcel = () => {
    if (!report) return;
    const { studentList, dates, classId: cls, from: f, to: t } = report;

    // Sheet 1: Tổng hợp
    const summary = studentList.map((s, i) => ({
      STT: i + 1, 'Họ tên': s.name, MSSV: s.mssv,
      'Có mặt': s.present, 'Muộn': s.late, 'Vắng': s.absent,
      'Tổng buổi': s.total, 'Tỉ lệ (%)': s.rate,
    }));

    // Sheet 2: Chi tiết từng ngày
    const detail = studentList.map((s, i) => {
      const row = { STT: i + 1, 'Họ tên': s.name, MSSV: s.mssv };
      dates.forEach(d => {
        const st = s.days[d] || 'absent';
        row[d] = st === 'present' ? 'CM' : st === 'late' ? 'M' : 'V';
      });
      row['Tỉ lệ (%)'] = s.rate;
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summary);
    ws1['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 9 }, { wch: 7 }, { wch: 7 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng hợp');

    const ws2 = XLSX.utils.json_to_sheet(detail);
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết');
    XLSX.writeFile(wb, `BaoCao_${cls}_${f}_${t}.xlsx`);
  };

  const exportPDF = () => {
    if (!report) return;
    const { studentList, classId: cls, from: f, to: t } = report;
    const rows = studentList.map((s, i) => {
      const rateColor = s.rate >= 80 ? '#16a34a' : s.rate >= 60 ? '#d97706' : '#dc2626';
      return `<tr>
        <td>${i + 1}</td><td>${s.name}</td><td>${s.mssv}</td>
        <td class="present">${s.present}</td><td class="late">${s.late}</td><td class="absent">${s.absent}</td>
        <td>${s.total}</td><td style="color:${rateColor};font-weight:700">${s.rate}%</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>
<title>Báo cáo ${cls}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;padding:24px}
  h1{font-size:16px;text-align:center;text-transform:uppercase;margin-bottom:8px}
  .meta{font-size:11px;text-align:center;color:#555;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#3b82f6;color:#fff;padding:8px 6px;font-size:11px;text-align:left}
  td{padding:7px 6px;border-bottom:1px solid #e5e7eb;font-size:11px}
  tr:nth-child(even) td{background:#f9fafb}
  .present{color:#16a34a;font-weight:600}.late{color:#d97706;font-weight:600}.absent{color:#dc2626;font-weight:600}
  @media print{body{padding:10px}}
</style></head><body>
<h1>Báo cáo Điểm Danh Tổng Hợp</h1>
<p class="meta">Lớp: <b>${cls}</b> &nbsp;|&nbsp; Từ <b>${f}</b> đến <b>${to}</b> &nbsp;|&nbsp; Trường Cao Đẳng Kinh Tế Đối Ngoại</p>
<table>
  <thead><tr><th>STT</th><th>Họ tên</th><th>MSSV</th><th>Có mặt</th><th>Muộn</th><th>Vắng</th><th>Tổng</th><th>Tỉ lệ</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const presets = [
    { label: '7 ngày', days: 6 },
    { label: '2 tuần', days: 13 },
    { label: '1 tháng', days: 29 },
  ];

  return (
    <div className="p-5 space-y-5">
      <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
        <CalendarRange size={18} className="text-blue-500"/> Báo cáo tổng hợp — {classId}
      </h4>

      {/* Bộ lọc */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.label} onClick={() => {
              const f = new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10);
              setFrom(f); setTo(today); setReport(null);
            }} className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setReport(null); }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setReport(null); }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> {loading ? 'Đang tải...' : 'Tạo báo cáo'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {/* Kết quả */}
      {report && (
        <>
          {/* Tóm tắt + nút xuất */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span><b className="text-gray-800 dark:text-white">{report.studentList.length}</b> sinh viên</span>
              <span><b className="text-gray-800 dark:text-white">{report.dates.length}</b> ngày</span>
              <span>TB tỉ lệ: <b className="text-blue-600">{
                report.studentList.length
                  ? Math.round(report.studentList.reduce((a, s) => a + s.rate, 0) / report.studentList.length)
                  : 0
              }%</b></span>
            </div>
            <div className="flex gap-2">
              <button onClick={exportExcel}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download size={15}/> Excel
              </button>
              <button onClick={exportPDF}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <FileText size={15}/> PDF
              </button>
            </div>
          </div>

          {/* Bảng tổng hợp */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">MSSV</th>
                  <th className="px-4 py-3 text-center text-green-600">Có mặt</th>
                  <th className="px-4 py-3 text-center text-yellow-600">Muộn</th>
                  <th className="px-4 py-3 text-center text-red-600">Vắng</th>
                  <th className="px-4 py-3 text-center">Tổng</th>
                  <th className="px-4 py-3 text-center">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {report.studentList.map((s, i) => {
                  const rColor = s.rate >= 80 ? 'text-green-600' : s.rate >= 60 ? 'text-yellow-600' : 'text-red-600';
                  const bg = s.rate < 60 ? 'bg-red-50 dark:bg-red-900/10' : '';
                  return (
                    <tr key={s.uid} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${bg}`}>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.mssv}</td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">{s.present}</td>
                      <td className="px-4 py-3 text-center font-semibold text-yellow-600">{s.late}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{s.absent}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{s.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${rColor}`}>{s.rate}%</span>
                        <div className="w-12 mx-auto mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${s.rate >= 80 ? 'bg-green-400' : s.rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${s.rate}%` }}/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const DAY_LABELS = { 'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN' };

function MiniBarChart({ dailyStats }) {
  if (!dailyStats?.length) return null;
  const maxVal = Math.max(...dailyStats.map(d => d.total), 1);

  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {dailyStats.map((d, i) => {
        const presentH = ((d.present + d.late) / maxVal) * 96;
        const absentH = (d.absent / maxVal) * 96;
        const dayName = new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
        const label = DAY_LABELS[dayName] || dayName;
        const dateShort = d.date.slice(5); // MM-DD
        const attendRate = d.total ? Math.round(((d.present + d.late) / d.total) * 100) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
              <p className="font-medium">{dateShort}</p>
              <p className="text-green-300">Có mặt: {d.present + d.late}</p>
              <p className="text-red-300">Vắng: {d.absent}</p>
              <p className="text-blue-300">Tỉ lệ: {attendRate}%</p>
            </div>
            <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
              <div className="w-full rounded-t-sm bg-red-300 dark:bg-red-500" style={{ height: absentH }} />
              <div className="w-full rounded-t-sm bg-blue-400 dark:bg-blue-500" style={{ height: presentH }} />
            </div>
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatsTab({ classId, stats, pct }) {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeks, setWeeks] = useState(1);

  useEffect(() => {
    setLoadingWeekly(true);
    attendanceAPI.getWeeklyStats(classId, weeks)
      .then(res => setWeeklyData(res.data))
      .catch(() => setWeeklyData(null))
      .finally(() => setLoadingWeekly(false));
  }, [classId, weeks]);

  const avgRate = weeklyData?.dailyStats?.length
    ? Math.round(weeklyData.dailyStats.reduce((acc, d) => acc + (d.total ? (d.present + d.late) / d.total * 100 : 0), 0) / weeklyData.dailyStats.length)
    : null;

  const trend = weeklyData?.dailyStats?.length >= 2
    ? (() => {
        const half = Math.floor(weeklyData.dailyStats.length / 2);
        const first = weeklyData.dailyStats.slice(0, half);
        const second = weeklyData.dailyStats.slice(half);
        const avg = arr => arr.reduce((a, d) => a + (d.total ? (d.present + d.late) / d.total * 100 : 0), 0) / arr.length;
        return avg(second) - avg(first);
      })()
    : null;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <BarChart2 size={18} className="text-blue-500" />
          Dashboard Thống kê — {classId}
        </h4>
        <div className="flex gap-2">
          {[1, 2, 4].map(w => (
            <button key={w} onClick={() => setWeeks(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${weeks === w ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
              {w === 1 ? '7 ngày' : w === 2 ? '2 tuần' : '4 tuần'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards hôm nay */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Có mặt hôm nay', value: stats.present, color: 'green', Icon: CheckCircle },
          { label: 'Muộn hôm nay', value: stats.late, color: 'yellow', Icon: Clock },
          { label: 'Vắng hôm nay', value: stats.absent, color: 'red', Icon: XCircle },
          { label: 'Tỉ lệ tham dự', value: `${pct(stats.present + stats.late)}%`, color: 'blue', Icon: Users },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-2xl p-4`}>
            <Icon size={18} className={`text-${color}-500 mb-2`} />
            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-white">Xu hướng điểm danh</p>
          {avgRate !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">TB: {avgRate}%</span>
              {trend !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  {Math.abs(Math.round(trend))}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-400 mb-1">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block"/>Có mặt</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block"/>Vắng</span>
        </div>
        {loadingWeekly ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
        ) : (
          <MiniBarChart dailyStats={weeklyData?.dailyStats} />
        )}
      </div>

      {/* Top vắng nhiều */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-2">
          <Award size={16} className="text-orange-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-white">Top sinh viên vắng nhiều nhất ({weeks === 1 ? '7 ngày' : weeks === 2 ? '2 tuần' : '4 tuần'})</p>
        </div>
        {loadingWeekly ? (
          <div className="py-6 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : !weeklyData?.topAbsent?.length ? (
          <div className="py-6 text-center text-gray-400 text-sm">Không có sinh viên vắng nào</div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {weeklyData.topAbsent.map((s, i) => {
              const absentRate = weeklyData.days ? Math.round((s.absent / weeklyData.days) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.mssv}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-500">{s.absent} buổi vắng</p>
                    <p className="text-xs text-gray-400">{s.present + s.late} có mặt · {s.late} muộn</p>
                  </div>
                  <div className="w-16">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${absentRate}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right mt-0.5">{absentRate}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bars ngày hôm nay */}
      {stats.total > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-white">Chi tiết hôm nay</p>
          {[
            { label: 'Có mặt', value: stats.present, color: 'bg-green-400', text: 'text-green-600' },
            { label: 'Muộn', value: stats.late, color: 'bg-yellow-400', text: 'text-yellow-600' },
            { label: 'Vắng', value: stats.absent, color: 'bg-red-400', text: 'text-red-600' },
          ].map(({ label, value, color, text }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                <span className={`font-semibold ${text}`}>{value} người ({pct(value)}%)</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct(value)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
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
              { key: 'sessions', label: 'Phiên học' },
              { key: 'list', label: 'Danh sách' },
              { key: 'alerts', label: 'Cảnh báo' },
              { key: 'stats', label: 'Thống kê' },
              { key: 'bulk', label: 'Bulk Upload' },
              { key: 'leave', label: 'Nghỉ phép' },
              { key: 'report', label: 'Báo cáo' },
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

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="p-4">
              <SessionPanel classId={selectedClass} />
            </div>
          )}

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
            <StatsTab classId={selectedClass} stats={stats} pct={pct} />
          )}

          {/* Report tab */}
          {activeTab === 'report' && (
            <ReportTab classId={selectedClass} />
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
