-- =============================================================================
-- DealFlow360 — PostgreSQL Database Schema Definition
-- Database: dealflow360
-- Target Engine: PostgreSQL 13+
-- Description: Clean, normalized, production-grade schema for hackathon MVP.
--              Implements 15 core domain entities with strict foreign keys,
--              enums, check constraints, historical line-item snapshots,
--              and multi-column indexes.
-- =============================================================================

-- Enable extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES DEFINITION
-- =============================================================================

-- Application User Roles
CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'SALES_REP',
    'SALES_MANAGER',
    'FINANCE'
);

-- Customer Membership / Commercial Tiers
CREATE TYPE customer_tier AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD'
);

-- Commercial Quotation Life-Cycle Statuses
CREATE TYPE quotation_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'NEGOTIATION',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED'
);

-- Governance Approval Roles
CREATE TYPE approval_role AS ENUM (
    'SALES_MANAGER',
    'FINANCE'
);

-- Approval Decision Statuses
CREATE TYPE approval_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'RETURNED'
);

-- Recurring Subscription Billing Cycles
CREATE TYPE billing_cycle AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY'
);

-- Subscription Statuses
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CANCELLED'
);

-- Invoice Types
CREATE TYPE invoice_type AS ENUM (
    'ONE_TIME',
    'RECURRING'
);

-- Invoice Statuses
CREATE TYPE invoice_status AS ENUM (
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);

-- Payment Methods
CREATE TYPE payment_method AS ENUM (
    'CARD',
    'BANK_TRANSFER',
    'UPI',
    'CASH'
);


-- =============================================================================
-- TABLE 1: COMPANIES (Tenant Organizations)
-- =============================================================================
CREATE TABLE companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 2: USERS (Internal Application Users)
-- =============================================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'SALES_REP',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 3: CUSTOMERS (External Clients)
-- =============================================================================
CREATE TABLE customers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(50),
    address      TEXT,
    tier         customer_tier NOT NULL DEFAULT 'BRONZE',
    status       VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 3.5: CATEGORIES (Product & Service Categories)
-- =============================================================================
CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);


-- =============================================================================
-- TABLE 4: PRODUCTS (Catalog Items)
-- =============================================================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    sku             VARCHAR(100) NOT NULL,
    category        VARCHAR(100),
    description     TEXT,
    unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    unit_cost       NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    tax_rate        NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 5: DISCOUNT_RULES (Governance Discount Policies)
-- =============================================================================
CREATE TABLE discount_rules (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name                 VARCHAR(255) NOT NULL,
    customer_tier        customer_tier,
    category             VARCHAR(100),
    min_quantity         INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
    max_discount_percent NUMERIC(5, 2) NOT NULL CHECK (max_discount_percent >= 0 AND max_discount_percent <= 100),
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 6: WAREHOUSES (Physical Storage Facilities)
-- =============================================================================
CREATE TABLE warehouses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    location      VARCHAR(255),
    shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 7: INVENTORY (Stock Availability & Reservations)
-- Note: Available stock is calculated dynamically as (quantity - reserved_quantity)
-- =============================================================================
CREATE TABLE inventory (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id      UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity          INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_inventory_warehouse_product UNIQUE (warehouse_id, product_id),
    CONSTRAINT chk_inventory_reserved_lte_quantity CHECK (reserved_quantity <= quantity)
);


-- =============================================================================
-- TABLE 8: QUOTATIONS (Commercial Proposals & Margins)
-- =============================================================================
CREATE TABLE quotations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sales_rep_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    quote_number      VARCHAR(100) NOT NULL UNIQUE,
    status            quotation_status NOT NULL DEFAULT 'DRAFT',
    subtotal          NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount   NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount      NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    estimated_cost    NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_cost >= 0),
    margin_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    margin_percent    NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    risk_score        NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (risk_score >= 0 AND risk_score <= 100),
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 9: QUOTE_ITEMS (Line Item Snapshots for Historical Audit Stability)
-- =============================================================================
CREATE TABLE quote_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id     UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name     VARCHAR(255) NOT NULL,
    category         VARCHAR(100),
    unit_price       NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    unit_cost        NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    tax_rate         NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    quantity         INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    line_subtotal    NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (line_subtotal >= 0),
    discount_amount  NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount       NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total       NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 10: APPROVALS (Managerial & Financial Approval Workflow Decisions)
-- =============================================================================
CREATE TABLE approvals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    approver_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_role approval_role NOT NULL,
    status        approval_status NOT NULL DEFAULT 'PENDING',
    comments      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 11: NEGOTIATIONS (Customer Negotiation History Rounds)
-- =============================================================================
CREATE TABLE negotiations (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id               UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    quote_item_id              UUID REFERENCES quote_items(id) ON DELETE SET NULL,
    actor_id                   UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type                 VARCHAR(50) NOT NULL DEFAULT 'USER',
    requested_quantity         INT CHECK (requested_quantity IS NULL OR requested_quantity > 0),
    requested_discount_percent NUMERIC(5, 2) CHECK (requested_discount_percent IS NULL OR (requested_discount_percent >= 0 AND requested_discount_percent <= 100)),
    proposed_total             NUMERIC(14, 2) NOT NULL CHECK (proposed_total >= 0),
    notes                      TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 12: SUBSCRIPTIONS (Recurring Contract Agreements)
-- =============================================================================
CREATE TABLE subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id      UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name      VARCHAR(255) NOT NULL,
    unit_price        NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity          INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    billing_cycle     billing_cycle NOT NULL DEFAULT 'MONTHLY',
    amount            NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    start_date        TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ NOT NULL,
    end_date          TIMESTAMPTZ,
    status            subscription_status NOT NULL DEFAULT 'ACTIVE',
    cancellation_note TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 13: INVOICES (Billing Documents & Financial Collection)
-- =============================================================================
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_number  VARCHAR(100) NOT NULL UNIQUE,
    type            invoice_type NOT NULL DEFAULT 'ONE_TIME',
    amount          NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    tax             NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total           NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    paid_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status          invoice_status NOT NULL DEFAULT 'ISSUED',
    due_date        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 14: PAYMENTS (Transaction Collection Logs)
-- =============================================================================
CREATE TABLE payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount         NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL,
    reference      VARCHAR(255),
    payment_date   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- TABLE 15: DEAL_EVENTS (Audit Timeline & Lifecycle Event History)
-- =============================================================================
CREATE TABLE deal_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type   VARCHAR(100) NOT NULL,
    description  TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- PERFORMANCE INDEXES DEFINITION
-- =============================================================================

-- Users Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);

-- Customers Indexes
CREATE INDEX idx_customers_company_id ON customers(company_id);

-- Products Indexes
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);

-- Discount Rules Indexes
CREATE INDEX idx_discount_rules_company_id ON discount_rules(company_id);

-- Warehouses Indexes
CREATE INDEX idx_warehouses_company_id ON warehouses(company_id);

-- Inventory Indexes
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Quotations Indexes
CREATE INDEX idx_quotations_quote_number ON quotations(quote_number);
CREATE INDEX idx_quotations_company_id ON quotations(company_id);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_sales_rep_id ON quotations(sales_rep_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

-- Quote Items Indexes
CREATE INDEX idx_quote_items_quotation_id ON quote_items(quotation_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);

-- Approvals Indexes
CREATE INDEX idx_approvals_quotation_id ON approvals(quotation_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);

-- Negotiations Indexes
CREATE INDEX idx_negotiations_quotation_id ON negotiations(quotation_id);
CREATE INDEX idx_negotiations_quote_item_id ON negotiations(quote_item_id);

-- Subscriptions Indexes
CREATE INDEX idx_subscriptions_quotation_id ON subscriptions(quotation_id);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_product_id ON subscriptions(product_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Invoices Indexes
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_quotation_id ON invoices(quotation_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Payments Indexes
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- Deal Events Indexes
CREATE INDEX idx_deal_events_quotation_id ON deal_events(quotation_id);
CREATE INDEX idx_deal_events_actor_id ON deal_events(actor_id);
CREATE INDEX idx_deal_events_event_type ON deal_events(event_type);
CREATE INDEX idx_deal_events_created_at ON deal_events(created_at);

CREATE TABLE deal_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    actor_id     UUID REFERENCES users(id),
    event_type   VARCHAR(100) NOT NULL, -- e.g., DISPATCH_RELEASED
    description  TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- =============================================================================
-- SEED DEMO DATA INSERTS
-- =============================================================================

-- 1. COMPANIES
INSERT INTO companies (id, name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DealFlow360 Operations');

-- 2. USERS
INSERT INTO users (id, company_id, email, password_hash, full_name, role, is_active) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'rahul@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Rahul Sharma', 'ADMIN', true),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 's.jenkins@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Sarah Jenkins', 'SALES_REP', true),
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd.chen@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'David Chen', 'SALES_REP', true),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'm.ross@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Michael Ross', 'SALES_REP', true),
('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a.morgan@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Alex Morgan', 'SALES_MANAGER', true),
('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'finance@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Finance Controller', 'FINANCE', true);

-- 3. CUSTOMERS
INSERT INTO customers (id, company_id, company_name, contact_name, email, phone, address, tier, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corp', 'Marcus Vance', 'm.vance@acme-corp.com', '+1-555-0192', '100 Industrial Parkway, Suite 400, Dallas, TX 75201', 'GOLD', 'ACTIVE'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beta Industries', 'Elena Rostova', 'e.rostova@betaind.com', '+1-555-0144', '850 Tech Center Way, Bldg B, Chicago, IL 60611', 'GOLD', 'ACTIVE'),
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zenith Co', 'Robert Thorne', 'r.thorne@zenithco.io', '+1-555-0188', '42 Innovation Drive, Austin, TX 78701', 'SILVER', 'ACTIVE'),
('c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Delta LLC', 'Patricia Morales', 'p.morales@deltallc.net', '+1-555-0167', '1200 Logistics Center Blvd, Atlanta, GA 30303', 'GOLD', 'ACTIVE'),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nova Retail', 'Jason Vance', 'j.vance@novaretail.com', '+1-555-0122', '500 Market St, San Francisco, CA 94105', 'BRONZE', 'ACTIVE'),
('c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Orion Ltd', 'Victoria Sterling', 'v.sterling@orion.co.uk', '+44-20-7946-0912', '10 Park Lane, London, UK', 'GOLD', 'ACTIVE');

-- 3.5. CATEGORIES
INSERT INTO categories (id, name) VALUES
('cat-11111111-1111-1111-1111-111111111111', 'Hardware'),
('cat-22222222-2222-2222-2222-222222222222', 'Software Subscription'),
('cat-33333333-3333-3333-3333-333333333333', 'Professional Services'),
('cat-44444444-4444-4444-4444-444444444444', 'Support');

-- 4. PRODUCTS
INSERT INTO products (id, company_id, name, sku, category, description, unit_price, unit_cost, tax_rate, is_subscription, active) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Laptop Pro 14', 'HW-LTP-14', 'Hardware', 'High-performance M3 Pro Workstation Laptop with 32GB RAM & 1TB SSD.', 1850.00, 1250.00, 18.00, false, true),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onsite Setup Service', 'SV-ONSITE-SET', 'Professional Services', 'White-glove enterprise deployment, network integration & user onboarding.', 450.00, 180.00, 18.00, false, true),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Extended Warranty', 'HW-EXT-WRN', 'Support', '3-year accidental damage protection & advance hardware replacement.', 299.00, 95.00, 18.00, false, true),
('d4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Docking Station', 'HW-DCK-STN', 'Hardware', 'Thunderbolt 4 Quad-Display Docking Hub with 100W Power Delivery.', 220.00, 135.00, 18.00, false, true),
('d5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Care Plan 2yr', 'SV-CARE-2YR', 'Software Subscription', '24/7 Priority SLA response, dedicated technical account manager & quarterly reviews.', 650.00, 220.00, 18.00, true, true);

-- 5. DISCOUNT RULES
INSERT INTO discount_rules (id, company_id, name, customer_tier, category, min_quantity, max_discount_percent, is_active) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Standard Rep Limit', NULL, NULL, 1, 10.00, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manager Threshold Limit', NULL, NULL, 1, 20.00, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gold Tier Bulk Volume Rule', 'GOLD', 'Hardware', 10, 25.00, true);

-- 6. WAREHOUSES
INSERT INTO warehouses (id, company_id, name, location, shipping_cost, active) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dallas Warehouse (HUB-01)', 'Dallas, TX', 150.00, true),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chicago Warehouse (HUB-02)', 'Chicago, IL', 175.00, true),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Frankfurt Warehouse (HUB-03)', 'Frankfurt, Germany', 300.00, true);

-- 7. INVENTORY
INSERT INTO inventory (id, warehouse_id, product_id, quantity, reserved_quantity) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 250, 45),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 170, 20),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 120, 15),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 65, 10);

-- 8. QUOTATIONS
INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, quote_number, status, subtotal, discount_amount, tax_amount, total_amount, estimated_cost, margin_amount, margin_percent, risk_score, approval_required) VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8492', 'PENDING_APPROVAL', 15480.00, 3080.00, 0.00, 12400.00, 8200.00, 4200.00, 33.90, 78.00, true),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8495', 'APPROVED', 32000.00, 3200.00, 0.00, 28800.00, 18500.00, 10300.00, 35.80, 94.00, false),
('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Q-1015', 'DRAFT', 10500.00, 750.00, 0.00, 9750.00, 6200.00, 3550.00, 36.40, 15.00, false),
('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Q-1030', 'NEGOTIATION', 17000.00, 1700.00, 0.00, 15300.00, 9800.00, 5500.00, 35.90, 61.00, false),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Q-1050', 'CONFIRMED', 46000.00, 5000.00, 0.00, 41000.00, 26000.00, 15000.00, 36.60, 10.00, false);

-- 9. QUOTE ITEMS
INSERT INTO quote_items (id, quotation_id, product_id, product_name, category, unit_price, unit_cost, tax_rate, quantity, discount_percent, line_subtotal, discount_amount, tax_amount, line_total) VALUES
('qi-1042-101', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.00, 1250.00, 18.00, 6, 12.00, 11100.00, 1332.00, 0.00, 9768.00),
('qi-1042-102', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.00, 180.00, 18.00, 2, 15.00, 900.00, 135.00, 0.00, 765.00),
('qi-1042-103', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.00, 95.00, 18.00, 2, 10.00, 598.00, 59.80, 0.00, 538.20),
('qi-1028-101', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.00, 1250.00, 18.00, 15, 10.00, 27750.00, 2775.00, 0.00, 24975.00),
('qi-1028-102', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Docking Station', 'Hardware', 220.00, 135.00, 18.00, 20, 12.50, 4400.00, 550.00, 0.00, 3850.00),
('qi-1015-101', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.00, 1250.00, 18.00, 5, 6.00, 9250.00, 555.00, 0.00, 8695.00),
('qi-1015-102', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Docking Station', 'Hardware', 220.00, 135.00, 18.00, 2, 5.00, 440.00, 22.00, 0.00, 418.00),
('qi-1015-103', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.00, 180.00, 18.00, 1, 10.00, 450.00, 45.00, 0.00, 405.00),
('qi-1015-104', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.00, 220.00, 18.00, 1, 10.00, 650.00, 65.00, 0.00, 585.00),
('qi-1030-101', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.00, 1250.00, 18.00, 8, 10.00, 14800.00, 1480.00, 0.00, 13320.00),
('qi-1030-102', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Docking Station', 'Hardware', 220.00, 135.00, 18.00, 10, 10.00, 2200.00, 220.00, 0.00, 1980.00),
('qi-1050-101', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.00, 1250.00, 18.00, 20, 10.00, 37000.00, 3700.00, 0.00, 33300.00),
('qi-1050-102', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Docking Station', 'Hardware', 220.00, 135.00, 18.00, 20, 10.00, 4400.00, 440.00, 0.00, 3960.00),
('qi-1050-103', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.00, 220.00, 18.00, 7, 10.00, 4550.00, 455.00, 0.00, 4095.00);

-- 10. APPROVALS
INSERT INTO approvals (id, quotation_id, approver_id, approval_role, status, comments) VALUES
('11111111-9c0b-4ef8-bb6d-6bb9bd380a77', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount 18.5% exceeds Rep Max Threshold (10.0%)'),
('22222222-9c0b-4ef8-bb6d-6bb9bd380a77', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Approved due to multi-year strategic software expansion commitment.');

-- 11. NEGOTIATIONS
INSERT INTO negotiations (id, quotation_id, quote_item_id, actor_id, actor_type, requested_quantity, requested_discount_percent, proposed_total, notes) VALUES
('33333333-1111-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 2, 18.00, 12400.00, 'Proposal generated with 18% setup discount requested.'),
('33333333-2222-4ef8-bb6d-6bb9bd380a11', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.00, 15300.00, 'We accept hardware line items if setup service discount is 12%.');

-- 12. SUBSCRIPTIONS
INSERT INTO subscriptions (id, quotation_id, customer_id, product_id, product_name, unit_price, quantity, billing_cycle, amount, start_date, next_billing_date, status) VALUES
('33333333-9c0b-4ef8-bb6d-6bb9bd380a88', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr + Premium Support', 650.00, 45, 'MONTHLY', 4500.00, '2025-10-01 00:00:00+00', '2026-10-01 00:00:00+00', 'ACTIVE'),
('44444444-9c0b-4ef8-bb6d-6bb9bd380a88', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Enterprise Care Plan & SLA', 650.00, 120, 'YEARLY', 12500.00, '2025-09-15 00:00:00+00', '2026-09-15 00:00:00+00', 'ACTIVE'),
('55555555-9c0b-4ef8-bb6d-6bb9bd380a88', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Care SLA', 650.00, 15, 'MONTHLY', 1800.00, '2026-01-10 00:00:00+00', '2027-01-10 00:00:00+00', 'ACTIVE');

-- 13. INVOICES
INSERT INTO invoices (id, quotation_id, customer_id, subscription_id, invoice_number, type, amount, tax, total, paid_amount, status, due_date) VALUES
('66666666-9c0b-4ef8-bb6d-6bb9bd380a99', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '44444444-9c0b-4ef8-bb6d-6bb9bd380a88', 'INV-2026-0811', 'ONE_TIME', 105110.00, 0.00, 105110.00, 0.00, 'ISSUED', '2026-10-02 00:00:00+00'),
('77777777-9c0b-4ef8-bb6d-6bb9bd380a99', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '33333333-9c0b-4ef8-bb6d-6bb9bd380a88', 'INV-2026-0740', 'ONE_TIME', 42500.00, 0.00, 42500.00, 42500.00, 'PAID', '2026-09-25 00:00:00+00'),
('88888888-9c0b-4ef8-bb6d-6bb9bd380a99', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-0601', 'ONE_TIME', 18400.00, 0.00, 18400.00, 5000.00, 'PARTIALLY_PAID', '2026-08-10 00:00:00+00');

-- 14. PAYMENTS
INSERT INTO payments (id, invoice_id, amount, payment_method, reference, payment_date) VALUES
('99999999-9c0b-4ef8-bb6d-6bb9bd380a00', '77777777-9c0b-4ef8-bb6d-6bb9bd380a99', 42500.00, 'BANK_TRANSFER', 'TXN-BANK-994821', '2026-08-28 11:30:00+00'),
('aaaaaa11-9c0b-4ef8-bb6d-6bb9bd380a00', '88888888-9c0b-4ef8-bb6d-6bb9bd380a99', 5000.00, 'CARD', 'TXN-CARD-883011', '2026-07-20 15:45:00+00');

-- 15. DEAL EVENTS
INSERT INTO deal_events (id, quotation_id, actor_id, event_type, description) VALUES
('e1111111-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8492 created and routed to Manager Approval.'),
('e2222222-9c0b-4ef8-bb6d-6bb9bd380a11', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8495 approved by Alex Morgan.'),
('e3333333-9c0b-4ef8-bb6d-6bb9bd380a11', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'COUNTER_OFFER_RECEIVED', 'Acme Corp submitted counter offer with 12% target setup discount.');

-- Approvals Sign-Off
INSERT INTO approvals (id, quotation_id, approver_id, approval_role, status, comments) VALUES
('11111111-9c0b-4ef8-bb6d-6bb9bd380a88', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount 15.0% requires manager approval');

-- Negotiation Messages
INSERT INTO negotiations (id, quotation_id, quote_item_id, actor_id, actor_type, requested_quantity, requested_discount_percent, proposed_total, notes) VALUES
('33333333-3333-4ef8-bb6d-6bb9bd380a11', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 15.00, 9750.00, 'Requested 15% discount on bulk hardware order.');

-- Deal Events Audit Trail
INSERT INTO deal_events (id, quotation_id, actor_id, event_type, description) VALUES
('e4444444-9c0b-4ef8-bb6d-6bb9bd380a11', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation Q-1015 created and line items configured.');
