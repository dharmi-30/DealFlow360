"""
tests_sub.py
------------
End-to-end tests for the DealFlow360 subscription & billing system.

Tests:
  1. Monthly subscription creation
  2. Yearly subscription creation
  3. Reject non-subscription product
  4. Reject duplicate subscription
  5. Quantity change with proration (increase)
  6. Quantity change with proration (decrease)
  7. End-of-period cancellation
  8. Immediate cancellation with credit
  9. Reject change on cancelled subscription
 10. Deal events audit trail verification
"""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import DealEvent, Subscription

# ---------------------------------------------------------------------------
# Test database setup (SQLite in-memory)
# ---------------------------------------------------------------------------
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
print("  DealFlow360 -- SUBSCRIPTION & BILLING TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# Setup: user, customer, products
# ---------------------------------------------------------------------------
client.post("/auth/signup", json={
    "full_name": "Billing Admin",
    "company_name": "SubsCorp",
    "email": "billing@subscorp.com",
    "password": "Pass123!",
    "role": "ADMIN",
})
token = client.post("/auth/login", json={
    "email": "billing@subscorp.com",
    "password": "Pass123!",
}).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

me = client.get("/auth/me", headers=headers).json()
company_id = me["company_id"]

# Customer
cust = client.post("/customers", json={
    "contact_name": "Enterprise Client",
    "email": "enterprise@client.com",
    "tier": "GOLD",
}, headers=headers).json()
assert cust.get("id"), f"Customer creation failed: {cust}"
customer_id = cust["id"]

# Subscription product (is_subscription=True)
sub_prod = client.post("/products", json={
    "name": "CRM Pro License",
    "sku": "CRM-PRO",
    "unit_price": "500.00",
    "unit_cost": "100.00",
    "is_subscription": True,
}, headers=headers).json()
assert sub_prod.get("id"), f"Subscription product creation failed: {sub_prod}"

# Second subscription product for multi-line test
sub_prod2 = client.post("/products", json={
    "name": "Analytics Add-on",
    "sku": "ANA-001",
    "unit_price": "200.00",
    "unit_cost": "50.00",
    "is_subscription": True,
}, headers=headers).json()

# One-time (non-subscription) product
onetime_prod = client.post("/products", json={
    "name": "Setup Fee",
    "sku": "SETUP-001",
    "unit_price": "1500.00",
    "unit_cost": "200.00",
    "is_subscription": False,
}, headers=headers).json()

print("\n[SETUP] Users, customers, and products created.\n")

# ---------------------------------------------------------------------------
# Helper: create a quotation that is CONFIRMED (submit + no-approval fast path)
# ---------------------------------------------------------------------------
def make_confirmed_quotation(items: list) -> dict:
    """Create a quotation with given items, submit it, then confirm it."""
    q = client.post("/quotations", json={
        "customer_id": customer_id,
        "items": items,
    }, headers=headers).json()
    assert q.get("id"), f"Quotation creation failed: {q}"

    # Submit (auto-approve if risk is low)
    submitted = client.post(f"/quotations/{q['id']}/submit", headers=headers).json()
    # If still PENDING_APPROVAL, we cannot confirm directly; we need risk=0 quotes
    # For test reliability, create quotes with 0 discount (risk score = 0 → auto-approved)
    assert submitted.get("status") in ("APPROVED", "CONFIRMED", "PENDING_APPROVAL"), \
        f"Submit failed: {submitted}"

    confirmed = client.post(f"/quotations/{q['id']}/confirm", headers=headers).json()
    assert confirmed.get("status") == "CONFIRMED", f"Confirm failed: {confirmed}"
    return confirmed


# ---------------------------------------------------------------------------
# TEST 1: MONTHLY subscription creation
# ---------------------------------------------------------------------------
q1 = make_confirmed_quotation([
    {"product_id": sub_prod["id"], "quantity": 5},
])

start_monthly = datetime.now(timezone.utc).isoformat()
sub_payload = {
    "items": [
        {
            "product_id": sub_prod["id"],
            "quantity": 5,
            "billing_cycle": "MONTHLY",
            "start_date": start_monthly,
        }
    ]
}
resp = client.post(f"/quotations/{q1['id']}/subscriptions", json=sub_payload, headers=headers)
assert resp.status_code == 201, f"TEST 1 FAILED: {resp.text}"
subs = resp.json()
assert len(subs) == 1
sub1 = subs[0]
assert sub1["billing_cycle"] == "MONTHLY"
assert sub1["quantity"] == 5
assert Decimal(sub1["amount"]) == Decimal("2500.00")  # 5 * 500
assert sub1["status"] == "ACTIVE"
assert sub1["product_name"] == "CRM Pro License"
sub1_id = sub1["id"]

print("TEST 1 PASSED: Monthly subscription created (5 * $500 = $2500/month).")

# ---------------------------------------------------------------------------
# TEST 2: YEARLY subscription on a different quotation
# ---------------------------------------------------------------------------
q2 = make_confirmed_quotation([
    {"product_id": sub_prod2["id"], "quantity": 10},
])

start_yearly = datetime.now(timezone.utc).isoformat()
resp2 = client.post(f"/quotations/{q2['id']}/subscriptions", json={
    "items": [{
        "product_id": sub_prod2["id"],
        "quantity": 10,
        "billing_cycle": "YEARLY",
        "start_date": start_yearly,
    }]
}, headers=headers)
assert resp2.status_code == 201, f"TEST 2 FAILED: {resp2.text}"
sub2_data = resp2.json()[0]
assert sub2_data["billing_cycle"] == "YEARLY"
assert sub2_data["quantity"] == 10
assert Decimal(sub2_data["amount"]) == Decimal("2000.00")  # 10 * 200
sub2_id = sub2_data["id"]

print("TEST 2 PASSED: Yearly subscription created (10 * $200 = $2000/year).")

# ---------------------------------------------------------------------------
# TEST 3: Reject non-subscription product
# ---------------------------------------------------------------------------
q3 = make_confirmed_quotation([
    {"product_id": onetime_prod["id"], "quantity": 1},
])
resp3 = client.post(f"/quotations/{q3['id']}/subscriptions", json={
    "items": [{
        "product_id": onetime_prod["id"],
        "quantity": 1,
        "billing_cycle": "MONTHLY",
        "start_date": datetime.now(timezone.utc).isoformat(),
    }]
}, headers=headers)
assert resp3.status_code == 400, f"TEST 3 FAILED: Expected 400, got {resp3.status_code}"
assert "is not a subscription product" in resp3.text

print("TEST 3 PASSED: Non-subscription product correctly rejected.")

# ---------------------------------------------------------------------------
# TEST 4: Reject duplicate subscription for same product on same quotation
# ---------------------------------------------------------------------------
resp4 = client.post(f"/quotations/{q1['id']}/subscriptions", json=sub_payload, headers=headers)
assert resp4.status_code == 409, f"TEST 4 FAILED: Expected 409, got {resp4.status_code}"
assert "already exists" in resp4.text

print("TEST 4 PASSED: Duplicate subscription correctly rejected with 409.")

# ---------------------------------------------------------------------------
# TEST 5: Quantity change — INCREASE (proration charge)
# ---------------------------------------------------------------------------
resp5 = client.post(f"/subscriptions/{sub1_id}/change", json={"new_quantity": 8}, headers=headers)
assert resp5.status_code == 200, f"TEST 5 FAILED: {resp5.text}"
data5 = resp5.json()

assert data5["old_quantity"] == 5
assert data5["new_quantity"] == 8
assert data5["subscription"]["quantity"] == 8
assert Decimal(data5["subscription"]["amount"]) == Decimal("4000.00")  # 8 * 500

# Prorated amount should be positive (charge), or 0 if change happens same day as start
prorated = Decimal(data5["prorated_amount"])
assert prorated >= 0, f"Expected non-negative proration for quantity increase, got {prorated}"
assert data5["total_days_in_period"] > 0

print(f"TEST 5 PASSED: Quantity increased 5->8. Prorated charge: ${data5['prorated_amount']}. "
      f"New amount/cycle: ${data5['subscription']['amount']}.")

# ---------------------------------------------------------------------------
# TEST 6: Quantity change — DECREASE (proration credit)
# ---------------------------------------------------------------------------
resp6 = client.post(f"/subscriptions/{sub1_id}/change", json={"new_quantity": 3}, headers=headers)
assert resp6.status_code == 200, f"TEST 6 FAILED: {resp6.text}"
data6 = resp6.json()

assert data6["old_quantity"] == 8
assert data6["new_quantity"] == 3
prorated6 = Decimal(data6["prorated_amount"])
assert prorated6 <= 0, f"Expected non-positive proration for quantity decrease, got {prorated6}"
assert Decimal(data6["subscription"]["amount"]) == Decimal("1500.00")  # 3 * 500

print(f"TEST 6 PASSED: Quantity decreased 8->3. Prorated credit: ${data6['prorated_amount']}. "
      f"New amount/cycle: ${data6['subscription']['amount']}.")

# ---------------------------------------------------------------------------
# TEST 7: End-of-period cancellation
# ---------------------------------------------------------------------------
resp7 = client.post(f"/subscriptions/{sub2_id}/cancel", json={
    "cancellation_type": "end_of_period",
    "reason": "Customer requested downgrade",
}, headers=headers)
assert resp7.status_code == 200, f"TEST 7 FAILED: {resp7.text}"
data7 = resp7.json()

assert data7["cancellation_type"] == "end_of_period"
assert Decimal(data7["credit_amount"]) == Decimal("0.00")
assert data7["subscription"]["status"] == "CANCELLED"
assert "end of current billing period" in data7["note"]

print(f"TEST 7 PASSED: End-of-period cancellation. Credit: $0 (correct). "
      f"Effective: {data7['effective_date']}.")

# ---------------------------------------------------------------------------
# TEST 8: Immediate cancellation with credit
# ---------------------------------------------------------------------------
# Create a fresh subscription to test immediate cancellation with a non-zero credit
q_imm = make_confirmed_quotation([
    {"product_id": sub_prod2["id"], "quantity": 1},
])
resp_imm_create = client.post(f"/quotations/{q_imm['id']}/subscriptions", json={
    "items": [{
        "product_id": sub_prod2["id"],
        "quantity": 12,
        "billing_cycle": "MONTHLY",
        # Use a past start date so remaining_days > 0 in the cycle
        "start_date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
    }]
}, headers=headers)
assert resp_imm_create.status_code == 201, f"Setup for TEST 8 failed: {resp_imm_create.text}"
sub_imm_id = resp_imm_create.json()[0]["id"]

resp8 = client.post(f"/subscriptions/{sub_imm_id}/cancel", json={
    "cancellation_type": "immediate",
    "reason": "Budget cut",
}, headers=headers)
assert resp8.status_code == 200, f"TEST 8 FAILED: {resp8.text}"
data8 = resp8.json()

assert data8["cancellation_type"] == "immediate"
assert data8["subscription"]["status"] == "CANCELLED"
credit8 = Decimal(data8["credit_amount"])
assert credit8 >= 0, "Credit must be non-negative"
assert "Prorated credit" in data8["note"]

print(f"TEST 8 PASSED: Immediate cancellation. Prorated credit issued: ${data8['credit_amount']}.")

# ---------------------------------------------------------------------------
# TEST 9: Reject operation on cancelled subscription
# ---------------------------------------------------------------------------
resp9 = client.post(f"/subscriptions/{sub2_id}/change", json={"new_quantity": 5}, headers=headers)
assert resp9.status_code == 409, f"TEST 9 FAILED: Expected 409, got {resp9.status_code}"
assert "not ACTIVE" in resp9.text

print("TEST 9 PASSED: Change on cancelled subscription correctly rejected with 409.")

# ---------------------------------------------------------------------------
# TEST 10: GET endpoints and deal event audit trail
# ---------------------------------------------------------------------------
# List all subscriptions
list_resp = client.get("/subscriptions", headers=headers)
assert list_resp.status_code == 200
all_subs = list_resp.json()
assert len(all_subs) >= 3, f"Expected >=3 subscriptions, got {len(all_subs)}"

# Get individual subscription
single_resp = client.get(f"/subscriptions/{sub1_id}", headers=headers)
assert single_resp.status_code == 200
assert single_resp.json()["id"] == sub1_id

# Verify deal events in DB
db = TestingSessionLocal()
events = db.query(DealEvent).filter(
    DealEvent.event_type.in_([
        "SUBSCRIPTION_CREATED",
        "SUBSCRIPTION_QUANTITY_CHANGED",
        "SUBSCRIPTION_CANCELLED",
    ])
).all()
event_types = [e.event_type for e in events]
db.close()

assert "SUBSCRIPTION_CREATED" in event_types
assert "SUBSCRIPTION_QUANTITY_CHANGED" in event_types
assert "SUBSCRIPTION_CANCELLED" in event_types

print(f"TEST 10 PASSED: List ({len(all_subs)} subs), GET by ID, deal events all verified.")
print(f"  Events logged: {set(event_types)}")

print("\n" + "=" * 60)
print("  ALL SUBSCRIPTION & BILLING TESTS PASSED!")
print("=" * 60)
