const axios = require('axios');

const DAY_VI = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const testChat = async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.json({ ok: false, error: 'GROQ_API_KEY chưa set trong Railway Variables' });
  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Xin chào, trả lời ngắn gọn bằng tiếng Việt.' }],
        max_tokens: 100,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    res.json({ ok: true, model: 'llama-3.3-70b-versatile', reply: r.data.choices?.[0]?.message?.content });
  } catch (err) {
    res.json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
};

const chat = async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages là bắt buộc' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chưa cấu hình GROQ_API_KEY' });
    }

    // Lấy dữ liệu thực từ userContext
    const { name, mssv, classId, timetable = [], stats = {}, attendanceHistory = [] } = userContext || {};

    // Tính ngày hôm nay (Vietnam UTC+7)
    const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
    const todayDow = vnNow.getUTCDay() === 0 ? null : vnNow.getUTCDay() + 1; // 2=T2...7=T7
    const todayStr = vnNow.toISOString().split('T')[0];
    const todayViStr = `${DAY_VI[vnNow.getUTCDay()]} ngày ${vnNow.getUTCDate()}/${vnNow.getUTCMonth() + 1}/${vnNow.getUTCFullYear()}`;

    // Lịch hôm nay
    const todayClasses = todayDow
      ? timetable.filter(e => e.dayOfWeek === todayDow).sort((a, b) => a.period - b.period)
      : [];

    // Lịch cả tuần
    const weekSchedule = [2, 3, 4, 5, 6, 7]
      .map(dow => {
        const entries = timetable.filter(e => e.dayOfWeek === dow);
        if (!entries.length) return null;
        return `  ${DAY_VI[dow - 1]}: ${entries.map(e => `Ca ${e.period} (${e.startTime}-${e.endTime}) - ${e.subject}`).join(', ')}`;
      })
      .filter(Boolean)
      .join('\n');

    // Lịch sử điểm danh gần đây (7 ngày)
    const recentHistory = attendanceHistory.slice(0, 7).map(h =>
      `  ${h.date}: ${h.status === 'present' ? 'Có mặt' : h.status === 'late' ? 'Muộn' : 'Vắng'}${h.subject ? ` (${h.subject})` : ''}`
    ).join('\n');

    const systemPrompt = `Bạn là trợ lý AI thông minh của ứng dụng ĐIỂM DANH — hệ thống quản lý điểm danh sinh viên.
Bạn CÓ THỂ trả lời mọi câu hỏi: về app, học tập, kiến thức chung, tư vấn...
Luôn trả lời bằng tiếng Việt, thân thiện, chi tiết và hữu ích.

━━━ THÔNG TIN SINH VIÊN ━━━
Tên: ${name || 'Chưa rõ'}
MSSV: ${mssv || 'Chưa rõ'}
Lớp: ${classId || 'Chưa rõ'}
Hôm nay: ${todayViStr}

━━━ THỐNG KÊ ĐIỂM DANH ━━━
Tổng số buổi: ${stats.total || 0}
Có mặt: ${stats.present || 0} buổi
Muộn: ${stats.late || 0} buổi
Vắng: ${stats.absent || 0} buổi
Tỉ lệ: ${stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%

━━━ LỊCH HỌC HÔM NAY ━━━
${todayClasses.length > 0
  ? todayClasses.map(e => `Ca ${e.period}: ${e.subject} (${e.startTime}–${e.endTime})`).join('\n')
  : 'Hôm nay không có lịch học'}

━━━ THỜI KHÓA BIỂU CẢ TUẦN ━━━
${weekSchedule || 'Chưa có thời khóa biểu'}

━━━ ĐIỂM DANH GẦN ĐÂY ━━━
${recentHistory || 'Chưa có lịch sử'}

━━━ TÍNH NĂNG APP ━━━
• Trang chủ: phiên điểm danh đang mở, thống kê tổng quan, nút xin nghỉ phép
• Lịch học: xem TKB theo ngày/tuần/tháng với chấm lịch
• Điểm danh: lịch sử chi tiết, biểu đồ 7 ngày, bảng xếp hạng lớp
• Cá nhân: đổi tên, đổi lớp, đổi mật khẩu, ảnh đại diện
Quy trình điểm danh: giảng viên mở phiên → app thông báo → bấm "Điểm danh" → xác nhận khuôn mặt bằng camera.

Hãy trả lời dựa trên dữ liệu THỰC TẾ của sinh viên ở trên. Nếu câu hỏi liên quan đến tỉ lệ, lịch học, lịch sử — hãy trích dẫn số liệu cụ thể.`;

    // Bỏ tin assistant ở đầu
    const filtered = messages.filter(m => m.role !== 'system');
    const firstUser = filtered.findIndex(m => m.role === 'user');
    if (firstUser === -1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất một tin từ user' });
    }

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...filtered.slice(firstUser).map(m => ({ role: m.role, content: m.content })),
    ];

    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 800,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const reply = r.data.choices?.[0]?.message?.content || 'Xin lỗi, mình không hiểu câu hỏi này.';
    res.json({ success: true, reply });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error('[chat] Groq error:', errMsg);
    res.status(500).json({ success: false, message: 'Lỗi kết nối AI', detail: errMsg });
  }
};

module.exports = { chat, testChat };
