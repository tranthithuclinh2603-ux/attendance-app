const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(toEmail, otp, name = '') {
  await resend.emails.send({
    from: 'Điểm Danh SV <noreply@diemdanh.io.vn>',
    to: toEmail,
    subject: 'Mã OTP xác thực đăng ký tài khoản',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#2563EB,#3B82F6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Điểm Danh SV</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Trường Cao đẳng Kinh tế Đối ngoại</p>
        </div>

        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Xin chào${name ? ` <strong>${name}</strong>` : ''},</p>
          <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Mã OTP xác thực đăng ký tài khoản của bạn là:</p>

          <div style="background:#EFF6FF;border:2px dashed #2563EB;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563EB;">${otp}</span>
          </div>

          <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
            <p style="color:#92400E;font-size:13px;margin:0;">⏱ Mã OTP có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
          </div>

          <p style="color:#9CA3AF;font-size:12px;margin:0;">Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
        </div>

        <p style="color:#D1D5DB;font-size:11px;text-align:center;margin-top:16px;">© 2026 Hệ thống Điểm Danh Sinh Viên — CĐKTĐN</p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail };
