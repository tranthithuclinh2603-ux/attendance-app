const axios = require('axios');

// Test kết nối Gemini (GET /api/chat/test)
const testChat = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ ok: false, error: 'GEMINI_API_KEY chưa set' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const r = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: 'Xin chào' }] }],
    });
    const text = r.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ ok: true, reply: text });
  } catch (err) {
    res.json({ ok: false, error: err.response?.data?.error || err.message });
  }
};

const chat = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages là bắt buộc' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chưa cấu hình API key' });
    }

    const systemPrompt = `Bạn là trợ lý AI của ứng dụng Điểm Danh — hệ thống quản lý điểm danh sinh viên tại Việt Nam.
Bạn có thể trả lời MỌI câu hỏi của sinh viên — từ câu hỏi về app, học tập, đến câu hỏi thông thường.
Trả lời thân thiện, ngắn gọn bằng tiếng Việt.

Thông tin sinh viên: Tên: ${userContext?.name || 'Chưa rõ'}, MSSV: ${userContext?.mssv || 'Chưa rõ'}, Lớp: ${userContext?.classId || 'Chưa rõ'}

Tính năng app Điểm Danh:
• Trang chủ: xem phiên điểm danh đang mở, thống kê, xin nghỉ phép
• Lịch học: TKB theo ngày/tuần/tháng
• Điểm danh: lịch sử, biểu đồ 7 ngày, xếp hạng lớp
• Cá nhân: hồ sơ, đổi mật khẩu, đổi lớp
Quy trình điểm danh: giảng viên mở phiên → sinh viên bấm Điểm danh → xác nhận khuôn mặt.`;

    // Gemini: tin đầu phải là 'user' — bỏ các tin assistant ở đầu
    const filtered = messages.filter(m => m.role !== 'system');
    const firstUser = filtered.findIndex(m => m.role === 'user');
    if (firstUser === -1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất một tin từ user' });
    }
    const contents = filtered.slice(firstUser).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Thử gemini-2.0-flash trước, fallback gemini-1.5-flash
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let reply = null;
    let lastErr = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const r = await axios.post(url, {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
        });
        reply = r.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) break;
      } catch (e) {
        lastErr = e;
        console.error(`[chat] model ${model} failed:`, e.response?.data?.error?.message || e.message);
      }
    }

    if (!reply) {
      const errMsg = lastErr?.response?.data?.error?.message || lastErr?.message || 'unknown';
      console.error('[chat] all models failed:', errMsg);
      return res.status(500).json({ success: false, message: 'Không thể kết nối AI', detail: errMsg });
    }

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[chat] unexpected error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', detail: err.message });
  }
};

module.exports = { chat, testChat };
