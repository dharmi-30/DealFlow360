"""
tests_rep.py
------------
End-to-end tests for DealFlow360 Reporting & Business Intelligence APIs.

Tests:
  1. GET /reports/sales (unfiltered baseline)
  2. GET /reports/products (unfiltered baseline)
  3. GET /reports/approvals (unfiltered baseline)
  4. Individual Filter: period (period=this_month)
  5. Individual Filter: sales_rep (sales_rep={rep_id})
  6. Individual Filter: approval_status (approval_status=CONFIRMED)
  7. Individual Filter: product (product={product_id})
  8. Individual Filter: category (category=Hardware)
  9. Combined Filters: period + sales_rep + approval_status + category
"""

import uuid
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
print("  DealFlow360 -- REPORTING & BUSINESS INTELLIGENCE TESTS")
print("=" * 60)

# ---------------------------------------------------------------------------
# Setup user, customer, products
# ---------------------------------------------------------------------------
client.post(
    "/auth/signup",
    json={
        "full_name": "Report Admin",
        "company_name": "ReportCorp",
        "email": "admin@reportcorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
token = client.post(
    "/auth/login",
    json={"email": "admin@reportcorp.com", "password": "Pass123!"},
).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

me = client.get("/auth/me", headers=headers).json()
sales_rep_id = me["id"]

cust = client.post(
    "/customers",
    json={"contact_name": "Report Client", "email": "client@report.com", "tier": "GOLD"},
    headers=headers,
).json()
customer_id = cust["id"]

# Product A (Hardware)
prod1 = client.post(
    "/products",
    json={
        "name": "Server Rack",
        "sku": "SRV-RACK",
        "category": "Hardware",
        "unit_price": "2000.00",
        "unit_cost": "1000.00",
        "tax_rate": "10.00",
    },
    headers=headers,
).json()
prod1_id = prod1["id"]

# Product B (Software)
prod2 = client.post(
    "/products",
    json={
        "name": "Analytics License",
        "sku": "ANA-LIC",
        "category": "Software",
        "unit_price": "1000.00",
        "unit_cost": "200.00",
        "tax_rate": "5.00",
    },
    headers=headers,
).json()
prod2_id = prod2["id"]

# Create Quote 1 (Hardware, CONFIRMED)
q1 = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod1_id, "quantity": 5, "discount_percent": 0}],
    },
    headers=headers,
).json()
client.post(f"/quotations/{q1['id']}/submit", headers=headers)
client.post(f"/quotations/{q1['id']}/confirm", headers=headers)

# Create Quote 2 (Software, PENDING_APPROVAL due to high discount)
q2 = client.post(
    "/quotations",
    json={
        "customer_id": customer_id,
        "items": [{"product_id": prod2_id, "quantity": 10, "discount_percent": 25}],
    },
    headers=headers,
).json()
client.post(f"/quotations/{q2['id']}/submit", headers=headers)

print("\n[SETUP] Users, Products, and Quotations initialized.\n")

# ---------------------------------------------------------------------------
# TEST 1: Unfiltered Sales Report
# ---------------------------------------------------------------------------
r_sales = client.get("/reports/sales", headers=headers).json()
assert Decimal(r_sales["total_sales"]) == Decimal("11000.00")  # 5 * 2000 + 10% tax
assert r_sales["confirmed_quote_count"] == 1
assert Decimal(r_sales["total_quotation_value"]) > Decimal("11000.00")

print(f"TEST 1 PASSED: Unfiltered Sales Report (Total Sales: ${r_sales['total_sales']}, Confirmed: {r_sales['confirmed_quote_count']}).")

# ---------------------------------------------------------------------------
# TEST 2: Unfiltered Product Report
# ---------------------------------------------------------------------------
r_prod = client.get("/reports/products", headers=headers).json()
assert len(r_prod) == 2
prod_names = [p["product_name"] for p in r_prod]
assert "Server Rack" in prod_names
assert "Analytics License" in prod_names

print(f"TEST 2 PASSED: Unfiltered Product Report (Products returned: {len(r_prod)}).")

# ---------------------------------------------------------------------------
# TEST 3: Unfiltered Approval Report
# ---------------------------------------------------------------------------
r_appr = client.get("/reports/approvals", headers=headers).json()
assert r_appr["pending"] >= 1

print(f"TEST 3 PASSED: Unfiltered Approval Report (Pending: {r_appr['pending']}, Approved: {r_appr['approved']}).")

# ---------------------------------------------------------------------------
# TEST 4: Individual Filter — period (period=this_month)
# ---------------------------------------------------------------------------
r_sales_period = client.get("/reports/sales?period=this_month", headers=headers).json()
assert Decimal(r_sales_period["total_sales"]) == Decimal("11000.00")

print("TEST 4 PASSED: Individual filter (period=this_month) verified.")

# ---------------------------------------------------------------------------
# TEST 5: Individual Filter — sales_rep
# ---------------------------------------------------------------------------
r_sales_rep = client.get(f"/reports/sales?sales_rep={sales_rep_id}", headers=headers).json()
assert Decimal(r_sales_rep["total_sales"]) == Decimal("11000.00")

print("TEST 5 PASSED: Individual filter (sales_rep) verified.")

# ---------------------------------------------------------------------------
# TEST 6: Individual Filter — approval_status (approval_status=CONFIRMED)
# ---------------------------------------------------------------------------
r_sales_status = client.get("/reports/sales?approval_status=CONFIRMED", headers=headers).json()
assert r_sales_status["confirmed_quote_count"] == 1

print("TEST 6 PASSED: Individual filter (approval_status=CONFIRMED) verified.")

# ---------------------------------------------------------------------------
# TEST 7: Individual Filter — product
# ---------------------------------------------------------------------------
r_prod_filter = client.get(f"/reports/products?product={prod1_id}", headers=headers).json()
assert len(r_prod_filter) == 1
assert r_prod_filter[0]["product_name"] == "Server Rack"

print("TEST 7 PASSED: Individual filter (product) verified.")

# ---------------------------------------------------------------------------
# TEST 8: Individual Filter — category (category=Hardware)
# ---------------------------------------------------------------------------
r_cat_filter = client.get("/reports/products?category=Hardware", headers=headers).json()
assert len(r_cat_filter) == 1
assert r_cat_filter[0]["category"] == "Hardware"

print("TEST 8 PASSED: Individual filter (category=Hardware) verified.")

# ---------------------------------------------------------------------------
# TEST 9: Combined Filters (period + sales_rep + approval_status + category)
# ---------------------------------------------------------------------------
combined_url = (
    f"/reports/sales?period=this_month&sales_rep={sales_rep_id}"
    f"&approval_status=CONFIRMED&category=Hardware"
)
r_combined = client.get(combined_url, headers=headers).json()
assert Decimal(r_combined["total_sales"]) == Decimal("11000.00")
assert r_combined["confirmed_quote_count"] == 1

print("TEST 9 PASSED: Combined filters (period + sales_rep + status + category) verified.")

print("\n" + "=" * 60)
print("  ALL REPORTING & BUSINESS INTELLIGENCE TESTS PASSED PERFECTLY!")
print("=" * 60)
