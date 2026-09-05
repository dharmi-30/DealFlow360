"""
tests_inv.py
------------
End-to-end unit tests for DealFlow360 Invoices and Payments system.

Tests:
  1. Create ONE_TIME invoice from confirmed quotation
  2. Create RECURRING invoice from confirmed quotation
  3. List invoices (GET /invoices)
  4. Get invoice by ID (GET /invoices/{id})
  5. Record partial payment (status becomes PARTIALLY_PAID)
  6. Record remaining payment (status becomes PAID)
  7. Reject payment on fully PAID invoice
  8. Verify Deal Events logged for invoice creation and payments
"""

from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import DealEvent, InvoiceStatus, InvoiceType, PaymentMethod

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
print("  DealFlow360 -- INVOICE & PAYMENT TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# Setup user, customer, products
# ---------------------------------------------------------------------------
client.post(
    "/auth/signup",
    json={
        "full_name": "Finance Admin",
        "company_name": "InvoiceCorp",
        "email": "finance@invoicecorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
token = client.post(
    "/auth/login",
    json={"email": "finance@invoicecorp.com", "password": "Pass123!"},
).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

me = client.get("/auth/me", headers=headers).json()
company_id = me["company_id"]

cust = client.post(
    "/customers",
    json={
        "contact_name": "Acme Corp Client",
        "email": "billing@acme.com",
        "tier": "GOLD",
    },
    headers=headers,
).json()
customer_id = cust["id"]

prod1 = client.post(
    "/products",
    json={
        "name": "Enterprise Server Hardware",
        "sku": "SRV-100",
        "unit_price": "2000.00",
        "unit_cost": "1000.00",
        "tax_rate": "10.00",
        "is_subscription": False,
    },
    headers=headers,
).json()

prod2 = client.post(
    "/products",
    json={
        "name": "Cloud Maintenance Support",
        "sku": "SUP-500",
        "unit_price": "500.00",
        "unit_cost": "100.00",
        "tax_rate": "5.00",
        "is_subscription": True,
    },
    headers=headers,
).json()

print("\n[SETUP] User, Customer, and Products created successfully.\n")


def make_confirmed_quotation(items: list) -> dict:
    """Helper to create, submit, and confirm a quotation."""
    q = client.post(
        "/quotations",
        json={"customer_id": customer_id, "items": items},
        headers=headers,
    ).json()

    submitted = client.post(f"/quotations/{q['id']}/submit", headers=headers).json()
    confirmed = client.post(f"/quotations/{q['id']}/confirm", headers=headers).json()
    assert confirmed["status"] == "CONFIRMED"
    return confirmed


# ---------------------------------------------------------------------------
# TEST 1: Create ONE_TIME Invoice
# ---------------------------------------------------------------------------
q1 = make_confirmed_quotation([
    {"product_id": prod1["id"], "quantity": 1, "discount_percent": 0}
])
# Subtotal = 2000.00, Tax = 200.00 (10%), Total = 2200.00

resp1 = client.post(
    f"/quotations/{q1['id']}/invoice",
    json={"type": "ONE_TIME"},
    headers=headers,
)
assert resp1.status_code == 201, f"TEST 1 FAILED: {resp1.text}"
inv1 = resp1.json()

assert inv1["type"] == "ONE_TIME"
assert inv1["status"] == "ISSUED"
assert Decimal(inv1["amount"]) == Decimal("2000.00")
assert Decimal(inv1["tax"]) == Decimal("200.00")
assert Decimal(inv1["total"]) == Decimal("2200.00")
assert Decimal(inv1["paid_amount"]) == Decimal("0.00")
assert inv1["invoice_number"].startswith("INV-")
inv1_id = inv1["id"]

print(f"TEST 1 PASSED: Created ONE_TIME invoice {inv1['invoice_number']} (Total: ${inv1['total']}, Status: {inv1['status']}).")

# ---------------------------------------------------------------------------
# TEST 2: Create RECURRING Invoice
# ---------------------------------------------------------------------------
q2 = make_confirmed_quotation([
    {"product_id": prod2["id"], "quantity": 2, "discount_percent": 0}
])
# Subtotal = 1000.00, Tax = 50.00 (5%), Total = 1050.00

resp2 = client.post(
    f"/quotations/{q2['id']}/invoice",
    json={"type": "RECURRING"},
    headers=headers,
)
assert resp2.status_code == 201, f"TEST 2 FAILED: {resp2.text}"
inv2 = resp2.json()

assert inv2["type"] == "RECURRING"
assert inv2["status"] == "ISSUED"
assert Decimal(inv2["total"]) == Decimal("1050.00")
inv2_id = inv2["id"]

print(f"TEST 2 PASSED: Created RECURRING invoice {inv2['invoice_number']} (Total: ${inv2['total']}, Status: {inv2['status']}).")

# ---------------------------------------------------------------------------
# TEST 3: List Invoices
# ---------------------------------------------------------------------------
resp3 = client.get("/invoices", headers=headers)
assert resp3.status_code == 200, f"TEST 3 FAILED: {resp3.text}"
invoices_list = resp3.json()
assert len(invoices_list) >= 2
inv_ids = [inv["id"] for inv in invoices_list]
assert inv1_id in inv_ids
assert inv2_id in inv_ids

print(f"TEST 3 PASSED: Listed invoices (Count: {len(invoices_list)}).")

# ---------------------------------------------------------------------------
# TEST 4: Get Single Invoice
# ---------------------------------------------------------------------------
resp4 = client.get(f"/invoices/{inv1_id}", headers=headers)
assert resp4.status_code == 200, f"TEST 4 FAILED: {resp4.text}"
single_inv = resp4.json()
assert single_inv["id"] == inv1_id
assert single_inv["customer_id"] == customer_id

print("TEST 4 PASSED: Retrieved single invoice by ID.")

# ---------------------------------------------------------------------------
# TEST 5: Partial Payment
# ---------------------------------------------------------------------------
pay_payload1 = {
    "amount": "1000.00",
    "payment_method": "BANK_TRANSFER",
    "reference": "TXN-BANK-001",
}
resp5 = client.post(
    f"/invoices/{inv1_id}/payment",
    json=pay_payload1,
    headers=headers,
)
assert resp5.status_code == 200, f"TEST 5 FAILED: {resp5.text}"
inv1_after_pay1 = resp5.json()

assert Decimal(inv1_after_pay1["paid_amount"]) == Decimal("1000.00")
assert inv1_after_pay1["status"] == "PARTIALLY_PAID"
assert len(inv1_after_pay1["payments"]) == 1
assert inv1_after_pay1["payments"][0]["payment_method"] == "BANK_TRANSFER"
assert inv1_after_pay1["payments"][0]["reference"] == "TXN-BANK-001"

print(f"TEST 5 PASSED: Recorded partial payment of $1000.00. Status updated to: {inv1_after_pay1['status']}.")

# ---------------------------------------------------------------------------
# TEST 6: Complete Payment (Status becomes PAID)
# ---------------------------------------------------------------------------
pay_payload2 = {
    "amount": "1200.00",
    "payment_method": "UPI",
    "reference": "UPI-REF-999",
}
resp6 = client.post(
    f"/invoices/{inv1_id}/payment",
    json=pay_payload2,
    headers=headers,
)
assert resp6.status_code == 200, f"TEST 6 FAILED: {resp6.text}"
inv1_after_pay2 = resp6.json()

assert Decimal(inv1_after_pay2["paid_amount"]) == Decimal("2200.00")
assert inv1_after_pay2["status"] == "PAID"
assert len(inv1_after_pay2["payments"]) == 2

print(f"TEST 6 PASSED: Recorded final payment of $1200.00. Total Paid: ${inv1_after_pay2['paid_amount']}. Status updated to: {inv1_after_pay2['status']}.")

# ---------------------------------------------------------------------------
# TEST 7: Reject payment on fully PAID invoice
# ---------------------------------------------------------------------------
resp7 = client.post(
    f"/invoices/{inv1_id}/payment",
    json={"amount": "100.00", "payment_method": "CASH"},
    headers=headers,
)
assert resp7.status_code == 400, f"TEST 7 FAILED: Expected 400, got {resp7.status_code}"
assert "already fully PAID" in resp7.text

print("TEST 7 PASSED: Payment attempt on fully PAID invoice correctly rejected with 400.")

# ---------------------------------------------------------------------------
# TEST 8: Deal Events Audit Trail Verification
# ---------------------------------------------------------------------------
db = TestingSessionLocal()
events = db.query(DealEvent).filter(
    DealEvent.event_type.in_(["INVOICE_GENERATED", "PAYMENT_RECEIVED"])
).all()
db.close()

event_types = [e.event_type for e in events]
assert "INVOICE_GENERATED" in event_types
assert "PAYMENT_RECEIVED" in event_types
assert len(events) >= 4  # 2 invoices generated + 2 payments recorded

print(f"TEST 8 PASSED: Deal events audit log verified ({len(events)} events recorded).")

print("\n" + "=" * 60)
print("  ALL INVOICE & PAYMENT TESTS PASSED PERFECTLY!")
print("=" * 60)
