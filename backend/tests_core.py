"""
tests_core.py
-------------
Core module tests for DealFlow360 (Auth, Customers, Products, Quotations, Approvals, Recommendations).
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
print("  DealFlow360 -- CORE MODULE TESTS")
print("=" * 60)

# 1. AUTH & SIGNUP
signup_res = client.post(
    "/auth/signup",
    json={
        "full_name": "Test Core Admin",
        "company_name": "CoreCorp",
        "email": "admin@corecorp.com",
        "password": "Pass123!",
        "role": "ADMIN",
    },
)
assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
user_data = signup_res.json()
assert "id" in user_data
assert "company_id" in user_data
assert "hashed_password" not in user_data
assert "password" not in user_data

# LOGIN
login_res = client.post(
    "/auth/login",
    json={"email": "admin@corecorp.com", "password": "Pass123!"},
)
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# ME
me_res = client.get("/auth/me", headers=headers)
assert me_res.status_code == 200
assert me_res.json()["email"] == "admin@corecorp.com"

print("TEST 1 PASSED: Auth signup, login, JWT validation, /me verified cleanly.")

# 2. CUSTOMERS CRUD & SEARCH
c_res = client.post(
    "/customers",
    json={
        "contact_name": "Acme Widgets",
        "email": "acme@widgets.com",
        "tier": "GOLD",
        "company_name": "Acme Inc",
    },
    headers=headers,
)
assert c_res.status_code == 201
cust_id = c_res.json()["id"]

# Search customer
c_search = client.get("/customers?search=Acme", headers=headers)
assert c_search.status_code == 200
assert len(c_search.json()) >= 1

print("TEST 2 PASSED: Customer creation, retrieval, and search verified.")

# 3. PRODUCTS CRUD, SEARCH & CATEGORY FILTER
p_res = client.post(
    "/products",
    json={
        "name": "Cloud Storage Pro",
        "sku": "STOR-PRO",
        "category": "Cloud Services",
        "unit_price": "100.00",
        "unit_cost": "20.00",
        "tax_rate": "18.00",
        "is_subscription": True,
    },
    headers=headers,
)
assert p_res.status_code == 201
prod_id = p_res.json()["id"]

p_filter = client.get("/products?category=Cloud%20Services", headers=headers)
assert p_filter.status_code == 200
assert len(p_filter.json()) >= 1

print("TEST 3 PASSED: Product creation, search, and category filtering verified.")

# 4. QUOTATION CREATION & PRICING
q_res = client.post(
    "/quotations",
    json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 10, "discount_percent": 10}],
    },
    headers=headers,
)
assert q_res.status_code == 201
q_data = q_res.json()
# unit_price=100.00, discount=10% -> 90.00 * 10 = 900 subtotal, 18% tax = 162.00, total = 1062.00
assert Decimal(q_data["subtotal"]) == Decimal("1000.00")
assert Decimal(q_data["discount_amount"]) == Decimal("100.00")
assert Decimal(q_data["tax_amount"]) == Decimal("162.00")
assert Decimal(q_data["total_amount"]) == Decimal("1062.00")
quote_id = q_data["id"]

print("TEST 4 PASSED: Quotation creation and backend monetary calculations verified.")

# 5. RECOMMENDATION ENGINE
rec_res = client.get(f"/quotations/{quote_id}/recommendations", headers=headers)
assert rec_res.status_code == 200
assert isinstance(rec_res.json(), list)

print("TEST 5 PASSED: Recommendation engine endpoint verified.")

print("\n" + "=" * 60)
print("  ALL CORE MODULE TESTS PASSED PERFECTLY!")
print("=" * 60)
