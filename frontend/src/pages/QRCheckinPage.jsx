import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { attendanceAPI } from '../services/api';

export default function QRCheckinPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | late | error | login
  const [message, setMessage] = useState('');

  const classId = params.get('c');
  const date = params.get('d');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Save QR params so we can return after login
      localStorage.setItem('qr_redirect', window.location.search);
      setStatus('login');
      return;
    }
    if (!classId) { setStatus('error'); setMessage('Mã QR không hợp lệ'); return; }

    attendanceAPI.qrCheckin({ classId, date })
      .then((res) => {
        setMessage(res.data.message);
        setStatus(res.data.status === 'late' ? 'late' : 'success');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Điểm danh thất bại');
      });
  }, [classId, date]);

  const goHome = () => navigate('/student');
  const goLogin = () => navigate(`/login?redirect=/qr${window.location.search.slice(1) ? '&' + window.location.search.slice(1) : ''}`);

  const screens = {
    loading: (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-300">Đang xử lý điểm danh...</p>
      </div>
    ),
    success: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={48} className="text-green-500"/></div>
        <h2 className="text-xl font-bold text-green-600">Điểm danh thành công!</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{message}</p>
        <p className="text-gray-500 text-xs">Lớp: <strong>{classId}</strong></p>
        <button onClick={goHome} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    ),
    late: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center"><Clock size={48} className="text-yellow-500"/></div>
        <h2 className="text-xl font-bold text-yellow-600">Điểm danh muộn!</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{message}</p>
        <p className="text-sm text-yellow-600 font-medium">Hãy cố gắng đến đúng giờ hơn nhé!</p>
        <button onClick={goHome} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    ),
    error: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center"><XCircle size={48} className="text-red-500"/></div>
        <h2 className="text-xl font-bold text-red-600">Thất bại</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{message}</p>
        <button onClick={goHome} className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    ),
    login: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center"><Lock size={48} className="text-blue-500"/></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cần đăng nhập</h2>
        <p className="text-gray-500 text-sm">Vui lòng đăng nhập để điểm danh bằng QR</p>
        <button onClick={() => navigate('/login')} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium">
          Đăng nhập ngay
        </button>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-sm">
        <p className="text-center text-blue-600 font-semibold mb-6">Điểm danh bằng QR Code</p>
        {screens[status] || screens.loading}
      </div>
    </div>
  );
}
