import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const SCHOOL = [
  {
    khoa: 'Khoa Thương mại Quốc tế',
    nganh: [
      { ten: 'Kinh doanh Xuất nhập khẩu', vietTat: 'KDXNK' },
      { ten: 'Logistics', vietTat: 'LOG' },
    ],
  },
  {
    khoa: 'Khoa Quản trị Kinh doanh',
    nganh: [
      { ten: 'Quản trị Kinh doanh', vietTat: 'QTKD' },
      { ten: 'Marketing Thương mại', vietTat: 'MKTM' },
      { ten: 'Thương mại Điện tử', vietTat: 'TMDT' },
      { ten: 'Quản trị Khách sạn', vietTat: 'QTKS' },
      { ten: 'Quản trị Dịch vụ Du lịch & Lữ hành', vietTat: 'QTDL' },
      { ten: 'Quản trị Kinh doanh Bất động sản', vietTat: 'QTBDS' },
    ],
  },
  {
    khoa: 'Khoa Tài chính Kế toán',
    nganh: [
      { ten: 'Tài chính Doanh nghiệp', vietTat: 'TCDN' },
      { ten: 'Kế toán Doanh nghiệp', vietTat: 'KTDN' },
    ],
  },
  {
    khoa: 'Khoa Ngoại ngữ',
    nganh: [
      { ten: 'Tiếng Anh Thương mại', vietTat: 'TATM' },
      { ten: 'Tiếng Anh Du lịch', vietTat: 'TADL' },
    ],
  },
];

const KHOA_LIST = ['K20','K21','K22','K23','K24','K25','K26','K27','K28','K29'];
const LOP_LETTERS = ['A','B','C','D','E','F','G','H','I'];

const SELECT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500';
const INPUT_CLS = (err) => `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400' : 'border-gray-300'}`;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [role, setRole] = useState(initRole);
  const [form, setForm] = useState({ name: '', email: '', mssv: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Cascading class selection
  const [selKhoa, setSelKhoa] = useState('');
  const [selNganh, setSelNganh] = useState('');
  const [selKhoa2, setSelKhoa2] = useState(''); // khóa học (K28...)
  const [selLop, setSelLop] = useState('');

  const nganhList = SCHOOL.find((k) => k.khoa === selKhoa)?.nganh || [];
  const vietTat = nganhList.find((n) => n.ten === selNganh)?.vietTat || '';
  const lopList = (selKhoa2 && vietTat)
    ? LOP_LETTERS.map((l) => `CĐ${vietTat}${selKhoa2.replace('K', '')}${l}`)
    : [];

  const classId = selLop;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Họ tên là bắt buộc';
    if (!form.email) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (role === 'student') {
      if (!form.mssv) e.mssv = 'MSSV là bắt buộc';
      else if (!/^\d{7}$/.test(form.mssv)) e.mssv = 'MSSV gồm đúng 7 số';
      if (!selKhoa) e.classId = 'Vui lòng chọn khoa';
      else if (!selNganh) e.classId = 'Vui lòng chọn ngành';
      else if (!selKhoa2) e.classId = 'Vui lòng chọn khóa';
      else if (!selLop) e.classId = 'Vui lòng chọn lớp';
    }
    if (!form.password) e.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!form.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'student') { payload.mssv = form.mssv; payload.classId = classId; }
      await authAPI.register(payload);
      setSuccess('Đăng ký thành công! Chuyển sang trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const subtitle = role === 'teacher' ? 'Tài khoản giảng viên' : 'Sinh viên mới';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <GraduationCap className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>

        {/* Role selector — same style as LoginForm */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setErrors({}); setApiError(''); }}
            className={SELECT_CLS}
          >
            <option value="student">Sinh viên</option>
            <option value="teacher">Giảng viên</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Thị A" className={INPUT_CLS(errors.name)} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className={INPUT_CLS(errors.email)} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Student-only */}
          {role === 'student' && (
            <>
              {/* MSSV — full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MSSV (7 số)</label>
                <input type="text" name="mssv" value={form.mssv} onChange={handleChange} placeholder="2404001" className={INPUT_CLS(errors.mssv)} />
                {errors.mssv && <p className="text-red-500 text-xs mt-1">{errors.mssv}</p>}
              </div>

              {/* Cascading: Khoa → Ngành → Khóa → Lớp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                <select
                  value={selKhoa}
                  onChange={(e) => { setSelKhoa(e.target.value); setSelNganh(''); setSelKhoa2(''); setSelLop(''); setErrors((er) => ({ ...er, classId: '' })); }}
                  className={SELECT_CLS}
                >
                  <option value="">-- Chọn khoa --</option>
                  {SCHOOL.map((k) => <option key={k.khoa} value={k.khoa}>{k.khoa}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
                <select
                  value={selNganh}
                  onChange={(e) => { setSelNganh(e.target.value); setSelKhoa2(''); setSelLop(''); }}
                  disabled={!selKhoa}
                  className={`${SELECT_CLS} disabled:bg-gray-50 disabled:text-gray-400`}
                >
                  <option value="">-- Chọn ngành --</option>
                  {nganhList.map((n) => <option key={n.ten} value={n.ten}>{n.ten}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khóa</label>
                  <select
                    value={selKhoa2}
                    onChange={(e) => { setSelKhoa2(e.target.value); setSelLop(''); }}
                    disabled={!selNganh}
                    className={`${SELECT_CLS} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">-- Chọn khóa --</option>
                    {KHOA_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select
                    value={selLop}
                    onChange={(e) => { setSelLop(e.target.value); setErrors((er) => ({ ...er, classId: '' })); }}
                    disabled={!selKhoa2}
                    className={`${SELECT_CLS} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">-- Chọn lớp --</option>
                    {lopList.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              {errors.classId && <p className="text-red-500 text-xs -mt-2">{errors.classId}</p>}

              {/* Preview lớp đã chọn */}
              {selLop && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                  <span className="text-base">🎓</span>
                  <span>Lớp của bạn: <strong>{selLop}</strong></span>
                </div>
              )}
            </>
          )}

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                className={INPUT_CLS(errors.password) + ' pr-10'}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              className={INPUT_CLS(errors.confirmPassword)}
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

        <p className="text-center text-sm text-gray-500 mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
