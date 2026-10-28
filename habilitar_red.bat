@echo off
chcp 65001 > nul
echo ============================================================
echo   CONFIGURANDO PERMISOS DE RED Y FIREWALL PARA TELEPROMPTER
echo ============================================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script debe ejecutarse como Administrador.
    echo Haz clic derecho sobre este archivo y selecciona:
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/2] Cambiando red Wi-Fi a Privada...
powershell -Command "Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private"

echo [2/2] Abriendo puerto 8000 en el Firewall de Windows...
netsh advfirewall firewall add rule name="Teleprompter PPT" dir=in action=allow protocol=TCP localport=8000

echo.
echo ============================================================
echo   listo! Tu telefono ya puede conectarse.
echo ============================================================
echo Abre en tu telefono: http://192.168.1.83:8000
echo.
pause
