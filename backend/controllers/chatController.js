const axios = require('axios');

// Test kết nối (GET /api/chat/test)
const testChat = async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.json({ ok: false, error: 'GROQ_API_KEY chưa set trong Railway Variables' });
  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Xin chào, trả lời ngắn gọn bằng tiếng Việt.' }],
        max_tokens: 100,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    const reply = r.data.choices?.[0]?.message?.content;
    res.json({ ok: true, reply });
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
      return res.status(500).json({ success: false, message: 'Chưa cấu hình GROQ_API_KEY trong Railway' });
    }

    const systemPrompt = `Bạn là trợ lý AI của ứng dụng Điểm Danh — hệ thống quản lý điểm danh sinh viên tại Việt Nam.
Bạn có thể trả lời MỌI câu hỏi — từ câu hỏi về app, học tập, đến câu hỏi thông thường.
Trả lời thân thiện, tự nhiên bằng tiếng Việt. Ngắn gọn, súc tích.

Thông tin sinh viên: Tên: ${userContext?.name || 'Chưa rõ'}, MSSV: ${userContext?.mssv || 'Chưa rõ'}, Lớp: ${userContext?.classId || 'Chưa rõ'}

Tính năng app Điểm Danh:
• Trang chủ: xem phiên điểm danh đang mở, thống kê, xin nghỉ phép
• Lịch học: TKB theo ngày/tuần/tháng
• Điểm danh: lịch sử, biểu đồ 7 ngày, xếp hạng lớp
• Cá nhân: hồ sơ, đổi mật khẩu, đổi lớp
Quy trình: giảng viên mở phiên → sinh viên bấm Điểm danh → xác nhận khuôn mặt.`;

    // Bỏ tin assistant ở đầu (Groq cũng yêu cầu tin đầu là user)
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
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: 600,
        temperature: 0.8,
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
