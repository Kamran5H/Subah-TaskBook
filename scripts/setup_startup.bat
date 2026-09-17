@echo off
title Setup Subah Windows Startup
cd /d "%~dp0\.."

echo ======================================================
echo    Setting up Subah for Automatic Laptop Login
echo ======================================================
echo.

for %%I in ("%~dp0..") do set "TARGET_DIR=%%~fI"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Subah-TaskBook.lnk"

REM Detect actual Desktop folder (works with or without OneDrive redirection)
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "USER_DESKTOP=%%D"
if not defined USER_DESKTOP set "USER_DESKTOP=%USERPROFILE%\Desktop"
set "DESKTOP_SHORTCUT=%USER_DESKTOP%\Subah.lnk"
set "EXE_PATH=%TARGET_DIR%\dist\Subah-win32-x64\Subah.exe"
set "ICON_PATH=%TARGET_DIR%\assets\icon.ico,0"

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

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_EXE%'; if ('%TARGET_ARGS%') { $s.Arguments = '%TARGET_ARGS%' }; $s.WorkingDirectory = '%TARGET_DIR%'; $s.IconLocation = '%ICON_PATH%'; $s.Save()"

echo Creating Desktop shortcut on your Desktop:
echo "%DESKTOP_SHORTCUT%"
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = '%TARGET_EXE%'; if ('%TARGET_ARGS%') { $s.Arguments = '%TARGET_ARGS%' }; $s.WorkingDirectory = '%TARGET_DIR%'; $s.IconLocation = '%ICON_PATH%'; $s.Save()"

echo.
echo [SUCCESS] Subah startup configuration refreshed cleanly!
echo Rogue development startup entries removed.
echo.
pause
