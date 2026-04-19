from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import Usuario, Empresa
from app.auth import hash_senha, verificar_senha, criar_token

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

class RegistroSchema(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    empresa_nome: str
    empresa_cnpj: str
    empresa_endereco: str
    empresa_latitude: float
    empresa_longitude: float
    empresa_telefone: str = None

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    usuario_nome: str
    empresa_id: int

@router.post("/registrar", status_code=201)
def registrar(dados: RegistroSchema, db: Session = Depends(get_db)):
    """Registra uma nova empresa e gestor administrador."""
    if db.query(Usuario).filter(Usuario.email == dados.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    if db.query(Empresa).filter(Empresa.cnpj == dados.empresa_cnpj).first():
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado.")

    empresa = Empresa(
        nome=dados.empresa_nome,
        cnpj=dados.empresa_cnpj,
        endereco=dados.empresa_endereco,
        latitude=dados.empresa_latitude,
        longitude=dados.empresa_longitude,
        email=dados.email,
        telefone=dados.empresa_telefone
    )
    db.add(empresa)
    db.flush()

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        empresa_id=empresa.id,
        is_admin=True
    )
    db.add(usuario)
    db.commit()

    return {"mensagem": "Empresa e gestor cadastrados com sucesso!"}

@router.post("/login", response_model=TokenSchema)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.email == form.username,
        Usuario.ativo == True
    ).first()

    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    token = criar_token({"sub": usuario.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario_nome": usuario.nome,
        "empresa_id": usuario.empresa_id
    }
