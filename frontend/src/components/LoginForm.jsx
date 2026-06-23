import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, Fingerprint } from 'lucide-react';
import { authAPI, biometricAPI } from '../services/api';

export default function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
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
      const res = await authAPI.login({ ...form, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin?.(res.data.user);
      const r = res.data.user.role;
      navigate(r === 'teacher' ? '/teacher' : r === 'admin' ? '/admin' : r === 'parent' ? '/parent' : '/student');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setApiError('Thiết bị của bạn không hỗ trợ xác thực sinh trắc học.');
      return;
    }
    setBioLoading(true);
    setApiError('');
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      });

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const res = await biometricAPI.loginWebAuthn({ credentialId });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin?.(res.data.user);
      const r = res.data.user.role;
      navigate(r === 'teacher' ? '/teacher' : r === 'admin' ? '/admin' : r === 'parent' ? '/parent' : '/student');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setApiError('Xác thực bị từ chối. Thử lại hoặc dùng mật khẩu.');
      } else {
        setApiError(err.response?.data?.message || 'Không thể xác thực sinh trắc học.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const subtitle = role === 'teacher'
    ? 'Hệ thống điểm danh giảng viên'
    : role === 'admin'
    ? 'Quản trị viên hệ thống'
    : role === 'parent'
    ? 'Cổng thông tin phụ huynh'
    : 'Hệ thống điểm danh sinh viên';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <GraduationCap className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Sinh viên</option>
            <option value="teacher">Giảng viên</option>
            <option value="parent">Phụ huynh</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        {apiError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Biometric login */}
        {window.PublicKeyCredential && (
          <button
            onClick={handleBiometric}
            disabled={bioLoading}
            className="mt-3 w-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Fingerprint size={18} className="text-blue-500" />
            {bioLoading ? 'Đang xác thực...' : 'Đăng nhập bằng sinh trắc học'}
          </button>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Chưa có tài khoản?{' '}
          <Link
            to={role === 'teacher' ? '/register?role=teacher' : role === 'parent' ? '/register?role=parent' : '/register'}
            className="text-blue-500 hover:underline font-medium"
          >
            Đăng ký ở đây
          </Link>
        </p>
        <p className="text-center text-sm text-gray-400 mt-2">
          <Link to="/forgot-password" className="hover:underline hover:text-blue-500">
            Quên mật khẩu?
          </Link>
        </p>
      </div>
    </div>
  );
}
