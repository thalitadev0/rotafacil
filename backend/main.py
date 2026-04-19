from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, funcionarios, rotas

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RotaFácil API",
    description="Sistema de otimização de rotas de transporte de funcionários",
    version="1.0.0"
)

# CORS — permite o frontend React acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas
app.include_router(auth.router)
app.include_router(funcionarios.router)
app.include_router(rotas.router)

@app.get("/")
def root():
    return {
        "sistema": "RotaFácil",
        "versao": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }
