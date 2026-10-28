# Android Bridge - Huawei Watch Fit 3 & PowerPoint Remote

Este módulo actúa como el **Nodo 2 (Puente)** entre la Laptop con Windows y el Smartwatch Huawei Watch Fit 3:
1. Se conecta mediante **WebSocket sobre Wi-Fi** a la Laptop (`ws://<IP_LAPTOP>:8000/ws`).
2. Retransmite las notas del orador y el estado de la presentación al **Huawei Watch Fit 3** mediante **Bluetooth P2P** usando el SDK oficial **Huawei Wear Engine**.
3. Recibe los comandos táctiles o de la corona desde el reloj y los reenvía inmediatamente a la laptop para cambiar de diapositiva en tiempo real.

---

## 🚀 Requisitos y Configuración de Huawei Wear Engine

### 1. Repositorio Maven de Huawei
Para compilar con el SDK oficial de Wear Engine, añade el repositorio Maven de Huawei en el archivo raíz `settings.gradle` o `build.gradle` del proyecto Android:

```groovy
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        // Repositorio de Huawei Developer
        maven { url 'https://developer.huawei.com/repo/' }
    }
}
```

### 2. Vinculación en Huawei Salud
1. Asegúrate de que tu teléfono Android tenga instalado **Huawei Health (Salud)** y los **Huawei Mobile Services (HMS Core)**.
2. Vincula el **Huawei Watch Fit 3** mediante Bluetooth en la app Huawei Salud.
3. El `WearEngineManager` detectará automáticamente el reloj vinculado en la primera posición.

---

## 📲 Modo Alternativo: Simulador Web Inmediato (Sin compilar APK)
Si deseas probar todo el sistema sin compilar Android Studio ni usar el SDK nativo de Huawei:
1. Abre la cámara de tu teléfono Android o iPhone.
2. Escanea el **Código QR** generado en la terminal de la laptop al ejecutar `run.bat`.
3. Tu navegador móvil abrirá la interfaz del simulador con las dimensiones idénticas del **Huawei Watch Fit 3 (402x480)**, pantalla AMOLED, vibración táctil háptica y teleprompter sincronizado.
