"""
tests_neg.py
------------
End-to-end unit tests for DealFlow360 Customer Portal Quotation Negotiation.

Tests:
  1. Customer opens quote (GET /portal/quotations/{id}) - verified sanitized view (no internal margins/risk).
  2. Customer requests higher discount (POST /portal/quotations/{id}/negotiation).
  3. Backend recalculates risk & sets approval_required = true.
  4. Quote returns to PENDING_APPROVAL status.
  5. Confirmation attempt while approval is pending is rejected with 400.
  6. Sales Manager / Finance approves the quotation.
  7. Quotation transitions to APPROVED.
  8. Customer successfully confirms quotation (POST /portal/quotations/{id}/confirm -> CONFIRMED).
  9. Audit deal events verified.
"""

from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import DealEvent, QuotationStatus

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
print("  DealFlow360 -- CUSTOMER PORTAL & NEGOTIATION TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# 1. SETUP: Company, Admin & Manager users, Customer, Product
# ---------------------------------------------------------------------------
client.post(
    "/auth/signup",
    json={
        "full_name": "Admin User",
        "company_name": "DealCorp",
        "email": "admin@dealcorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
admin_token = client.post(
    "/auth/login",
    json={"email": "admin@dealcorp.com", "password": "Pass123!"},
).json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Customer (BRONZE tier -> base max discount is 5%)
cust = client.post(
    "/customers",
    json={
        "contact_name": "Negotiating Buyer",
        "email": "buyer@negotiate.com",
        "tier": "BRONZE",
    },
    headers=admin_headers,
).json()
customer_id = cust["id"]

# Product ($1,000 unit price)
prod = client.post(
    "/products",
    json={
        "name": "Enterprise Software Suite",
        "sku": "SW-ENT-001",
        "unit_price": "1000.00",
        "unit_cost": "200.00",
        "tax_rate": "10.00",
    },
    headers=admin_headers,
).json()
product_id = prod["id"]

print("\n[SETUP] Company, Customer, and Product created.\n")

# ---------------------------------------------------------------------------
# Create initial quotation with 0% discount
# ---------------------------------------------------------------------------
q = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 10, "discount_percent": 0}],
    },
    headers=admin_headers,
).json()
quotation_id = q["id"]

# Submit initial quotation -> Auto-approved since 0% discount has risk score 0
q_submitted = client.post(f"/quotations/{quotation_id}/submit", headers=admin_headers).json()
assert q_submitted["status"] == "APPROVED"
assert q_submitted["approval_required"] is False

print(f"[SETUP] Initial Quotation {q_submitted['quote_number']} created & approved.")

# ---------------------------------------------------------------------------
# STEP 1: Customer opens quote on Portal (GET /portal/quotations/{id})
# ---------------------------------------------------------------------------
resp_portal = client.get(f"/portal/quotations/{quotation_id}")
assert resp_portal.status_code == 200, f"STEP 1 FAILED: {resp_portal.text}"
portal_data = resp_portal.json()

# Security Check: Verify internal metrics are NOT exposed
assert "margin_amount" not in portal_data
assert "margin_percent" not in portal_data
assert "risk_score" not in portal_data
assert "approvals" not in portal_data
assert portal_data["status"] == "APPROVED"
assert len(portal_data["items"]) == 1
target_item_id = portal_data["items"][0]["id"]

print("STEP 1 PASSED: Customer opened quote on portal. Security check verified (internal metrics hidden).")

# ---------------------------------------------------------------------------
# STEP 2 & 3: Customer requests higher discount (25% discount on BRONZE tier)
# ---------------------------------------------------------------------------
neg_payload = {
    "quote_item_id": target_item_id,
    "requested_quantity": 10,
    "requested_discount_percent": 25,
    "comment": "Can you offer a better price for volume?",
}
resp_neg = client.post(f"/portal/quotations/{quotation_id}/negotiation", json=neg_payload)
assert resp_neg.status_code == 200, f"STEP 2/3 FAILED: {resp_neg.text}"
neg_data = resp_neg.json()

print(f"STEP 2 & 3 PASSED: Customer submitted negotiation request for 25% discount.")

# ---------------------------------------------------------------------------
# STEP 4: Backend recalculates risk & Quote returns to PENDING_APPROVAL
# ---------------------------------------------------------------------------
assert neg_data["status"] == "PENDING_APPROVAL"
assert neg_data["approval_required"] is True

# Test Attempting to confirm prematurely
resp_early_confirm = client.post(f"/portal/quotations/{quotation_id}/confirm")
assert resp_early_confirm.status_code == 400
assert "requires Manager/Finance approval" in resp_early_confirm.text

print("STEP 4 PASSED: Risk recalculated, status set to PENDING_APPROVAL, and premature confirmation blocked with 400.")

# ---------------------------------------------------------------------------
# STEP 5: Manager/Finance approves the quotation
# ---------------------------------------------------------------------------
# Fetch pending approvals
resp_apprs = client.get("/approvals?status=PENDING", headers=admin_headers)
assert resp_apprs.status_code == 200
apprs_list = resp_apprs.json()

# Admin approves all pending approval roles for this quotation
for appr in apprs_list:
    if appr["quotation_id"] == quotation_id:
        appr_id = appr["id"]
        appr_resp = client.post(
            f"/approvals/{appr_id}/approve",
            json={"comments": "Approved 25% discount for key deal."},
            headers=admin_headers,
        )
        assert appr_resp.status_code == 200

# Verify quotation status is now APPROVED
resp_check = client.get(f"/portal/quotations/{quotation_id}")
assert resp_check.json()["status"] == "APPROVED"

print("STEP 5 PASSED: Approvals completed by Sales Manager / Finance. Quotation status updated to APPROVED.")

# ---------------------------------------------------------------------------
# STEP 6: Customer can confirm
# ---------------------------------------------------------------------------
resp_confirm = client.post(f"/portal/quotations/{quotation_id}/confirm")
assert resp_confirm.status_code == 200, f"STEP 6 FAILED: {resp_confirm.text}"
final_portal_data = resp_confirm.json()

assert final_portal_data["status"] == "CONFIRMED"

# Verify Deal Events in DB
import uuid
db = TestingSessionLocal()
events = db.query(DealEvent).filter(DealEvent.quotation_id == uuid.UUID(quotation_id)).all()
db.close()

event_types = [e.event_type for e in events]
assert "CUSTOMER_NEGOTIATION_SUBMITTED" in event_types
assert "QUOTATION_CONFIRMED_BY_CUSTOMER" in event_types

print(f"STEP 6 PASSED: Customer confirmed quote (Status: {final_portal_data['status']}).")
print(f"Audit log events verified: {set(event_types)}")

print("\n" + "=" * 60)
print("  ALL CUSTOMER PORTAL & NEGOTIATION TESTS PASSED PERFECTLY!")
print("=" * 60)
