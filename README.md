# 🚌 RotaFácil

Sistema SaaS de gestão e otimização de rotas de transporte de funcionários.

## ✨ Funcionalidades

- **Multi-empresa** — cada empresa tem seus próprios dados
- **Otimização automática** por bairro e proximidade geográfica
- **Turnos** — manhã, comercial, tarde e noite
- **Mapa interativo** com a rota completa
- **Localização em tempo real** do ônibus via WebSocket
- **Check-in** de funcionários por matrícula/QR Code
- **Página do funcionário** — consulta rota pelo celular sem login
- **Importação CSV** de funcionários em massa

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| Banco | PostgreSQL |
| Mapas | Leaflet.js + OpenStreetMap |
| Tempo real | WebSockets |
| Auth | JWT |

## ⚙️ Instalação

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edite o .env com suas configurações
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse:
- **Sistema gestor:** http://localhost:3000
- **Página funcionário:** http://localhost:3000/minha-rota
- **API Docs:** http://localhost:8000/docs

## 👤 Autora

**Thalita Santana Cruz da Silva**
- 📧 santanathwlita@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/thalitasantanacruz/)
- 🐙 [GitHub](https://github.com/thalitadev0)
