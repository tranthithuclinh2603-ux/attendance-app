import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { attendanceAPI } from '../services/api';
import AttendanceTable from './AttendanceTable';
import NavBar from './NavBar';

const CLASSES = ['ATTT1', 'ATTT2', 'CNTT1', 'CNTT2'];

export default function TeacherDashboard({ user, onLogout }) {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const stats = {
    present: data.filter((d) => d.status === 'present').length,
    late: data.filter((d) => d.status === 'late').length,
    absent: data.filter((d) => d.status === 'absent').length,
    total: data.length,
  };

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
    const interval = setInterval(fetchData, 30000); // auto refresh every 30s
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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-2xl font-bold mb-1">Xin chào, {user?.name}! 👋</h2>
          <p className="text-blue-100 text-sm">Quản lý điểm danh - Giảng viên</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Ngày</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Tải Excel
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng', value: stats.total, icon: Users, color: 'blue', pct: 100 },
            { label: 'Có mặt', value: stats.present, icon: CheckCircle, color: 'green', pct: pct(stats.present) },
            { label: 'Muộn', value: stats.late, icon: Clock, color: 'yellow', pct: pct(stats.late) },
            { label: 'Vắng', value: stats.absent, icon: XCircle, color: 'red', pct: pct(stats.absent) },
          ].map(({ label, value, icon: Icon, color, pct: p }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
              <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon size={20} className={`text-${color}-500`} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-gray-500 text-sm">{label}</p>
              <p className={`text-${color}-500 text-xs font-medium mt-1`}>{p}%</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Danh sách điểm danh - {selectedClass} ({selectedDate})
            </h3>
            {lastRefresh && (
              <span className="text-xs text-gray-400">Cập nhật lúc {lastRefresh}</span>
            )}
          </div>
          {loading ? (
            <div className="py-12 text-center text-gray-400">Đang tải dữ liệu...</div>
          ) : (
            <AttendanceTable data={data} onRefresh={fetchData} />
          )}
        </div>
      </div>
    </div>
  );
}
