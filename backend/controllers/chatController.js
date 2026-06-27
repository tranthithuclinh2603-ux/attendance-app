const axios = require('axios');

const chat = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages là bắt buộc' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY chưa được cấu hình');
      return res.status(500).json({ success: false, message: 'Chưa cấu hình API key' });
    }

    const systemPrompt = `Bạn là trợ lý AI của ứng dụng Điểm Danh — hệ thống quản lý điểm danh sinh viên.
Hỗ trợ sinh viên về: lịch học, điểm danh, xin nghỉ phép, và các tính năng của app.
Trả lời ngắn gọn, thân thiện bằng tiếng Việt.

Thông tin sinh viên:
- Tên: ${userContext?.name || 'Chưa rõ'}
- MSSV: ${userContext?.mssv || 'Chưa rõ'}
- Lớp: ${userContext?.classId || 'Chưa rõ'}

Tính năng app: Trang chủ (phiên điểm danh, thống kê, xin nghỉ), Lịch học (TKB ngày/tuần/tháng), Điểm danh (lịch sử, biểu đồ, xếp hạng), Cá nhân (hồ sơ, mật khẩu).
Quy trình: giảng viên mở phiên → sinh viên bấm Điểm danh → xác nhận khuôn mặt.`;

    // Gemini yêu cầu: tin đầu tiên phải là 'user', xen kẽ user/model
    // Bỏ qua các tin assistant ở đầu (lời chào bot)
    const userMessages = messages.filter(m => m.role !== 'system');
    const firstUserIdx = userMessages.findIndex(m => m.role === 'user');
    if (firstUserIdx === -1) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất một tin nhắn từ user' });
    }
    const validMessages = userMessages.slice(firstUserIdx);

    // Chuyển sang định dạng Gemini (role: user/model)
    const geminiContents = validMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(geminiUrl, {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Xin lỗi, mình không hiểu câu hỏi này.';

    res.json({ success: true, reply });
  } catch (err) {
    const errData = err.response?.data;
    console.error('chat error:', JSON.stringify(errData) || err.message);
    res.status(500).json({
      success: false,
      message: 'Không thể kết nối trợ lý AI lúc này',
      detail: errData?.error?.message || err.message,
    });
  }
};

module.exports = { chat };
