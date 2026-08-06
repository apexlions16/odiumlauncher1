@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo [HATA] Windows PowerShell bulunamadi.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build-windows-exe.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [HATA] EXE uretimi tamamlanamadi. Yukaridaki hata metnini ekran goruntusuyle paylasin.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo [TAMAMLANDI] release klasoru aciliyor.
pause
exit /b 0
