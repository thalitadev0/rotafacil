from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import Funcionario, TurnoEnum
from app.auth import get_usuario_atual
from app.services.rota_service import geocodificar_endereco

router = APIRouter(prefix="/api/funcionarios", tags=["Funcionários"])

class FuncionarioCreate(BaseModel):
    nome: str
    matricula: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: str
    bairro: str
    turno: TurnoEnum

class FuncionarioResponse(BaseModel):
    id: int
    nome: str
    matricula: str
    telefone: Optional[str]
    email: Optional[str]
    endereco: str
    bairro: str
    turno: str
    latitude: Optional[float]
    longitude: Optional[float]
    rota_id: Optional[int]
    ativo: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[FuncionarioResponse])
def listar(turno: Optional[str] = None, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    query = db.query(Funcionario).filter(
        Funcionario.empresa_id == usuario.empresa_id,
        Funcionario.ativo == True
    )
    if turno:
        query = query.filter(Funcionario.turno == turno)
    return query.all()

@router.post("/", status_code=201)
def criar(dados: FuncionarioCreate, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    if db.query(Funcionario).filter(Funcionario.matricula == dados.matricula).first():
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada.")

    # Geocodifica o endereço automaticamente
    lat, lon = geocodificar_endereco(f"{dados.endereco}, {dados.bairro}")

    funcionario = Funcionario(
        **dados.model_dump(),
        empresa_id=usuario.empresa_id,
        latitude=lat,
        longitude=lon
    )
    db.add(funcionario)
    db.commit()
    db.refresh(funcionario)
    return {"mensagem": "Funcionário cadastrado!", "id": funcionario.id}

@router.put("/{id}")
def atualizar(id: int, dados: FuncionarioCreate, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    func = db.query(Funcionario).filter(
        Funcionario.id == id,
        Funcionario.empresa_id == usuario.empresa_id
    ).first()
    if not func:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

    for campo, valor in dados.model_dump().items():
        setattr(func, campo, valor)

    # Recalcula coordenadas se endereço mudou
    lat, lon = geocodificar_endereco(f"{dados.endereco}, {dados.bairro}")
    func.latitude = lat
    func.longitude = lon

    db.commit()
    return {"mensagem": "Funcionário atualizado!"}

@router.delete("/{id}")
def deletar(id: int, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    func = db.query(Funcionario).filter(
        Funcionario.id == id,
        Funcionario.empresa_id == usuario.empresa_id
    ).first()
    if not func:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
    func.ativo = False
    db.commit()
    return {"mensagem": "Funcionário removido!"}

@router.post("/importar-csv")
async def importar_csv(arquivo, usuario=Depends(get_usuario_atual), db: Session = Depends(get_db)):
    """Importa funcionários via CSV."""
    import pandas as pd
    import io

    conteudo = await arquivo.read()
    df = pd.read_csv(io.StringIO(conteudo.decode("utf-8")))

    colunas = ['nome', 'matricula', 'telefone', 'endereco', 'bairro', 'turno']
    for col in colunas:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Coluna '{col}' não encontrada no CSV.")

    inseridos = 0
    for _, row in df.iterrows():
        if db.query(Funcionario).filter(Funcionario.matricula == str(row['matricula'])).first():
            continue
        lat, lon = geocodificar_endereco(f"{row['endereco']}, {row['bairro']}")
        func = Funcionario(
            nome=row['nome'],
            matricula=str(row['matricula']),
            telefone=str(row.get('telefone', '')),
            endereco=row['endereco'],
            bairro=row['bairro'],
            turno=row['turno'],
            empresa_id=usuario.empresa_id,
            latitude=lat,
            longitude=lon
        )
        db.add(func)
        inseridos += 1

    db.commit()
    return {"mensagem": f"{inseridos} funcionários importados com sucesso!"}
