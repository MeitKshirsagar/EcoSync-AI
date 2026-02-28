"""
Eco-Sync AI — SQLModel Database Layer.

Provides async SQLite persistence for analysis runs, strategies, and pipeline history.
Uses SQLModel and SQLAlchemy's async engine for ORM operations.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from sqlmodel import SQLModel, Field, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DB_PATH = Path(__file__).parent / "data" / "ecosync.db"
# Ensure data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

sqlite_url = f"sqlite+aiosqlite:///{DB_PATH}"

# Create async engine
engine = create_async_engine(sqlite_url, echo=False)

# Create session maker
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Models ───────────────────────────────────────────────────────────────────

class AnalysisRun(SQLModel, table=True):
    __tablename__ = "analysis_runs"
    id: Optional[int] = Field(default=None, primary_key=True)
    agent: str
    result_json: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class PipelineRun(SQLModel, table=True):
    __tablename__ = "pipeline_runs"
    id: Optional[int] = Field(default=None, primary_key=True)
    stages_json: str
    duration_ms: int
    status: str = Field(default="complete")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class StrategyRow(SQLModel, table=True):
    __tablename__ = "strategies"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    data_json: str
    vikor_score: float
    rank: int
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Trade(SQLModel, table=True):
    __tablename__ = "trades"
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str
    quantity: int
    type: str  # 'BUY' or 'SELL'
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AuditSnapshot(SQLModel, table=True):
    __tablename__ = "audit_snapshots"
    id: Optional[int] = Field(default=None, primary_key=True)
    domain: str
    score: int
    data_json: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ── Session Dependency ─────────────────────────────────────────────────────────

async def get_db_session():
    """FastAPI dependency for yielding DB sessions."""
    async with async_session() as session:
        yield session

# ── Database Operations ────────────────────────────────────────────────────────

async def init_db():
    """Create tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def save_analysis_run(agent: str, result: dict):
    """Save an analysis run result to the database."""
    async with async_session() as session:
        run = AnalysisRun(
            agent=agent,
            result_json=json.dumps(result)
        )
        session.add(run)
        await session.commit()


async def save_pipeline_run(stages: list[dict], duration_ms: int, status: str = "complete"):
    """Save a pipeline execution record."""
    async with async_session() as session:
        run = PipelineRun(
            stages_json=json.dumps(stages),
            duration_ms=duration_ms,
            status=status
        )
        session.add(run)
        await session.commit()


async def save_strategies(strategies: list[dict]):
    """Save ranked strategies to the database."""
    async with async_session() as session:
        for s in strategies:
            row = StrategyRow(
                name=s.get("name", "Unknown"),
                data_json=json.dumps(s),
                vikor_score=s.get("vikor_score", 0.0),
                rank=s.get("rank", 999)
            )
            session.add(row)
        await session.commit()


async def get_recent_runs(agent: Optional[str] = None, limit: int = 10) -> list[dict]:
    """Fetch recent analysis runs, optionally filtered by agent."""
    async with async_session() as session:
        stmt = select(AnalysisRun).order_by(AnalysisRun.created_at.desc()).limit(limit)
        if agent:
            stmt = stmt.where(AnalysisRun.agent == agent)
            
        result = await session.execute(stmt)
        runs = result.scalars().all()
        
        return [
            {
                "id": run.id,
                "agent": run.agent,
                "result": json.loads(run.result_json),
                "created_at": run.created_at,
            }
            for run in runs
        ]
