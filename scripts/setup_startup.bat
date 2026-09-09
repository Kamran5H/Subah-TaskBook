@echo off
title Setup Subah Windows Startup
cd /d "%~dp0\.."

echo ======================================================
echo    Setting up Subah for Automatic Laptop Login
echo ======================================================
echo.

set "TARGET_DIR=%~dp0.."
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Subah-TaskBook.lnk"
set "DESKTOP_SHORTCUT=%USERPROFILE%\OneDrive\Desktop\Subah.lnk"
set "EXE_PATH=%~dp0..\dist\Subah-win32-x64\Subah.exe"

REM Remove rogue electron.app.Electron entry from Windows Run registry
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "electron.app.Electron" /f >nul 2>&1

echo Target Application:
if exist "%EXE_PATH%" (
    echo Using packaged application: "%EXE_PATH%"
    set "TARGET_EXE=%EXE_PATH%"
    set "TARGET_ARGS="
) else (
    echo Using launch script: "%~dp0launch.vbs"
    set "TARGET_EXE=wscript.exe"
    set "TARGET_ARGS=\"%~dp0launch.vbs\""
)

echo Creating Windows Startup shortcut in:
echo "%SHORTCUT_PATH%"
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_EXE%'; if ('%TARGET_ARGS%') { $s.Arguments = '%TARGET_ARGS%' }; $s.WorkingDirectory = '%TARGET_DIR%'; $s.Save()"

echo Creating Desktop shortcut on your Desktop:
echo "%DESKTOP_SHORTCUT%"
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = '%TARGET_EXE%'; if ('%TARGET_ARGS%') { $s.Arguments = '%TARGET_ARGS%' }; $s.WorkingDirectory = '%TARGET_DIR%'; $s.Save()"

echo.
echo [SUCCESS] Subah startup configuration refreshed cleanly!
echo Rogue development startup entries removed.
echo.
pause
