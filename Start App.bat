@echo off
cd /d "%~dp0"
start "" cmd /c "python -m http.server 8012"
timeout /t 1 >nul
start "" http://localhost:8012/index.html
