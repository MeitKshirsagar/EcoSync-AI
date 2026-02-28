"""
Controller Agent — Unit Economics Validator.

Validates each strategy against hard thresholds for Indian-market
unit economics. All monetary values are in INR (₹); time periods
follow the Indian Financial Year (April – March).
"""

from __future__ import annotations

from agents.auditor import format_inr, current_indian_fy


# ── Thresholds (INR) ───────────────────────────────────────────────────────────

THRESHOLDS = {
    # [REDACTED] exact internal thresholds hidden for public repo
    "max_cac":          2_500.00,
    "min_ltv":          15_000.00,
    "min_ltv_cac_ratio": 3.0,
    "max_monthly_burn": 50_00_000.0,
    "min_gross_margin":  0.40,
    "max_payback_months": 18,
}


def validate_unit_economics(strategy: dict) -> dict:
    """Validate a strategy's unit economics against Indian-market thresholds.

    Expected keys in `strategy`:
        cac, ltv, monthly_burn, gross_margin, payback_months

    Returns a validation report with pass/fail per metric + overall verdict.
    """
    fy = current_indian_fy()
    unit = strategy.get("unit_economics", {})

    cac             = unit.get("cac", 0)
    ltv             = unit.get("ltv", 0)
    monthly_burn    = unit.get("monthly_burn", 0)
    gross_margin    = unit.get("gross_margin", 0)
    payback_months  = unit.get("payback_months", 0)
    ltv_cac_ratio   = ltv / cac if cac > 0 else 0

    checks = {
        "cac": {
            "value": format_inr(cac),
            "threshold": f"≤ {format_inr(THRESHOLDS['max_cac'])}",
            "passed": cac <= THRESHOLDS["max_cac"],
        },
        "ltv": {
            "value": format_inr(ltv),
            "threshold": f"≥ {format_inr(THRESHOLDS['min_ltv'])}",
            "passed": ltv >= THRESHOLDS["min_ltv"],
        },
        "ltv_cac_ratio": {
            "value": f"{ltv_cac_ratio:.1f}×",
            "threshold": f"≥ {THRESHOLDS['min_ltv_cac_ratio']}×",
            "passed": ltv_cac_ratio >= THRESHOLDS["min_ltv_cac_ratio"],
        },
        "monthly_burn": {
            "value": format_inr(monthly_burn),
            "threshold": f"≤ {format_inr(THRESHOLDS['max_monthly_burn'])}",
            "passed": monthly_burn <= THRESHOLDS["max_monthly_burn"],
        },
        "gross_margin": {
            "value": f"{gross_margin * 100:.0f}%",
            "threshold": f"≥ {THRESHOLDS['min_gross_margin'] * 100:.0f}%",
            "passed": gross_margin >= THRESHOLDS["min_gross_margin"],
        },
        "payback_months": {
            "value": f"{payback_months} months",
            "threshold": f"≤ {THRESHOLDS['max_payback_months']} months",
            "passed": payback_months <= THRESHOLDS["max_payback_months"],
        },
    }

    passed_count = sum(1 for c in checks.values() if c["passed"])
    total_count = len(checks)

    return {
        "strategy": strategy.get("name", "Unknown"),
        "financial_year": fy,
        "currency": "INR",
        "checks": checks,
        "passed": passed_count,
        "total": total_count,
        "verdict": "PASS" if passed_count == total_count else "FAIL",
        "score": round(passed_count / total_count, 2),
    }
