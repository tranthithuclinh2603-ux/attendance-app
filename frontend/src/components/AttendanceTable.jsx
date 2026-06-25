import React, { useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { attendanceAPI } from '../services/api';

const STATUS_CONFIG = {
  present: { label: 'Có mặt', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
  late:    { label: 'Muộn',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
  absent:  { label: 'Vắng',   color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  excused: { label: 'Có phép',color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

function EditModal({ record, onSave, onClose }) {
  const [status, setStatus] = useState(record.status);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await attendanceAPI.updateAttendance(record.attendanceId, status);
      onSave(record.attendanceId, status);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Cập nhật trạng thái - {record.name}</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="present">Có mặt</option>
          <option value="late">Muộn</option>
          <option value="absent">Vắng</option>
          <option value="excused">Có phép</option>
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceTable({ data, onRefresh }) {
  const [editRecord, setEditRecord] = useState(null);
  const [records, setRecords] = useState(data);

  React.useEffect(() => { setRecords(data); }, [data]);

  const handleDelete = async (record) => {
    if (!window.confirm(`Xóa điểm danh của ${record.name}?`)) return;
    try {
      await attendanceAPI.deleteAttendance(record.attendanceId);
      setRecords((r) => r.filter((x) => x.attendanceId !== record.attendanceId));
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleSaveEdit = (attendanceId, newStatus) => {
    setRecords((r) => r.map((x) => x.attendanceId === attendanceId ? { ...x, status: newStatus } : x));
  };

  if (!records.length) {
    return <div className="py-10 text-center text-gray-400 dark:text-gray-500">Không có dữ liệu điểm danh</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">STT</th>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">MSSV</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Giờ vào</th>
              <th className="px-4 py-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {records.map((item, i) => {
              const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
              return (
                <tr key={item.uid || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.studentId}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditRecord(item)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editRecord && (
        <EditModal record={editRecord} onSave={handleSaveEdit} onClose={() => setEditRecord(null)} />
      )}
    </>
  );
}
