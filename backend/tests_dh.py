"""
tests_dh.py
-----------
End-to-end tests for DealFlow360 Deal Health & Risk Diagnostics APIs.

Tests:
  1. HEALTHY DEAL (Score >= 80, status = HEALTHY, no risk alerts)
  2. STALLED DEAL (Detects inactivity > threshold, STALLED_DEAL alert)
  3. HIGH DISCOUNT (Detects discount anomaly vs rep baseline, DISCOUNT_ANOMALY alert)
  4. LOW MARGIN (Detects gross margin below threshold, LOW_MARGIN alert)
  5. DELIVERY RISK (Detects warehouse inventory deficit, DELIVERY_RISK alert)
  6. GET /deal-health (Lists deal health for all company deals)
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import DealEvent, Inventory, Quotation, Warehouse

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
print("  DealFlow360 -- DEAL HEALTH & RISK DIAGNOSTICS TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# Setup user, customer, warehouse, products
# ---------------------------------------------------------------------------
client.post(
    "/auth/signup",
    json={
        "full_name": "Health Inspector",
        "company_name": "HealthCorp",
        "email": "health@healthcorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
token = client.post(
    "/auth/login",
    json={"email": "health@healthcorp.com", "password": "Pass123!"},
).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

me = client.get("/auth/me", headers=headers).json()
company_id = me["company_id"]

cust = client.post(
    "/customers",
    json={"contact_name": "Health Test Client", "email": "client@health.com", "tier": "GOLD"},
    headers=headers,
).json()
customer_id = cust["id"]

# Product 1: High stock, good margin ($1,000 price, $300 cost)
prod_healthy = client.post(
    "/products",
    json={
        "name": "Standard Laptop",
        "sku": "LAP-001",
        "unit_price": "1000.00",
        "unit_cost": "300.00",
        "tax_rate": "10.00",
    },
    headers=headers,
).json()

# Product 2: Low margin product ($1,000 price, $980 cost)
prod_low_margin = client.post(
    "/products",
    json={
        "name": "Low Margin Hardware",
        "sku": "HW-LOW-01",
        "unit_price": "1000.00",
        "unit_cost": "980.00",
        "tax_rate": "10.00",
    },
    headers=headers,
).json()

# Product 3: Limited inventory product ($2,000 price, $1,000 cost)
prod_limited_stock = client.post(
    "/products",
    json={
        "name": "Rare GPU Accelerator",
        "sku": "GPU-001",
        "unit_price": "2000.00",
        "unit_cost": "1000.00",
        "tax_rate": "10.00",
    },
    headers=headers,
).json()

# Setup Warehouse & Inventory
import uuid

db = TestingSessionLocal()
wh = Warehouse(company_id=uuid.UUID(company_id), name="Central Hub", location="Delaware")
db.add(wh)
db.commit()
db.refresh(wh)

inv1 = Inventory(warehouse_id=wh.id, product_id=uuid.UUID(prod_healthy["id"]), quantity_available=500, quantity_reserved=0)
inv2 = Inventory(warehouse_id=wh.id, product_id=uuid.UUID(prod_low_margin["id"]), quantity_available=500, quantity_reserved=0)
inv3 = Inventory(warehouse_id=wh.id, product_id=uuid.UUID(prod_limited_stock["id"]), quantity_available=2, quantity_reserved=0)
db.add_all([inv1, inv2, inv3])
db.commit()
db.close()

print("\n[SETUP] Company, Products, Warehouse, and Inventory created.\n")

# ---------------------------------------------------------------------------
# TEST 1: HEALTHY DEAL
# ---------------------------------------------------------------------------
q_healthy = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod_healthy["id"], "quantity": 5, "discount_percent": 0}],
    },
    headers=headers,
).json()

dh1_resp = client.get(f"/deal-health/{q_healthy['id']}", headers=headers)
assert dh1_resp.status_code == 200, f"TEST 1 FAILED: {dh1_resp.text}"
dh1 = dh1_resp.json()

assert dh1["health_score"] >= 80, f"Expected score >=80, got {dh1['health_score']}"
assert dh1["status"] == "HEALTHY"
assert len(dh1["alerts"]) == 0

print(f"TEST 1 PASSED: Healthy deal verified (Score: {dh1['health_score']}, Status: {dh1['status']}).")

# ---------------------------------------------------------------------------
# TEST 2: STALLED DEAL (No activity for > threshold days)
# ---------------------------------------------------------------------------
q_stalled = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod_healthy["id"], "quantity": 1, "discount_percent": 0}],
    },
    headers=headers,
).json()

# Simulate past activity date (10 days ago)
db = TestingSessionLocal()
stalled_uuid = uuid.UUID(q_stalled["id"])
q_obj = db.query(Quotation).filter(Quotation.id == stalled_uuid).first()
old_date = datetime.now(timezone.utc) - timedelta(days=10)
q_obj.updated_at = old_date

# Also update deal event timestamp
evt = db.query(DealEvent).filter(DealEvent.quotation_id == stalled_uuid).first()
if evt:
    evt.created_at = old_date
db.commit()
db.close()

dh2_resp = client.get(f"/deal-health/{q_stalled['id']}", headers=headers)
assert dh2_resp.status_code == 200, f"TEST 2 FAILED: {dh2_resp.text}"
dh2 = dh2_resp.json()

alert_types_2 = [a["type"] for a in dh2["alerts"]]
assert "STALLED_DEAL" in alert_types_2
assert dh2["health_score"] < 100

print(f"TEST 2 PASSED: Stalled deal detected (Score: {dh2['health_score']}, Status: {dh2['status']}, Alerts: {alert_types_2}).")

# ---------------------------------------------------------------------------
# TEST 3: HIGH DISCOUNT (Discount Anomaly)
# ---------------------------------------------------------------------------
q_high_disc = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod_healthy["id"], "quantity": 2, "discount_percent": 30}],
    },
    headers=headers,
).json()

dh3_resp = client.get(f"/deal-health/{q_high_disc['id']}", headers=headers)
assert dh3_resp.status_code == 200, f"TEST 3 FAILED: {dh3_resp.text}"
dh3 = dh3_resp.json()

alert_types_3 = [a["type"] for a in dh3["alerts"]]
assert "DISCOUNT_ANOMALY" in alert_types_3

print(f"TEST 3 PASSED: Discount anomaly detected (Score: {dh3['health_score']}, Alerts: {alert_types_3}).")

# ---------------------------------------------------------------------------
# TEST 4: LOW MARGIN
# ---------------------------------------------------------------------------
q_low_margin = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod_low_margin["id"], "quantity": 1, "discount_percent": 5}],
    },
    headers=headers,
).json()

dh4_resp = client.get(f"/deal-health/{q_low_margin['id']}", headers=headers)
assert dh4_resp.status_code == 200, f"TEST 4 FAILED: {dh4_resp.text}"
dh4 = dh4_resp.json()

alert_types_4 = [a["type"] for a in dh4["alerts"]]
assert "LOW_MARGIN" in alert_types_4

print(f"TEST 4 PASSED: Low margin risk detected (Score: {dh4['health_score']}, Alerts: {alert_types_4}).")

# ---------------------------------------------------------------------------
# TEST 5: DELIVERY RISK (Stock deficit)
# ---------------------------------------------------------------------------
# Request 50 units of GPU Accelerator (available stock is only 2)
q_delivery = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod_limited_stock["id"], "quantity": 50, "discount_percent": 0}],
    },
    headers=headers,
).json()

dh5_resp = client.get(f"/deal-health/{q_delivery['id']}", headers=headers)
assert dh5_resp.status_code == 200, f"TEST 5 FAILED: {dh5_resp.text}"
dh5 = dh5_resp.json()

alert_types_5 = [a["type"] for a in dh5["alerts"]]
assert "DELIVERY_RISK" in alert_types_5

print(f"TEST 5 PASSED: Delivery / stock deficit risk detected (Score: {dh5['health_score']}, Alerts: {alert_types_5}).")

# ---------------------------------------------------------------------------
# TEST 6: GET /deal-health (List All Deal Health)
# ---------------------------------------------------------------------------
dh_all_resp = client.get("/deal-health", headers=headers)
assert dh_all_resp.status_code == 200, f"TEST 6 FAILED: {dh_all_resp.text}"
all_dh = dh_all_resp.json()

assert len(all_dh) >= 5
quote_ids = [d["quotation_id"] for d in all_dh]
assert q_healthy["id"] in quote_ids
assert q_delivery["id"] in quote_ids

print(f"TEST 6 PASSED: List all deal health returned {len(all_dh)} evaluations.")

print("\n" + "=" * 60)
print("  ALL DEAL HEALTH & RISK DIAGNOSTICS TESTS PASSED PERFECTLY!")
print("=" * 60)
