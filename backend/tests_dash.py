"""
tests_dash.py
--------------
End-to-end tests for DealFlow360 Dashboard APIs.

Tests:
  1. GET /dashboard/summary (initial baseline state)
  2. GET /dashboard/pipeline (initial baseline breakdown)
  3. GET /dashboard/recent-activity (initial activity log)
  4. Create & Submit Quotation -> verify total_pipeline & quotation_value increase dynamically
  5. Request high discount -> verify at_risk_deals & pending_approvals increase dynamically
  6. Approve & Generate Invoice + Record Payment -> verify revenue increases dynamically
  7. Verify recent-activity timeline updates with new deal events
"""

from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db

# Setup in-memory SQLite for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

print("=" * 60)
print("  DealFlow360 -- DASHBOARD & ANALYTICS TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# Setup user, customer, product
# ---------------------------------------------------------------------------
client.post(
    "/auth/signup",
    json={
        "full_name": "Dashboard Admin",
        "company_name": "AnalyticsCorp",
        "email": "admin@analyticscorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
token = client.post(
    "/auth/login",
    json={"email": "admin@analyticscorp.com", "password": "Pass123!"},
).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

cust = client.post(
    "/customers",
    json={"contact_name": "Dashboard Client", "email": "client@analytics.com", "tier": "SILVER"},
    headers=headers,
).json()
customer_id = cust["id"]

prod = client.post(
    "/products",
    json={
        "name": "Cloud Sub",
        "sku": "CLOUD-001",
        "unit_price": "5000.00",
        "unit_cost": "1000.00",
        "tax_rate": "10.00",
        "is_subscription": False,
    },
    headers=headers,
).json()
product_id = prod["id"]

print("\n[SETUP] User, Customer, and Product created.\n")

# ---------------------------------------------------------------------------
# TEST 1: Initial Baseline Dashboard Summary
# ---------------------------------------------------------------------------
s0_resp = client.get("/dashboard/summary", headers=headers)
assert s0_resp.status_code == 200, f"TEST 1 FAILED: {s0_resp.text}"
s0 = s0_resp.json()

assert Decimal(s0["total_pipeline"]) == Decimal("0.00")
assert Decimal(s0["revenue"]) == Decimal("0.00")
assert s0["pending_approvals"] == 0
assert s0["at_risk_deals"] == 0

print("TEST 1 PASSED: Initial baseline summary confirmed ($0 pipeline, $0 revenue, 0 pending).")

# ---------------------------------------------------------------------------
# TEST 2: Initial Baseline Pipeline
# ---------------------------------------------------------------------------
p0_resp = client.get("/dashboard/pipeline", headers=headers)
assert p0_resp.status_code == 200, f"TEST 2 FAILED: {p0_resp.text}"
p0 = p0_resp.json()

assert p0["total_count"] == 0
assert Decimal(p0["total_value"]) == Decimal("0.00")
assert len(p0["stages"]) == 5

print("TEST 2 PASSED: Initial pipeline breakdown confirmed (5 stages, 0 total deals).")

# ---------------------------------------------------------------------------
# TEST 3: Create Quotation -> Verify Summary & Pipeline Numbers Increase
# ---------------------------------------------------------------------------
q1 = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 2, "discount_percent": 0}],
    },
    headers=headers,
).json()
# Subtotal = 10000.00, Tax = 1000.00 (10%), Total = 11000.00

s1_resp = client.get("/dashboard/summary", headers=headers)
s1 = s1_resp.json()

assert Decimal(s1["quotation_value"]) == Decimal("11000.00")
assert Decimal(s1["total_pipeline"]) == Decimal("11000.00")

p1_resp = client.get("/dashboard/pipeline", headers=headers)
p1 = p1_resp.json()
assert p1["total_count"] == 1
assert Decimal(p1["total_value"]) == Decimal("11000.00")

print(f"TEST 3 PASSED: Dynamic update verified after quotation creation (Pipeline: ${s1['total_pipeline']}, Deals: {p1['total_count']}).")

# ---------------------------------------------------------------------------
# TEST 4: High Discount -> Pending Approval & At Risk Deals Increase
# ---------------------------------------------------------------------------
q2 = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 1, "discount_percent": 30}],
    },
    headers=headers,
).json()
# Submit q2 (30% discount exceeds SILVER tier 10% limit -> risk score > 0 and PENDING_APPROVAL)
client.post(f"/quotations/{q2['id']}/submit", headers=headers)

s2_resp = client.get("/dashboard/summary", headers=headers)
s2 = s2_resp.json()

assert s2["pending_approvals"] >= 1
assert s2["at_risk_deals"] >= 1

print(f"TEST 4 PASSED: Dynamic update verified for risk & approvals (Pending: {s2['pending_approvals']}, At-Risk: {s2['at_risk_deals']}).")

# ---------------------------------------------------------------------------
# TEST 5: Confirm Quotation + Generate Invoice + Record Payment -> Revenue Increases
# ---------------------------------------------------------------------------
# Auto-approve q1 and confirm
client.post(f"/quotations/{q1['id']}/submit", headers=headers)
client.post(f"/quotations/{q1['id']}/confirm", headers=headers)

# Generate Invoice for q1
inv = client.post(f"/quotations/{q1['id']}/invoice", json={"type": "ONE_TIME"}, headers=headers).json()
invoice_id = inv["id"]

# Record Payment of $5000
client.post(
    f"/invoices/{invoice_id}/payment",
    json={"amount": "5000.00", "payment_method": "BANK_TRANSFER", "reference": "REF-DASH-1"},
    headers=headers,
)

s3_resp = client.get("/dashboard/summary", headers=headers)
s3 = s3_resp.json()

assert Decimal(s3["revenue"]) == Decimal("5000.00")

print(f"TEST 5 PASSED: Dynamic update verified after payment recording (Revenue: ${s3['revenue']}).")

# ---------------------------------------------------------------------------
# TEST 6: Recent Activity Log
# ---------------------------------------------------------------------------
act_resp = client.get("/dashboard/recent-activity", headers=headers)
assert act_resp.status_code == 200, f"TEST 6 FAILED: {act_resp.text}"
activities = act_resp.json()

assert len(activities) >= 4
event_types = [a["event_type"] for a in activities]
assert "PAYMENT_RECEIVED" in event_types
assert "INVOICE_GENERATED" in event_types

print(f"TEST 6 PASSED: Recent activity log verified ({len(activities)} events returned).")

print("\n" + "=" * 60)
print("  ALL DASHBOARD & ANALYTICS TESTS PASSED PERFECTLY!")
print("=" * 60)
