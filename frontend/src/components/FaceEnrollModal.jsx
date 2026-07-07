import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { biometricAPI } from '../services/api';

const ANGLES = ['Nhìn thẳng', 'Quay trái nhẹ', 'Quay phải nhẹ', 'Ngửa đầu nhẹ', 'Cúi đầu nhẹ'];

export default function FaceEnrollModal({ onClose, onEnrolled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [step, setStep] = useState('loading'); // loading | ready | capturing | done | error
  const [capturedCount, setCapturedCount] = useState(0);
  const [descriptors, setDescriptors] = useState([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) { setStep('error'); setMsg('face-api.js chưa được tải. Vui lòng tải lại trang.'); return; }

        setMsg('Đang tải model nhận diện khuôn mặt...');
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setStep('ready');
        setMsg('');
      } catch (err) {
        console.error(err);
        setStep('error');
        setMsg(err.name === 'NotAllowedError' ? 'Bạn cần cho phép truy cập camera.' : 'Không thể khởi động camera.');
      }
    };
    init();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const captureFrame = async () => {
    const faceapi = window.faceapi;
    if (!faceapi || !videoRef.current) return;

    setStep('capturing');
    setMsg('Đang phát hiện khuôn mặt...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!detection) {
        setMsg('Không phát hiện khuôn mặt. Vui lòng căn chỉnh lại và thử lại.');
        setStep('ready');
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const newList = [...descriptors, descriptor];
      setDescriptors(newList);
      const count = capturedCount + 1;
      setCapturedCount(count);

      if (count >= ANGLES.length) {
        setStep('done');
        setMsg('');
      } else {
        setStep('ready');
        setMsg('');
      }
    } catch (err) {
      console.error(err);
      setMsg('Lỗi khi xử lý khuôn mặt. Thử lại.');
      setStep('ready');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await biometricAPI.saveFace({ descriptors });
      onEnrolled?.();
      onClose();
    } catch (err) {
      setMsg('Lỗi lưu dữ liệu khuôn mặt: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="font-bold text-lg">Đăng ký khuôn mặt</h2>
            <p className="text-violet-200 text-sm">Nhận diện khuôn mặt khi điểm danh</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Progress */}
          <div className="flex gap-2">
            {ANGLES.map((angle, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`h-1.5 rounded-full transition-all ${i < capturedCount ? 'bg-violet-500' : i === capturedCount ? 'bg-violet-300' : 'bg-gray-200 dark:bg-gray-600'}`} />
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500 leading-tight">{angle.split(' ')[0]}</p>
              </div>
            ))}
          </div>

          {/* Camera */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay: face frame guide */}
            {(step === 'ready' || step === 'capturing') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-4 border-white/60 rounded-full" />
              </div>
            )}

            {step === 'done' && (
              <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                <CheckCircle size={64} className="text-green-400" />
              </div>
            )}

            {step === 'error' && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center flex-col gap-2 p-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-white text-center text-sm">{msg}</p>
              </div>
            )}

            {step === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm">{msg || 'Đang khởi động...'}</p>
              </div>
            )}
          </div>

          {/* Instruction */}
          {step !== 'error' && step !== 'done' && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center">
              <p className="text-violet-700 dark:text-violet-300 font-medium text-sm">
                Góc {capturedCount + 1}/{ANGLES.length}: {ANGLES[capturedCount] || ''}
              </p>
              {msg && <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">{msg}</p>}
            </div>
          )}

          {step === 'done' && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-green-700 dark:text-green-300 font-semibold">Đã chụp đủ {ANGLES.length} góc!</p>
              {msg && <p className="text-red-500 text-xs mt-1">{msg}</p>}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Hủy
            </button>

            {step === 'done' ? (
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : 'Lưu khuôn mặt'}
              </button>
            ) : (
              <button
                onClick={captureFrame}
                disabled={step !== 'ready'}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Camera size={17} />
                {step === 'capturing' ? 'Đang xử lý...' : `Chụp góc ${capturedCount + 1}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
