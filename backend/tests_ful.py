import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import DealEvent, Inventory, Warehouse

engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False}, poolclass=StaticPool)
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

print('--- TESTING FULFILLMENT SYSTEM ---')

# 1. SETUP COMPANY & USER
client.post('/auth/signup', json={'full_name': 'Supply Chain Rep', 'company_name': 'LogisticsCorp', 'email': 'ops@logistics.com', 'password': 'Pass123!', 'role': 'SALES_REP'})
token = client.post('/auth/login', json={'email': 'ops@logistics.com', 'password': 'Pass123!'}).json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

# Get user company_id
me = client.get('/auth/me', headers=headers).json()
company_id = uuid.UUID(me['company_id'])

# 2. SETUP WAREHOUSES
db = TestingSessionLocal()
wh_mumbai = Warehouse(company_id=company_id, name='Mumbai Warehouse', location='Mumbai', shipping_cost=Decimal('800.00'))
wh_surat = Warehouse(company_id=company_id, name='Surat Warehouse', location='Surat', shipping_cost=Decimal('1000.00'))
db.add(wh_mumbai)
db.add(wh_surat)
db.commit()
db.refresh(wh_mumbai)
db.refresh(wh_surat)

wh_mumbai_id = str(wh_mumbai.id)
wh_surat_id = str(wh_surat.id)

# 3. SETUP PRODUCTS & CUSTOMER
cust = client.post('/customers', json={'contact_name': 'Distributor Client', 'email': 'client@dist.com', 'tier': 'GOLD'}, headers=headers).json()
prod_a = client.post('/products', json={'name': 'Widget A', 'sku': 'WID-A', 'unit_price': '1000.00', 'unit_cost': '500.00'}, headers=headers).json()
prod_b = client.post('/products', json={'name': 'Widget B', 'sku': 'WID-B', 'unit_price': '2000.00', 'unit_cost': '800.00'}, headers=headers).json()

# 4. SETUP INVENTORY IN WAREHOUSES
# WH Mumbai has 10 units of Prod A, 4 units of Prod B
inv1 = Inventory(warehouse_id=wh_mumbai.id, product_id=uuid.UUID(prod_a['id']), quantity_available=10, quantity_reserved=0)
inv2 = Inventory(warehouse_id=wh_mumbai.id, product_id=uuid.UUID(prod_b['id']), quantity_available=4, quantity_reserved=0)

# WH Surat has 6 units of Prod B
inv3 = Inventory(warehouse_id=wh_surat.id, product_id=uuid.UUID(prod_b['id']), quantity_available=6, quantity_reserved=0)

db.add_all([inv1, inv2, inv3])
db.commit()
db.close()

print('Warehouses & Inventory Setup Completed.')

# ----------------------------------------------------
# TEST 1: ONE WAREHOUSE FULFILLMENT
# ----------------------------------------------------
# Quote 1: 6 units of Prod A (Mumbai has 10 units)
q1 = client.post('/quotations', json={'customer_id': cust['id'], 'items': [{'product_id': prod_a['id'], 'quantity': 6}]}, headers=headers).json()
ful1_resp = client.get(f"/quotations/{q1['id']}/fulfillment", headers=headers)
assert ful1_resp.status_code == 200, f'Fulfillment failed: {ful1_resp.text}'
ful1 = ful1_resp.json()

assert ful1['shipment_count'] == 1
assert Decimal(ful1['estimated_shipping_cost']) == Decimal('800.00')
assert ful1['backordered_quantity'] == 0
assert len(ful1['allocations']) == 1
assert ful1['allocations'][0]['warehouse_name'] == 'Mumbai Warehouse'
assert ful1['allocations'][0]['quantity'] == 6

# Accept Fulfillment 1
acc1 = client.post(f"/quotations/{q1['id']}/fulfillment/accept", headers=headers)
assert acc1.status_code == 200
print('TEST 1 PASSED: One warehouse fulfillment (Mumbai: 6 units, shipping: $800.00, backorder: 0).')

# ----------------------------------------------------
# TEST 2: TWO WAREHOUSE SPLIT FULFILLMENT
# ----------------------------------------------------
# Quote 2: 8 units of Prod B (WH Surat has 6 net avail, WH Mumbai has 4 net avail)
q2 = client.post('/quotations', json={'customer_id': cust['id'], 'items': [{'product_id': prod_b['id'], 'quantity': 8}]}, headers=headers).json()
ful2 = client.get(f"/quotations/{q2['id']}/fulfillment", headers=headers).json()

assert ful2['shipment_count'] == 2
assert Decimal(ful2['estimated_shipping_cost']) == Decimal('1800.00')
assert ful2['backordered_quantity'] == 0
assert len(ful2['allocations']) == 2
print('TEST 2 PASSED: Two warehouse split fulfillment (Surat + Mumbai, shipping: $1800.00, backorder: 0).')

# ----------------------------------------------------
# TEST 3: INSUFFICIENT STOCK & BACKORDER
# ----------------------------------------------------
# Quote 3: 15 units of Prod B (Total Prod B stock is 10 units)
q3 = client.post('/quotations', json={'customer_id': cust['id'], 'items': [{'product_id': prod_b['id'], 'quantity': 15}]}, headers=headers).json()
ful3 = client.get(f"/quotations/{q3['id']}/fulfillment", headers=headers).json()

assert ful3['backordered_quantity'] == 5
print('TEST 3 PASSED: Insufficient stock handled correctly (Backordered quantity: 5).')

# ----------------------------------------------------
# TEST 4: MANUAL OVERRIDE
# ----------------------------------------------------
# Override Quote 2 allocation: 4 from Mumbai, 4 from Surat
override_payload = {
    'allocations': [
        {'warehouse_id': wh_mumbai_id, 'product_id': prod_b['id'], 'quantity': 4},
        {'warehouse_id': wh_surat_id, 'product_id': prod_b['id'], 'quantity': 4}
    ]
}
ov_resp = client.post(f"/quotations/{q2['id']}/fulfillment/override", json=override_payload, headers=headers)
assert ov_resp.status_code == 200, f'Override failed: {ov_resp.text}'
ov_data = ov_resp.json()

assert ov_data['shipment_count'] == 2
assert Decimal(ov_data['estimated_shipping_cost']) == Decimal('1800.00')
assert ov_data['backordered_quantity'] == 0

# Test invalid override exceeding stock (attempt 10 from Mumbai where available is 4)
invalid_ov_payload = {
    'allocations': [
        {'warehouse_id': wh_mumbai_id, 'product_id': prod_b['id'], 'quantity': 10}
    ]
}
invalid_resp = client.post(f"/quotations/{q2['id']}/fulfillment/override", json=invalid_ov_payload, headers=headers)
assert invalid_resp.status_code == 400
assert 'exceeds available stock' in invalid_resp.text
print('TEST 4 PASSED: Manual override succeeded & stock validation constraint enforced.')

# Verify Deal Events in DB
db = TestingSessionLocal()
events = db.query(DealEvent).filter(DealEvent.event_type.in_(['FULFILLMENT_ACCEPTED', 'FULFILLMENT_OVERRIDDEN'])).all()
assert len(events) >= 2
print('DEAL EVENTS VERIFIED: Logged fulfillment acceptance and override events.')
db.close()

print('=== ALL FULFILLMENT LOGIC TESTS PASSED PERFECTLY! ===')
