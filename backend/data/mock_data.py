"""
Mock Data Generator — Indian CPI Inflation + NSE Nifty 50 Index.

Generates realistic synthetic time-series for 36 months,
starting from April (Indian Financial Year convention).
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def generate_cpi_data(months: int = 36, base_cpi: float = 6.0, seed: int = 42) -> pd.DataFrame:
    """Generate monthly Indian CPI (YoY inflation %) time-series."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start="2023-04-01", periods=months, freq="MS")

    values = []
    cpi = base_cpi
    for i, dt in enumerate(dates):
        seasonal = 0.8 if dt.month in (7, 8, 9) else -0.2 if dt.month in (1, 2, 3) else 0.0
        noise = rng.normal(0, 0.25)
        drift = rng.normal(0, 0.05)
        cpi = max(2.0, min(10.0, cpi + seasonal * 0.1 + noise * 0.3 + drift))
        values.append(round(cpi, 2))

    return pd.DataFrame({"date": dates, "cpi": values})


def generate_nse_data(months: int = 36, base_nifty: float = 18000.0, seed: int = 42) -> pd.DataFrame:
    """Generate monthly NSE Nifty 50 index price time-series."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start="2023-04-01", periods=months, freq="MS")

    values = []
    nifty = base_nifty
    monthly_drift = 0.01
    volatility = 0.04

    for _ in range(months):
        ret = monthly_drift + rng.normal(0, volatility)
        nifty *= (1 + ret)
        values.append(round(nifty, 2))

    return pd.DataFrame({"date": dates, "nifty50": values})


def get_mock_strategies() -> list[dict]:
    """Return 5 mock Indian business strategies with criteria scores and unit economics."""
    return [
        {
            "name": "Tier-2 City Expansion",
            "description": "Expand retail footprint into Tier-2 cities like Jaipur, Lucknow, Coimbatore",
            "sector": "Retail",
            "criteria_scores": [8, 4, 7, 6, 6],
            "unit_economics": {
                "cac": 1_800, "ltv": 22_000, "monthly_burn": 35_00_000,
                "gross_margin": 0.52, "payback_months": 10,
            },
        },
        {
            "name": "Raw Material Bulk Buy",
            "description": "Negotiate long-term contracts with domestic steel and polymer suppliers",
            "sector": "Manufacturing",
            "criteria_scores": [6, 3, 8, 5, 7],
            "unit_economics": {
                "cac": 500, "ltv": 8_000, "monthly_burn": 20_00_000,
                "gross_margin": 0.38, "payback_months": 14,
            },
        },
        {
            "name": "Digital-First D2C",
            "description": "Launch direct-to-consumer brand via Shopify India + social commerce",
            "sector": "E-Commerce",
            "criteria_scores": [9, 5, 9, 3, 8],
            "unit_economics": {
                "cac": 2_200, "ltv": 18_500, "monthly_burn": 42_00_000,
                "gross_margin": 0.61, "payback_months": 8,
            },
        },
        {
            "name": "Export Diversification",
            "description": "Target ASEAN + Middle East markets for textile and pharma exports",
            "sector": "Trade",
            "criteria_scores": [7, 6, 5, 4, 4],
            "unit_economics": {
                "cac": 3_200, "ltv": 28_000, "monthly_burn": 55_00_000,
                "gross_margin": 0.45, "payback_months": 16,
            },
        },
        {
            "name": "Green Energy Transition",
            "description": "Shift manufacturing to solar + wind power under PLI scheme incentives",
            "sector": "Energy",
            "criteria_scores": [7, 5, 6, 8, 5],
            "unit_economics": {
                "cac": 1_500, "ltv": 35_000, "monthly_burn": 48_00_000,
                "gross_margin": 0.55, "payback_months": 20,
            },
        },
    ]
