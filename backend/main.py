"""Eco-Sync AI — FastAPI Backend Entry Point."""

import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from agents.analyst import run_vecm_analysis
from agents.auditor import map_focus_schema
from agents.jurist import rank_strategies, promethee_outranking
from agents.controller import validate_unit_economics
from agents.macro_analyst import MacroAnalyst
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from data.mock_data import generate_cpi_data, generate_nse_data, get_mock_strategies
from database import init_db, save_analysis_run, save_pipeline_run, save_strategies, Trade, User, get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
import io
from datetime import timedelta
from config import config
import json
import os

macro_analyst = MacroAnalyst()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Eco-Sync AI",
    description="Multi-Agent Resilience Engine for the Indian Market",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pipeline State (mutable) ───────────────────────────────────────────────────
def _default_stages():
    return [
        {"id": "analyst",    "label": "Analyst",    "status": "pending"},
        {"id": "auditor",    "label": "Auditor",    "status": "pending"},
        {"id": "jurist",     "label": "Jurist",     "status": "pending"},
        {"id": "controller", "label": "Controller", "status": "pending"},
    ]

pipeline_state = {"stages": _default_stages(), "running": False}

@app.on_event("startup")
async def startup_event():
    # Reset pipeline on server startup to ensure a clean slate for the demo
    pipeline_state["stages"] = _default_stages()
    pipeline_state["running"] = False


def _set_stage(stage_id: str, status: str):
    for s in pipeline_state["stages"]:
        if s["id"] == stage_id:
            s["status"] = status
            break


# ── Health ──────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "eco-sync-ai", "version": "0.2.0"}


# ── Auth ────────────────────────────────────────────────────────────────────────
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: dict, db: AsyncSession = Depends(get_db_session)):
    email = user_data.get("email")
    password = user_data.get("password")
    full_name = user_data.get("full_name", "Eco-Sync User")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # Check existing
    result = await db.execute(select(User).where(User.email == email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=email,
        full_name=full_name,
        hashed_password=get_password_hash(password)
    )
    db.add(new_user)
    await db.commit()
    return {"message": "User created successfully"}


@app.post("/api/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "name": user.full_name}}


@app.get("/api/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "full_name": current_user.full_name}

# ── Pipeline Status ─────────────────────────────────────────────────────────────
@app.get("/api/pipeline/status")
async def pipeline_status(user: User = Depends(get_current_user)):
    return {"stages": pipeline_state["stages"], "running": pipeline_state["running"]}

# ── CSV Data Ingestion ──────────────────────────────────────────────────────────
@app.post("/api/upload/csv")
async def upload_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        # Basic validation: ensure we have at least some numerics
        if df.empty or len(df.columns) < 2:
            raise ValueError("CSV must contain data")
            
        record_count = len(df)
        columns = list(df.columns)
        
        # We could save this parsing result to a new 'company_data' table
        # For now, we'll return a success parsing report
        return {
            "message": "Data ingested successfully",
            "file": file.filename,
            "records_processed": record_count,
            "detected_columns": columns
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")


# ── Interactive Copilot ─────────────────────────────────────────────────────────
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def copilot_chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    msg = request.message.lower()
    
    # A simple local rule-based assistant to keep it free and instant
    if "why" in msg and "drop" in msg:
        reply = "Looking at your recent Multi-Domain Audit, your Human Capital score dipped by 12 points due to increased attrition in the Q3 datasets. I suggest reviewing the 'Retention Bonus' strategy."
    elif "strategy" in msg or "deploy" in msg:
        reply = "I currently recommend the 'Digital-First D2C' strategy. It has the highest VIKOR ranking (0.85) and passed 5/5 unit economic checks. Should I queue it for execution?"
    elif "status" in msg or "pipeline" in msg:
        reply = f"The current pipeline status is: {pipeline_state['running'] and 'Running' or 'Idle'}. All 4 agents are ready."
    else:
        reply = "I'm your Eco-Sync Copilot! I can analyze your recent audit drops, recommend strategies, or check pipeline status. What would you like to explore?"
        
    # Simulate a little "thinking" delay
    await asyncio.sleep(1.2)
    
    return {
        "reply": reply,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


async def _run_pipeline():
    """Execute all agents sequentially, updating stage status as each completes."""
    pipeline_state["running"] = True
    start_time = time.time()

    agents = [
        ("analyst",    lambda: run_vecm_analysis(generate_cpi_data(), generate_nse_data())),
        ("auditor",    lambda: map_focus_schema()),
        ("jurist",     lambda: rank_strategies(get_mock_strategies())),
        ("controller", lambda: [validate_unit_economics(s) for s in get_mock_strategies()]),
    ]

    for stage_id, agent_fn in agents:
        _set_stage(stage_id, "active")
        await asyncio.sleep(0.8)  # simulate processing time for visual feedback
        try:
            result = agent_fn()
            _set_stage(stage_id, "complete")
            await save_analysis_run(stage_id, result if isinstance(result, dict) else {"data": result})
        except Exception:
            _set_stage(stage_id, "error")

    pipeline_state["running"] = False
    duration_ms = int((time.time() - start_time) * 1000)
    await save_pipeline_run(pipeline_state["stages"], duration_ms)


@app.post("/api/pipeline/run")
async def run_pipeline(background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    if pipeline_state["running"]:
        return {"message": "Pipeline is already running", "running": True}
    # Reset all stages before running
    pipeline_state["stages"] = _default_stages()
    background_tasks.add_task(_run_pipeline)
    return {"message": "Pipeline started", "running": True}


@app.post("/api/pipeline/reset")
async def reset_pipeline():
    pipeline_state["stages"] = _default_stages()
    pipeline_state["running"] = False
    return {"message": "Pipeline reset", "running": False}


# ── Strategies (VIKOR-ranked) ────────────────────────────────────────────────────
@app.get("/api/strategies")
async def strategies(user: User = Depends(get_current_user)):
    raw = get_mock_strategies()
    ranked = rank_strategies(raw)
    await save_strategies(ranked)
    return {"strategies": ranked}


# ── Analyst: VECM preview ───────────────────────────────────────────────────────
@app.get("/api/analyst/vecm")
async def analyst_vecm():
    cpi = generate_cpi_data()
    nse = generate_nse_data()
    result = run_vecm_analysis(cpi, nse)
    await save_analysis_run("analyst", result)
    return result


# ── Analyst: PROMETHEE II outranking ────────────────────────────────────────────
@app.get("/api/analyst/promethee")
async def analyst_promethee():
    raw = get_mock_strategies()
    result = promethee_outranking(raw)
    return result


# ── Auditor: FOCUS schema ───────────────────────────────────────────────────────
@app.get("/api/auditor/focus")
async def auditor_focus():
    result = map_focus_schema()
    return result


# ── Controller: Unit economics ──────────────────────────────────────────────────
@app.get("/api/controller/validate")
async def controller_validate():
    raw = get_mock_strategies()
    results = [validate_unit_economics(s) for s in raw]
    return {"validations": results}
# ── News Feed ───────────────────────────────────────────────────────────────────
@app.get("/api/news")
async def get_news():
    return {"feed": macro_analyst.get_live_news()}


# ── Archestra Trades (via SQLite Data Layer) ────────────────────────────────────
@app.get("/api/trades")
async def get_trades(
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user)
):
    # Only return trades for the current user
    result = await db.execute(
        select(Trade).where(Trade.user_id == user.id).order_by(Trade.timestamp.desc())
    )
    trades = result.scalars().all()
    # Serialize securely
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "quantity": t.quantity,
            "type": t.type,
            "timestamp": t.timestamp
        }
        for t in trades
    ]


@app.post("/api/trades")
async def post_trade(
    trade: dict, 
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user)
):
    new_trade = Trade(
        symbol=trade.get("symbol", "UNKNOWN"),
        quantity=trade.get("quantity", 0),
        type=trade.get("type", "BUY"),
        user_id=user.id,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )
    db.add(new_trade)
    await db.commit()
    await db.refresh(new_trade)
    
    return {
        "status": "ok", 
        "trade": {
            "id": new_trade.id,
            "symbol": new_trade.symbol,
            "quantity": new_trade.quantity,
            "type": new_trade.type,
            "timestamp": new_trade.timestamp
        }
    }
