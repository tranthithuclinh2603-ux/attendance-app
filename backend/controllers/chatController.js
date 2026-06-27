const axios = require('axios');

// Test kết nối Gemini (GET /api/chat/test)
const testChat = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ ok: false, error: 'GEMINI_API_KEY chưa set' });

  const attempts = [
    { version: 'v1',    model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash' },
    { version: 'v1',    model: 'gemini-1.5-flash-latest' },
    { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
    { version: 'v1',    model: 'gemini-pro' },
  ];
  const results = [];
  for (const { version, model } of attempts) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      const r = await axios.post(url, { contents: [{ role: 'user', parts: [{ text: 'Xin chào' }] }] });
      const text = r.data.candidates?.[0]?.content?.parts?.[0]?.text;
      results.push({ version, model, ok: true, reply: text });
      if (text) break;
    } catch (e) {
      results.push({ version, model, ok: false, error: e.response?.data?.error?.message || e.message });
    }
  }
  res.json({ results });
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

    // Thử nhiều model + version khác nhau
    const attempts = [
      { version: 'v1',    model: 'gemini-2.0-flash' },
      { version: 'v1beta', model: 'gemini-2.0-flash' },
      { version: 'v1',    model: 'gemini-1.5-flash-latest' },
      { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
      { version: 'v1',    model: 'gemini-pro' },
    ];
    let reply = null;
    let lastErr = null;

    // Nhúng system prompt vào tin nhắn đầu (tránh lỗi system_instruction)
    const contentsWithSystem = [
      { role: 'user', parts: [{ text: `[Hướng dẫn hệ thống]: ${systemPrompt}\n\nOK, tôi hiểu.` }] },
      { role: 'model', parts: [{ text: 'Tôi hiểu, tôi sẽ hỗ trợ bạn theo đúng hướng dẫn.' }] },
      ...contents,
    ];

    for (const { version, model } of attempts) {
      try {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
        const r = await axios.post(url, {
          contents: contentsWithSystem,
          generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
        });
        reply = r.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) { console.log(`[chat] success with ${version}/${model}`); break; }
      } catch (e) {
        lastErr = e;
        console.error(`[chat] ${version}/${model} failed:`, e.response?.data?.error?.message || e.message);
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
