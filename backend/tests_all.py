"""
tests_all.py
-------------
Master Integration Verification Test Runner for DealFlow360 FastAPI Backend.

Executes end-to-end integration tests across all modules:
  1. Authentication & Security (JWT, RBAC, Multi-tenancy)
  2. Customers & Products (CRUD, Search, Category Filter)
  3. Quotation Engine (Pricing, Margin, Risk, Status)
  4. Discount Governance & Approvals (Tier rules, Manager/Finance approvals, Reject, Return)
  5. Recommendation Engine (Dynamic complementary & co-occurrence suggestions)
  6. Fulfillment Engine (Multi-warehouse split, Shipping cost, Backorders, Manual Overrides)
  7. Subscription Billing Engine (Monthly/Quarterly/Yearly, Proration, Immediate/End-of-period Cancellation)
  8. Invoices & Payments (One-time/Recurring, Partial/Full Payments, Status transitions)
  9. Customer Portal Negotiation (Sanitized security view, Discount negotiation, Recalculation, Reapproval, Customer Confirmation)
 10. Executive Dashboard (Dynamic KPI cards, Pipeline distribution, Recent activity timeline)
 11. Deal Health & Risk Diagnostics (Deterministic 0-100 score, Stalled deal, Discount anomaly, Low margin, Delivery risk alerts)
 12. Reporting & BI (Sales, Product, Approval reports with individual and combined filters)
 13. OpenAPI Schema & Route Inspection (Swagger docs integrity)
"""

import sys
from fastapi.testclient import TestClient

from app.main import app

print("============================================================")
print("  DEALFLOW360 FASTAPI BACKEND -- FULL INTEGRATION PASS")
print("============================================================")

# 1. OpenAPI & Route inspection check
client = TestClient(app)
openapi_resp = client.get("/openapi.json")
assert openapi_resp.status_code == 200, f"OpenAPI schema generation failed: {openapi_resp.text}"
schema = openapi_resp.json()
paths_count = len(schema["paths"])
print(f"\n[OK] FastAPI OpenAPI Schema verified cleanly ({paths_count} routes registered).\n")

# 2. Run Module Test Suites
modules = [
    ("Auth, Customers, Products, Quotations, Approvals, Recommendations", "tests_core.py"),
    ("Warehouse Inventory Fulfillment", "tests_ful.py"),
    ("Subscription & Prorated Billing", "tests_sub.py"),
    ("Invoices & Payments", "tests_inv.py"),
    ("Customer Portal & Negotiation", "tests_neg.py"),
    ("Executive Dashboard & Analytics", "tests_dash.py"),
    ("Deal Health & Risk Diagnostics", "tests_dh.py"),
    ("Reporting & Business Intelligence", "tests_rep.py"),
]

import subprocess

failed_suites = []

for title, script_name in modules:
    print(f"--- Running Test Suite: {title} ({script_name}) ---")
    result = subprocess.run(
        [sys.executable, "-X", "utf8", script_name],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode == 0:
        print(f"[PASSED] {script_name}")
    else:
        print(f"[FAILED] {script_name}")
        print(result.stdout)
        print(result.stderr)
        failed_suites.append(script_name)

print("\n" + "=" * 60)
if not failed_suites:
    print("  ALL 12 BACKEND SYSTEM MODULES PASSED FULL INTEGRATION!")
    print("============================================================")
else:
    print(f"  FAILED SUITES: {failed_suites}")
    print("============================================================")
    sys.exit(1)
