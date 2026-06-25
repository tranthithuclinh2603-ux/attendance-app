import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle, Upload, Camera, RotateCcw, ChevronRight } from 'lucide-react';
import { authAPI, biometricAPI } from '../services/api';
import { loadFaceModels, detectFaceDescriptor, resizeImage } from '../utils/faceUtils';

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 'Yếu', color: 'bg-red-500', width: '25%', text: 'text-red-600' };
  if (score <= 2) return { level: 'Trung bình', color: 'bg-yellow-500', width: '50%', text: 'text-yellow-600' };
  if (score <= 3) return { level: 'Khá mạnh', color: 'bg-blue-500', width: '75%', text: 'text-blue-600' };
  return { level: 'Mạnh', color: 'bg-green-500', width: '100%', text: 'text-green-600' };
}

function generateStrongPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;
  let pw = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + digits[Math.floor(Math.random() * digits.length)]
    + special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

const SCHOOL = [
  { khoa: 'Khoa Thương mại Quốc tế', nganh: [{ ten: 'Kinh doanh Xuất nhập khẩu', vietTat: 'KDXNK' }, { ten: 'Logistics', vietTat: 'LOG' }] },
  { khoa: 'Khoa Quản trị Kinh doanh', nganh: [{ ten: 'Quản trị Kinh doanh', vietTat: 'QTKD' }, { ten: 'Marketing Thương mại', vietTat: 'MKTM' }, { ten: 'Thương mại Điện tử', vietTat: 'TMDT' }, { ten: 'Quản trị Khách sạn', vietTat: 'QTKS' }, { ten: 'Quản trị Dịch vụ Du lịch & Lữ hành', vietTat: 'QTDL' }, { ten: 'Quản trị Kinh doanh Bất động sản', vietTat: 'QTBDS' }] },
  { khoa: 'Khoa Tài chính Kế toán', nganh: [{ ten: 'Tài chính Doanh nghiệp', vietTat: 'TCDN' }, { ten: 'Kế toán Doanh nghiệp', vietTat: 'KTDN' }] },
  { khoa: 'Khoa Ngoại ngữ', nganh: [{ ten: 'Tiếng Anh Thương mại', vietTat: 'TATM' }, { ten: 'Tiếng Anh Du lịch', vietTat: 'TADL' }] },
];
const KHOA_LIST = ['K20','K21','K22','K23','K24','K25','K26','K27','K28','K29'];
const LOP_LETTERS = ['A','B','C','D','E','F','G','H','I'];

const SELECT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500';
const INPUT_CLS = (err) => `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400' : 'border-gray-300'}`;

const FACE_ANGLES = ['Nhìn thẳng', 'Quay trái nhẹ', 'Quay phải nhẹ'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [step, setStep] = useState(1); // 1=thông tin, 2=thẻ SV, 3=khuôn mặt, 4=hoàn tất
  const [role, setRole] = useState(initRole);
  const [form, setForm] = useState({ name: '', email: '', mssv: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Class cascade
  const [selKhoa, setSelKhoa] = useState(SCHOOL[0].khoa);
  const [selNganh, setSelNganh] = useState(SCHOOL[0].nganh[0].ten);
  const [selKhoaHoc, setSelKhoaHoc] = useState(KHOA_LIST[0]);
  const [selLop, setSelLop] = useState(`CĐ${SCHOOL[0].nganh[0].vietTat}${KHOA_LIST[0].replace('K','')}${LOP_LETTERS[0]}`);
  const nganhList = SCHOOL.find(k => k.khoa === selKhoa)?.nganh || [];
  const vietTat = nganhList.find(n => n.ten === selNganh)?.vietTat || '';
  const lopList = selKhoaHoc && vietTat ? LOP_LETTERS.map(l => `CĐ${vietTat}${selKhoaHoc.replace('K','')}${l}`) : [];

  // Step 2: Student ID card
  const [studentIdImage, setStudentIdImage] = useState(null);
  const [idError, setIdError] = useState('');
  const [modelPreloaded, setModelPreloaded] = useState(false);

  // Step 3: Face enrollment
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [faceStep, setFaceStep] = useState('init'); // init|loadingModel|ready|capturing|done|error
  const [faceMsg, setFaceMsg] = useState('');
  const [capturedCount, setCapturedCount] = useState(0);
  const [faceDescriptors, setFaceDescriptors] = useState([]);
  const [modelsReady, setModelsReady] = useState(false);

  // Registration result
  const [registeredUser, setRegisteredUser] = useState(null); // { id, token }

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Cleanup camera on unmount
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Step 1 validation ─────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Họ tên là bắt buộc';
    if (!form.email) e.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (role === 'student') {
      if (!form.mssv) e.mssv = 'MSSV là bắt buộc';
      else if (!/^\d{7}$/.test(form.mssv)) e.mssv = 'MSSV gồm đúng 7 số';
      if (!selLop) e.classId = 'Vui lòng chọn lớp';
    }
    if (!form.password) e.password = 'Mật khẩu là bắt buộc';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!form.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    return e;
  };

  const handleNext = () => {
    setApiError('');
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (role === 'teacher') {
      // Teacher: skip step 2 & 3 → go straight to register
      handleTeacherSubmit();
    } else {
      setStep(2);
    }
  };

  const handleTeacherSubmit = async () => {
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password, role });
      setStep(4);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Student ID card upload ────────────────
  // Preload face models in background the moment step 2 is shown
  useEffect(() => {
    if (step === 2 && !modelPreloaded) {
      loadFaceModels().then(() => setModelPreloaded(true)).catch(() => {});
    }
  }, [step, modelPreloaded]);

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdError('');
    if (!file.type.startsWith('image/')) { setIdError('Vui lòng chọn file ảnh'); return; }
    const base64 = await resizeImage(file, 1000);
    setStudentIdImage(base64);
  };

  const handleStep2Next = () => {
    if (!studentIdImage) { setIdError('Vui lòng tải lên ảnh thẻ sinh viên'); return; }
    setStep(3);
    startFaceEnroll();
  };

  // ── Step 3: Face enrollment ────────────────────────
  // Gắn stream vào video khi faceStep chuyển sang 'ready' (DOM đã render video element)
  useEffect(() => {
    if (faceStep === 'ready' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [faceStep]);

  const startFaceEnroll = async () => {
    setFaceStep('loadingModel');
    setFaceMsg('Đang bật camera...');
    setModelsReady(false);
    try {
      // 1. Bật camera trước — nhanh (< 1 giây)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;

      // 2. Hiển thị video NGAY — dùng setTimeout để chờ DOM render xong
      setFaceStep('ready');
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);

      // 3. Tải model ở nền — nếu đã preload từ bước 2 thì gần như tức thì
      setFaceMsg('Đang tải model nhận diện...');
      await loadFaceModels((msg) => setFaceMsg(msg));
      setModelsReady(true);
      setFaceMsg('');
    } catch (err) {
      setFaceStep('error');
      setFaceMsg(
        err.name === 'NotAllowedError'
          ? 'Bạn cần cho phép truy cập camera.'
          : 'Không thể khởi động camera. Vui lòng thử lại.'
      );
    }
  };

  const captureAngle = async () => {
    setFaceStep('capturing');
    setFaceMsg('Đang nhận diện khuôn mặt...');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const descriptor = await detectFaceDescriptor(canvas);
    if (!descriptor) {
      setFaceStep('ready');
      setFaceMsg('Không phát hiện khuôn mặt. Hãy căn chỉnh lại và thử lại.');
      return;
    }
    const newList = [...faceDescriptors, descriptor];
    setFaceDescriptors(newList);
    const count = capturedCount + 1;
    setCapturedCount(count);
    if (count >= FACE_ANGLES.length) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setFaceStep('done');
      setFaceMsg('');
    } else {
      setFaceStep('ready');
      setFaceMsg('');
    }
  };

  // ── Final submit (student) ─────────────────────────
  const handleFinalSubmit = async () => {
    setLoading(true);
    setApiError('');
    try {
      // 1. Register account
      const regRes = await authAPI.register({
        name: form.name, email: form.email, password: form.password,
        role, mssv: form.mssv, classId: selLop,
      });

      // 2. Login to get token for subsequent calls
      const loginRes = await authAPI.login({ email: form.email, password: form.password, role });
      const token = loginRes.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));

      // 3. Save student ID card
      await biometricAPI.saveStudentId({ imageBase64: studentIdImage });

      // 4. Save face descriptors
      if (faceDescriptors.length > 0) {
        await biometricAPI.saveFace({ descriptors: faceDescriptors });
      }

      setStep(4);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
    setApiError('');
  };

  // ── Render ─────────────────────────────────────────
  const stepLabels = role === 'teacher'
    ? ['Thông tin']
    : ['Thông tin', 'Thẻ SV', 'Khuôn mặt'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <GraduationCap className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">{role === 'teacher' ? 'Tài khoản giảng viên' : 'Sinh viên mới'}</p>
        </div>

        {/* Progress steps (student only, steps 1-3) */}
        {role === 'student' && step < 4 && (
          <div className="flex items-center mb-6">
            {stepLabels.map((label, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? '✓' : idx}
                    </div>
                    <span className={`text-xs mt-1 ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > idx ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {apiError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} /> {apiError}
          </div>
        )}

        {/* ── STEP 1: Thông tin cơ bản ─────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select value={role} onChange={e => { setRole(e.target.value); setErrors({}); setApiError(''); }} className={SELECT_CLS}>
                <option value="student">Sinh viên</option>
                <option value="teacher">Giảng viên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Thị A" className={INPUT_CLS(errors.name)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className={INPUT_CLS(errors.email)} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MSSV (7 số)</label>
                  <input type="text" name="mssv" value={form.mssv} onChange={handleChange} placeholder="2403976" className={INPUT_CLS(errors.mssv)} />
                  {errors.mssv && <p className="text-red-500 text-xs mt-1">{errors.mssv}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                  <select value={selKhoa} onChange={e => { const k = e.target.value; const fn = SCHOOL.find(x => x.khoa === k)?.nganh[0]; const vt = fn?.vietTat||''; setSelKhoa(k); setSelNganh(fn?.ten||''); setSelLop(vt?`CĐ${vt}${selKhoaHoc.replace('K','')}${LOP_LETTERS[0]}`:''); }} className={SELECT_CLS}>
                    {SCHOOL.map(k => <option key={k.khoa} value={k.khoa}>{k.khoa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
                  <select value={selNganh} onChange={e => { const n = e.target.value; const vt = nganhList.find(x => x.ten === n)?.vietTat||''; setSelNganh(n); setSelLop(vt?`CĐ${vt}${selKhoaHoc.replace('K','')}${LOP_LETTERS[0]}`:''); }} className={SELECT_CLS}>
                    {nganhList.map(n => <option key={n.ten} value={n.ten}>{n.ten}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khóa</label>
                    <select value={selKhoaHoc} onChange={e => { const k = e.target.value; setSelKhoaHoc(k); setSelLop(vietTat?`CĐ${vietTat}${k.replace('K','')}${LOP_LETTERS[0]}`:''); }} className={SELECT_CLS}>
                      {KHOA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                    <select value={selLop} onChange={e => { setSelLop(e.target.value); setErrors(er => ({...er, classId:''})); }} className={SELECT_CLS}>
                      {lopList.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                {errors.classId && <p className="text-red-500 text-xs -mt-2">{errors.classId}</p>}
                {selLop && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                    <span>🎓</span> <span>Lớp: <strong>{selLop}</strong></span>
                  </div>
                )}
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => {
                    const pw = generateStrongPassword();
                    setForm(f => ({ ...f, password: pw, confirmPassword: pw }));
                    setErrors(er => ({ ...er, password: '', confirmPassword: '' }));
                    setShowPw(true);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  ⚡ Tạo mật khẩu mạnh
                </button>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" className={INPUT_CLS(errors.password) + ' pr-10'} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
              {/* Password strength */}
              {form.password && (() => {
                const s = getPasswordStrength(form.password);
                return (
                  <div className="mt-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div className={`h-1.5 rounded-full transition-all ${s.color}`} style={{ width: s.width }} />
                      </div>
                      <span className={`text-xs font-medium ${s.text}`}>{s.level}</span>
                    </div>
                  </div>
                );
              })()}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <input type={showConfirmPw ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu" className={INPUT_CLS(errors.confirmPassword) + ' pr-10'} />
                <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-green-500 text-xs mt-1">✓ Mật khẩu khớp</p>
              )}
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button onClick={handleNext} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
              {loading ? 'Đang xử lý...' : role === 'teacher' ? 'Đăng ký' : <><span>Tiếp theo</span> <ChevronRight size={16}/></>}
            </button>
          </div>
        )}

        {/* ── STEP 2: Ảnh thẻ sinh viên ────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1">📋 Tải lên ảnh thẻ sinh viên</p>
              <p className="text-blue-600 text-xs">Hệ thống sẽ xác thực thông tin cá nhân qua ảnh thẻ sinh viên của bạn.</p>
            </div>

            <label className={`block border-2 border-dashed rounded-xl cursor-pointer transition-colors ${studentIdImage ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
              <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />
              {studentIdImage ? (
                <div className="p-3">
                  <img src={studentIdImage} alt="Thẻ SV" className="w-full rounded-lg object-contain max-h-48" />
                  <p className="text-center text-green-600 text-sm font-medium mt-2">✅ Đã tải lên thành công</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Upload size={40} className="text-gray-400" />
                  <p className="text-gray-500 text-sm">Nhấn để chọn ảnh thẻ sinh viên</p>
                  <p className="text-gray-400 text-xs">JPG, PNG — tối đa 10MB</p>
                </div>
              )}
            </label>
            {idError && <p className="text-red-500 text-sm">{idError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Quay lại
              </button>
              <button onClick={handleStep2Next} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                Tiếp theo <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Quét khuôn mặt ───────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-700">
              <p className="font-semibold mb-1">📸 Đăng ký nhận diện khuôn mặt</p>
              <p className="text-violet-600 text-xs">Chụp <strong>{FACE_ANGLES.length} góc</strong> để hệ thống nhận diện chính xác khi điểm danh.</p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 justify-center">
              {FACE_ANGLES.map((angle, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < capturedCount ? 'bg-green-500 text-white' : i === capturedCount ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i < capturedCount ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-400">{angle}</span>
                </div>
              ))}
            </div>

            {/* Camera / result */}
            {faceStep === 'loadingModel' && (
              <div className="flex flex-col items-center gap-4 py-10 bg-gray-900 rounded-xl px-6" style={{ minHeight: '220px' }}>
                <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mt-4" />
                <p className="text-white text-sm text-center">{faceMsg || 'Đang bật camera...'}</p>
              </div>
            )}

            {faceStep === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600 text-sm">{faceMsg}</p>
                <button onClick={startFaceEnroll} className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Thử lại</button>
              </div>
            )}

            {(faceStep === 'ready' || faceStep === 'capturing') && (
              <div>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ maxHeight: '55vh', minHeight: '220px' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover scale-x-[-1]" style={{ maxHeight: '55vh' }} />

                  {/* Face oval guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-36 h-44 border-4 border-violet-400 rounded-full opacity-70" />
                  </div>

                  {/* Model loading overlay — hiện khi camera đã bật nhưng model chưa xong */}
                  {!modelsReady && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                      <p className="text-white text-xs px-3 text-center">{faceMsg || 'Đang tải model...'}</p>
                    </div>
                  )}

                  {/* Angle label + capture button */}
                  <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5">
                    {modelsReady && (
                      <p className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">{FACE_ANGLES[capturedCount]}</p>
                    )}
                    <button
                      onClick={captureAngle}
                      disabled={!modelsReady || faceStep === 'capturing'}
                      className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-violet-500 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
                    >
                      <Camera size={24} className="text-violet-500" />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {faceStep === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-green-700 font-semibold">Đã chụp đủ {FACE_ANGLES.length} góc khuôn mặt!</p>
                <p className="text-green-600 text-sm mt-1">Dữ liệu sinh trắc học sẵn sàng được lưu.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setStep(2); setCapturedCount(0); setFaceDescriptors([]); setFaceStep('init'); setModelsReady(false); setFaceMsg(''); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Quay lại
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={faceStep !== 'done' || loading}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Đang lưu...</> : '🎉 Hoàn tất đăng ký'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Hoàn tất ──────────────────────────── */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-800">Đăng ký thành công!</h2>
            {role === 'student' && (
              <p className="text-gray-500 text-sm">Tài khoản, ảnh thẻ sinh viên và dữ liệu khuôn mặt đã được lưu. Bạn có thể điểm danh bằng nhận diện khuôn mặt.</p>
            )}
            <button onClick={() => navigate('/login')} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm">
              Đến trang đăng nhập
            </button>
          </div>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-gray-500 mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-blue-500 hover:underline font-medium">Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  );
}
