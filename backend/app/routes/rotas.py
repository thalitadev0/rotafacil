from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
from app.database import get_db
from app.models import Rota, Onibus, Embarque, TurnoEnum, StatusOnibusEnum
from app.auth import get_usuario_atual
from app.services.rota_service import gerar_rotas_empresa

router = APIRouter(tags=["Rotas e Ônibus"])

# ─── WEBSOCKET MANAGER ─────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.connections: dict = {}

    async def connect(self, websocket: WebSocket, onibus_id: int):
        await websocket.accept()
        if onibus_id not in self.connections:
            self.connections[onibus_id] = []
        self.connections[onibus_id].append(websocket)

    def disconnect(self, websocket: WebSocket, onibus_id: int):
        if onibus_id in self.connections:
            self.connections[onibus_id].remove(websocket)

    async def broadcast(self, onibus_id: int, mensagem: dict):
        if onibus_id in self.connections:
            for ws in self.connections[onibus_id]:
                await ws.send_json(mensagem)

manager = ConnectionManager()

# ─── ÔNIBUS ────────────────────────────────────────────────
class OnibusCreate(BaseModel):
    placa: str
    modelo: Optional[str] = None
    capacidade: int = 32
    motorista_nome: Optional[str] = None
    motorista_telefone: Optional[str] = None

@router.get("/api/onibus")
def listar_onibus(usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    onibus = db.query(Onibus).filter(
        Onibus.empresa_id == usuario.empresa_id,
        Onibus.ativo == True
    ).all()
    return [{"id": o.id, "placa": o.placa, "modelo": o.modelo, "capacidade": o.capacidade,
             "motorista": o.motorista_nome, "status": o.status,
             "lat": o.latitude_atual, "lon": o.longitude_atual} for o in onibus]

@router.post("/api/onibus", status_code=201)
def criar_onibus(dados: OnibusCreate, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    if db.query(Onibus).filter(Onibus.placa == dados.placa).first():
        raise HTTPException(status_code=400, detail="Placa já cadastrada.")
    onibus = Onibus(**dados.model_dump(), empresa_id=usuario.empresa_id)
    db.add(onibus)
    db.commit()
    db.refresh(onibus)
    return {"mensagem": "Ônibus cadastrado!", "id": onibus.id}

@router.delete("/api/onibus/{id}")
def deletar_onibus(id: int, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    onibus = db.query(Onibus).filter(Onibus.id == id, Onibus.empresa_id == usuario.empresa_id).first()
    if not onibus:
        raise HTTPException(status_code=404, detail="Ônibus não encontrado.")
    onibus.ativo = False
    db.commit()
    return {"mensagem": "Ônibus removido!"}

# ─── ROTAS ─────────────────────────────────────────────────
@router.post("/api/rotas/gerar")
def gerar_rotas(turno: TurnoEnum, capacidade: int = 32,
                usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    """Gera as rotas otimizadas por bairro e proximidade."""
    try:
        rotas = gerar_rotas_empresa(db, usuario.empresa_id, turno, capacidade)
        return {"mensagem": f"{len(rotas)} rotas geradas!", "rotas": rotas}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/rotas")
def listar_rotas(turno: Optional[str] = None, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    query = db.query(Rota).filter(Rota.empresa_id == usuario.empresa_id, Rota.ativa == True)
    if turno:
        query = query.filter(Rota.turno == turno)
    rotas = query.all()
    return [{
        "id": r.id, "nome": r.nome, "turno": r.turno,
        "total_funcionarios": len(r.funcionarios),
        "onibus_placa": r.onibus.placa if r.onibus else None,
        "pontos": json.loads(r.pontos_json) if r.pontos_json else []
    } for r in rotas]

@router.get("/api/rotas/{id}")
def detalhe_rota(id: int, db: Session = Depends(get_db)):
    rota = db.query(Rota).filter(Rota.id == id).first()
    if not rota:
        raise HTTPException(status_code=404, detail="Rota não encontrada.")
    return {
        "id": rota.id, "nome": rota.nome, "turno": rota.turno,
        "pontos": json.loads(rota.pontos_json) if rota.pontos_json else [],
        "funcionarios": [{"id": f.id, "nome": f.nome, "bairro": f.bairro,
                          "lat": f.latitude, "lon": f.longitude} for f in rota.funcionarios],
        "onibus": {"placa": rota.onibus.placa, "motorista": rota.onibus.motorista_nome,
                   "lat": rota.onibus.latitude_atual, "lon": rota.onibus.longitude_atual} if rota.onibus else None
    }

# ─── LOCALIZAÇÃO EM TEMPO REAL ─────────────────────────────
class LocalizacaoUpdate(BaseModel):
    latitude: float
    longitude: float

@router.put("/api/onibus/{id}/localizacao")
def atualizar_localizacao(id: int, dados: LocalizacaoUpdate, db: Session = Depends(get_db)):
    """Motorista atualiza localização do ônibus."""
    onibus = db.query(Onibus).filter(Onibus.id == id).first()
    if not onibus:
        raise HTTPException(status_code=404, detail="Ônibus não encontrado.")
    onibus.latitude_atual = dados.latitude
    onibus.longitude_atual = dados.longitude
    onibus.atualizado_em = datetime.utcnow()
    onibus.status = StatusOnibusEnum.em_rota
    db.commit()
    return {"mensagem": "Localização atualizada!"}

@router.websocket("/ws/onibus/{onibus_id}")
async def websocket_localizacao(websocket: WebSocket, onibus_id: int, db: Session = Depends(get_db)):
    """WebSocket para localização em tempo real do ônibus."""
    await manager.connect(websocket, onibus_id)
    try:
        while True:
            dados = await websocket.receive_json()
            onibus = db.query(Onibus).filter(Onibus.id == onibus_id).first()
            if onibus:
                onibus.latitude_atual = dados["latitude"]
                onibus.longitude_atual = dados["longitude"]
                onibus.atualizado_em = datetime.utcnow()
                db.commit()
                await manager.broadcast(onibus_id, {
                    "onibus_id": onibus_id,
                    "latitude": dados["latitude"],
                    "longitude": dados["longitude"],
                    "timestamp": datetime.utcnow().isoformat()
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, onibus_id)

# ─── CHECK-IN ──────────────────────────────────────────────
@router.post("/api/checkin/{matricula}")
def checkin(matricula: str, rota_id: int, db: Session = Depends(get_db)):
    """Registra embarque do funcionário via matrícula/QR Code."""
    from app.models import Funcionario
    func = db.query(Funcionario).filter(Funcionario.matricula == matricula).first()
    if not func:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

    embarque = Embarque(funcionario_id=func.id, rota_id=rota_id)
    db.add(embarque)
    db.commit()
    return {"mensagem": f"Check-in de {func.nome} registrado!", "funcionario": func.nome}

@router.get("/api/rotas/{rota_id}/embarques")
def listar_embarques(rota_id: int, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    """Lista os embarques de uma rota no dia."""
    from datetime import date
    embarques = db.query(Embarque).filter(
        Embarque.rota_id == rota_id
    ).all()
    return [{
        "funcionario": e.funcionario.nome,
        "matricula": e.funcionario.matricula,
        "horario": e.data_hora.strftime("%H:%M")
    } for e in embarques]

# ─── FUNCIONÁRIO VER SUA ROTA ──────────────────────────────
@router.get("/api/minha-rota/{matricula}")
def minha_rota(matricula: str, db: Session = Depends(get_db)):
    """Funcionário consulta sua rota pelo número de matrícula."""
    from app.models import Funcionario
    func = db.query(Funcionario).filter(
        Funcionario.matricula == matricula,
        Funcionario.ativo == True
    ).first()
    if not func or not func.rota_id:
        raise HTTPException(status_code=404, detail="Funcionário ou rota não encontrada.")

    rota = func.rota
    return {
        "funcionario": func.nome,
        "turno": func.turno,
        "rota_nome": rota.nome,
        "onibus": {
            "placa": rota.onibus.placa if rota.onibus else None,
            "motorista": rota.onibus.motorista_nome if rota.onibus else None,
            "lat_atual": rota.onibus.latitude_atual if rota.onibus else None,
            "lon_atual": rota.onibus.longitude_atual if rota.onibus else None,
        } if rota.onibus else None,
        "pontos": json.loads(rota.pontos_json) if rota.pontos_json else []
    }
