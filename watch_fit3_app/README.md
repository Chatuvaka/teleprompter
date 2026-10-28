# App Huawei Watch Fit 3 - Teleprompter & PowerPoint Remote

Esta carpeta contiene el proyecto oficial para **Huawei Watch Fit 3** desarrollado en **ArkUI-JS (HarmonyOS Lite Wearable)** con resolución nativa de **402 x 480 píxeles**.

---

## 🛠️ Herramientas Necesarias
1. **Huawei DevEco Studio** (versión 3.1 o 4.0+ con soporte para Lite Wearable).
2. **HarmonyOS SDK (JS / Lite Wearable)** instalado desde el SDK Manager de DevEco Studio.
3. Huawei ID de Desarrollador para firma de depuración (Debug Signing).

---

## 📥 Pasos para Abrir y Compilar en DevEco Studio

### 1. Abrir el Proyecto
1. Inicia **DevEco Studio**.
2. Selecciona **Open Project** y navega hasta la carpeta:
   `c:\Users\chatu\teleprompter\watch_fit3_app`
3. DevEco Studio sincronizará el archivo `config.json` y estructurará el árbol de archivos.

### 2. Configurar la Firma Automática (Debug Signing)
1. Ve a **File** -> **Project Structure** -> **Project** -> **Signing Configs**.
2. Marca la casilla **Automatically generate signature**.
3. Inicia sesión con tu cuenta Huawei ID cuando el asistente lo solicite. DevEco generará el certificado y perfil de depuración.

### 3. Ejecutar en el Simulador de DevEco Studio
1. Ve a **Tools** -> **Device Manager**.
2. En la pestaña **Local Emulator**, crea o inicia un emulador de tipo **Lite Wearable**.
3. Haz clic en el botón verde **Run** (`Shift + F10`) para desplegar la app en el emulador.

### 4. Instalar en el Huawei Watch Fit 3 Físico
1. Conecta tu teléfono Android (vinculado al Watch Fit 3 mediante Huawei Salud) por cable USB a la laptop con la depuración USB habilitada.
2. En DevEco Studio, ve a **Build** -> **Build Hap(s) / APP(s)** -> **Build Hap(s)**.
3. El paquete `.hap` compilado se generará en:
   `watch_fit3_app/build/outputs/hap/debug/entry-debug-lite.hap`
4. Puedes transferir e instalar el paquete `.hap` en el reloj a través de la herramienta de depuración en la app Huawei Salud en modo desarrollador.

---

## 💡 Pruebas Inmediatas sin DevEco Studio
Recuerda que no requieres compilar en el reloj para validar tu presentación:
- El **Simulador Web (PWA)** incluido en el servidor emula pixel por pixel la pantalla AMOLED de 402x480 del Huawei Watch Fit 3 con soporte táctil, feedback de vibración y teleprompter sincronizado.
