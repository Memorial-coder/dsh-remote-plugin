@echo off
rem fix-antivirus launcher (double-click friendly)
rem 1) removes Mark-of-the-Web on this folder
rem 2) runs the PowerShell fix with execution policy bypassed
rem 3) keeps the window open afterwards so any error stays visible
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%~dp0.' -Recurse -File | Unblock-File"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-antivirus.ps1" -NoPause
echo.
pause
