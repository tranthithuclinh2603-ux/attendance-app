import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Check, X, Loader, MapPin, AlertTriangle, Map } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import GeofenceMap from './GeofenceMap';

// ===== CẤU HÌNH VỊ TRÍ TRƯỜNG =====
// Thay tọa độ này bằng tọa độ thực của trường bạn
const SCHOOL_LOCATION = {
  lat: 10.813308852984058,
  lng: 106.77209163591941,
  radius: 200,
  name: 'Trường Cao Đẳng Kinh Tế Đối Ngoại',
};

// Tính khoảng cách giữa 2 tọa độ (đơn vị: mét)
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GPS_STATUS = {
  idle: null,
  loading: 'loading',
  success: 'success',
  outOfRange: 'outOfRange',
  error: 'error',
};

export default function AttendanceModal({ classId, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState('gps'); // gps | camera | preview | loading | result
  const [gpsStatus, setGpsStatus] = useState(GPS_STATUS.idle);
  const [gpsData, setGpsData] = useState(null); // { lat, lng, accuracy, distance }
  const [gpsError, setGpsError] = useState('');

  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // ── GPS ──────────────────────────────────────────
  const getGPS = useCallback(() => {
    setGpsStatus(GPS_STATUS.loading);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsStatus(GPS_STATUS.error);
      setGpsError('Trình duyệt không hỗ trợ GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const distance = Math.round(getDistanceMeters(lat, lng, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng));

        const data = { lat, lng, accuracy: Math.round(accuracy), distance };
        setGpsData(data);

        if (distance <= SCHOOL_LOCATION.radius) {
          setGpsStatus(GPS_STATUS.success);
        } else {
          setGpsStatus(GPS_STATUS.outOfRange);
        }
      },
      (err) => {
        setGpsStatus(GPS_STATUS.error);
        if (err.code === 1) setGpsError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép GPS trong cài đặt trình duyệt.');
        else if (err.code === 2) setGpsError('Không xác định được vị trí. Kiểm tra GPS đã bật chưa.');
        else setGpsError('Hết thời gian lấy vị trí. Thử lại.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { getGPS(); }, [getGPS]);

  // ── Camera ────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => { if (step === 'camera') stopCamera(); };
  }, [step, startCamera, stopCamera]);

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
    setStep('preview');
  };

  const retake = () => {
    setCapturedImage(null);
    setStep('camera');
  };

  const confirm = async () => {
    setStep('loading');
    try {
      const res = await attendanceAPI.checkin({
        classId: classId || 'ATTT1',
        imageBase64: capturedImage,
        gpsLat: gpsData?.lat,
        gpsLng: gpsData?.lng,
        timestamp: new Date().toISOString(),
      });
      setResult({ success: true, message: res.data.message, status: res.data.status });
      setStep('result');
      onSuccess?.(res.data.status);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Điểm danh thất bại' });
      setStep('result');
    }
  };

  // ── GPS Step UI ───────────────────────────────────
  const renderGPS = () => (
    <div className="py-4">
      {/* School info */}
      <div className="bg-blue-50 rounded-xl p-4 mb-5 flex items-start gap-3">
        <MapPin className="text-blue-500 mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-medium text-gray-800 text-sm">{SCHOOL_LOCATION.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">Phạm vi điểm danh: {SCHOOL_LOCATION.radius}m</p>
        </div>
      </div>

      {/* Loading */}
      {gpsStatus === GPS_STATUS.loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader className="animate-spin text-blue-500" size={36} />
          <p className="text-gray-600 text-sm">Đang xác định vị trí của bạn...</p>
        </div>
      )}

      {/* Success */}
      {gpsStatus === GPS_STATUS.success && gpsData && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <p className="font-semibold text-green-700">Trong phạm vi cho phép</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 Khoảng cách: <span className="font-medium text-green-600">{gpsData.distance}m</span> (tối đa {SCHOOL_LOCATION.radius}m)</p>
              <p>🎯 Độ chính xác GPS: ±{gpsData.accuracy}m</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMap(true)}
              className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Map size={18} /> Bản đồ
            </button>
            <button
              onClick={() => setStep('camera')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Camera size={20} /> Tiếp tục chụp ảnh
            </button>
          </div>
        </div>
      )}

      {/* Out of range */}
      {gpsStatus === GPS_STATUS.outOfRange && gpsData && (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">❌</span>
              <p className="font-semibold text-red-700">Ngoài phạm vi trường</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 Khoảng cách: <span className="font-medium text-red-600">{gpsData.distance}m</span> (tối đa {SCHOOL_LOCATION.radius}m)</p>
              <p>🎯 Độ chính xác GPS: ±{gpsData.accuracy}m</p>
            </div>
            <p className="text-red-600 text-sm mt-2 font-medium">
              Bạn cần có mặt tại trường để điểm danh.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMap(true)}
              className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Map size={18} /> Bản đồ
            </button>
            <button
              onClick={getGPS}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={18} /> Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {gpsStatus === GPS_STATUS.error && (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-gray-700">{gpsError}</p>
          </div>
          <button
            onClick={getGPS}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={18} />
            Thử lại
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            {step === 'gps' ? <MapPin size={20} className="text-blue-500" /> : <Camera size={20} className="text-blue-500" />}
            {step === 'gps' ? 'Xác nhận vị trí' : 'Điểm danh khuôn mặt'}
          </h2>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${step === 'gps' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 'gps' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                {step === 'gps' ? '1' : '✓'}
              </div>
              GPS
            </div>
            <div className="w-4 h-px bg-gray-300" />
            <div className={`flex items-center gap-1 text-xs ${['camera','preview','loading','result'].includes(step) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${['camera','preview','loading','result'].includes(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              Ảnh
            </div>
            <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* GPS step */}
          {step === 'gps' && renderGPS()}

          {/* Camera step */}
          {step === 'camera' && (
            <div>
              {cameraError ? (
                <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm text-center mb-4">{cameraError}</div>
              ) : (
                <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-56 border-4 border-blue-400 rounded-full opacity-60" />
                  </div>
                  {/* GPS badge */}
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <MapPin size={10} /> {gpsData?.distance}m
                  </div>
                </div>
              )}
              <p className="text-center text-gray-500 text-sm mb-4">Nhìn thẳng vào camera, đảm bảo ánh sáng đủ</p>
              <button
                onClick={capture}
                disabled={!!cameraError}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Camera size={20} /> Chụp ảnh
              </button>
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && (
            <div>
              <div className="rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
              </div>
              <p className="text-center text-gray-600 text-sm mb-4">Ảnh có rõ ràng không?</p>
              <div className="flex gap-3">
                <button onClick={retake} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  <RotateCcw size={18} /> Chụp lại
                </button>
                <button onClick={confirm} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  <Check size={18} /> Xác nhận
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="py-10 flex flex-col items-center gap-4">
              <Loader className="animate-spin text-blue-500" size={40} />
              <p className="text-gray-600">Đang xử lý điểm danh...</p>
            </div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${result.success ? (result.status === 'late' ? 'bg-yellow-100' : 'bg-green-100') : 'bg-red-100'}`}>
                {result.success ? (result.status === 'late' ? '⏰' : '✅') : '❌'}
              </div>
              <p className={`text-lg font-semibold ${result.success ? (result.status === 'late' ? 'text-yellow-600' : 'text-green-600') : 'text-red-600'}`}>
                {result.message}
              </p>
              <button onClick={onClose} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl transition-colors">
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {showMap && <GeofenceMap gpsData={gpsData} onClose={() => setShowMap(false)} />}
    </div>
  );
}
