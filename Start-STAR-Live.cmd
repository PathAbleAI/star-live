@echo off
rem Starts Claude in a clean profile: no memory, no email or Drive connectors, no personal files.
title STAR 2026 - Built Live
set "CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude-star"
cd /d "%~dp0"
git pull -q 2>nul
echo.
echo   STAR 2026 - Built Live
echo   Tip: press Ctrl and + a few times so the back row can read this.
echo.
claude
