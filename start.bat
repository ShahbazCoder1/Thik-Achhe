@echo off
title Thik Achhe - Scam Checker

echo ==============================================
echo        Starting Thik Achhe...
echo ==============================================

echo [1/3] Starting AI Engine (Ollama)...
:: Use start /B to run in background without opening a new window if possible, 
:: or just rely on the existing background service.
start /B ollama serve >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Opening your browser...
:: Wait a bit for Next.js to compile before opening
start http://localhost:3000

echo [3/3] Starting the User Interface...
echo Keep this black window open while you use the app!
echo.
npm run dev
