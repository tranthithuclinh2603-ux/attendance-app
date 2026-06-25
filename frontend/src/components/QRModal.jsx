import React, { useEffect, useRef, useState } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

const BASE_URL = 'https://attendance-app-eight-sigma.vercel.app';

export default function QRModal({ classId, date, onClose }) {
  const canvasRef = useRef(null);
  const [qrUrl, setQrUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút
  const [expired, setExpired] = useState(false);

  const checkinUrl = `${BASE_URL}/qr?c=${encodeURIComponent(classId)}&d=${date}`;

  const generateQR = async () => {
    if (!canvasRef.current) return;
    try {
      await QRCode.toCanvas(canvasRef.current, checkinUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#1e3a5f', light: '#ffffff' },
      });
      const url = canvasRef.current.toDataURL('image/png');
      setQrUrl(url);
    } catch (err) {
      console.error('QR generate error:', err);
    }
  };

  useEffect(() => {
    generateQR();
  }, [classId, date]);

  // Countdown timer
  useEffect(() => {
    setTimeLeft(300);
    setExpired(false);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setExpired(true); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [classId, date]);

  const refresh = () => {
    setExpired(false);
    setTimeLeft(300);
    generateQR();
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${classId}_${date}.png`;
    a.click();
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold text-lg">QR Điểm Danh</h3>
            <p className="text-blue-100 text-xs mt-0.5">Lớp {classId} · {date}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={22} /></button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* QR Canvas */}
          <div className={`relative p-3 rounded-2xl border-4 transition-all ${expired ? 'border-red-300 opacity-50' : 'border-blue-200'}`}>
            <canvas ref={canvasRef} />
            {expired && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
                <div className="text-center">
                  <p className="text-red-500 font-bold text-lg">Hết hạn!</p>
                  <p className="text-gray-500 text-sm">Tạo lại mã mới</p>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`text-center px-4 py-2 rounded-xl ${expired ? 'bg-red-50' : timeLeft < 60 ? 'bg-yellow-50' : 'bg-green-50'}`}>
            {expired ? (
              <p className="text-red-600 text-sm font-medium">Mã đã hết hạn</p>
            ) : (
              <p className={`font-mono font-bold text-xl ${timeLeft < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                ⏱ {mm}:{ss}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Mã có hiệu lực trong 5 phút</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 w-full text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Hướng dẫn:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Chiếu QR code này lên màn hình/máy chiếu</li>
              <li>Sinh viên mở camera điện thoại quét mã</li>
              <li>Trình duyệt tự mở trang điểm danh</li>
              <li>Đăng nhập (nếu chưa) → điểm danh tự động</li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={refresh}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} /> Làm mới
            </button>
            <button
              onClick={download}
              disabled={!qrUrl || expired}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Download size={16} /> Tải ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
