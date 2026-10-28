package com.teleprompter.bridge;

import android.content.Context;
import android.util.Log;
import com.huawei.wearengine.HiWear;
import com.huawei.wearengine.client.DeviceClient;
import com.huawei.wearengine.client.P2pClient;
import com.huawei.wearengine.device.Device;
import com.huawei.wearengine.p2p.Message;
import com.huawei.wearengine.p2p.P2pCallback;
import com.huawei.wearengine.p2p.Receiver;
import com.huawei.wearengine.p2p.SendCallback;

import java.nio.charset.StandardCharsets;
import java.util.List;

public class WearEngineManager {
    private static final String TAG = "WearEngineManager";
    public static final String WATCH_PACKAGE_NAME = "com.teleprompter.fit3";
    public static final String WATCH_FINGERPRINT = "teleprompter_key_fingerprint";

    private final Context context;
    private final DeviceClient deviceClient;
    private final P2pClient p2pClient;
    private Device connectedWatch = null;
    private OnWatchCommandListener commandListener;

    public interface OnWatchCommandListener {
        void onCommandReceived(String commandJson);
    }

    public WearEngineManager(Context context) {
        this.context = context;
        this.deviceClient = HiWear.getDeviceClient(context);
        this.p2pClient = HiWear.getP2pClient(context);
    }

    public void setCommandListener(OnWatchCommandListener listener) {
        this.commandListener = listener;
    }

    /**
     * Busca dispositivos Huawei vinculados (Watch Fit 3) y establece el canal P2P
     */
    public void initWearEngine(Runnable onSuccess, Runnable onError) {
        p2pClient.setPeerPkgName(WATCH_PACKAGE_NAME);
        p2pClient.setPeerFingerPrint(WATCH_FINGERPRINT);

        deviceClient.getBondedDevices().addOnSuccessListener(devices -> {
            if (devices != null && !devices.isEmpty()) {
                connectedWatch = devices.get(0);
                Log.i(TAG, "Dispositivo Huawei conectado: " + connectedWatch.getName());
                registerWatchReceiver();
                if (onSuccess != null) onSuccess.run();
            } else {
                Log.w(TAG, "No se encontraron relojes Huawei vinculados en Huawei Salud.");
                if (onError != null) onError.run();
            }
        }).addOnFailureListener(e -> {
            Log.e(TAG, "Fallo al consultar dispositivos Huawei: " + e.getMessage());
            if (onError != null) onError.run();
        });
    }

    /**
     * Registra el receptor para recibir pulsaciones y comandos desde el Watch Fit 3
     */
    private void registerWatchReceiver() {
        if (connectedWatch == null) return;

        Receiver receiver = message -> {
            if (message != null && message.getData() != null) {
                String payload = new String(message.getData(), StandardCharsets.UTF_8);
                Log.d(TAG, "[RELOJ -> TELEFONO] Comando recibido: " + payload);
                if (commandListener != null) {
                    commandListener.onCommandReceived(payload);
                }
            }
        };

        p2pClient.registerReceiver(connectedWatch, receiver).addOnSuccessListener(unused -> {
            Log.i(TAG, "Receptor de mensajes del reloj registrado correctamente.");
        }).addOnFailureListener(e -> {
            Log.e(TAG, "Error registrando receptor del reloj: " + e.getMessage());
        });
    }

    /**
     * Envía la nota de orador y el estado de diapositiva al Watch Fit 3 vía Bluetooth
     */
    public void sendToWatch(String jsonPayload) {
        if (connectedWatch == null) {
            Log.w(TAG, "No hay reloj Huawei conectado para enviar el payload.");
            return;
        }

        Message.Builder builder = new Message.Builder();
        builder.setPayload(jsonPayload.getBytes(StandardCharsets.UTF_8));
        Message message = builder.build();

        p2pClient.send(connectedWatch, message, new SendCallback() {
            @Override
            public void onSendResult(int resultCode) {
                Log.d(TAG, "[TELEFONO -> RELOJ] Envio exitoso. Codigo: " + resultCode);
            }

            @Override
            public void onSendProgress(long progress) {
            }
        });
    }

    public boolean isWatchConnected() {
        return connectedWatch != null;
    }
}
