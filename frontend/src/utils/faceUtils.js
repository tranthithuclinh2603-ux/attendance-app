const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
let modelsLoaded = false;
let loading = false;
let loadingPromise = null;

export async function loadFaceModels(onProgress) {
  if (modelsLoaded) return;
  if (loading) return loadingPromise;
  loading = true;
  loadingPromise = (async () => {
    const faceapi = window.faceapi;
    if (!faceapi) throw new Error('face-api.js chưa được tải. Vui lòng tải lại trang.');
    onProgress?.('Đang tải model (1/3)...');
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    onProgress?.('Đang tải model (2/3)...');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    onProgress?.('Đang tải model nhận diện (3/3)...');
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    loading = false;
  })();
  return loadingPromise;
}

// Trích xuất descriptor từ ảnh base64
export async function extractDescriptorFromBase64(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const descriptor = await detectFaceDescriptor(img);
      resolve(descriptor);
    };
    img.onerror = () => resolve(null);
    img.src = base64;
  });
}

// So sánh 1 descriptor với 1 descriptor (dùng để xác minh thẻ SV)
export function compareTwoDescriptors(a, b, threshold = 0.55) {
  if (!a || !b) return { match: false, confidence: 0, distance: 99 };
  const dist = euclidean(a, b);
  const confidence = Math.max(0, Math.round((1 - dist / threshold) * 100));
  return { match: dist < threshold, distance: +dist.toFixed(3), confidence };
}

export async function detectFaceDescriptor(source) {
  const faceapi = window.faceapi;
  const result = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return result ? Array.from(result.descriptor) : null;
}

export function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

// So sánh descriptor sống với mảng descriptors đã lưu
// threshold mặc định 0.55 (chặt hơn 0.6 tiêu chuẩn để tránh giả mạo)
export function matchDescriptor(live, stored, threshold = 0.55) {
  if (!stored?.length) return { match: false, confidence: 0, distance: 99 };
  let min = Infinity;
  for (const s of stored) {
    const d = euclidean(live, s);
    if (d < min) min = d;
  }
  const confidence = Math.max(0, Math.round((1 - min / threshold) * 100));
  return { match: min < threshold, distance: +min.toFixed(3), confidence };
}

// Resize ảnh trước khi lưu (max 800px)
export function resizeImage(file, maxSize = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.src = url;
  });
}
