# ⌚ Huawei Watch Fit 3 - Teleprompter & PowerPoint Remote

Sistema integral de **Teleprompter y Control Remoto de Diapositivas** para oradores profesionales, diseñado específicamente para la pantalla AMOLED (402x480 px) del **Huawei Watch Fit 3**, conectado a una **Laptop con Windows** a través de un **Teléfono Android** como puente (Bridge), con un **Simulador Web PWA de latencia cero** para pruebas inmediatas sin necesidad del reloj físico.

---

## 🏛️ Arquitectura del Sistema (3 Nodos + Modo Simulador)

```
┌─────────────────────────────────┐
│     NODO 1: Laptop Windows      │
│  FastAPI + WebSocket + COM API  │◄──────┐
│ (PowerPoint & Speaker Notes)    │       │
└────────────────┬────────────────┘       │
                 │ Wi-Fi LAN              │ Wi-Fi LAN
                 │ (WebSockets)           │ (WebSockets)
                 ▼                        ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│     NODO 2: Teléfono Android    │   │  MODO SIMULADOR INMEDIATO (PWA) │
│   Bridge (Huawei Wear Engine)   │   │  402x480 AMOLED Web / Móvil     │
└────────────────┬────────────────┘   │  (Prueba instantánea vía QR)    │
                 │ Bluetooth P2P      └─────────────────────────────────┘
                 │ (Wear Engine SDK)
                 ▼
┌─────────────────────────────────┐
│  NODO 3: Huawei Watch Fit 3     │
│   HarmonyOS Lite Wearable JS    │
│  (Corona, Háptica & Prompter)   │
└─────────────────────────────────┘
```

---

## 📂 Estructura del Proyecto

```
teleprompter/
├── server/
│   ├── app.py                     # Servidor FastAPI, WebSocket broadcast y API REST
│   ├── ppt_controller.py          # Automatización COM win32com con PowerPoint y fallback
│   ├── qr_util.py                 # Detección de IP LAN y generación de QR en consola
│   ├── script_fallback.json       # Guion de respaldo con notas de orador demo
│   ├── requirements.txt           # Dependencias Python
│   └── run.bat                    # Script ejecutor 'One-Click' para Windows
├── web_simulator/
│   ├── index.html                 # Simulador del Watch Fit 3 con bezel y corona
│   ├── css/style.css              # Estilos AMOLED 402x480, alto contraste y responsivo
│   └── js/app.js                  # Lógica WebSocket, auto-scroll, swipes y háptica
├── android_bridge/
│   ├── AndroidManifest.xml        # Permisos de Bluetooth, Wi-Fi y Huawei Wear Engine
│   ├── build.gradle               # Dependencias OkHttp y Huawei Wear Engine SDK
│   ├── src/main/java/...          # MainActivity y WearEngineManager (P2P Bluetooth)
│   └── README.md                  # Guía de compilación en Android Studio
├── watch_fit3_app/
│   ├── config.json                # Configuración Lite Wearable (402x480 px)
│   ├── pages/index/               # HML, CSS y JS con soporte de corona y háptica
│   └── README.md                  # Guía de apertura y despliegue en DevEco Studio
└── README.md                      # Documentación maestra del sistema
```

---

## ⚡ Guía de Inicio Rápido (Prueba en 1 Minuto)

### Paso 1: Ejecutar el Servidor en la Laptop
1. Abre la carpeta `server/`.
2. Haz doble clic en el archivo **`run.bat`** (o ejecuta en consola):
   ```powershell
   cd c:\Users\chatu\teleprompter\server
   python -m pip install -r requirements.txt
   python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. El servidor detectará automáticamente la IP de tu red Wi-Fi y mostrará un **Código QR ASCII** en la consola con la URL directa:
   ```
   ============================================================
     HUAWEI WATCH FIT 3 - TELEPROMPTER & PPT REMOTE
   ============================================================
     Escanea este código QR con la cámara de tu teléfono
     o abre la siguiente URL en tu navegador móvil:

     👉  http://192.168.1.50:8000
   ============================================================
   ```

### Paso 2: Probar el Simulador en Laptop o Teléfono
- **En la Laptop:** Abre tu navegador en `http://localhost:8000`. Verás el Huawei Watch Fit 3 renderizado con su corona digital interactiva y la pantalla AMOLED.
- **En el Teléfono Móvil:** Apunta la cámara de tu teléfono al código QR de la consola y pulsa el enlace. El simulador se adaptará a pantalla completa como si tuvieras el reloj en tu mano.

### Paso 3: Abrir una Presentación de PowerPoint
- Abre cualquier archivo de PowerPoint (`.pptx`) en tu laptop.
- Si la presentación tiene **Notas del Orador**, el sistema las extraerá automáticamente en tiempo real.
- Si no tienes PowerPoint abierto en este momento, el sistema utilizará automáticamente el guion de respaldo (`script_fallback.json`) sin fallar.

---

## 🎮 Controles e Interacción

| Acción | En el Reloj (Fit 3) | En el Simulador Móvil | En la Laptop (Teclado/Mouse) |
| :--- | :--- | :--- | :--- |
| **Siguiente Diapositiva** | Swipe Izquierda / Toque Borde Der. | Swipe Izquierda / Toque Der. | `Espacio` / `Flecha Der` / `PageDown` |
| **Diapositiva Anterior** | Swipe Derecha / Toque Borde Izq. | Swipe Derecha / Toque Izq. | `Flecha Izq` / `Backspace` / `PageUp` |
| **Scroll de Teleprompter** | Girar Corona Digital | Deslizar dedo / Rueda | Rueda del ratón sobre la Corona |
| **Auto-Scroll Play/Pause** | Toque en botón ▶ / ❚❚ | Toque en botón ▶ / ❚❚ | Tecla `P` |
| **Aumentar / Reducir Letra**| Botones `A-` / `A+` | Botones `A-` / `A+` | Teclas `+` / `-` |
| **F5 Proyectar Diapositivas** | Desde app móvil | Botón Superior | Tecla `F5` / `Escape` |
| **Confirmación Háptica** | Vibración física en muñeca | Vibración del teléfono | Flash visual en pantalla |

---

## 🛠️ Empaquetado y Despliegue en Hardware Real

### 1. Despliegue de la App en el Huawei Watch Fit 3
1. Abre **Huawei DevEco Studio** y carga la carpeta `watch_fit3_app/`.
2. Habilita la firma de depuración automática en `File > Project Structure > Signing Configs`.
3. Compila el paquete `.hap` en `Build > Build Hap(s)`.
4. Transfiere el `.hap` al reloj mediante la herramienta de depuración de Huawei Salud.

### 2. Despliegue del Puente Android
1. Abre **Android Studio** y carga la carpeta `android_bridge/`.
2. Sincroniza Gradle para descargar el SDK de `com.huawei.hms:wearengine`.
3. Instala la APK en tu teléfono Android vinculado al Watch Fit 3.
4. Ingresa la IP de la laptop mostrada en la terminal y pulsa **Conectar**.

---

## 🔒 Consideraciones de Red y Firewall
- Asegúrate de que tanto la laptop como el teléfono estén conectados a la **misma red Wi-Fi**.
- Si el teléfono no conecta, permite el puerto `8000` en el Firewall de Windows:
  ```powershell
  netsh advfirewall firewall add rule name="Teleprompter PPT" dir=in action=allow protocol=TCP localport=8000
  ```
