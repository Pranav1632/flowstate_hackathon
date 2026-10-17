@echo off
title RecallGuard — AI Supply Chain Safety Agent with ArmorIQ
echo ========================================================
echo   RecallGuard: AI Product Recall & Supply Chain Safety
echo   Governed by ArmorIQ Intent Verification & Policy Guard
echo ========================================================
echo.

set "PYTHONPATH=%~dp0;%PYTHONPATH%"

echo [1/2] Starting RecallGuard FastAPI Backend on port 8000...
start "RecallGuard Backend (FastAPI)" cmd /k "cd /d %~dp0 && set PYTHONPATH=%~dp0;%%PYTHONPATH%% && python -m uvicorn backend.main:app --port 8000 --reload"

timeout /t 3 >nul

echo [2/2] Starting Next.js Frontend Dashboard on port 3001...
start "RecallGuard Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo RecallGuard is launching!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3001
echo ========================================================
echo.
pause
