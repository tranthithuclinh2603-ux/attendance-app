import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const CLASSES = ['CĐTMDT28A','CĐTMDT28B','CĐTMDT28C','CĐTMDT28D','CĐTMDT28E','CĐTMDT28F','CĐTMDT28G','CĐTMDT28H','CĐTMDT28I'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [role, setRole] = useState(initRole);
  const [form, setForm] = useState({
    name: '', email: '', mssv: '', classId: CLASSES[0], password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Họ tên là bắt buộc';
    if (!form.email) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (role === 'student') {
      if (!form.mssv) e.mssv = 'MSSV là bắt buộc';
      else if (!/^\d{7}$/.test(form.mssv)) e.mssv = 'MSSV gồm đúng 7 số';
    }
    if (!form.password) e.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!form.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'student') {
        payload.mssv = form.mssv;
        payload.classId = form.classId;
      }
      await authAPI.register(payload);
      setSuccess('Đăng ký thành công! Chuyển sang trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <GraduationCap className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Đăng ký tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">
            {role === 'teacher' ? 'Tài khoản giảng viên' : 'Sinh viên mới'}
          </p>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setErrors({}); setApiError(''); }}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="student">🎓 Sinh viên</option>
            <option value="teacher">👩‍🏫 Giảng viên</option>
          </select>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-3 text-sm">
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {apiError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} /> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nguyễn Thị A"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Student-only fields */}
          {role === 'student' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MSSV (7 số)</label>
                <input
                  type="text"
                  name="mssv"
                  value={form.mssv}
                  onChange={handleChange}
                  placeholder="2404001"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.mssv ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.mssv && <p className="text-red-500 text-xs mt-1">{errors.mssv}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lớp</label>
                <select
                  name="classId"
                  value={form.classId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
