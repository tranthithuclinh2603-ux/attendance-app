import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '🤳',
    title: 'Điểm danh khuôn mặt',
    desc: 'Nhận diện khuôn mặt tức thì bằng AI, không cần chạm tay, chính xác và nhanh chóng.',
  },
  {
    icon: '📱',
    title: 'Quét mã QR',
    desc: 'Giảng viên tạo mã QR theo buổi học, sinh viên quét là hoàn thành điểm danh.',
  },
  {
    icon: '📊',
    title: 'Thống kê realtime',
    desc: 'Theo dõi tỷ lệ chuyên cần, xu hướng theo tuần và cảnh báo vắng mặt tức thì.',
  },
  {
    icon: '📄',
    title: 'Xuất báo cáo',
    desc: 'Xuất file Excel 2 sheet và PDF chuyên nghiệp theo khoảng thời gian tùy chọn.',
  },
  {
    icon: '🔒',
    title: 'Bảo mật cao',
    desc: 'Xác thực JWT, WebAuthn và mã hóa dữ liệu đảm bảo thông tin luôn an toàn.',
  },
  {
    icon: '🤖',
    title: 'Trợ lý AI',
    desc: 'Chatbox AI hỗ trợ giải đáp thắc mắc và hướng dẫn sử dụng 24/7.',
  },
];

const steps = [
  { num: '01', title: 'Đăng ký tài khoản', desc: 'Sinh viên, giảng viên tạo tài khoản trong vài giây.' },
  { num: '02', title: 'Mở phiên điểm danh', desc: 'Giảng viên mở phiên, hệ thống tự tạo QR và bật nhận diện.' },
  { num: '03', title: 'Điểm danh tức thì', desc: 'Sinh viên quét QR hoặc nhận diện khuôn mặt — xong ngay!' },
];

const roles = [
  {
    icon: '🎓',
    title: 'Sinh viên',
    color: 'from-blue-400 to-blue-600',
    items: ['Điểm danh bằng khuôn mặt / QR', 'Xem lịch sử điểm danh', 'Xin nghỉ phép online', 'Nhận thông báo vắng mặt'],
  },
  {
    icon: '👨‍🏫',
    title: 'Giảng viên',
    color: 'from-sky-400 to-sky-600',
    items: ['Quản lý phiên điểm danh', 'Xem thống kê theo tuần', 'Xuất báo cáo Excel/PDF', 'Duyệt đơn xin nghỉ'],
  },
  {
    icon: '⚙️',
    title: 'Quản trị',
    color: 'from-cyan-400 to-cyan-600',
    items: ['Quản lý tài khoản người dùng', 'Thống kê tăng trưởng', 'Theo dõi tần suất sử dụng', 'Toàn quyền hệ thống'],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">Đ</div>
            <span className="font-bold text-lg text-blue-700">Điểm Danh SV</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-blue-600 transition-colors">Cách dùng</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">Đối tượng</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Đăng nhập</button>
            <button onClick={() => navigate('/register')} className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Đăng ký</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-white">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-sky-100 rounded-full opacity-60 blur-2xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
            Hệ thống điểm danh thông minh
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Điểm danh{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
              chính xác
            </span>
            <br />chỉ trong vài giây
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ứng dụng điểm danh hiện đại cho trường đại học — nhận diện khuôn mặt AI, mã QR thông minh,
            thống kê realtime và báo cáo chuyên nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-200"
            >
              Bắt đầu ngay →
            </button>
            <a
              href="#features"
              className="border-2 border-blue-200 text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition"
            >
              Xem tính năng
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[['99%', 'Độ chính xác'], ['&lt;2s', 'Nhận diện'], ['3 vai trò', 'Người dùng']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-extrabold text-blue-600" dangerouslySetInnerHTML={{ __html: val }} />
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Tính năng nổi bật</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Đầy đủ công cụ để quản lý điểm danh hiệu quả từ lớp học đến báo cáo tổng hợp.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-blue-50 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-gradient-to-br from-blue-600 to-sky-500">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Cách hoạt động</h2>
            <p className="text-blue-100 max-w-xl mx-auto">Chỉ 3 bước đơn giản để bắt đầu điểm danh thông minh.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-white opacity-20" />
                )}
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white border-opacity-30">
                  <span className="text-2xl font-extrabold text-white">{s.num}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Dành cho mọi đối tượng</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Hệ thống được thiết kế riêng cho từng vai trò trong trường học.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r) => (
              <div key={r.title} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow">
                <div className={`bg-gradient-to-r ${r.color} p-6 text-center`}>
                  <div className="text-5xl mb-3">{r.icon}</div>
                  <h3 className="font-bold text-white text-xl">{r.title}</h3>
                </div>
                <ul className="p-6 space-y-3">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sẵn sàng thử ngay?</h2>
          <p className="text-gray-500 mb-8">Đăng ký miễn phí và bắt đầu quản lý điểm danh thông minh hôm nay.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-200"
            >
              Tạo tài khoản miễn phí
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-blue-200 text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">Đ</div>
            <span className="font-bold text-white">Điểm Danh Sinh Viên</span>
          </div>
          <p className="text-sm">Hệ thống điểm danh thông minh dành cho trường đại học</p>
          <div className="flex gap-4 text-sm">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Đăng nhập</button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Đăng ký</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
