import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import sys

# Directorios de trabajo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ppt_controller import PowerPointController
from qr_util import get_lan_ip, print_terminal_qr
WEB_SIMULATOR_DIR = os.path.join(os.path.dirname(BASE_DIR), "web_simulator")

# Instancia del controlador de PowerPoint
ppt = PowerPointController()

# Gestor de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Nuevo cliente conectado. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Cliente desconectado. Restantes: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Difunde el estado a todos los teléfonos/simuladores conectados."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WS] Error enviando a cliente: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# Contexto Lifespan para inicio y apagado
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al arrancar el servidor:
    lan_ip = get_lan_ip()
    port = int(os.environ.get("PORT", 8000))
    server_url = f"http://{lan_ip}:{port}"

    # Imprimir QR en terminal y banner informativo
    print_terminal_qr(server_url)

    yield
    print("\n[INFO] Servidor detenido.")

app = FastAPI(
    title="Huawei Watch Fit 3 - Teleprompter Server",
    description="Servidor local para sincronización de notas de orador de PowerPoint y control remoto háptico",
    version="1.0.0",
    lifespan=lifespan
)

# CORS habilitado para simuladores y aplicaciones externas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de API REST
@app.get("/api/status")
async def get_status():
    """Retorna el estado actual de la diapositiva y las notas de orador."""
    return ppt.get_status()

@app.post("/api/next")
async def next_slide():
    """Avanza a la siguiente diapositiva y notifica por broadcast."""
    status = ppt.next_slide()
    await manager.broadcast(status)
    return status

@app.post("/api/prev")
async def prev_slide():
    """Retrocede a la diapositiva anterior y notifica por broadcast."""
    status = ppt.prev_slide()
    await manager.broadcast(status)
    return status

@app.post("/api/goto/{slide_num}")
async def goto_slide(slide_num: int):
    """Salta a una diapositiva específica."""
    status = ppt.goto_slide(slide_num)
    await manager.broadcast(status)
    return status

@app.post("/api/start")
async def start_presentation():
    """Inicia la presentación en pantalla completa."""
    status = ppt.start_presentation()
    await manager.broadcast(status)
    return status

@app.post("/api/exit")
async def exit_presentation():
    """Sale de la presentación en pantalla completa."""
    status = ppt.exit_presentation()
    await manager.broadcast(status)
    return status

# WebSocket bidireccional de baja latencia
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Enviar estado inicial nada más conectar
        initial_status = ppt.get_status()
        await websocket.send_json(initial_status)

        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                action = data.get("action", "").upper()
            except Exception:
                action = data_text.strip().upper()
                data = {}

            print(f"[WS RECV] Acción recibida: {action}")

            new_status = None
            if action in ["NEXT", "NEXT_SLIDE"]:
                new_status = ppt.next_slide()
            elif action in ["PREV", "PREV_SLIDE"]:
                new_status = ppt.prev_slide()
            elif action in ["START", "START_PRESENTATION"]:
                new_status = ppt.start_presentation()
            elif action in ["EXIT", "EXIT_PRESENTATION"]:
                new_status = ppt.exit_presentation()
            elif action in ["GOTO", "GOTO_SLIDE"]:
                slide_num = int(data.get("slide", 1))
                new_status = ppt.goto_slide(slide_num)
            elif action in ["GET_STATUS", "SYNC"]:
                new_status = ppt.get_status()
            else:
                new_status = ppt.get_status()

            # Difundir el nuevo estado a todos los clientes conectados
            if new_status:
                await manager.broadcast(new_status)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS ERROR] {e}")
        manager.disconnect(websocket)

# Montar simulador web si existe la carpeta
if os.path.exists(WEB_SIMULATOR_DIR):
    app.mount("/static", StaticFiles(directory=WEB_SIMULATOR_DIR), name="static")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(WEB_SIMULATOR_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse({"message": "Simulador Web disponible en /static"})

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
