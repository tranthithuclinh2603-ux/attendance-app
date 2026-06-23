import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, Users, BookOpen, TrendingDown, BarChart2 } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStats();
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🏛️</span> Admin Dashboard
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-gray-400 hover:text-white p-1.5">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-2xl font-bold mb-1">Thống kê toàn trường 🏫</h2>
          <p className="text-gray-300 text-sm">Trường Cao Đẳng Kinh Tế Đối Ngoại · Admin: {user?.name}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && (
          <>
            {/* Tổng quan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Sinh viên', value: data.stats.totalStudents, icon: '🎓', color: 'blue' },
                { label: 'Giảng viên', value: data.stats.totalTeachers, icon: '👩‍🏫', color: 'green' },
                { label: 'Lớp học', value: data.stats.totalClasses, icon: '📚', color: 'purple' },
                { label: 'Lượt điểm danh', value: data.stats.totalAttendance, icon: '📋', color: 'orange' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-3xl mb-2">{icon}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b dark:border-gray-700">
                {[
                  { key: 'overview', label: '📊 Theo lớp' },
                  { key: 'daily', label: '📅 7 ngày qua' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                      tab === key
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >{label}</button>
                ))}
              </div>

              {/* Thống kê theo lớp */}
              {tab === 'overview' && (
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sắp xếp theo tỷ lệ vắng cao nhất</p>
                  {data.classRanking.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Chưa có dữ liệu</p>
                  ) : data.classRanking.map((c, i) => (
                    <div key={c.classId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : i === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}>{i + 1}</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{c.classId}</span>
                          <span className="text-xs text-gray-400">{c.studentCount} SV</span>
                        </div>
                        <span className={`text-sm font-bold ${c.absenceRate >= 30 ? 'text-red-600' : c.absenceRate >= 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {c.absenceRate}% vắng
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                        <div className="bg-green-400" style={{ width: `${c.total ? Math.round((c.present / c.total) * 100) : 0}%` }} title="Có mặt" />
                        <div className="bg-yellow-400" style={{ width: `${c.total ? Math.round((c.late / c.total) * 100) : 0}%` }} title="Muộn" />
                        <div className="bg-red-400" style={{ width: `${c.total ? Math.round((c.absent / c.total) * 100) : 0}%` }} title="Vắng" />
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block"/> Có mặt: {c.present}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"/> Muộn: {c.late}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block"/> Vắng: {c.absent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thống kê 7 ngày */}
              {tab === 'daily' && (
                <div className="p-5">
                  <div className="space-y-3">
                    {data.daily.map((d) => {
                      const max = Math.max(...data.daily.map((x) => x.total), 1);
                      const pct = (n) => Math.round((n / max) * 100);
                      return (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{d.date.slice(5)}</span>
                          <div className="flex-1 flex gap-0.5 h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {d.total === 0 ? (
                              <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Không có dữ liệu</div>
                            ) : (
                              <>
                                <div className="bg-green-400 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${pct(d.present)}%` }}>
                                  {d.present > 0 && d.present}
                                </div>
                                <div className="bg-yellow-400 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${pct(d.late)}%` }}>
                                  {d.late > 0 && d.late}
                                </div>
                                <div className="bg-red-400 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${pct(d.absent)}%` }}>
                                  {d.absent > 0 && d.absent}
                                </div>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right shrink-0">{d.total} lượt</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-400 rounded inline-block"/> Có mặt</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-400 rounded inline-block"/> Muộn</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-400 rounded inline-block"/> Vắng</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
