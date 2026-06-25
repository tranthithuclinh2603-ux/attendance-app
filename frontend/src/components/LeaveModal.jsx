import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { leaveAPI } from '../services/api';

function resizeImage(file, maxSize = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

export default function LeaveModal({ user, onClose }) {
  const [form, setForm] = useState({ classId: user?.classId || '', date: '', reason: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [myLeaves, setMyLeaves] = useState(null);
  const [tab, setTab] = useState('form'); // form | history
  const fileRef = useRef();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setImage(base64);
    setImagePreview(base64);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.date) return;
    setLoading(true);
    try {
      await leaveAPI.submit({ ...form, imageBase64: image });
      setResult({ ok: true, msg: 'Gửi đơn xin nghỉ thành công! Giảng viên sẽ xem xét và duyệt.' });
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || 'Gửi đơn thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setTab('history');
    if (myLeaves !== null) return;
    try {
      const res = await leaveAPI.getMy();
      setMyLeaves(res.data.leaves || []);
    } catch { setMyLeaves([]); }
  };

  const statusBadge = (s) => ({
    pending: <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Chờ duyệt</span>,
    approved: <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Đã duyệt</span>,
    rejected: <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Từ chối</span>,
  }[s] || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-bold text-lg">Xin nghỉ phép</h3>
            <p className="text-indigo-100 text-xs mt-0.5">Nộp giấy tờ & chờ giảng viên duyệt</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={22} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 shrink-0">
          {[{ key: 'form', label: 'Gửi đơn' }, { key: 'history', label: 'Lịch sử' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={key === 'history' ? loadHistory : () => setTab('form')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* Form tab */}
          {tab === 'form' && (
            <>
              {result ? (
                <div className={`flex flex-col items-center gap-4 text-center py-4 ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {result.ok ? <CheckCircle size={56} /> : <AlertCircle size={56} />}
                  <p className="font-medium">{result.msg}</p>
                  {result.ok && (
                    <button onClick={onClose} className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm">
                      Đóng
                    </button>
                  )}
                  {!result.ok && (
                    <button onClick={() => setResult(null)} className="mt-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm">
                      Thử lại
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Lớp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lớp</label>
                    <input
                      value={form.classId}
                      onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                      placeholder="Ví dụ: CĐTMDT28A"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Ngày nghỉ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày xin nghỉ</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Lý do */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do</label>
                    <textarea
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="Mô tả lý do xin nghỉ..."
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>

                  {/* Ảnh giấy khám bệnh */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Giấy tờ chứng minh <span className="text-gray-400 font-normal">(ảnh giấy khám bệnh, đơn thuốc...)</span>
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="preview" className="w-full rounded-xl object-cover max-h-48 border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => { setImage(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                      >
                        <Upload size={24} />
                        <span className="text-sm">Bấm để tải ảnh lên</span>
                      </button>
                    )}
                  </div>

                  {/* Hạn mức nghỉ */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-xs text-indigo-700 dark:text-indigo-400">
                    Theo quy định, sinh viên không được nghỉ quá <strong>20% số tiết</strong> mỗi môn. Nghỉ có phép được xét riêng.
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !form.classId || !form.date}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-xl text-sm transition-colors"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div className="space-y-3">
              {myLeaves === null && (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {myLeaves?.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Chưa có đơn xin nghỉ nào</p>
              )}
              {myLeaves?.map((leave) => (
                <div key={leave.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-800 dark:text-white">{leave.date} · {leave.classId}</p>
                    {statusBadge(leave.status)}
                  </div>
                  {leave.reason && <p className="text-xs text-gray-500 dark:text-gray-400">{leave.reason}</p>}
                  {leave.note && <p className="text-xs text-blue-600 dark:text-blue-400">GV: {leave.note}</p>}
                  {leave.imageBase64 && (
                    <img src={leave.imageBase64} alt="giấy tờ" className="w-full max-h-32 object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
