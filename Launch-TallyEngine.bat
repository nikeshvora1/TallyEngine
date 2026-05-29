@echo off
REM ============================================================
REM  TallyEngine - read-only viewer launcher
REM  Opens the TallyEngine UI and (optionally) starts TallyPrime
REM  so its HTTP-XML gateway is available on localhost:9000.
REM
REM  NOTE: TallyEngine fetches live data from localhost:9000 in
REM  the browser. Browsers allow this only when the page is served
REM  over HTTP (not opened as file://). This launcher tries Python's
REM  built-in server first. Without Python, it falls back to file://
REM  (demo data still shows; live data may be blocked by CORS).
REM ============================================================
setlocal
title TallyEngine Launcher

REM --- CONFIG --------------------------------------------------
set "TALLY_EXE=C:\Program Files\TallyPrime\tally.exe"
set "TALLY_PORT=9000"
set "HTTP_PORT=8080"
set "DIR=%~dp0"
REM -------------------------------------------------------------

echo.
echo   ============================================
echo     TallyEngine  -  read-only Tally viewer
echo   ============================================
echo.

REM --- Is the Tally gateway already up? -----------------------
echo   Checking for TallyPrime gateway on port %TALLY_PORT% ...
netstat -ano | findstr ":%TALLY_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [ OK ] Gateway is listening on localhost:%TALLY_PORT%.
) else (
    echo   [ -- ] Gateway not detected.
    if exist "%TALLY_EXE%" (
        echo          Starting TallyPrime ...
        start "" "%TALLY_EXE%"
        echo          Waiting for the gateway ...
        timeout /t 6 /nobreak >nul
    ) else (
        echo          TallyPrime not found at: %TALLY_EXE%
        echo          Edit TALLY_EXE in this .bat, or start Tally manually.
        echo          The UI still opens. If Tally is running on another
        echo          machine, enter its IP in the connection dialog.
    )
)

echo.

REM --- Serve via Python HTTP server (preferred) ---------------
REM  Serving over HTTP lets the browser fetch from localhost:9000
REM  without CORS errors. Python ships with Windows 10/11 from the
REM  Microsoft Store; also available at https://python.org.

set "PYTHON_CMD="
python --version >nul 2>&1 && set "PYTHON_CMD=python"
if not defined PYTHON_CMD (
    py --version >nul 2>&1 && set "PYTHON_CMD=py"
)

if defined PYTHON_CMD (
    REM Kill any existing process on %HTTP_PORT% so we always start fresh
    REM from the correct directory (stale processes cause 404 or wrong-folder issues).
    for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr ":%HTTP_PORT% " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%P >nul 2>&1
    )
    echo   Starting local HTTP server on port %HTTP_PORT% ...
    cd /d "%DIR%"
    start /B %PYTHON_CMD% -m http.server %HTTP_PORT%
    timeout /t 2 /nobreak >nul
    REM Use 127.0.0.1 explicitly — on Windows, "localhost" can resolve to ::1
    REM (IPv6) while Python binds IPv4, causing a connection refused.
    echo   Opening TallyEngine at http://127.0.0.1:%HTTP_PORT%/ ...
    start "" "http://127.0.0.1:%HTTP_PORT%/TallyEngine.html"
) else (
    echo   Python not found. Opening as file:// instead.
    echo   Install Python from https://python.org to enable live Tally data.
    echo.
    start "" "%DIR%TallyEngine.html"
)

echo.
echo   Done. You can close this window.
echo.
timeout /t 3 /nobreak >nul
endlocal
