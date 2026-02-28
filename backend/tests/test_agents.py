"""Tests for Eco-Sync AI agents."""

import pytest
from agents.analyst import run_vecm_analysis
from agents.auditor import map_focus_schema, current_indian_fy, fy_quarter, format_inr
from agents.jurist import rank_strategies, promethee_outranking
from agents.controller import validate_unit_economics
from data.mock_data import generate_cpi_data, generate_nse_data, get_mock_strategies


# ── Analyst Agent ──────────────────────────────────────────────────────────────

class TestAnalyst:
    def test_vecm_returns_dict(self):
        cpi = generate_cpi_data()
        nse = generate_nse_data()
        result = run_vecm_analysis(cpi, nse)
        assert isinstance(result, dict)

    def test_vecm_has_required_keys(self):
        cpi = generate_cpi_data()
        nse = generate_nse_data()
        result = run_vecm_analysis(cpi, nse)
        assert "trace_stat" in result
        assert "cointegration_detected" in result
        assert "observations" in result
        assert "interpretation" in result

    def test_vecm_observations_count(self):
        cpi = generate_cpi_data(months=24)
        nse = generate_nse_data(months=24)
        result = run_vecm_analysis(cpi, nse)
        assert result["observations"] == 24

    def test_vecm_cointegration_is_bool(self):
        cpi = generate_cpi_data()
        nse = generate_nse_data()
        result = run_vecm_analysis(cpi, nse)
        assert isinstance(result["cointegration_detected"], bool)


# ── Auditor Agent ──────────────────────────────────────────────────────────────

class TestAuditor:
    def test_focus_schema_returns_dict(self):
        result = map_focus_schema()
        assert isinstance(result, dict)

    def test_focus_has_categories(self):
        result = map_focus_schema()
        assert "categories" in result
        assert len(result["categories"]) == 5

    def test_focus_currency_is_inr(self):
        result = map_focus_schema()
        assert result["currency"] == "INR"
        assert result["currency_symbol"] == "₹"

    def test_current_fy_format(self):
        fy = current_indian_fy()
        assert fy.startswith("FY ")
        assert "-" in fy

    def test_fy_quarter_mapping(self):
        assert fy_quarter(4) == "Q1"
        assert fy_quarter(7) == "Q2"
        assert fy_quarter(10) == "Q3"
        assert fy_quarter(1) == "Q4"

    def test_format_inr(self):
        assert format_inr(0) == "₹0.00"
        assert "₹" in format_inr(1_00_000)
        assert format_inr(1234567) == "₹12,34,567.00"


# ── Jurist Agent ───────────────────────────────────────────────────────────────

class TestJurist:
    def test_rank_strategies_returns_list(self):
        raw = get_mock_strategies()
        result = rank_strategies(raw)
        assert isinstance(result, list)

    def test_rank_strategies_preserves_count(self):
        raw = get_mock_strategies()
        result = rank_strategies(raw)
        assert len(result) == len(raw)

    def test_rank_strategies_has_rank(self):
        raw = get_mock_strategies()
        result = rank_strategies(raw)
        for s in result:
            assert "rank" in s
            assert "vikor_score" in s

    def test_rank_strategies_sorted_by_rank(self):
        raw = get_mock_strategies()
        result = rank_strategies(raw)
        ranks = [s["rank"] for s in result]
        assert ranks == sorted(ranks)

    def test_promethee_returns_dict(self):
        raw = get_mock_strategies()
        result = promethee_outranking(raw)
        assert isinstance(result, dict)

    def test_promethee_has_flows(self):
        raw = get_mock_strategies()
        result = promethee_outranking(raw)
        assert "net_flows" in result or "error" in result

    def test_rank_empty_strategies(self):
        result = rank_strategies([])
        assert result == []


# ── Controller Agent ───────────────────────────────────────────────────────────

class TestController:
    def test_validate_returns_dict(self):
        raw = get_mock_strategies()
        result = validate_unit_economics(raw[0])
        assert isinstance(result, dict)

    def test_validate_has_verdict(self):
        raw = get_mock_strategies()
        result = validate_unit_economics(raw[0])
        assert result["verdict"] in ("PASS", "FAIL")

    def test_validate_has_checks(self):
        raw = get_mock_strategies()
        result = validate_unit_economics(raw[0])
        assert "checks" in result
        assert "cac" in result["checks"]
        assert "ltv" in result["checks"]
        assert "gross_margin" in result["checks"]

    def test_validate_score_range(self):
        raw = get_mock_strategies()
        result = validate_unit_economics(raw[0])
        assert 0 <= result["score"] <= 1

    def test_validate_all_strategies(self):
        raw = get_mock_strategies()
        for s in raw:
            result = validate_unit_economics(s)
            assert result["passed"] <= result["total"]


# ── Mock Data ──────────────────────────────────────────────────────────────────

class TestMockData:
    def test_cpi_data_shape(self):
        df = generate_cpi_data(months=12)
        assert len(df) == 12
        assert "date" in df.columns
        assert "cpi" in df.columns

    def test_nse_data_shape(self):
        df = generate_nse_data(months=12)
        assert len(df) == 12
        assert "date" in df.columns
        assert "nifty50" in df.columns

    def test_strategies_count(self):
        strategies = get_mock_strategies()
        assert len(strategies) == 5

    def test_strategies_have_required_fields(self):
        strategies = get_mock_strategies()
        for s in strategies:
            assert "name" in s
            assert "criteria_scores" in s
            assert "unit_economics" in s
            assert len(s["criteria_scores"]) == 5
