import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { leaveAPI } from '../services/api';

export default function LeavePanel({ classId }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending | all
  const [noteMap, setNoteMap] = useState({});
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await leaveAPI.getByClass(classId);
      setLeaves(res.data.leaves || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (classId) fetch(); }, [classId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const review = async (leaveId, status) => {
    setProcessing(leaveId + status);
    try {
      const res = await leaveAPI.review(leaveId, { status, note: noteMap[leaveId] || '' });
      showToast(status === 'approved' ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
      if (status === 'approved' && res.data.quota) {
        const q = res.data.quota;
        if (q.remaining <= 0) showToast(`Sinh viên đã dùng hết ${q.max} buổi nghỉ phép (20%)!`);
      }
      fetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi xử lý');
    } finally {
      setProcessing(null);
    }
  };

  const displayed = filter === 'pending' ? leaves.filter((l) => l.status === 'pending') : leaves;

  const statusBadge = (s) => ({
    pending: <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">⏳ Chờ duyệt</span>,
    approved: <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Đã duyệt</span>,
    rejected: <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Từ chối</span>,
  }[s]);

  return (
    <div className="p-5 space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg text-sm animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          Đơn xin nghỉ phép
          {leaves.filter((l) => l.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {leaves.filter((l) => l.status === 'pending').length} mới
            </span>
          )}
        </h4>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:text-white"
          >
            <option value="pending">Chờ duyệt</option>
            <option value="all">Tất cả</option>
          </select>
          <button onClick={fetch} className="text-gray-400 hover:text-blue-500 p-1.5">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          {filter === 'pending' ? 'Không có đơn nào chờ duyệt' : 'Chưa có đơn xin nghỉ nào'}
        </p>
      )}

      {displayed.map((leave) => (
        <div key={leave.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-gray-800 dark:text-white">{leave.studentName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {leave.date} · Lớp {leave.classId}
              </p>
            </div>
            {statusBadge(leave.status)}
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Lý do */}
            {leave.reason && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">Lý do: </span>{leave.reason}
              </p>
            )}

            {/* Ảnh giấy tờ */}
            {leave.imageBase64 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Giấy tờ đính kèm:</p>
                <img
                  src={leave.imageBase64}
                  alt="giấy tờ"
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50 cursor-pointer"
                  onClick={() => window.open(leave.imageBase64, '_blank')}
                />
              </div>
            )}

            {/* Note của GV nếu đã xử lý */}
            {leave.note && (
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                Ghi chú: {leave.note}
              </p>
            )}

            {/* Chờ duyệt → hiện nút */}
            {leave.status === 'pending' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Ghi chú (không bắt buộc)..."
                  value={noteMap[leave.id] || ''}
                  onChange={(e) => setNoteMap((m) => ({ ...m, [leave.id]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => review(leave.id, 'approved')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={16} />
                    {processing === leave.id + 'approved' ? 'Đang duyệt...' : 'Duyệt'}
                  </button>
                  <button
                    onClick={() => review(leave.id, 'rejected')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <XCircle size={16} />
                    {processing === leave.id + 'rejected' ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
