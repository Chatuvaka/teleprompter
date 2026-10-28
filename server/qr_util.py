import socket
import sys
import qrcode

# Asegurar codificación UTF-8 en consolas Windows si es posible
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def get_lan_ip() -> str:
    """
    Detecta la dirección IP local de la laptop en la red LAN activa (Wi-Fi o Ethernet).
    Usa un socket UDP no conectado para obtener la interfaz de red con ruta principal.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def print_terminal_qr(url: str):
    """
    Imprime un código QR 100% compatible con cualquier terminal y codificación de Windows.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=1,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)

    print("\n" + "=" * 62)
    print("  HUAWEI WATCH FIT 3 - TELEPROMPTER & PPT REMOTE")
    print("=" * 62)
    print("  Escanea este codigo QR con la camara de tu telefono")
    print("  o abre la siguiente URL en tu navegador movil:\n")
    print(f"  >>> URL: {url}")
    print("=" * 62 + "\n")

    # Intentar renderizado con caracteres de bloque, si falla usar caracteres ASCII 100% seguros
    try:
        matrix = qr.get_matrix()
        # Matriz ASCII pura: ## para módulos negros, dos espacios para módulos blancos
        # Con borde seguro
        for row in matrix:
            line = "".join("  " if col else "##" for col in row)
            print(f"  {line}")
    except Exception as e:
        print(f"  [Abre directamente la URL en tu telefono: {url}]")

    print("\n" + "=" * 62)
    print("  Servidor en linea. Esperando conexiones WebSocket...\n")
