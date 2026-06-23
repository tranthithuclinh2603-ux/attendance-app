import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Clock, BookOpen } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import AttendanceModal from './AttendanceModal';
import NavBar from './NavBar';

const STATUS_CONFIG = {
  present: { label: 'Có mặt', icon: '✅', color: 'text-green-600 bg-green-50' },
  late: { label: 'Muộn', icon: '⏰', color: 'text-yellow-600 bg-yellow-50' },
  absent: { label: 'Vắng', icon: '❌', color: 'text-red-600 bg-red-50' },
};

export default function StudentDashboard({ user, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await attendanceAPI.getHistory({});
      setHistory(res.data.data || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSuccess = () => {
    setShowModal(false);
    fetchHistory();
  };

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={user} onLogout={onLogout} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Greeting card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-md">
          <p className="text-blue-100 text-sm mb-1">{today}</p>
          <h2 className="text-2xl font-bold mb-3">Xin chào, {user?.name}! 👋</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <BookOpen size={14} />
              <span>MSSV: {user?.mssv || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <Calendar size={14} />
              <span>Lớp: {user?.classId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Big checkin button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-6 shadow-md flex flex-col items-center gap-2 transition-all"
        >
          <Camera size={40} />
          <span className="text-xl font-bold">ĐIỂM DANH NGAY</span>
          <span className="text-blue-100 text-sm">Nhận diện khuôn mặt</span>
        </button>

        {/* Attendance history */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Lịch sử điểm danh
            </h3>
            <button onClick={fetchHistory} className="text-blue-500 text-sm hover:underline">
              Làm mới
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-400">Đang tải...</div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-gray-400">Chưa có lịch sử điểm danh</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Ngày</th>
                    <th className="px-4 py-3 text-left">Giờ</th>
                    <th className="px-4 py-3 text-left">Lớp</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item, i) => {
                    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{item.date}</td>
                        <td className="px-4 py-3 text-gray-600">{item.time}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.classId}</td>
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
      </div>

      {showModal && (
        <AttendanceModal
          classId={user?.classId}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
