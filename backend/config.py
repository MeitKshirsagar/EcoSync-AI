"""
Eco-Sync AI — Application Configuration.

Environment-based configuration using pydantic-settings.
Supports switching between mock and live data sources.
"""

from __future__ import annotations

import os


class Config:
    """Simple configuration loaded from environment variables."""

    DATA_SOURCE: str = os.getenv("ECOSYNC_DATA_SOURCE", "mock")  # "mock" or "live"
    RBI_API_KEY: str = os.getenv("ECOSYNC_RBI_API_KEY", "")
    NSE_API_KEY: str = os.getenv("ECOSYNC_NSE_API_KEY", "")
    DB_PATH: str = os.getenv("ECOSYNC_DB_PATH", "data/ecosync.db")
    CORS_ORIGINS: list[str] = os.getenv(
        "ECOSYNC_CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
    ).split(",")

    @property
    def is_live(self) -> bool:
        return self.DATA_SOURCE == "live"


config = Config()
