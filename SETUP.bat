@echo off
echo ============================================
echo   ATTENDANCE APP - SETUP & RUN
echo ============================================
echo.

REM Check Node.js
node --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [!] Node.js chua duoc cai dat.
    echo     Tai tai: https://nodejs.org/  (chon LTS)
    echo     Sau do chay lai file nay.
    pause
    exit /b 1
)

echo [OK] Node.js:
node --version
echo.

REM Install Backend
echo [1/3] Cai dat Backend packages...
cd /d "%~dp0backend"
call npm install
IF ERRORLEVEL 1 (
    echo [!] Loi cai backend packages
    pause
    exit /b 1
)
echo [OK] Backend packages xong.
echo.

REM Install Frontend
echo [2/3] Cai dat Frontend packages...
cd /d "%~dp0frontend"
call npm install
IF ERRORLEVEL 1 (
    echo [!] Loi cai frontend packages
    pause
    exit /b 1
)
echo [OK] Frontend packages xong.
echo.

echo [3/3] Khoi dong ung dung...
echo.
echo ============================================
echo   Dang khoi dong Backend (port 5000)...
echo   Dang khoi dong Frontend (port 3000)...
echo.
echo   Sau khi chay xong, mo trinh duyet:
echo   http://localhost:3000
echo ============================================
echo.

REM Start backend in new window
start "BACKEND - Port 5000" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait a bit then start frontend
timeout /t 3 /nobreak >nul
start "FRONTEND - Port 3000" cmd /k "cd /d "%~dp0frontend" && npm start"

echo Ung dung dang khoi dong trong 2 cua so moi!
echo Doi khoang 30 giay roi mo: http://localhost:3000
echo.
pause
