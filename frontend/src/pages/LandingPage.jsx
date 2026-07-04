import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, QrCode, BarChart2, FileSpreadsheet, Shield,
  CheckCircle, ChevronDown, ChevronUp, ArrowRight, Users,
  Star, Menu, X, Zap, BookOpen, GraduationCap, Settings,
  Activity, Clock, TrendingUp, UserCheck,
} from 'lucide-react';

/* ─── CSS animations (injected once) ─── */
const STYLE = `
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes fadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pulseRing {
  0%   { transform:scale(1); opacity:.6; }
  100% { transform:scale(1.6); opacity:0; }
}
.anim-float   { animation: float 4s ease-in-out infinite; }
.anim-fadeUp  { animation: fadeUp .6s ease both; }
.anim-fadeUp1 { animation: fadeUp .6s .1s ease both; }
.anim-fadeUp2 { animation: fadeUp .6s .2s ease both; }
.anim-fadeUp3 { animation: fadeUp .6s .3s ease both; }
.anim-fadeUp4 { animation: fadeUp .6s .4s ease both; }
.pulse-ring::after {
  content:''; position:absolute; inset:0; border-radius:50%;
  border:2px solid #22c55e;
  animation: pulseRing 1.4s ease-out infinite;
}
`;

/* ─── Logo Icon ─── */
function LogoIcon({ size = 32 }) {
  const s = Math.round(size * 0.6);
  return <Users size={s} className="text-white" />;
}

/* ─── Premium Dashboard Mockup ─── */
function HeroDashboard() {
  return (
    <div className="relative anim-float" style={{ animationDelay: '.2s' }}>
      {/* Glow blobs */}
      <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-400 rounded-full opacity-15 blur-2xl" />
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sky-400 rounded-full opacity-20 blur-xl" />

      {/* Glass card */}
      <div className="relative rounded-[28px] overflow-hidden shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(37,99,235,0.15)' }}>

        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <span className="ml-1.5 text-white text-[11px] font-semibold opacity-90">Điểm Danh SV</span>
          </div>
          {/* Realtime badge */}
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-white text-[10px] font-medium">Realtime</span>
          </div>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Face AI + QR row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-[16px] p-2.5 flex items-center gap-2 border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Camera size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Khuôn mặt</div>
                <div className="text-xs font-bold text-blue-700">Chính xác cao</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-[16px] p-2.5 flex items-center gap-2 border border-sky-100">
              <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <QrCode size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500">QR Code</div>
                <div className="text-xs font-bold text-sky-700">Tức thì</div>
              </div>
            </div>
          </div>

          {/* Attendance summary */}
          <div className="bg-gray-50 rounded-[16px] p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-semibold text-gray-700">Buổi học hôm nay</span>
              <span className="text-[10px] text-gray-400">Thứ Tư, 02/07</span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {[
                { v: '38', l: 'Có mặt', bg: 'bg-green-500' },
                { v: '4', l: 'Vắng', bg: 'bg-red-400' },
                { v: '2', l: 'Trễ', bg: 'bg-yellow-400' },
              ].map(s => (
                <div key={s.l} className="flex-1 text-center">
                  <div className="text-base font-extrabold text-gray-800">{s.v}</div>
                  <div className="text-[9px] text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full" style={{ width: '86%' }} />
            </div>
            <div className="text-[9px] text-gray-400 mt-1 text-right">86% chuyên cần</div>
          </div>

          {/* Mini bar chart */}
          <div className="bg-gray-50 rounded-[16px] px-3 pt-2.5 pb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-semibold text-gray-700">7 ngày qua</span>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp size={11} />
                <span className="text-[10px] font-semibold">+5%</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-10">
              {[65, 80, 55, 90, 72, 95, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm"
                  style={{ height: `${h}%`, background: i === 5 ? '#2563EB' : '#BFDBFE' }} />
              ))}
            </div>
            <div className="flex mt-1">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                <span key={d} className="flex-1 text-center text-[8px] text-gray-400">{d}</span>
              ))}
            </div>
          </div>

          {/* Student list */}
          <div className="space-y-1">
            {[
              { name: 'Nguyễn Văn An', status: 'Có mặt', dot: 'bg-green-400', time: '07:58' },
              { name: 'Trần Thị Bình', status: 'Vắng mặt', dot: 'bg-red-400', time: '--:--' },
              { name: 'Lê Hoàng Cường', status: 'Có mặt', dot: 'bg-green-400', time: '08:01' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between bg-white rounded-[12px] px-2.5 py-1.5 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <span className="text-[11px] text-gray-700 font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400">{s.time}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.status === 'Có mặt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating check badge — bottom right */}
      <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl shadow-xl px-3 py-2 border border-blue-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <UserCheck size={12} className="text-white" />
        </div>
        <div>
          <div className="text-[9px] text-gray-400 leading-none">Nhận diện</div>
          <div className="text-[11px] font-bold text-gray-800 leading-tight">Nhanh chóng</div>
        </div>
      </div>

      {/* Floating online badge — bottom left */}
      <div className="absolute -bottom-10 -left-2 sm:-left-3 bg-white rounded-2xl shadow-xl px-3 py-2 border border-green-100 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-[11px] font-semibold text-gray-700">44 sinh viên online</span>
      </div>
    </div>
  );
}

/* ─── Scroll reveal ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  );
}

/* ─── Counter ─── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    let n = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      n += step;
      if (n >= to) { setVal(to); clearInterval(t); } else setVal(n);
    }, 30);
    return () => clearInterval(t);
  }, [visible, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── FAQ item ─── */
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between px-4 py-4 text-left gap-3">
        <span className="font-semibold text-gray-800 text-sm leading-snug">{q}</span>
        {open ? <ChevronUp size={16} className="text-blue-600 flex-shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{a}</div>}
    </div>
  );
}

/* ─── Data ─── */
const features = [
  { icon: Camera, title: 'Nhận diện khuôn mặt', desc: 'Nhận diện khuôn mặt chính xác cao, không cần chạm tay, hoạt động ngay trên trình duyệt.' },
  { icon: QrCode, title: 'Quét mã QR', desc: 'Tạo QR theo buổi học, sinh viên quét là hoàn thành ngay lập tức.' },
  { icon: BarChart2, title: 'Thống kê realtime', desc: 'Theo dõi chuyên cần và cảnh báo vắng mặt tự động.' },
  { icon: FileSpreadsheet, title: 'Xuất báo cáo', desc: 'Xuất Excel 2 sheet và PDF chuyên nghiệp theo khoảng thời gian.' },
  { icon: Shield, title: 'Bảo mật cao', desc: 'JWT, mã hóa dữ liệu — thông tin sinh viên luôn được bảo vệ.' },
  { icon: GraduationCap, title: 'Dễ sử dụng', desc: 'Giao diện thân thiện, không cần cài đặt thêm, hoạt động trên mọi thiết bị.' },
];

const steps = [
  { icon: GraduationCap, title: 'Đăng ký tài khoản', desc: 'Sinh viên và giảng viên tạo tài khoản trong vài giây.' },
  { icon: Zap, title: 'Mở phiên điểm danh', desc: 'Giảng viên mở phiên, hệ thống tự tạo QR và bật nhận diện.' },
  { icon: CheckCircle, title: 'Điểm danh tức thì', desc: 'Sinh viên quét QR hoặc nhận diện khuôn mặt — nhanh chóng và chính xác.' },
];

const roles = [
  {
    icon: BookOpen, title: 'Sinh viên', color: 'from-blue-500 to-blue-700',
    items: ['Điểm danh bằng khuôn mặt hoặc QR', 'Xem lịch sử điểm danh cá nhân', 'Nộp đơn xin nghỉ phép online', 'Nhận thông báo khi vắng nhiều'],
  },
  {
    icon: GraduationCap, title: 'Giảng viên', color: 'from-sky-500 to-sky-700',
    items: ['Mở/đóng phiên điểm danh nhanh', 'Thống kê theo tuần, tháng', 'Xuất báo cáo Excel và PDF', 'Duyệt đơn xin nghỉ trực tiếp'],
  },
  {
    icon: Settings, title: 'Quản trị viên', color: 'from-indigo-500 to-indigo-700',
    items: ['Quản lý toàn bộ tài khoản', 'Thống kê tăng trưởng người dùng', 'Theo dõi tần suất sử dụng', 'Toàn quyền hệ thống'],
  },
];

const faqs = [
  { q: 'Hệ thống có hoạt động trên điện thoại không?', a: 'Có. Ứng dụng hỗ trợ đầy đủ trên trình duyệt điện thoại và có thể cài đặt như ứng dụng PWA hoặc APK Android.' },
  { q: 'Sinh viên cần đăng ký khuôn mặt ở đâu?', a: 'Sau khi đăng nhập, vào mục Hồ sơ và thực hiện đăng ký khuôn mặt một lần duy nhất. Hệ thống sẽ tự nhận diện từ lần sau.' },
  { q: 'Giảng viên có thể sửa điểm danh thủ công không?', a: 'Có. Giảng viên chỉnh sửa trạng thái điểm danh của từng sinh viên trong danh sách lớp bất cứ lúc nào.' },
  { q: 'Dữ liệu được lưu trữ ở đâu?', a: 'Dữ liệu lưu trên Firebase Realtime Database theo chuẩn Google Cloud, bảo mật và ổn định 99.9%.' },
  { q: 'Có hỗ trợ xuất báo cáo theo học kỳ không?', a: 'Có. Giảng viên chọn khoảng thời gian tùy ý (tối đa 62 ngày) để xuất báo cáo Excel hoặc PDF.' },
];

/* ─── Main ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white text-gray-800" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{STYLE}</style>

      {/* ─── Navbar ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); }}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow">
              <LogoIcon size={22} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[#2563EB] text-sm">Điểm Danh SV</div>
              <div className="text-[10px] text-gray-400 hidden sm:block">CĐKTĐN</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {[['#features','Tính năng'],['#how','Cách dùng'],['#roles','Đối tượng'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-blue-600 transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-[#2563EB] hover:text-blue-800 px-3 py-2 transition-colors">Đăng nhập</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-4 py-2 rounded-[18px] hover:opacity-90 transition shadow-md shadow-blue-200">Đăng ký miễn phí</button>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg px-4 py-4 space-y-1">
            {[['#features','Tính năng'],['#how','Cách dùng'],['#roles','Đối tượng'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm">{label}</a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button onClick={() => { navigate('/login'); setMenuOpen(false); }} className="border border-blue-200 text-blue-600 font-semibold py-2.5 rounded-[18px] text-sm">Đăng nhập</button>
              <button onClick={() => { navigate('/register'); setMenuOpen(false); }} className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold py-2.5 rounded-[18px] text-sm">Đăng ký</button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO — new layout ─── */}
      <section className="relative pt-16 pb-6 px-4 sm:px-6 overflow-hidden" style={{ background: '#F8FAFC' }}>
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #BFDBFE 0%, transparent 70%)' }} />
        <div className="absolute top-20 -left-20 w-48 h-48 bg-sky-200 rounded-full opacity-20 blur-2xl pointer-events-none" />
        <div className="absolute top-10 -right-16 w-40 h-40 bg-blue-200 rounded-full opacity-20 blur-2xl pointer-events-none" />

        <div className="relative max-w-md mx-auto md:max-w-6xl">

          {/* ── Text block (mobile compact) ── */}
          <div className="text-center mb-5 md:hidden">
            {/* Badge */}
            <div className="anim-fadeUp inline-flex items-center gap-1.5 bg-blue-100 text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse" />
              Hệ thống điểm danh hiện đại
            </div>

            {/* Title */}
            <h1 className="anim-fadeUp1 text-[2.1rem] leading-tight font-extrabold text-[#111827] mb-2">
              Điểm danh{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#60A5FA]">khuôn mặt</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#2563EB]">thông minh</span>
            </h1>

            {/* Subtitle — 1 line only */}
            <p className="anim-fadeUp2 text-[#6B7280] text-sm mb-4 leading-relaxed">
              Dành cho <strong className="text-[#111827]">Trường Cao đẳng Kinh tế Đối ngoại</strong>
            </p>

            {/* CTAs — primary full, secondary text link */}
            <div className="anim-fadeUp3 flex flex-col gap-2 max-w-xs mx-auto">
              <button onClick={() => navigate('/register')}
                className="w-full flex items-center justify-center gap-2 font-semibold text-white text-sm py-3.5 rounded-[18px] transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}>
                Đăng ký miễn phí <ArrowRight size={15} />
              </button>
              <button onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="w-full text-[#2563EB] text-sm font-medium py-2 active:opacity-70">
                Xem tính năng ↓
              </button>
            </div>
          </div>

          {/* ── Desktop hero: 2 cols ── */}
          <div className="hidden md:grid md:grid-cols-2 gap-12 items-center mb-10">
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse" />
                Hệ thống điểm danh hiện đại
              </div>
              <h1 className="text-5xl font-extrabold text-[#111827] leading-tight mb-4">
                Điểm danh{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#60A5FA]">khuôn mặt</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#2563EB]">thông minh</span>
              </h1>
              <p className="text-[#6B7280] text-base mb-4 leading-relaxed">
                Giải pháp điểm danh thông minh dành cho<br />
                <strong className="text-[#111827]">Trường Cao đẳng Kinh tế Đối ngoại.</strong>
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6 max-w-sm">
                {['Nhận diện khuôn mặt','Quét mã QR','Dashboard Realtime','Xuất Excel & PDF'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                    <CheckCircle size={14} className="text-[#2563EB] flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('/register')}
                  className="flex items-center gap-2 font-semibold text-white text-sm px-6 py-3.5 rounded-[18px] transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}>
                  Đăng ký miễn phí <ArrowRight size={15} />
                </button>
                <button onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="flex items-center gap-2 font-semibold text-[#2563EB] text-sm px-6 py-3.5 rounded-[18px] border-2 border-[#2563EB]/20 hover:bg-blue-50 transition-all">
                  Xem tính năng
                </button>
              </div>
            </div>
            <HeroDashboard />
          </div>

          {/* ── Mobile: Dashboard below CTAs ── */}
          <div className="md:hidden anim-fadeUp4 mb-6 px-2">
            <HeroDashboard />
          </div>

          {/* ── Stats 2x2 ── */}
          <div className="anim-fadeUp4 grid grid-cols-2 gap-3 max-w-sm mx-auto md:max-w-none md:grid-cols-4 md:gap-4">
            {[
              { icon: Activity, to: 99, suffix: '%', label: 'Độ chính xác', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Users, to: 1000, suffix: '+', label: 'Lượt điểm danh', color: 'text-sky-600', bg: 'bg-sky-50' },
              { icon: CheckCircle, to: 100, suffix: '%', label: 'Miễn phí', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Zap, to: 24, suffix: '/7', label: 'Hoạt động', color: 'text-green-600', bg: 'bg-green-50' },
            ].map(s => (
              <div key={s.label} className="rounded-[20px] bg-white border border-gray-100 p-3 md:p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div className={`text-xl md:text-2xl font-extrabold ${s.color}`}>
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] mb-2">Tính năng nổi bật</h2>
              <p className="text-[#6B7280] max-w-xl mx-auto text-sm">Bộ công cụ hoàn chỉnh để quản lý điểm danh — từ lớp học đến báo cáo tổng hợp.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group p-5 rounded-[24px] bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <f.icon size={20} className="text-[#2563EB]" />
                  </div>
                  <h3 className="font-bold text-[#111827] mb-1.5 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">Cách hoạt động</h2>
              <p className="text-[#6B7280] text-sm">Chỉ 3 bước đơn giản để bắt đầu điểm danh thông minh.</p>
            </div>
          </Reveal>
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                  <div className="relative flex-shrink-0 sm:mb-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-200">
                      <s.icon size={28} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-[#2563EB] rounded-full text-[#2563EB] text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827] mb-1 text-sm sm:text-base">{s.title}</h3>
                    <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles ─── */}
      <section id="roles" className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">Dành cho mọi đối tượng</h2>
              <p className="text-[#6B7280] text-sm max-w-xl mx-auto">Thiết kế riêng cho từng vai trò tại Trường Cao đẳng Kinh tế Đối ngoại.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {roles.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div className="rounded-[24px] bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`bg-gradient-to-r ${r.color} p-5`}>
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                      <r.icon size={22} className="text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg">{r.title}</h3>
                  </div>
                  <ul className="p-4 sm:p-5 space-y-2.5">
                    {r.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-[#6B7280]">
                        <CheckCircle size={14} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-[#2563EB] to-[#3B82F6]">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-yellow-300 fill-yellow-300" />)}
            </div>
            <blockquote className="text-white text-base sm:text-lg font-medium italic mb-5 leading-relaxed">
              "Hệ thống giúp tôi tiết kiệm thời gian điểm danh mỗi buổi học. Giao diện đơn giản, dễ dùng và hoạt động ổn định trên cả điện thoại lẫn máy tính."
            </blockquote>
          </div>
        </Reveal>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">Câu hỏi thường gặp</h2>
              <p className="text-[#6B7280] text-sm">Giải đáp những thắc mắc phổ biến nhất.</p>
            </div>
          </Reveal>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 50}><FAQ q={f.q} a={f.a} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <Reveal>
          <div className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
              <LogoIcon size={38} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">Sẵn sàng bắt đầu?</h2>
            <p className="text-[#6B7280] mb-3 text-sm">Đăng ký hoàn toàn miễn phí. Không cần thiết bị chuyên dụng.</p>
            <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs text-[#6B7280] mb-7">
              {['Miễn phí cho sinh viên','Không cần thiết bị chuyên dụng','Hoạt động trên mọi trình duyệt'].map(t => (
                <li key={t} className="flex items-center justify-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/register')}
                className="flex items-center justify-center gap-2 font-semibold text-white text-sm px-8 py-3.5 rounded-[18px] transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
                Tạo tài khoản miễn phí <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/login')} className="border-2 border-[#2563EB]/20 text-[#2563EB] font-semibold px-8 py-3.5 rounded-[18px] hover:bg-blue-50 transition text-sm">
                Đăng nhập
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center">
                  <LogoIcon size={22} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Điểm Danh Sinh Viên</div>
                  <div className="text-[10px] text-gray-500">Trường Cao đẳng Kinh tế Đối ngoại</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed max-w-xs">
                Hệ thống điểm danh hiện đại ứng dụng công nghệ nhận diện khuôn mặt và QR Code cho giáo dục.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Tính năng</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {[['#features','Tính năng'],['#how','Cách dùng'],['#roles','Đối tượng'],['#faq','FAQ']].map(([href, label]) => (
                  <li key={href}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Tài khoản</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Đăng nhập</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Đăng ký</button></li>
                <li><button onClick={() => navigate('/forgot-password')} className="hover:text-white transition-colors">Quên mật khẩu</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <span className="text-center sm:text-left">© 2026 Điểm Danh Sinh Viên — Trường Cao đẳng Kinh tế Đối ngoại</span>
            <div className="flex items-center gap-1.5"><Users size={11} /> <span>Hỗ trợ sinh viên & giảng viên</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
