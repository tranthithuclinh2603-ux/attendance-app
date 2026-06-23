# HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG ĐIỂM DANH

## BƯỚC 1: Cài Node.js (nếu chưa có)
Tải tại: https://nodejs.org/ → chọn phiên bản LTS → cài đặt
Kiểm tra: mở CMD và gõ `node --version`

---

## BƯỚC 2: Tạo Firebase Project

1. Vào https://console.firebase.google.com/
2. Tạo project mới (ví dụ: `attendance-app-2026`)
3. Bật **Realtime Database**:
   - Vào Build → Realtime Database → Create Database
   - Chọn location → Start in test mode
4. Lấy **Service Account** (cho backend):
   - Vào Project Settings → Service Accounts
   - Click "Generate new private key" → tải file JSON về

---

## BƯỚC 3: Cấu hình Backend

Mở file `backend/.env` và điền thông tin từ file JSON vừa tải:

```
FIREBASE_PROJECT_ID=ten-project-cua-ban
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=xxx
FIREBASE_DATABASE_URL=https://ten-project-default-rtdb.firebaseio.com
```

---

## BƯỚC 4: Cấu hình Frontend

Mở file `frontend/src/services/firebase.js` và điền thông tin từ Firebase Console:
- Vào Project Settings → General → Your apps → Add app (Web)
- Copy firebaseConfig và dán vào file

---

## BƯỚC 5: Chạy ứng dụng

### Cách 1: Double-click file `SETUP.bat`
(Tự động cài packages và khởi động)

### Cách 2: Thủ công
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

---

## TRUY CẬP

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

---

## TÀI KHOẢN TEST

Sau khi chạy, tạo tài khoản qua trang `/register` (sinh viên)
hoặc thêm giảng viên trực tiếp vào Firebase Database.

### Thêm giảng viên vào Firebase:
Vào Realtime Database → Thêm node:
```json
users/
  "uid_teacher001": {
    "name": "Cô Nguyễn B",
    "email": "teacher@edu.vn",
    "passwordHash": "[bcrypt của password]",
    "role": "teacher",
    "teachingClasses": ["ATTT1", "ATTT2"]
  }
```
(Dùng bcrypt online để hash password, ví dụ: bcrypt.io)

---

## CẤU TRÚC FILE

```
attendance-app/
├── backend/
│   ├── server.js          ← Main server Express
│   ├── .env               ← Firebase config (QUAN TRỌNG)
│   ├── routes/            ← API routes
│   ├── controllers/       ← Logic xử lý
│   ├── middleware/        ← JWT auth
│   └── models/            ← Firebase connection
└── frontend/
    └── src/
        ├── App.jsx         ← Routing chính
        ├── components/     ← UI components
        ├── pages/          ← Pages
        └── services/       ← API & Firebase config
```
