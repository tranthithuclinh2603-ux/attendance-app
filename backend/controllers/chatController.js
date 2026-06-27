const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const chat = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages là bắt buộc' });
    }

    const systemPrompt = `Bạn là trợ lý AI của ứng dụng Điểm Danh — hệ thống quản lý điểm danh sinh viên.
Bạn hỗ trợ sinh viên với các thắc mắc về: lịch học, điểm danh, xin nghỉ phép, và các tính năng của app.
Trả lời ngắn gọn, thân thiện bằng tiếng Việt.

Thông tin sinh viên hiện tại:
- Tên: ${userContext?.name || 'Chưa rõ'}
- MSSV: ${userContext?.mssv || 'Chưa rõ'}
- Lớp: ${userContext?.classId || 'Chưa rõ'}

Các tính năng của app:
• Trang chủ: xem phiên điểm danh đang mở, thống kê, xin nghỉ phép
• Lịch học: xem TKB theo ngày/tuần/tháng
• Điểm danh: lịch sử điểm danh, biểu đồ 7 ngày, xếp hạng lớp
• Cá nhân: cập nhật hồ sơ, đổi mật khẩu, sinh trắc học

Quy trình điểm danh: khi giảng viên mở phiên → sinh viên nhận thông báo → bấm "Điểm danh" → xác nhận khuôn mặt.
Nếu không biết câu trả lời, hãy nói thật và gợi ý liên hệ giảng viên.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0]?.text || 'Xin lỗi, mình không hiểu câu hỏi này.';
    res.json({ success: true, reply });
  } catch (err) {
    console.error('chat error:', err.message);
    res.status(500).json({ success: false, message: 'Không thể kết nối trợ lý AI lúc này' });
  }
};

module.exports = { chat };
