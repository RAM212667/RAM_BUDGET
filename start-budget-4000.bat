@echo off
cd /d "%~dp0"
echo Starting Money Command Center on http://127.0.0.1:4000
set PORT=4000
set HOST=127.0.0.1
start "Budget Tool Server" cmd /k node server.js