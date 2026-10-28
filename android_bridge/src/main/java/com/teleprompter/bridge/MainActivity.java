package com.teleprompter.bridge;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "TeleprompterBridge";

    private EditText editServerIp;
    private Button btnConnect;
    private TextView txtWsStatus;
    private TextView txtWatchStatus;
    private TextView txtCurrentSlide;
    private TextView txtNotesPreview;

    private OkHttpClient httpClient;
    private WebSocket webSocket;
    private WearEngineManager wearEngineManager;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        editServerIp = findViewById(R.id.editServerIp);
        btnConnect = findViewById(R.id.btnConnect);
        txtWsStatus = findViewById(R.id.txtWsStatus);
        txtWatchStatus = findViewById(R.id.txtWatchStatus);
        txtCurrentSlide = findViewById(R.id.txtCurrentSlide);
        txtNotesPreview = findViewById(R.id.txtNotesPreview);

        httpClient = new OkHttpClient.Builder().build();
        wearEngineManager = new WearEngineManager(this);

        // Inicializar enlace Huawei Wear Engine con el Watch Fit 3
        initWearEngine();

        // Escuchar comandos del Huawei Watch Fit 3 y retransmitir a la Laptop por WebSocket
        wearEngineManager.setCommandListener(commandJson -> {
            Log.d(TAG, "Retransmitiendo comando de reloj a laptop: " + commandJson);
            if (webSocket != null) {
                webSocket.send(commandJson);
            }
        });

        btnConnect.setOnClickListener(v -> {
            String ip = editServerIp.getText().toString().trim();
            if (ip.isEmpty()) {
                Toast.makeText(this, "Ingresa la IP de la Laptop", Toast.LENGTH_SHORT).show();
                return;
            }
            connectToLaptop(ip);
        });
    }

    private void initWearEngine() {
        txtWatchStatus.setText("Buscando Huawei Watch Fit 3...");
        wearEngineManager.initWearEngine(
            () -> mainHandler.post(() -> txtWatchStatus.setText("Watch Fit 3 Conectado (Bluetooth P2P)")),
            () -> mainHandler.post(() -> txtWatchStatus.setText("No conectado al Reloj (Usando solo Wi-Fi)"))
        );
    }

    private void connectToLaptop(String ip) {
        String wsUrl = "ws://" + ip + ":8000/ws";
        txtWsStatus.setText("Conectando a " + wsUrl + "...");

        Request request = new Request.Builder().url(wsUrl).build();
        if (webSocket != null) {
            webSocket.close(1000, "Nueva conexion");
        }

        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                mainHandler.post(() -> {
                    txtWsStatus.setText("Conectado a Laptop Windows");
                    btnConnect.setText("Reconectar");
                });
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                Log.d(TAG, "Payload recibido de Laptop: " + text);
                mainHandler.post(() -> {
                    // Retransmitir al Huawei Watch Fit 3 vía Wear Engine
                    if (wearEngineManager != null) {
                        wearEngineManager.sendToWatch(text);
                    }
                    txtNotesPreview.setText(text);
                });
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                mainHandler.post(() -> {
                    txtWsStatus.setText("Fallo conexion: " + t.getMessage());
                });
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                mainHandler.post(() -> {
                    txtWsStatus.setText("Desconectado de la Laptop");
                });
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webSocket != null) {
            webSocket.close(1000, "App cerrada");
        }
    }
}
