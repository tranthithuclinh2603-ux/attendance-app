import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, Users, BookOpen, TrendingUp, BarChart2, UserPlus, GraduationCap, Shield, UserCheck, Activity, Clock, Smartphone, QrCode, Edit3 } from 'lucide-react';
import { adminAPI } from '../services/api';

const ROLE_LABEL = { student: 'Sinh viên', teacher: 'Giảng viên', parent: 'Phụ huynh', admin: 'Admin' };
const ROLE_COLOR = { student: 'blue', teacher: 'green', parent: 'purple', admin: 'red' };

function MonthlyBarChart({ data }) {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map(d => d.students + d.teachers + d.parents), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-2">
      {data.map((d, i) => {
        const total = d.students + d.teachers + d.parents;
        const sH = (d.students / maxVal) * 120;
        const tH = (d.teachers / maxVal) * 120;
        const pH = (d.parents / maxVal) * 120;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
              <p className="font-medium">{d.label}</p>
              <p className="text-blue-300">SV: {d.students}</p>
              <p className="text-green-300">GV: {d.teachers}</p>
              {d.parents > 0 && <p className="text-purple-300">PH: {d.parents}</p>}
              <p className="text-white font-semibold">Tổng: {total}</p>
            </div>
            <div className="w-full flex flex-col justify-end" style={{ height: 120 }}>
              {pH > 0 && <div className="w-full bg-purple-400 dark:bg-purple-500" style={{ height: pH }} />}
              {tH > 0 && <div className="w-full bg-green-400 dark:bg-green-500" style={{ height: tH }} />}
              <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-sm" style={{ height: Math.max(sH, 2) }} />
            </div>
            <span className="text-[10px] text-gray-400">{d.label.split('/')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

function UserStatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUserStats()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data) return <div className="py-10 text-center text-gray-400">Không thể tải dữ liệu</div>;

  const total = Object.values(data.roleCount).reduce((a, b) => a + b, 0);
  const thisMonth = data.monthlyGrowth[data.monthlyGrowth.length - 1];
  const lastMonth = data.monthlyGrowth[data.monthlyGrowth.length - 2];
  const thisMonthTotal = (thisMonth?.students || 0) + (thisMonth?.teachers || 0) + (thisMonth?.parents || 0);
  const lastMonthTotal = (lastMonth?.students || 0) + (lastMonth?.teachers || 0) + (lastMonth?.parents || 0);
  const growth = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  return (
    <div className="p-5 space-y-5">
      {/* Thẻ tổng quan vai trò */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { role: 'student', label: 'Sinh viên', Icon: GraduationCap },
          { role: 'teacher', label: 'Giảng viên', Icon: BookOpen },
          { role: 'parent', label: 'Phụ huynh', Icon: UserCheck },
          { role: 'admin', label: 'Admin', Icon: Shield },
        ].map(({ role, label, Icon }) => {
          const count = data.roleCount[role] || 0;
          const color = ROLE_COLOR[role];
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={role} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-2xl p-4`}>
              <Icon size={18} className={`text-${color}-500 mb-2`} />
              <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <div className={`mt-2 h-1.5 rounded-full bg-${color}-100 dark:bg-${color}-900/40`}>
                <div className={`h-1.5 rounded-full bg-${color}-400`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-[11px] text-${color}-500 mt-0.5`}>{pct}% tổng</p>
            </div>
          );
        })}
      </div>

      {/* Biểu đồ tăng trưởng */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500"/> Tăng trưởng tài khoản (6 tháng)
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-700 dark:text-white">{thisMonthTotal} tháng này</span>
            {growth !== 0 && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${growth > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {growth > 0 ? '+' : ''}{growth}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-gray-400 mb-1">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block"/>SV</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block"/>GV</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block"/>PH</span>
        </div>
        <MonthlyBarChart data={data.monthlyGrowth} />
      </div>

      {/* Tài khoản mới nhất */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-2">
          <UserPlus size={16} className="text-indigo-500"/>
          <p className="text-sm font-semibold text-gray-700 dark:text-white">Tài khoản đăng ký gần nhất</p>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {data.recentUsers.slice(0, 10).map((u, i) => {
            const color = ROLE_COLOR[u.role] || 'gray';
            const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—';
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className={`w-9 h-9 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center shrink-0`}>
                  <span className={`text-sm font-bold text-${color}-600`}>{u.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 font-medium`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                  {u.classId && <p className="text-[11px] text-gray-400">{u.classId}</p>}
                </div>
                <p className="text-[11px] text-gray-400 shrink-0 w-20 text-right">{date}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UsageStatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUsageStats()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data) return <div className="py-10 text-center text-gray-400">Không thể tải dữ liệu</div>;

  const maxLogin = Math.max(...data.dailyLogins.map(d => d.count), 1);
  const maxHour = Math.max(...data.hourlyLogins, 1);
  const totalMethod = Object.values(data.methodCount).reduce((a, b) => a + b, 0) || 1;

  const DAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="p-5 space-y-5">
      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Tổng đăng nhập (7 ngày)', value: data.totalLogins, Icon: Activity, color: 'blue' },
          { label: 'Hoạt động hôm nay', value: data.activeToday, Icon: Users, color: 'green' },
          { label: 'Giờ cao điểm', value: `${data.peakHour}:00`, Icon: Clock, color: 'orange' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-2xl p-4`}>
            <Icon size={18} className={`text-${color}-500 mb-2`} />
            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Đăng nhập 7 ngày */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
          <Activity size={16} className="text-blue-500"/> Lượt đăng nhập 7 ngày qua
        </p>
        <div className="flex items-end gap-2 h-24">
          {data.dailyLogins.map((d, i) => {
            const h = (d.count / maxLogin) * 88;
            const dayName = DAY_VI[new Date(d.date + 'T00:00:00').getDay()];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {d.date.slice(5)}: {d.count} lượt
                </div>
                <div className="w-full flex flex-col justify-end" style={{ height: 88 }}>
                  <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-sm" style={{ height: Math.max(h, d.count > 0 ? 4 : 0) }} />
                </div>
                <span className="text-[10px] text-gray-400">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Giờ cao điểm trong ngày */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
          <Clock size={16} className="text-orange-500"/> Phân bố giờ đăng nhập (7 ngày)
        </p>
        <div className="flex items-end gap-px h-16">
          {data.hourlyLogins.map((count, h) => {
            const barH = (count / maxHour) * 60;
            const isPeak = h === data.peakHour;
            return (
              <div key={h} className="flex-1 flex flex-col items-center group relative" style={{ height: 64 }}>
                {count > 0 && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap">
                    {h}h: {count}
                  </div>
                )}
                <div className="w-full flex flex-col justify-end" style={{ height: 60 }}>
                  <div className={`w-full rounded-t-sm ${isPeak ? 'bg-orange-400' : 'bg-blue-300 dark:bg-blue-600'}`}
                    style={{ height: Math.max(barH, count > 0 ? 3 : 0) }} />
                </div>
                {(h % 6 === 0) && <span className="text-[9px] text-gray-400">{h}h</span>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Giờ cao điểm: <span className="text-orange-500 font-semibold">{data.peakHour}:00 – {data.peakHour + 1}:00</span>
        </p>
      </div>

      {/* Loại điểm danh */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
          <Smartphone size={16} className="text-indigo-500"/> Phương thức điểm danh (7 ngày)
        </p>
        <div className="space-y-3">
          {[
            { key: 'face', label: 'Nhận diện khuôn mặt', Icon: Smartphone, color: 'indigo' },
            { key: 'qr', label: 'Quét mã QR', Icon: QrCode, color: 'blue' },
            { key: 'manual', label: 'Thủ công (GV)', Icon: Edit3, color: 'gray' },
          ].map(({ key, label, Icon, color }) => {
            const val = data.methodCount[key] || 0;
            const pct = Math.round((val / totalMethod) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Icon size={14} className={`text-${color}-500`}/> {label}
                  </span>
                  <span className={`text-sm font-bold text-${color}-600 dark:text-${color}-400`}>{val} ({pct}%)</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                  <div className={`bg-${color}-400 h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
          Admin Dashboard
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
          <h2 className="text-2xl font-bold mb-1">Thống kê toàn trường</h2>
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
                { label: 'Sinh viên', value: data.stats.totalStudents, Icon: GraduationCap, color: 'blue' },
                { label: 'Giảng viên', value: data.stats.totalTeachers, Icon: BookOpen, color: 'green' },
                { label: 'Lớp học', value: data.stats.totalClasses, Icon: BarChart2, color: 'purple' },
                { label: 'Lượt điểm danh', value: data.stats.totalAttendance, Icon: Users, color: 'orange' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm text-center">
                  <Icon size={20} className={`text-${color}-500 mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b dark:border-gray-700">
                {[
                  { key: 'overview', label: 'Theo lớp' },
                  { key: 'daily', label: '7 ngày qua' },
                  { key: 'users', label: 'Người dùng' },
                  { key: 'usage', label: 'Tần suất' },
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
                      <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                        <div className="bg-green-400" style={{ width: `${c.total ? Math.round((c.present / c.total) * 100) : 0}%` }} />
                        <div className="bg-yellow-400" style={{ width: `${c.total ? Math.round((c.late / c.total) * 100) : 0}%` }} />
                        <div className="bg-red-400" style={{ width: `${c.total ? Math.round((c.absent / c.total) * 100) : 0}%` }} />
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

              {/* Tab người dùng */}
              {tab === 'users' && <UserStatsTab />}

              {/* Tab tần suất */}
              {tab === 'usage' && <UsageStatsTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
