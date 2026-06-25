import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, X, Loader, MapPin, AlertTriangle, Navigation, ShieldCheck, ShieldX, CheckCircle, XCircle, Clock } from 'lucide-react';
import { attendanceAPI, biometricAPI } from '../services/api';
import { loadFaceModels, detectFaceDescriptor, matchDescriptor, extractDescriptorFromBase64, compareTwoDescriptors } from '../utils/faceUtils';
import GeofenceMap from './GeofenceMap';

const SCHOOL_LOCATION = {
  lat: 10.813308852984058,
  lng: 106.77209163591941,
  radius: 200,
  name: 'Trường Cao Đẳng Kinh Tế Đối Ngoại',
};

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AttendanceModal({ classId, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // step: gps | loadingFace | camera | verifying | result
  const [step, setStep] = useState('gps');
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle|loading|success|outOfRange|error
  const [gpsData, setGpsData] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [showMap, setShowMap] = useState(false);

  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceMsg, setFaceMsg] = useState('');
  const [storedDescriptors, setStoredDescriptors] = useState(null);
  const [idCardDescriptor, setIdCardDescriptor] = useState(null); // chuẩn xác minh thẻ SV
  const [result, setResult] = useState(null);

  // ── GPS ──────────────────────────────────────────────
  const getGPS = useCallback(() => {
    setGpsStatus('loading');
    setGpsError('');
    if (!navigator.geolocation) { setGpsStatus('error'); setGpsError('Trình duyệt không hỗ trợ GPS'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const distance = Math.round(getDistanceMeters(lat, lng, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng));
        setGpsData({ lat, lng, accuracy: Math.round(accuracy), distance });
        setGpsStatus(distance <= SCHOOL_LOCATION.radius ? 'success' : 'outOfRange');
      },
      (err) => {
        setGpsStatus('error');
        if (err.code === 1) setGpsError('Bạn chưa cho phép truy cập vị trí. Vui lòng bật trong cài đặt trình duyệt.');
        else if (err.code === 2) setGpsError('Không xác định được vị trí. Kiểm tra GPS đã bật chưa.');
        else setGpsError('Hết thời gian lấy vị trí. Thử lại.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { getGPS(); }, [getGPS]);

  // ── Camera ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => { if (step === 'camera') stopCamera(); };
  }, [step, startCamera, stopCamera]);

  // ── Chuyển sang camera: tải model + lấy idCardDescriptor ───
  const proceedToCamera = async () => {
    setStep('loadingFace');
    try {
      const res = await biometricAPI.getMyFace();
      const faceData = res.data.enrolled ? res.data.faceData : null;

      if (!faceData) {
        // Chưa đăng ký → cho điểm danh nhưng không xác minh mặt
        setStoredDescriptors([]);
        setIdCardDescriptor(null);
        setStep('camera');
        return;
      }

      // Ưu tiên dùng idCardDescriptor (chuẩn từ thẻ SV) nếu có
      if (faceData.idCardDescriptor) {
        setIdCardDescriptor(faceData.idCardDescriptor);
        // Cũng load model để nhận diện live face khi chụp
        await loadFaceModels((msg) => setFaceMsg(msg));
        setFaceMsg('');
        setStoredDescriptors(faceData.descriptors || []);
        setStep('camera');
        return;
      }

      // Fallback: dùng descriptors cũ (tài khoản đăng ký trước khi có tính năng này)
      if (faceData.descriptors?.length) {
        setStoredDescriptors(faceData.descriptors);
        await loadFaceModels((msg) => setFaceMsg(msg));
        setFaceMsg('');
        setStep('camera');
        return;
      }

      // Fallback: chỉ có ảnh → trích xuất descriptor
      if (faceData.images?.length) {
        setFaceMsg('Đang xử lý dữ liệu khuôn mặt...');
        await loadFaceModels((msg) => setFaceMsg(msg));
        setFaceMsg('Đang trích xuất...');
        const descriptors = [];
        for (const img of faceData.images) {
          const d = await extractDescriptorFromBase64(img);
          if (d) descriptors.push(d);
        }
        if (descriptors.length) {
          biometricAPI.saveFace({ descriptors }).catch(() => {});
        }
        setStoredDescriptors(descriptors);
        setFaceMsg('');
        setStep('camera');
        return;
      }

      setStoredDescriptors([]);
      setStep('camera');
    } catch {
      setFaceMsg('');
      setStoredDescriptors([]);
      setStep('camera');
    }
  };

  // ── Chụp ảnh → nhận diện khuôn mặt ─────────────────
  const capture = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setCapturedImage(imgData);
    setStep('verifying');

    const hasIdCard = idCardDescriptor && idCardDescriptor.length > 0;
    const hasFallback = storedDescriptors && storedDescriptors.length > 0;

    if (hasIdCard || hasFallback) {
      setFaceMsg('Đang xác minh khuôn mặt...');
      const liveDescriptor = await detectFaceDescriptor(canvas);
      if (!liveDescriptor) {
        setResult({
          success: false,
          message: 'Không phát hiện khuôn mặt. Vui lòng đảm bảo đủ ánh sáng và thử lại.',
          faceResult: null,
        });
        setStep('result');
        return;
      }

      let match, confidence, distance;

      if (hasIdCard) {
        // So sánh với khuôn mặt trên thẻ SV (chuẩn chính)
        ({ match, confidence, distance } = compareTwoDescriptors(liveDescriptor, idCardDescriptor));
      } else {
        // Fallback: so sánh với ảnh đã đăng ký (tài khoản cũ)
        ({ match, confidence, distance } = matchDescriptor(liveDescriptor, storedDescriptors));
      }

      if (!match) {
        setResult({
          success: false,
          message: `Khuôn mặt không khớp với thẻ sinh viên (${confidence}%). Điểm danh bị từ chối.`,
          faceResult: { match: false, confidence, distance },
        });
        setStep('result');
        return;
      }
      await submitCheckin(imgData, confidence);
    } else {
      // Chưa đăng ký khuôn mặt → cho qua
      await submitCheckin(imgData, null);
    }
  };

  const submitCheckin = async (imageBase64, faceConfidence) => {
    setFaceMsg('Đang ghi nhận điểm danh...');
    try {
      const res = await attendanceAPI.checkin({
        classId: classId || 'DEFAULT',
        imageBase64,
        gpsLat: gpsData?.lat,
        gpsLng: gpsData?.lng,
        faceConfidence,
        timestamp: new Date().toISOString(),
      });
      setResult({ success: true, message: res.data.message, status: res.data.status, faceConfidence });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Điểm danh thất bại' });
    }
    setStep('result');
    setFaceMsg('');
  };

  const retake = () => {
    setCapturedImage(null);
    setFaceMsg('');
    setStep('camera');
  };

  // ── GPS UI ───────────────────────────────────────────
  const renderGPS = () => (
    <div className="py-4">
      <div className="bg-blue-50 rounded-xl p-4 mb-5 flex items-start gap-3">
        <MapPin className="text-blue-500 mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-medium text-gray-800 text-sm">{SCHOOL_LOCATION.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">Phạm vi điểm danh: {SCHOOL_LOCATION.radius}m</p>
        </div>
      </div>

      {gpsStatus === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader className="animate-spin text-blue-500" size={36} />
          <p className="text-gray-600 text-sm">Đang xác định vị trí...</p>
        </div>
      )}

      {gpsStatus === 'success' && gpsData && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-green-500"/><p className="font-semibold text-green-700">Trong phạm vi cho phép</p></div>
            <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={12} className="text-gray-400"/> Khoảng cách: <span className="font-medium text-green-600 ml-1">{gpsData.distance}m</span><span className="ml-1">(tối đa {SCHOOL_LOCATION.radius}m)</span></p>
            <p className="text-sm text-gray-600">Độ chính xác GPS: ±{gpsData.accuracy}m</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMap(true)} className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <Navigation size={18}/> Bản đồ
            </button>
            <button onClick={proceedToCamera} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <Camera size={18}/> Tiếp tục chụp ảnh
            </button>
          </div>
        </div>
      )}

      {gpsStatus === 'outOfRange' && gpsData && (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2"><XCircle size={20} className="text-red-500"/><p className="font-semibold text-red-700">Ngoài phạm vi trường</p></div>
            <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={12} className="text-gray-400"/> Khoảng cách: <span className="font-medium text-red-600 ml-1">{gpsData.distance}m</span><span className="ml-1">(tối đa {SCHOOL_LOCATION.radius}m)</span></p>
            <p className="text-sm text-red-600 mt-1 font-medium">Bạn cần có mặt tại trường để điểm danh.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMap(true)} className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <Navigation size={18}/> Bản đồ
            </button>
            <button onClick={getGPS} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <RotateCcw size={18}/> Thử lại
            </button>
          </div>
        </div>
      )}

      {gpsStatus === 'error' && (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20}/>
            <p className="text-sm text-gray-700">{gpsError}</p>
          </div>
          <button onClick={getGPS} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <RotateCcw size={18}/> Thử lại
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            {step === 'gps' ? <MapPin size={20} className="text-blue-500"/> : <Camera size={20} className="text-blue-500"/>}
            {step === 'gps' ? 'Xác nhận vị trí' : step === 'loadingFace' ? 'Chuẩn bị...' : 'Điểm danh khuôn mặt'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Step indicators */}
            <div className={`flex items-center gap-1 text-xs ${step === 'gps' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 'gps' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                {step === 'gps' ? '1' : '✓'}
              </div> GPS
            </div>
            <div className="w-4 h-px bg-gray-300"/>
            <div className={`flex items-center gap-1 text-xs ${['loadingFace','camera','verifying','result'].includes(step) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${['loadingFace','camera','verifying','result'].includes(step) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div> Ảnh
            </div>
            <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
        </div>

        <div className="p-5">
          {/* GPS step */}
          {step === 'gps' && renderGPS()}

          {/* Loading face model */}
          {step === 'loadingFace' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"/>
              <p className="text-gray-600 text-sm text-center">{faceMsg || 'Đang chuẩn bị...'}</p>
            </div>
          )}

          {/* Camera */}
          {step === 'camera' && (
            <div>
              {cameraError ? (
                <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm text-center mb-3">{cameraError}
                  <button onClick={startCamera} className="mt-3 w-full bg-red-500 text-white py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                    <RotateCcw size={16}/> Thử lại
                  </button>
                </div>
              ) : (
                <div>
                  {storedDescriptors?.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <ShieldCheck size={16} className="text-green-600"/>
                      <p className="text-green-700 text-xs font-medium">Nhận diện khuôn mặt đã kích hoạt</p>
                    </div>
                  )}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ maxHeight: '60vh', minHeight: '240px' }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" style={{ maxHeight: '60vh' }}/>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-48 border-4 border-blue-400 rounded-full opacity-60"/>
                    </div>
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <MapPin size={10}/> {gpsData?.distance}m
                    </div>
                    <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none">
                      <p className="bg-black/40 text-white text-xs px-3 py-1 rounded-full">Nhìn thẳng, đủ ánh sáng</p>
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <button onClick={capture} className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-blue-500 active:scale-95 transition-transform">
                        <Camera size={28} className="text-blue-500"/>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <div>
              {capturedImage && (
                <div className="relative rounded-xl overflow-hidden mb-4" style={{ maxHeight: '50vh' }}>
                  <img src={capturedImage} alt="Captured" className="w-full object-cover scale-x-[-1]" style={{ maxHeight: '50vh' }}/>
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"/>
                    <p className="text-white text-sm font-medium">{faceMsg || 'Đang xác thực...'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <div>
              {/* Ảnh đã chụp */}
              {capturedImage && (
                <div className="rounded-xl overflow-hidden mb-4" style={{ maxHeight: '35vh' }}>
                  <img src={capturedImage} alt="Captured" className="w-full object-cover scale-x-[-1]" style={{ maxHeight: '35vh' }}/>
                </div>
              )}

              {/* Kết quả nhận diện */}
              {result.faceResult !== undefined && result.faceResult !== null && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-sm ${result.faceResult.match ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {result.faceResult.match
                    ? <><ShieldCheck size={16} className="text-green-600"/><span className="text-green-700">Khuôn mặt khớp ({result.faceResult.confidence}%)</span></>
                    : <><ShieldX size={16} className="text-red-600"/><span className="text-red-700">Khuôn mặt không khớp ({result.faceResult.confidence}%)</span></>
                  }
                </div>
              )}

              <div className={`flex flex-col items-center gap-3 py-4 text-center rounded-xl ${result.success ? (result.status === 'late' ? 'bg-yellow-50' : 'bg-green-50') : 'bg-red-50'}`}>
                <div>{result.success ? (result.status === 'late' ? <Clock size={44} className="text-yellow-500"/> : <CheckCircle size={44} className="text-green-500"/>) : <XCircle size={44} className="text-red-500"/>}</div>
                <p className={`font-semibold ${result.success ? (result.status === 'late' ? 'text-yellow-600' : 'text-green-600') : 'text-red-600'}`}>
                  {result.message}
                </p>
                {result.faceConfidence && <p className="text-xs text-gray-500">Độ khớp khuôn mặt: {result.faceConfidence}%</p>}
              </div>

              <div className="flex gap-3 mt-4">
                {!result.success && (
                  <button onClick={retake} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                    <RotateCcw size={16}/> Thử lại
                  </button>
                )}
                <button onClick={() => { onSuccess?.(result.status); onClose(); }} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"/>
      {showMap && <GeofenceMap gpsData={gpsData} onClose={() => setShowMap(false)}/>}
    </div>
  );
}
