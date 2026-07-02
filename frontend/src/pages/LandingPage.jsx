import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, QrCode, BarChart2, FileSpreadsheet, Shield, Bot,
  CheckCircle, ChevronDown, ChevronUp, ArrowRight, Users,
  Star, Menu, X, Zap, BookOpen, GraduationCap, Settings,
} from 'lucide-react';

/* ── Logo SVG: học sinh dơ tay ── */
function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="14" r="9" fill="#BFDBFE" stroke="#2563EB" strokeWidth="2.5" />
      <path d="M14 52 C14 38 42 38 42 52" fill="#BFDBFE" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 36 L52 16" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="14" r="3.5" fill="#2563EB" />
      <path d="M18 40 L12 50" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Mini dashboard mockup (mobile-friendly) ── */
function DashboardMockup() {
  return (
    <div className="relative w-full mx-auto">
      <div className="absolute inset-0 bg-blue-300 opacity-20 blur-3xl rounded-3xl" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-3 py-2.5 flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white opacity-60" />
          <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
          <div className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
          <span className="ml-2 text-white text-[11px] font-medium opacity-90">Dashboard — Điểm Danh SV</span>
        </div>
        <div className="p-3 space-y-2.5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Có mặt', val: '38', c: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Vắng', val: '4', c: 'bg-red-50 text-red-600 border-red-100' },
              { label: 'Trễ', val: '2', c: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-2 text-center border ${s.c}`}>
                <div className="text-lg font-extrabold">{s.val}</div>
                <div className="text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Bar chart */}
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="text-[10px] text-gray-500 mb-1.5 font-medium">Tỷ lệ điểm danh 7 ngày</div>
            <div className="flex items-end gap-1 h-12">
              {[70, 85, 60, 90, 75, 95, 88].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                <span key={d} className="text-[9px] text-gray-400 flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>
          {/* Student list */}
          <div className="space-y-1">
            {[
              { name: 'Nguyễn Văn A', status: 'Có mặt', dot: 'bg-green-400' },
              { name: 'Trần Thị B', status: 'Vắng', dot: 'bg-red-400' },
              { name: 'Lê Văn C', status: 'Có mặt', dot: 'bg-green-400' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[11px] text-gray-700">{s.name}</span>
                </div>
                <span className="text-[10px] text-gray-500">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 bg-white rounded-xl shadow-lg px-2.5 py-1.5 border border-blue-100 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-gray-700">Điểm danh realtime</span>
      </div>
    </div>
  );
}

/* ── Scroll reveal ── */
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

/* ── Counter ── */
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

/* ── FAQ item ── */
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

/* ── Data ── */
const features = [
  { icon: Camera, title: 'Nhận diện khuôn mặt', desc: 'AI nhận diện tức thì, độ chính xác 99%, không cần chạm tay.' },
  { icon: QrCode, title: 'Quét mã QR', desc: 'Tạo QR theo buổi học, sinh viên quét là hoàn thành ngay lập tức.' },
  { icon: BarChart2, title: 'Thống kê realtime', desc: 'Theo dõi chuyên cần và cảnh báo vắng mặt tự động.' },
  { icon: FileSpreadsheet, title: 'Xuất báo cáo', desc: 'Xuất Excel 2 sheet và PDF chuyên nghiệp theo khoảng thời gian.' },
  { icon: Shield, title: 'Bảo mật cao', desc: 'JWT, WebAuthn, mã hóa — thông tin luôn được bảo vệ.' },
  { icon: Bot, title: 'Trợ lý AI 24/7', desc: 'Chatbox AI hỗ trợ giải đáp và hướng dẫn bất kỳ lúc nào.' },
];

const steps = [
  { icon: GraduationCap, title: 'Đăng ký tài khoản', desc: 'Sinh viên và giảng viên tạo tài khoản trong vài giây.' },
  { icon: Zap, title: 'Mở phiên điểm danh', desc: 'Giảng viên mở phiên, hệ thống tự tạo QR và bật nhận diện.' },
  { icon: CheckCircle, title: 'Điểm danh tức thì', desc: 'Sinh viên quét QR hoặc nhận diện khuôn mặt — xong trong 2 giây.' },
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

/* ── Main Component ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close menu on outside scroll
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white text-gray-800" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); }}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl flex items-center justify-center shadow">
              <LogoIcon size={22} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-blue-700 text-sm">Điểm Danh SV</div>
              <div className="text-[10px] text-gray-400 hidden sm:block">CĐKTĐN</div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {[['#features','Tính năng'],['#how','Cách dùng'],['#roles','Đối tượng'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-blue-600 transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 px-3 py-2 transition-colors">Đăng nhập</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">Đăng ký miễn phí</button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg px-4 py-4 space-y-1">
            {[['#features','Tính năng'],['#how','Cách dùng'],['#roles','Đối tượng'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm">{label}</a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button onClick={() => { navigate('/login'); setMenuOpen(false); }} className="border border-blue-200 text-blue-600 font-semibold py-2.5 rounded-xl text-sm">Đăng nhập</button>
              <button onClick={() => { navigate('/register'); setMenuOpen(false); }} className="bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm">Đăng ký</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0F9FF]">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: stacked | Desktop: 2 cols */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text */}
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Hệ thống điểm danh thông minh
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Điểm danh{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">chính xác</span>
                <br className="hidden sm:block" />{' '}chỉ trong{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">2 giây</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mb-4 leading-relaxed">
                Giải pháp điểm danh hiện đại dành cho<br />
                <strong className="text-gray-700">Trường Cao đẳng Kinh tế Đối ngoại.</strong>
              </p>
              <ul className="space-y-1.5 mb-6 text-sm text-gray-600 inline-block text-left">
                {['Nhận diện khuôn mặt bằng AI', 'Điểm danh QR theo buổi học', 'Dashboard thống kê realtime', 'Xuất báo cáo Excel & PDF'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button onClick={() => navigate('/register')} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 text-sm w-full sm:w-auto">
                  Đăng ký miễn phí <ArrowRight size={15} />
                </button>
                <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm w-full sm:w-auto">
                  Đăng nhập
                </button>
              </div>
            </div>

            {/* Mockup — show on mobile too but smaller */}
            <div className="max-w-xs sm:max-w-sm md:max-w-lg mx-auto w-full">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { to: 99, suffix: '%', label: 'Độ chính xác AI' },
            { to: 2, suffix: 's', label: 'Thời gian nhận diện' },
            { to: 1000, suffix: '+', label: 'Lượt điểm danh' },
            { to: 24, suffix: '/7', label: 'Hệ thống hoạt động' },
          ].map(s => (
            <div key={s.label} className="py-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mb-1">
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Tính năng nổi bật</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">Bộ công cụ hoàn chỉnh để quản lý điểm danh — từ lớp học đến báo cáo tổng hợp.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-100 transition-colors">
                    <f.icon size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Cách hoạt động</h2>
              <p className="text-gray-500 text-sm">Chỉ 3 bước đơn giản để bắt đầu điểm danh thông minh.</p>
            </div>
          </Reveal>
          {/* Mobile: vertical | Desktop: horizontal */}
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                  {/* Icon + number */}
                  <div className="relative flex-shrink-0 mb-0 sm:mb-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-200">
                      <s.icon size={28} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full text-blue-600 text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                  </div>
                  <div className="sm:mt-0">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{s.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Dành cho mọi đối tượng</h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">Thiết kế riêng cho từng vai trò tại Trường Cao đẳng Kinh tế Đối ngoại.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {roles.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`bg-gradient-to-r ${r.color} p-5 sm:p-6`}>
                    <div className="w-11 h-11 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-3">
                      <r.icon size={22} className="text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg">{r.title}</h3>
                  </div>
                  <ul className="p-4 sm:p-5 space-y-2.5">
                    {r.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <CheckCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
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

      {/* ── Testimonial ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-blue-600 to-sky-500">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-yellow-300 fill-yellow-300" />)}
            </div>
            <blockquote className="text-white text-base sm:text-lg font-medium italic mb-5 leading-relaxed">
              "Hệ thống giúp tôi tiết kiệm ít nhất 10 phút mỗi buổi học. Điểm danh khuôn mặt cực kỳ chính xác và nhanh chóng."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold text-sm">Giảng viên Khoa CNTT</div>
                <div className="text-blue-100 text-xs">Trường Cao đẳng Kinh tế Đối ngoại</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Câu hỏi thường gặp</h2>
              <p className="text-gray-500 text-sm">Giải đáp những thắc mắc phổ biến nhất.</p>
            </div>
          </Reveal>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <FAQ q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <Reveal>
          <div className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
              <LogoIcon size={38} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sẵn sàng bắt đầu?</h2>
            <p className="text-gray-500 mb-3 text-sm">Đăng ký hoàn toàn miễn phí. Không cần thiết bị chuyên dụng.</p>
            <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-7">
              {['Miễn phí cho sinh viên', 'Không cần thẻ tín dụng', 'Nhận diện dưới 2 giây'].map(t => (
                <li key={t} className="flex items-center justify-center gap-1.5">
                  <CheckCircle size={13} className="text-green-500" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/register')} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 text-sm">
                Tạo tài khoản miễn phí <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/login')} className="border-2 border-blue-200 text-blue-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition text-sm">
                Đăng nhập
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            {/* Brand — span 2 cols on mobile */}
            <div className="col-span-2 sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl flex items-center justify-center">
                  <LogoIcon size={22} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Điểm Danh Sinh Viên</div>
                  <div className="text-[10px] text-gray-500">Trường Cao đẳng Kinh tế Đối ngoại</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed max-w-xs">
                Hệ thống điểm danh thông minh ứng dụng AI và công nghệ hiện đại cho trường học.
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
            <div className="flex items-center gap-1.5">
              <Users size={11} /> <span>Hỗ trợ sinh viên & giảng viên</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
