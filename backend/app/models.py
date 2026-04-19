from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class TurnoEnum(str, enum.Enum):
    manha = "manha"
    comercial = "comercial"
    tarde = "tarde"
    noite = "noite"

class StatusOnibusEnum(str, enum.Enum):
    ativo = "ativo"
    em_rota = "em_rota"
    inativo = "inativo"

# ─── EMPRESA ───────────────────────────────────────────────
class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cnpj = Column(String, unique=True, nullable=False)
    endereco = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    email = Column(String, unique=True, nullable=False)
    telefone = Column(String)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    usuarios = relationship("Usuario", back_populates="empresa")
    funcionarios = relationship("Funcionario", back_populates="empresa")
    onibus = relationship("Onibus", back_populates="empresa")
    rotas = relationship("Rota", back_populates="empresa")

# ─── USUÁRIO (GESTOR) ───────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    is_admin = Column(Boolean, default=False)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    empresa = relationship("Empresa", back_populates="usuarios")

# ─── FUNCIONÁRIO ───────────────────────────────────────────
class Funcionario(Base):
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    matricula = Column(String, unique=True, nullable=False)
    telefone = Column(String)
    email = Column(String)
    endereco = Column(String, nullable=False)
    bairro = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    turno = Column(Enum(TurnoEnum), nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    rota_id = Column(Integer, ForeignKey("rotas.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    empresa = relationship("Empresa", back_populates="funcionarios")
    rota = relationship("Rota", back_populates="funcionarios")
    embarques = relationship("Embarque", back_populates="funcionario")

# ─── ÔNIBUS ────────────────────────────────────────────────
class Onibus(Base):
    __tablename__ = "onibus"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, nullable=False)
    modelo = Column(String)
    capacidade = Column(Integer, default=32)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    motorista_nome = Column(String)
    motorista_telefone = Column(String)
    status = Column(Enum(StatusOnibusEnum), default=StatusOnibusEnum.ativo)
    latitude_atual = Column(Float, nullable=True)
    longitude_atual = Column(Float, nullable=True)
    atualizado_em = Column(DateTime, nullable=True)
    ativo = Column(Boolean, default=True)

    empresa = relationship("Empresa", back_populates="onibus")
    rotas = relationship("Rota", back_populates="onibus")

# ─── ROTA ──────────────────────────────────────────────────
class Rota(Base):
    __tablename__ = "rotas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    turno = Column(Enum(TurnoEnum), nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    onibus_id = Column(Integer, ForeignKey("onibus.id"), nullable=True)
    pontos_json = Column(String)  # JSON com lista de coordenadas
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    empresa = relationship("Empresa", back_populates="rotas")
    onibus = relationship("Onibus", back_populates="rotas")
    funcionarios = relationship("Funcionario", back_populates="rota")
    embarques = relationship("Embarque", back_populates="rota")

# ─── EMBARQUE (CHECK-IN) ───────────────────────────────────
class Embarque(Base):
    __tablename__ = "embarques"

    id = Column(Integer, primary_key=True, index=True)
    funcionario_id = Column(Integer, ForeignKey("funcionarios.id"), nullable=False)
    rota_id = Column(Integer, ForeignKey("rotas.id"), nullable=False)
    data_hora = Column(DateTime, server_default=func.now())

    funcionario = relationship("Funcionario", back_populates="embarques")
    rota = relationship("Rota", back_populates="embarques")
