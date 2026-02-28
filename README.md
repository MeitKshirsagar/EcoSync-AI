# 🌿 Eco-Sync Prototype

**Enterprise Resilience Engine for the Indian Market**

Eco-Sync is a transparent dashboard that analyzes Indian market data, ranks business strategies, and validates financial health — all with full accountability.

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────┐
│   React UI  │────▶│  FastAPI Backend (port 8000)             │
│  (Vite/TS)  │     │                                         │
│  port 5173  │     │  ┌──────────┐ ┌──────────┐              │
└─────────────┘     │  │ Analyst  │ │ Auditor  │              │
                    │  │ Module   │ │ Module   │              │
                    │  └──────────┘ └──────────┘              │
                    │  ┌──────────┐ ┌──────────┐              │
                    │  │ Jurist   │ │ Controller│             │
                    │  │ Module   │ │ Module   │              │
                    │  └──────────┘ └──────────┘              │
                    │                    │                     │
                    │               SQLite DB                  │
                    └─────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (full stack)
```bash
docker compose up --build
```
Frontend → `http://localhost:5173` · Backend API → `http://localhost:8000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pipeline/status` | Current pipeline stage statuses |
| POST | `/api/pipeline/run` | Start pipeline execution |
| POST | `/api/pipeline/reset` | Reset all stages |
| GET | `/api/strategies` | VIKOR-ranked strategies |
| GET | `/api/analyst/vecm` | VECM cointegration analysis |
| GET | `/api/analyst/promethee` | PROMETHEE II outranking |
| GET | `/api/auditor/focus` | FOCUS schema mapping |
| GET | `/api/controller/validate` | Unit economics validation |

## Modules

| Module | Role | 
|-------|------|
| **Analyst** | Market-inflation link detection | 
| **Auditor** | Financial category mapping | 
| **Jurist** | Strategy ranking | 
| **Controller** | Financial health validation | 

## Configuration

Environment variables (see `backend/config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ECOSYNC_DATA_SOURCE` | `mock` | `mock` or `live` |
| `ECOSYNC_CORS_ORIGINS` | `http://localhost:5173` | Comma-separated origins |
| `ECOSYNC_DB_PATH` | `data/ecosync.db` | SQLite database path |

## Testing

```bash
cd backend
pip install pytest
pytest tests/ -v
```

## Tech Stack

**Backend:** FastAPI · Python 3.11 · SQLite (aiosqlite) · statsmodels · pymcdm  
**Frontend:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide icons  
**DevOps:** Docker · nginx · docker-compose
