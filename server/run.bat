@echo off
chcp 65001 > nul
title Huawei Watch Fit 3 - Teleprompter Server

echo ============================================================
echo   TELEPROMPTER & PPT REMOTE - SERVIDOR WINDOWS
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando entorno Python...
python --version
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Python 3.10+ desde python.org y marca "Add Python to PATH".
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando dependencias necesarias...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [WARN] Hubo una advertencia al instalar requisitos, continuando...
)

echo.
echo [3/3] Iniciando Servidor FastAPI y WebSocket...
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

pause
