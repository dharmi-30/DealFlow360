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
-- =============================================================================
-- SEED DEMO DATA INSERTS (Comprehensive 480+ Enterprise Operational Records)
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
('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'finance@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Finance Controller', 'FINANCE', true),
('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e.watson@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Emma Watson', 'SALES_OPS_DIRECTOR', true),
('b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'r.kumar@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Rajesh Kumar', 'SALES_REP', true),
('b9eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c.taylor@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Chris Taylor', 'SALES_MANAGER', true),
('b10ebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'audit@dealflow360.com', '$2b$12$eWzXb1.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w0.1w', 'Audit Controller', 'ADMIN', true);


-- 3. CUSTOMERS
INSERT INTO customers (id, company_id, company_name, contact_name, email, phone, address, tier, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corp', 'Marcus Vance', 'm.vance@acme-corp.com', '+1-555-0192', '100 Industrial Pkwy, Dallas, TX 75201', 'GOLD', 'ACTIVE'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beta Industries', 'Elena Rostova', 'e.rostova@betaind.com', '+1-555-0144', '850 Tech Center Way, Chicago, IL 60611', 'GOLD', 'ACTIVE'),
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zenith Co', 'Robert Thorne', 'r.thorne@zenithco.io', '+1-555-0188', '42 Innovation Drive, Austin, TX 78701', 'SILVER', 'ACTIVE'),
('c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Delta LLC', 'Patricia Morales', 'p.morales@deltallc.net', '+1-555-0167', '1200 Logistics Blvd, Atlanta, GA 30303', 'GOLD', 'ACTIVE'),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nova Retail', 'Jason Vance', 'j.vance@novaretail.com', '+1-555-0122', '500 Market St, San Francisco, CA 94105', 'BRONZE', 'ACTIVE'),
('c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Orion Ltd', 'Victoria Sterling', 'v.sterling@orion.co.uk', '+44-20-7946-0912', '10 Park Lane, London, UK', 'GOLD', 'ACTIVE'),
('c7eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Apex Global Solutions', 'Siddharth Mehta', 's.mehta@apexglobal.in', '+91-98200-11223', 'Bandra Kurla Complex, Mumbai, MH 400051', 'GOLD', 'ACTIVE'),
('c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Starlight Tech Systems', 'Anna Lindqvist', 'a.lindqvist@starlight.se', '+46-8-123-4567', 'Sveavagen 44, Stockholm, Sweden', 'SILVER', 'INACTIVE'),
('c9eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quantum Networks', 'Derek Sterling', 'd.sterling@quantumnet.com', '+1-555-0811', '700 Cyber Way, Seattle, WA 98101', 'GOLD', 'LEAD'),
('c10eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vanguard Healthcare', 'Dr. Rebecca Hayes', 'r.hayes@vanguardhealth.org', '+1-555-0922', '300 Medical Center Dr, Boston, MA 02115', 'GOLD', 'ACTIVE'),
('c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nexus Enterprise Systems', 'Kenji Sato', 'k.sato@nexus-sys.jp', '+81-3-5555-0143', 'Roppongi Hills Tower, Tokyo, Japan', 'SILVER', 'ACTIVE'),
('c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Horizon Logistics Group', 'Carlos Mendez', 'c.mendez@horizonlogistics.es', '+34-91-555-0199', 'Paseo de la Castellana 80, Madrid, Spain', 'BRONZE', 'INACTIVE'),
('c13eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CyberShield Protection', 'Tanya Petrova', 't.petrova@cybershield.io', '+1-555-0311', '900 Security Ave, Arlington, VA 22202', 'GOLD', 'ACTIVE'),
('c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Titan Dynamics Corp', 'Bradley Cooper', 'b.cooper@titandynamics.com', '+1-555-0422', '1500 Enterprise Way, Denver, CO 80202', 'GOLD', 'ACTIVE'),
('c15eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Solaris Energy Holdings', 'Maria Santos', 'm.santos@solaris.br', '+55-11-98765-4321', 'Av Paulista 1000, Sao Paulo, Brazil', 'SILVER', 'INACTIVE'),
('c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'InfiniData Solutions', 'Liam O''Connor', 'l.oconnor@infinidata.ie', '+353-1-496-0123', 'Grand Canal Dock, Dublin, Ireland', 'BRONZE', 'LEAD'),
('c17eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Velocity Automotive', 'Sophie Martin', 's.martin@velocity.fr', '+33-1-4268-5555', 'Rue de la Paix 15, Paris, France', 'SILVER', 'INACTIVE'),
('c18eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Atlas Cloud Operations', 'Hassan Al-Mansoor', 'h.almansoor@atlascloud.ae', '+971-4-321-9876', 'DIFC Tower 2, Dubai, UAE', 'GOLD', 'LEAD'),
('c19eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Echo Media Group', 'Chloe Zhang', 'c.zhang@echomedia.cn', '+86-21-6123-4567', 'Lujiazui Ring Rd, Shanghai, China', 'SILVER', 'ACTIVE'),
('c20eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pinnacle Financial Inc', 'James Worthington', 'j.worthington@pinnaclefin.com', '+1-555-0777', '200 Wall St, New York, NY 10005', 'GOLD', 'INACTIVE'),
('c21eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Terraform Infrastructure', 'Oliver Schmidt', 'o.schmidt@terraform.de', '+49-30-887766', 'Friedrichstrasse 100, Berlin, Germany', 'GOLD', 'ACTIVE'),
('c22eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BlueWave Telecom', 'Elena Rossi', 'e.rossi@bluewave.it', '+39-06-698765', 'Via del Corso 50, Rome, Italy', 'BRONZE', 'INACTIVE'),
('c23eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Synergy BioTech Ltd', 'Dr. Aris Thorne', 'a.thorne@synergybio.ca', '+1-416-555-0199', 'Bay St 120, Toronto, ON, Canada', 'SILVER', 'ACTIVE'),
('c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AeroSpace Dynamics', 'Captain Alan Grant', 'a.grant@aerospacedyn.com', '+1-555-0666', '1 Aerospace Way, Houston, TX 77001', 'GOLD', 'LEAD'),
('c25eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'OmniCorp International', 'Gwen Stacy', 'g.stacy@omnicorp.org', '+1-555-0555', '77 Seventh Ave, New York, NY 10011', 'GOLD', 'ACTIVE');


-- 4. CATEGORIES
INSERT INTO categories (id, name) VALUES
('cat-11111111-1111-1111-1111-111111111111', 'Hardware'),
('cat-22222222-2222-2222-2222-222222222222', 'Software Subscription'),
('cat-33333333-3333-3333-3333-333333333333', 'Professional Services'),
('cat-44444444-4444-4444-4444-444444444444', 'Support'),
('cat-55555555-5555-5555-5555-555555555555', 'Cloud Infrastructure'),
('cat-66666666-6666-6666-6666-666666666666', 'Security & Compliance');


-- 5. PRODUCTS
INSERT INTO products (id, company_id, name, sku, category, description, unit_price, unit_cost, tax_rate, is_subscription, active) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Laptop Pro 14', 'HW-LTP-14', 'Hardware', 'High-performance M3 Pro Workstation Laptop with 32GB RAM & 1TB SSD.', 1850.0, 1250.0, 18.0, false, true),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onsite Setup Service', 'SV-ONSITE-SET', 'Professional Services', 'White-glove enterprise deployment, network integration & user onboarding.', 450.0, 180.0, 18.0, false, true),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Extended Warranty', 'HW-EXT-WRN', 'Support', '3-year accidental damage protection & advance hardware replacement.', 299.0, 95.0, 18.0, false, true),
('d4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Docking Station', 'HW-DCK-STN', 'Hardware', 'Thunderbolt 4 Quad-Display Docking Hub with 100W Power Delivery.', 220.0, 135.0, 18.0, false, true),
('d5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Care Plan 2yr', 'SV-CARE-2YR', 'Software Subscription', '24/7 Priority SLA response, dedicated technical account manager & quarterly reviews.', 650.0, 220.0, 18.0, true, true),
('d6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Workstation Max 16', 'HW-LTP-16', 'Hardware', 'Ultra 16-inch 64GB RAM 2TB SSD workstation for high-end rendering.', 2850.0, 1950.0, 18.0, false, true),
('d7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Enterprise Server Rack 2U', 'HW-SRV-2U', 'Hardware', 'Dual Xeon Scalable 128GB ECC RAM Enterprise Rack Server.', 4200.0, 2900.0, 18.0, false, true),
('d8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SAN Storage Array 50TB', 'HW-SAN-50TB', 'Hardware', 'High-speed NVMe SAN array with dual redundant controllers.', 8900.0, 5800.0, 18.0, false, true),
('d9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Core Switch 48-Port 10GbE', 'HW-SWT-48P', 'Hardware', 'Layer 3 managed 10GbE fiber switch with dual power supply.', 1950.0, 1100.0, 18.0, false, true),
('d10eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'NextGen Firewall Gateway', 'HW-FW-NG', 'Security & Compliance', 'Enterprise threat prevention 10Gbps throughput hardware appliance.', 3200.0, 1850.0, 18.0, false, true),
('d11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cloud SaaS Enterprise License', 'SW-SAAS-ENT', 'Software Subscription', 'Per-seat annual enterprise cloud suite subscription with AI assist.', 480.0, 120.0, 18.0, true, true),
('d12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DevOps Cloud Automation Hub', 'SW-DEVOPS-HUB', 'Software Subscription', 'Automated CI/CD pipeline automation & Kubernetes cluster orchestrator.', 1200.0, 300.0, 18.0, true, false),
('d13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SIEM Security Analytics Suite', 'SW-SIEM-SEC', 'Security & Compliance', 'Real-time threat monitoring, SOC audit log aggregation & incident handler.', 2400.0, 600.0, 18.0, true, false),
('d14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Database Managed SLA (Monthly)', 'SV-DBA-MGD', 'Software Subscription', '24/7 DBA support, backup validation, index optimization & auto-failover.', 850.0, 250.0, 18.0, true, true),
('d15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cloud Migration Audit', 'SV-MIG-AUD', 'Professional Services', 'Full architecture assessment, cloud readiness audit & security risk analysis.', 3500.0, 1400.0, 18.0, false, false),
('d16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Custom API Integration Workshop', 'SV-API-INT', 'Professional Services', 'Dedicated integration engineer 5-day custom connector build.', 4800.0, 2100.0, 18.0, false, true),
('d17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CyberSecurity Penetration Test', 'SV-SEC-PENT', 'Security & Compliance', 'Comprehensive ethical hacking, vulnerability scanning & SOC report.', 5200.0, 2300.0, 18.0, false, true),
('d18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Premium 1-Hour SLA Support', 'SUP-PREM-1HR', 'Support', 'Guaranteed 1-hour response SLA, dedicated TAM & direct hotline.', 1450.0, 400.0, 18.0, true, true),
('d19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Business SLA Support', 'SUP-BIZ-SLA', 'Support', 'Business hours 4-hour response SLA with ticket priority routing.', 750.0, 200.0, 18.0, true, true),
('d20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Standard Support SLA', 'SUP-STD-SLA', 'Support', '24-hour email & web portal support ticket response.', 350.0, 80.0, 18.0, true, true),
('d21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Virtual Desktop Infrastructure Node', 'HW-VDI-NODE', 'Cloud Infrastructure', 'High-density GPU-accelerated VDI host server.', 5400.0, 3600.0, 18.0, false, true),
('d22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Load Balancer Hardware Appliance', 'HW-LB-APP', 'Cloud Infrastructure', 'Dual-redundant SSL acceleration hardware load balancer.', 2750.0, 1600.0, 18.0, false, true),
('d23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fiber Channel Host Bus Adapter', 'HW-FC-HBA', 'Hardware', 'Dual-port 32Gb Fiber Channel PCIe HBA card.', 680.0, 390.0, 18.0, false, true),
('d24eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4K Ultra Monitor 32-inch', 'HW-MON-32', 'Hardware', 'Color-calibrated 4K IPS Ergonomic monitor with USB-C PD.', 720.0, 430.0, 18.0, false, false),
('d25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Wireless Access Point Wi-Fi 7', 'HW-WAP-WIFI7', 'Hardware', 'Enterprise tri-band Wi-Fi 7 access point with PoE+.', 420.0, 240.0, 18.0, false, false),
('d26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Uninterruptible Power Supply 3kVA', 'HW-UPS-3KVA', 'Hardware', 'Rackmount 3kVA online double-conversion UPS with battery pack.', 1250.0, 780.0, 18.0, false, false),
('d27eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'KVM Console 17-inch Rack', 'HW-KVM-RACK', 'Hardware', '1U integrated 17-inch LCD KVM console with 8-port switch.', 890.0, 520.0, 18.0, false, false),
('d28eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zero Trust Endpoint Agent', 'SW-ZT-AGENT', 'Security & Compliance', 'Per-endpoint Zero Trust Network Access (ZTNA) annual license.', 95.0, 20.0, 18.0, true, true),
('d29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Data Loss Prevention Suite', 'SW-DLP-SUITE', 'Security & Compliance', 'Automated classification, encryption & exfiltration prevention software.', 1600.0, 400.0, 18.0, true, false),
('d30eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AI Code Security Scanner', 'SW-AI-SEC', 'Security & Compliance', 'Static code analysis & SBOM vulnerability scanner for enterprise repos.', 2100.0, 500.0, 18.0, true, false),
('d31eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Container Security Operator', 'SW-K8S-SEC', 'Cloud Infrastructure', 'Kubernetes runtime protection & cluster posture governance tool.', 1850.0, 450.0, 18.0, true, true),
('d32eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Multi-Cloud Cost Optimizer', 'SW-CLOUD-OPT', 'Cloud Infrastructure', 'AI-driven cloud spend monitoring & cost optimization platform.', 950.0, 220.0, 18.0, true, false),
('d33eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Disaster Recovery Site Setup', 'SV-DR-SETUP', 'Professional Services', 'Hot-site replication deployment, RTO/RPO validation & failover drill.', 6500.0, 2800.0, 18.0, false, false),
('d34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Network Security Architecture Consulting', 'SV-NET-CONS', 'Professional Services', 'Senior network architect 10-day topology redesign & zero trust audit.', 8900.0, 3900.0, 18.0, false, false),
('d35eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Executive IT Strategy Session', 'SV-EXEC-STRAT', 'Professional Services', '1-day executive workshop on digital transformation & enterprise architecture.', 2500.0, 900.0, 18.0, false, true),
('d36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hardware Maintenance 5yr Add-On', 'SUP-HW-5YR', 'Support', '5-year 4-hour onsite parts replacement guarantee.', 1100.0, 350.0, 18.0, true, true),
('d37eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Update Assurance Plan', 'SUP-SW-UPD', 'Support', 'Guaranteed major version upgrades & emergency patch distribution.', 550.0, 110.0, 18.0, true, true),
('d38eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cloud Storage 100TB Tier', 'SW-CLOUD-100TB', 'Cloud Infrastructure', 'Immutable enterprise S3-compatible cloud backup repository.', 1400.0, 450.0, 18.0, true, true),
('d39eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Virtual Private Gateway License', 'SW-VPG-LIC', 'Cloud Infrastructure', 'Encrypted multi-region cloud interconnect gateway service.', 780.0, 190.0, 18.0, true, true),
('d40eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Identity Access Governance Suite', 'SW-IAM-GOV', 'Security & Compliance', 'SSO, MFA, Privileged Access Management (PAM) & lifecycle management.', 3100.0, 750.0, 18.0, true, false);


-- 6. DISCOUNT RULES
INSERT INTO discount_rules (id, company_id, name, customer_tier, category, min_quantity, max_discount_percent, is_active) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Standard Rep Limit', NULL, NULL, 1, 10.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manager Threshold Limit', NULL, NULL, 1, 20.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gold Tier Bulk Volume Rule', 'GOLD', 'Hardware', 10, 25.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Silver Tier Hardware Ceiling', 'SILVER', 'Hardware', 5, 15.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SaaS Multi-Year Subscription Discount', 'GOLD', 'Software Subscription', 20, 30.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Professional Services Bundle Rule', NULL, 'Professional Services', 3, 12.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Support SLA Enterprise Rule', 'GOLD', 'Support', 1, 18.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cloud Infrastructure Starter Discount', 'BRONZE', 'Cloud Infrastructure', 1, 8.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Security & Compliance Auditing Bundle', 'GOLD', 'Security & Compliance', 2, 22.0, true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Year-End Enterprise Clearing Threshold', NULL, NULL, 50, 35.0, true);


-- 7. WAREHOUSES
INSERT INTO warehouses (id, company_id, name, location, shipping_cost, active) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dallas Warehouse (HUB-01)', 'Dallas, TX', 150.0, true),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chicago Warehouse (HUB-02)', 'Chicago, IL', 175.0, true),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Frankfurt Warehouse (HUB-03)', 'Frankfurt, Germany', 300.0, true),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tokyo Logistics Hub (HUB-04)', 'Tokyo, Japan', 320.0, true);


-- 8. INVENTORY
INSERT INTO inventory (id, warehouse_id, product_id, quantity, reserved_quantity) VALUES
('f0eebc99-9c0b-4ef8-bb6d-000000000001', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 413, 106),
('f0eebc99-9c0b-4ef8-bb6d-000000000002', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 146, 46),
('f0eebc99-9c0b-4ef8-bb6d-000000000003', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 335, 134),
('f0eebc99-9c0b-4ef8-bb6d-000000000004', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 125, 17),
('f0eebc99-9c0b-4ef8-bb6d-000000000005', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 471, 84),
('f0eebc99-9c0b-4ef8-bb6d-000000000006', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 243, 39),
('f0eebc99-9c0b-4ef8-bb6d-000000000007', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 210, 17),
('f0eebc99-9c0b-4ef8-bb6d-000000000008', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 54, 1),
('f0eebc99-9c0b-4ef8-bb6d-000000000009', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 265, 100),
('f0eebc99-9c0b-4ef8-bb6d-000000000010', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 217, 68),
('f0eebc99-9c0b-4ef8-bb6d-000000000011', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 257, 50),
('f0eebc99-9c0b-4ef8-bb6d-000000000012', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 385, 87),
('f0eebc99-9c0b-4ef8-bb6d-000000000013', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 138, 18),
('f0eebc99-9c0b-4ef8-bb6d-000000000014', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 117, 17),
('f0eebc99-9c0b-4ef8-bb6d-000000000015', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 422, 23),
('f0eebc99-9c0b-4ef8-bb6d-000000000016', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 56, 14),
('f0eebc99-9c0b-4ef8-bb6d-000000000017', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 61, 13),
('f0eebc99-9c0b-4ef8-bb6d-000000000018', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 161, 19),
('f0eebc99-9c0b-4ef8-bb6d-000000000019', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd10eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 399, 23),
('f0eebc99-9c0b-4ef8-bb6d-000000000020', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd10eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 438, 37),
('f0eebc99-9c0b-4ef8-bb6d-000000000021', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 162, 52),
('f0eebc99-9c0b-4ef8-bb6d-000000000022', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 192, 46),
('f0eebc99-9c0b-4ef8-bb6d-000000000023', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 405, 44),
('f0eebc99-9c0b-4ef8-bb6d-000000000024', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 280, 48),
('f0eebc99-9c0b-4ef8-bb6d-000000000025', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 65, 1),
('f0eebc99-9c0b-4ef8-bb6d-000000000026', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 345, 72),
('f0eebc99-9c0b-4ef8-bb6d-000000000027', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 104, 22),
('f0eebc99-9c0b-4ef8-bb6d-000000000028', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 195, 43),
('f0eebc99-9c0b-4ef8-bb6d-000000000029', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 269, 13),
('f0eebc99-9c0b-4ef8-bb6d-000000000030', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 351, 16),
('f0eebc99-9c0b-4ef8-bb6d-000000000031', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 71, 28),
('f0eebc99-9c0b-4ef8-bb6d-000000000032', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 220, 31),
('f0eebc99-9c0b-4ef8-bb6d-000000000033', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 273, 6),
('f0eebc99-9c0b-4ef8-bb6d-000000000034', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 444, 46),
('f0eebc99-9c0b-4ef8-bb6d-000000000035', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 203, 27),
('f0eebc99-9c0b-4ef8-bb6d-000000000036', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 380, 140),
('f0eebc99-9c0b-4ef8-bb6d-000000000037', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 460, 75),
('f0eebc99-9c0b-4ef8-bb6d-000000000038', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 447, 178),
('f0eebc99-9c0b-4ef8-bb6d-000000000039', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 436, 101),
('f0eebc99-9c0b-4ef8-bb6d-000000000040', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 140, 29),
('f0eebc99-9c0b-4ef8-bb6d-000000000041', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 146, 29),
('f0eebc99-9c0b-4ef8-bb6d-000000000042', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 92, 20),
('f0eebc99-9c0b-4ef8-bb6d-000000000043', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 214, 50),
('f0eebc99-9c0b-4ef8-bb6d-000000000044', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 445, 153),
('f0eebc99-9c0b-4ef8-bb6d-000000000045', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 163, 30),
('f0eebc99-9c0b-4ef8-bb6d-000000000046', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 296, 32),
('f0eebc99-9c0b-4ef8-bb6d-000000000047', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd24eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 216, 85),
('f0eebc99-9c0b-4ef8-bb6d-000000000048', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd24eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 432, 15),
('f0eebc99-9c0b-4ef8-bb6d-000000000049', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 161, 39),
('f0eebc99-9c0b-4ef8-bb6d-000000000050', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 121, 29),
('f0eebc99-9c0b-4ef8-bb6d-000000000051', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 323, 21),
('f0eebc99-9c0b-4ef8-bb6d-000000000052', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 321, 78),
('f0eebc99-9c0b-4ef8-bb6d-000000000053', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd27eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 390, 98),
('f0eebc99-9c0b-4ef8-bb6d-000000000054', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd27eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 141, 9),
('f0eebc99-9c0b-4ef8-bb6d-000000000055', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd28eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 366, 39),
('f0eebc99-9c0b-4ef8-bb6d-000000000056', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd28eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 80, 0),
('f0eebc99-9c0b-4ef8-bb6d-000000000057', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 195, 1),
('f0eebc99-9c0b-4ef8-bb6d-000000000058', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 415, 44),
('f0eebc99-9c0b-4ef8-bb6d-000000000059', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd30eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 373, 52),
('f0eebc99-9c0b-4ef8-bb6d-000000000060', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd30eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 100, 6);


-- 9. QUOTATIONS
INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, quote_number, status, subtotal, discount_amount, tax_amount, total_amount, estimated_cost, margin_amount, margin_percent, risk_score, approval_required) VALUES
('f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8401', 'PENDING_APPROVAL', 111200.0, 16590.0, 0.0, 94610.0, 48660.0, 45950.0, 48.57, 25.01, true),
('f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8402', 'CONFIRMED', 54300.0, 2062.5, 0.0, 52237.5, 31350.0, 20887.5, 39.99, 55.85, false),
('f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8403', 'FULFILLED', 54525.0, 1470.75, 0.0, 53054.25, 24330.0, 28724.25, 54.14, 37.06, false),
('f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8404', 'APPROVED', 120650.0, 9165.0, 0.0, 111485.0, 51190.0, 60295.0, 54.08, 31.66, false),
('f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8405', 'FULFILLED', 72000.0, 10800.0, 0.0, 61200.0, 30600.0, 30600.0, 50.0, 31.58, true),
('f06ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c9eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8406', 'DRAFT', 59300.0, 7022.5, 0.0, 52277.5, 25260.0, 27017.5, 51.68, 88.1, false),
('f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8407', 'PENDING_APPROVAL', 116700.0, 22845.0, 0.0, 93855.0, 72750.0, 21105.0, 22.49, 68.38, true),
('f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c21eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8408', 'PENDING_APPROVAL', 16300.0, 2322.5, 0.0, 13977.5, 3760.0, 10217.5, 73.1, 40.35, true),
('f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8409', 'APPROVED', 6940.0, 1358.0, 0.0, 5582.0, 3520.0, 2062.0, 36.94, 56.14, true),
('f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c10eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8410', 'DRAFT', 15148.0, 2699.6, 0.0, 12448.4, 4240.0, 8208.4, 65.94, 61.09, true),
('f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8411', 'FULFILLED', 7950.0, 993.75, 0.0, 6956.25, 2000.0, 4956.25, 71.25, 36.43, true),
('f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8412', 'FULFILLED', 13000.0, 450.0, 0.0, 12550.0, 7040.0, 5510.0, 43.9, 52.87, false),
('f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8413', 'REJECTED', 32400.0, 2589.25, 0.0, 29810.75, 17050.0, 12760.75, 42.81, 79.36, false),
('f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8414', 'NEGOTIATION', 30540.0, 4025.5, 0.0, 26514.5, 12320.0, 14194.5, 53.53, 75.5, true),
('f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8415', 'CONFIRMED', 70500.0, 6150.0, 0.0, 64350.0, 34600.0, 29750.0, 46.23, 88.45, false),
('f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8416', 'APPROVED', 68800.0, 11376.0, 0.0, 57424.0, 38350.0, 19074.0, 33.22, 16.97, true),
('f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c19eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8417', 'CONFIRMED', 85360.0, 14272.8, 0.0, 71087.2, 37590.0, 33497.2, 47.12, 55.47, true),
('f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c18eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8418', 'PENDING_APPROVAL', 12700.0, 755.0, 0.0, 11945.0, 3100.0, 8845.0, 74.05, 36.15, true),
('f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8419', 'PENDING_APPROVAL', 72300.0, 8880.0, 0.0, 63420.0, 40500.0, 22920.0, 36.14, 61.9, true),
('f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8420', 'FULFILLED', 32388.0, 3310.1, 0.0, 29077.9, 8980.0, 20097.9, 69.12, 59.21, false),
('f21ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c10eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8421', 'DRAFT', 6834.0, 476.25, 0.0, 6357.75, 3450.0, 2907.75, 45.74, 12.4, false),
('f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c13eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8422', 'PENDING_APPROVAL', 114310.0, 10913.25, 0.0, 103396.75, 53130.0, 50266.75, 48.62, 57.72, true),
('f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c21eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8423', 'NEGOTIATION', 207500.0, 31305.0, 0.0, 176195.0, 90200.0, 85995.0, 48.81, 17.28, true),
('f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8424', 'CONFIRMED', 25745.0, 2915.25, 0.0, 22829.75, 12225.0, 10604.75, 46.45, 25.49, false),
('f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c25eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8425', 'PENDING_APPROVAL', 18400.0, 1440.0, 0.0, 16960.0, 5600.0, 11360.0, 66.98, 67.0, true),
('f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c13eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8426', 'DRAFT', 118350.0, 7768.0, 0.0, 110582.0, 69240.0, 41342.0, 37.39, 72.99, false),
('f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8427', 'APPROVED', 120700.0, 17917.5, 0.0, 102782.5, 50710.0, 52072.5, 50.66, 88.0, true),
('f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c15eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8428', 'PENDING_APPROVAL', 20290.0, 3294.7, 0.0, 16995.3, 10540.0, 6455.299999999999, 37.98, 53.67, true),
('f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8429', 'PENDING_APPROVAL', 50650.0, 5622.5, 0.0, 45027.5, 19250.0, 25777.5, 57.25, 77.3, true),
('f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c20eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8430', 'NEGOTIATION', 84692.0, 8479.6, 0.0, 76212.4, 55200.0, 21012.399999999994, 27.57, 51.84, false),
('f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8431', 'APPROVED', 44980.0, 2225.0, 0.0, 42755.0, 29120.0, 13635.0, 31.89, 63.46, false),
('f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8432', 'APPROVED', 103500.0, 15442.5, 0.0, 88057.5, 54300.0, 33757.5, 38.34, 78.23, true),
('f33ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c10eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8433', 'DRAFT', 42600.0, 7020.0, 0.0, 35580.0, 13800.0, 21780.0, 61.21, 66.67, true),
('f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8434', 'CONFIRMED', 29250.0, 3862.5, 0.0, 25387.5, 11700.0, 13687.5, 53.91, 93.63, true),
('f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8435', 'NEGOTIATION', 223000.0, 26975.0, 0.0, 196025.0, 91800.0, 104225.0, 53.17, 39.7, true),
('f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8436', 'PENDING_APPROVAL', 21360.0, 2766.5, 0.0, 18593.5, 5580.0, 13013.5, 69.99, 24.55, true),
('f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8437', 'APPROVED', 20950.0, 3405.0, 0.0, 17545.0, 6540.0, 11005.0, 62.72, 44.43, true),
('f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c23eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8438', 'APPROVED', 16380.0, 0.0, 0.0, 16380.0, 7740.0, 8640.0, 52.75, 34.87, false),
('f39ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c15eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8439', 'DRAFT', 52150.0, 4497.5, 0.0, 47652.5, 23550.0, 24102.5, 50.58, 58.33, false),
('f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8440', 'FULFILLED', 17550.0, 1590.0, 0.0, 15960.0, 4300.0, 11660.0, 73.06, 40.05, false),
('f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c20eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8441', 'FULFILLED', 59300.0, 8642.5, 0.0, 50657.5, 33000.0, 17657.5, 34.86, 79.64, true),
('f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c17eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8442', 'FULFILLED', 138340.0, 24898.0, 0.0, 113442.0, 68130.0, 45312.0, 39.94, 23.2, true),
('f43ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c10eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8443', 'DRAFT', 35850.0, 4481.25, 0.0, 31368.75, 21150.0, 10218.75, 32.58, 82.4, true),
('f44ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c23eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8444', 'REJECTED', 16360.0, 1660.0, 0.0, 14700.0, 5190.0, 9510.0, 64.69, 22.17, false),
('f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8445', 'PENDING_APPROVAL', 62200.0, 8890.0, 0.0, 53310.0, 24170.0, 29140.0, 54.66, 55.04, true),
('f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c20eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8446', 'REJECTED', 44400.0, 1710.0, 0.0, 42690.0, 19190.0, 23500.0, 55.05, 66.11, false),
('f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c9eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8447', 'APPROVED', 41450.0, 7327.5, 0.0, 34122.5, 16600.0, 17522.5, 51.35, 24.7, true),
('f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c22eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8448', 'APPROVED', 88100.0, 12015.0, 0.0, 76085.0, 48600.0, 27485.0, 36.12, 14.24, true),
('f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8449', 'NEGOTIATION', 60350.0, 1550.0, 0.0, 58800.0, 34700.0, 24100.0, 40.99, 92.94, false),
('f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c15eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QT-2026-8450', 'PENDING_APPROVAL', 23150.0, 4167.0, 0.0, 18983.0, 11670.0, 7313.0, 38.52, 62.25, true);


-- 10. QUOTE ITEMS
INSERT INTO quote_items (id, quotation_id, product_id, product_name, category, unit_price, unit_cost, tax_rate, quantity, discount_percent, line_subtotal, discount_amount, tax_amount, line_total) VALUES
('qi-2026-0001', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 10, 15.0, 48000.0, 7200.0, 0.0, 40800.0),
('qi-2026-0002', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 7, 15.0, 62300.0, 9345.0, 0.0, 52955.0),
('qi-2026-0003', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.0, 180.0, 18.0, 2, 5.0, 900.0, 45.0, 0.0, 855.0),
('qi-2026-0004', 'f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 15, 12.5, 16500.0, 2062.5, 0.0, 14437.5),
('qi-2026-0005', 'f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Enterprise Server Rack 2U', 'Hardware', 4200.0, 2900.0, 18.0, 9, 0.0, 37800.0, 0.0, 0.0, 37800.0),
('qi-2026-0006', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 9, 0.0, 43200.0, 0.0, 0.0, 43200.0),
('qi-2026-0007', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Load Balancer Hardware Appliance', 'Cloud Infrastructure', 2750.0, 1600.0, 18.0, 3, 12.5, 8250.0, 1031.25, 0.0, 7218.75),
('qi-2026-0008', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd28eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Zero Trust Endpoint Agent', 'Security & Compliance', 95.0, 20.0, 18.0, 15, 10.0, 1425.0, 142.5, 0.0, 1282.5),
('qi-2026-0009', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd37eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Software Update Assurance Plan', 'Support', 550.0, 110.0, 18.0, 3, 18.0, 1650.0, 297.0, 0.0, 1353.0),
('qi-2026-0010', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 11, 5.0, 97900.0, 4895.0, 0.0, 93005.0),
('qi-2026-0011', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud Migration Audit', 'Professional Services', 3500.0, 1400.0, 18.0, 4, 18.0, 14000.0, 2520.0, 0.0, 11480.0),
('qi-2026-0012', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 7, 20.0, 7700.0, 1540.0, 0.0, 6160.0),
('qi-2026-0013', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 'Support', 350.0, 80.0, 18.0, 3, 20.0, 1050.0, 210.0, 0.0, 840.0),
('qi-2026-0014', 'f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Data Loss Prevention Suite', 'Security & Compliance', 1600.0, 400.0, 18.0, 3, 15.0, 4800.0, 720.0, 0.0, 4080.0),
('qi-2026-0015', 'f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 14, 15.0, 67200.0, 10080.0, 0.0, 57120.0),
('qi-2026-0016', 'f06ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd30eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'AI Code Security Scanner', 'Security & Compliance', 2100.0, 500.0, 18.0, 1, 12.5, 2100.0, 262.5, 0.0, 1837.5),
('qi-2026-0017', 'f06ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'CyberSecurity Penetration Test', 'Security & Compliance', 5200.0, 2300.0, 18.0, 10, 12.5, 52000.0, 6500.0, 0.0, 45500.0),
('qi-2026-0018', 'f06ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 8, 5.0, 5200.0, 260.0, 0.0, 4940.0),
('qi-2026-0019', 'f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SAN Storage Array 50TB', 'Hardware', 8900.0, 5800.0, 18.0, 12, 20.0, 106800.0, 21360.0, 0.0, 85440.0),
('qi-2026-0020', 'f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 9, 15.0, 9900.0, 1485.0, 0.0, 8415.0),
('qi-2026-0021', 'f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 'Support', 350.0, 80.0, 18.0, 14, 12.5, 4900.0, 612.5, 0.0, 4287.5),
('qi-2026-0022', 'f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd32eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Multi-Cloud Cost Optimizer', 'Cloud Infrastructure', 950.0, 220.0, 18.0, 12, 15.0, 11400.0, 1710.0, 0.0, 9690.0),
('qi-2026-0023', 'f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 2, 18.0, 1500.0, 270.0, 0.0, 1230.0),
('qi-2026-0024', 'f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Fiber Channel Host Bus Adapter', 'Hardware', 680.0, 390.0, 18.0, 8, 20.0, 5440.0, 1088.0, 0.0, 4352.0),
('qi-2026-0025', 'f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 15, 20.0, 11250.0, 2250.0, 0.0, 9000.0),
('qi-2026-0026', 'f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 2, 20.0, 598.0, 119.60000000000001, 0.0, 478.4),
('qi-2026-0027', 'f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 3, 10.0, 3300.0, 330.0, 0.0, 2970.0),
('qi-2026-0028', 'f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SIEM Security Analytics Suite', 'Security & Compliance', 2400.0, 600.0, 18.0, 3, 12.5, 7200.0, 900.0, 0.0, 6300.0),
('qi-2026-0029', 'f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 1, 12.5, 750.0, 93.75, 0.0, 656.25),
('qi-2026-0030', 'f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 4, 15.0, 3000.0, 450.0, 0.0, 2550.0),
('qi-2026-0031', 'f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Uninterruptible Power Supply 3kVA', 'Hardware', 1250.0, 780.0, 18.0, 8, 0.0, 10000.0, 0.0, 0.0, 10000.0),
('qi-2026-0032', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Database Managed SLA (Monthly)', 'Software Subscription', 850.0, 250.0, 18.0, 1, 18.0, 850.0, 153.0, 0.0, 697.0),
('qi-2026-0033', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 1, 10.0, 4800.0, 480.0, 0.0, 4320.0),
('qi-2026-0034', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 11, 12.5, 8250.0, 1031.25, 0.0, 7218.75),
('qi-2026-0035', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.0, 1250.0, 18.0, 10, 5.0, 18500.0, 925.0, 0.0, 17575.0),
('qi-2026-0036', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud Migration Audit', 'Professional Services', 3500.0, 1400.0, 18.0, 1, 12.5, 3500.0, 437.5, 0.0, 3062.5),
('qi-2026-0037', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd38eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud Storage 100TB Tier', 'Cloud Infrastructure', 1400.0, 450.0, 18.0, 13, 10.0, 18200.0, 1820.0, 0.0, 16380.0),
('qi-2026-0038', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Fiber Channel Host Bus Adapter', 'Hardware', 680.0, 390.0, 18.0, 13, 20.0, 8840.0, 1768.0, 0.0, 7072.0),
('qi-2026-0039', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 12, 10.0, 34200.0, 3420.0, 0.0, 30780.0),
('qi-2026-0040', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SIEM Security Analytics Suite', 'Security & Compliance', 2400.0, 600.0, 18.0, 10, 5.0, 24000.0, 1200.0, 0.0, 22800.0),
('qi-2026-0041', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 8, 15.0, 6000.0, 900.0, 0.0, 5100.0),
('qi-2026-0042', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wireless Access Point Wi-Fi 7', 'Hardware', 420.0, 240.0, 18.0, 15, 10.0, 6300.0, 630.0, 0.0, 5670.0),
('qi-2026-0043', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd10eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'NextGen Firewall Gateway', 'Security & Compliance', 3200.0, 1850.0, 18.0, 11, 15.0, 35200.0, 5280.0, 0.0, 29920.0),
('qi-2026-0044', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Laptop Pro 14', 'Hardware', 1850.0, 1250.0, 18.0, 12, 18.0, 22200.0, 3996.0, 0.0, 18204.0),
('qi-2026-0045', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 12, 20.0, 9000.0, 1800.0, 0.0, 7200.0),
('qi-2026-0046', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'DevOps Cloud Automation Hub', 'Software Subscription', 1200.0, 300.0, 18.0, 2, 12.5, 2400.0, 300.0, 0.0, 2100.0),
('qi-2026-0047', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd24eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '4K Ultra Monitor 32-inch', 'Hardware', 720.0, 430.0, 18.0, 13, 18.0, 9360.0, 1684.8, 0.0, 7675.2),
('qi-2026-0048', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'CyberSecurity Penetration Test', 'Security & Compliance', 5200.0, 2300.0, 18.0, 13, 18.0, 67600.0, 12168.0, 0.0, 55432.0),
('qi-2026-0049', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'DevOps Cloud Automation Hub', 'Software Subscription', 1200.0, 300.0, 18.0, 7, 5.0, 8400.0, 420.0, 0.0, 7980.0),
('qi-2026-0050', 'f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd31eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Container Security Operator', 'Cloud Infrastructure', 1850.0, 450.0, 18.0, 6, 5.0, 11100.0, 555.0, 0.0, 10545.0),
('qi-2026-0051', 'f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Data Loss Prevention Suite', 'Security & Compliance', 1600.0, 400.0, 18.0, 1, 12.5, 1600.0, 200.0, 0.0, 1400.0),
('qi-2026-0052', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 2, 15.0, 9600.0, 1440.0, 0.0, 8160.0),
('qi-2026-0053', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Desktop Infrastructure Node', 'Cloud Infrastructure', 5400.0, 3600.0, 18.0, 2, 15.0, 10800.0, 1620.0, 0.0, 9180.0),
('qi-2026-0054', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 3, 10.0, 26700.0, 2670.0, 0.0, 24030.0),
('qi-2026-0055', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Enterprise Server Rack 2U', 'Hardware', 4200.0, 2900.0, 18.0, 6, 12.5, 25200.0, 3150.0, 0.0, 22050.0),
('qi-2026-0056', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 'Support', 350.0, 80.0, 18.0, 8, 10.0, 2800.0, 280.0, 0.0, 2520.0),
('qi-2026-0057', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 12, 20.0, 3588.0, 717.6, 0.0, 2870.4),
('qi-2026-0058', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd31eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Container Security Operator', 'Cloud Infrastructure', 1850.0, 450.0, 18.0, 10, 12.5, 18500.0, 2312.5, 0.0, 16187.5),
('qi-2026-0059', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd35eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Executive IT Strategy Session', 'Professional Services', 2500.0, 900.0, 18.0, 3, 0.0, 7500.0, 0.0, 0.0, 7500.0),
('qi-2026-0060', 'f21ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wireless Access Point Wi-Fi 7', 'Hardware', 420.0, 240.0, 18.0, 12, 5.0, 5040.0, 252.0, 0.0, 4788.0),
('qi-2026-0061', 'f21ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 6, 12.5, 1794.0, 224.25, 0.0, 1569.75),
('qi-2026-0062', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 13, 12.5, 37050.0, 4631.25, 0.0, 32418.75),
('qi-2026-0063', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Fiber Channel Host Bus Adapter', 'Hardware', 680.0, 390.0, 18.0, 7, 20.0, 4760.0, 952.0, 0.0, 3808.0),
('qi-2026-0064', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd40eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Identity Access Governance Suite', 'Security & Compliance', 3100.0, 750.0, 18.0, 11, 10.0, 34100.0, 3410.0, 0.0, 30690.0),
('qi-2026-0065', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 8, 5.0, 38400.0, 1920.0, 0.0, 36480.0),
('qi-2026-0066', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 15, 18.0, 133500.0, 24030.0, 0.0, 109470.0),
('qi-2026-0067', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd35eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Executive IT Strategy Session', 'Professional Services', 2500.0, 900.0, 18.0, 1, 5.0, 2500.0, 125.0, 0.0, 2375.0),
('qi-2026-0068', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd33eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Disaster Recovery Site Setup', 'Professional Services', 6500.0, 2800.0, 18.0, 11, 10.0, 71500.0, 7150.0, 0.0, 64350.0),
('qi-2026-0069', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Uninterruptible Power Supply 3kVA', 'Hardware', 1250.0, 780.0, 18.0, 10, 15.0, 12500.0, 1875.0, 0.0, 10625.0),
('qi-2026-0070', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wireless Access Point Wi-Fi 7', 'Hardware', 420.0, 240.0, 18.0, 6, 20.0, 2520.0, 504.0, 0.0, 2016.0),
('qi-2026-0071', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 'Software Subscription', 480.0, 120.0, 18.0, 13, 5.0, 6240.0, 312.0, 0.0, 5928.0),
('qi-2026-0072', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 15, 5.0, 4485.0, 224.25, 0.0, 4260.75),
('qi-2026-0073', 'f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'CyberSecurity Penetration Test', 'Security & Compliance', 5200.0, 2300.0, 18.0, 1, 15.0, 5200.0, 780.0, 0.0, 4420.0),
('qi-2026-0074', 'f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'DevOps Cloud Automation Hub', 'Software Subscription', 1200.0, 300.0, 18.0, 11, 5.0, 13200.0, 660.0, 0.0, 12540.0),
('qi-2026-0075', 'f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Core Switch 48-Port 10GbE', 'Hardware', 1950.0, 1100.0, 18.0, 9, 0.0, 17550.0, 0.0, 0.0, 17550.0),
('qi-2026-0076', 'f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SAN Storage Array 50TB', 'Hardware', 8900.0, 5800.0, 18.0, 8, 10.0, 71200.0, 7120.0, 0.0, 64080.0),
('qi-2026-0077', 'f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.0, 180.0, 18.0, 8, 18.0, 3600.0, 648.0, 0.0, 2952.0),
('qi-2026-0078', 'f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'CyberSecurity Penetration Test', 'Security & Compliance', 5200.0, 2300.0, 18.0, 5, 0.0, 26000.0, 0.0, 0.0, 26000.0),
('qi-2026-0079', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Premium 1-Hour SLA Support', 'Support', 1450.0, 400.0, 18.0, 7, 15.0, 10150.0, 1522.5, 0.0, 8627.5),
('qi-2026-0080', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 10, 10.0, 2990.0, 299.0, 0.0, 2691.0),
('qi-2026-0081', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 12, 15.0, 106800.0, 16020.0, 0.0, 90780.0),
('qi-2026-0082', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd28eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Zero Trust Endpoint Agent', 'Security & Compliance', 95.0, 20.0, 18.0, 8, 10.0, 760.0, 76.0, 0.0, 684.0),
('qi-2026-0083', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wireless Access Point Wi-Fi 7', 'Hardware', 420.0, 240.0, 18.0, 12, 18.0, 5040.0, 907.1999999999999, 0.0, 4132.8),
('qi-2026-0084', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd26eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Uninterruptible Power Supply 3kVA', 'Hardware', 1250.0, 780.0, 18.0, 7, 18.0, 8750.0, 1575.0, 0.0, 7175.0),
('qi-2026-0085', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 10, 12.5, 6500.0, 812.5, 0.0, 5687.5),
('qi-2026-0086', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SIEM Security Analytics Suite', 'Security & Compliance', 2400.0, 600.0, 18.0, 12, 15.0, 28800.0, 4320.0, 0.0, 24480.0),
('qi-2026-0087', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 5, 20.0, 3250.0, 650.0, 0.0, 2600.0),
('qi-2026-0088', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Premium 1-Hour SLA Support', 'Support', 1450.0, 400.0, 18.0, 3, 15.0, 4350.0, 652.5, 0.0, 3697.5),
('qi-2026-0089', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 5, 0.0, 14250.0, 0.0, 0.0, 14250.0),
('qi-2026-0090', 'f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Extended Warranty', 'Support', 299.0, 95.0, 18.0, 8, 5.0, 2392.0, 119.60000000000001, 0.0, 2272.4),
('qi-2026-0091', 'f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Desktop Infrastructure Node', 'Cloud Infrastructure', 5400.0, 3600.0, 18.0, 15, 10.0, 81000.0, 8100.0, 0.0, 72900.0),
('qi-2026-0092', 'f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 2, 20.0, 1300.0, 260.0, 0.0, 1040.0),
('qi-2026-0093', 'f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SAN Storage Array 50TB', 'Hardware', 8900.0, 5800.0, 18.0, 5, 5.0, 44500.0, 2225.0, 0.0, 42275.0),
('qi-2026-0094', 'f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 'Software Subscription', 480.0, 120.0, 18.0, 1, 0.0, 480.0, 0.0, 0.0, 480.0),
('qi-2026-0095', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Load Balancer Hardware Appliance', 'Cloud Infrastructure', 2750.0, 1600.0, 18.0, 6, 12.5, 16500.0, 2062.5, 0.0, 14437.5),
('qi-2026-0096', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd33eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Disaster Recovery Site Setup', 'Professional Services', 6500.0, 2800.0, 18.0, 9, 18.0, 58500.0, 10530.0, 0.0, 47970.0),
('qi-2026-0097', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 10, 10.0, 28500.0, 2850.0, 0.0, 25650.0),
('qi-2026-0098', 'f33ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd15eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud Migration Audit', 'Professional Services', 3500.0, 1400.0, 18.0, 6, 18.0, 21000.0, 3780.0, 0.0, 17220.0),
('qi-2026-0099', 'f33ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SIEM Security Analytics Suite', 'Security & Compliance', 2400.0, 600.0, 18.0, 9, 15.0, 21600.0, 3240.0, 0.0, 18360.0),
('qi-2026-0100', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 'Support', 350.0, 80.0, 18.0, 15, 5.0, 5250.0, 262.5, 0.0, 4987.5),
('qi-2026-0101', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 5, 15.0, 24000.0, 3600.0, 0.0, 20400.0),
('qi-2026-0102', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd13eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'SIEM Security Analytics Suite', 'Security & Compliance', 2400.0, 600.0, 18.0, 13, 15.0, 31200.0, 4680.0, 0.0, 26520.0),
('qi-2026-0103', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd16eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Custom API Integration Workshop', 'Professional Services', 4800.0, 2100.0, 18.0, 14, 10.0, 67200.0, 6720.0, 0.0, 60480.0),
('qi-2026-0104', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd34eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Network Security Architecture Consulting', 'Professional Services', 8900.0, 3900.0, 18.0, 14, 12.5, 124600.0, 15575.0, 0.0, 109025.0),
('qi-2026-0105', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 10, 12.5, 6500.0, 812.5, 0.0, 5687.5),
('qi-2026-0106', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd37eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Software Update Assurance Plan', 'Support', 550.0, 110.0, 18.0, 10, 10.0, 5500.0, 550.0, 0.0, 4950.0),
('qi-2026-0107', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd39eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Private Gateway License', 'Cloud Infrastructure', 780.0, 190.0, 18.0, 12, 15.0, 9360.0, 1404.0, 0.0, 7956.0),
('qi-2026-0108', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.0, 180.0, 18.0, 12, 20.0, 5400.0, 1080.0, 0.0, 4320.0),
('qi-2026-0109', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 4, 5.0, 2600.0, 130.0, 0.0, 2470.0),
('qi-2026-0110', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 15, 18.0, 11250.0, 2025.0, 0.0, 9225.0),
('qi-2026-0111', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Database Managed SLA (Monthly)', 'Software Subscription', 850.0, 250.0, 18.0, 2, 10.0, 1700.0, 170.0, 0.0, 1530.0),
('qi-2026-0112', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Core Switch 48-Port 10GbE', 'Hardware', 1950.0, 1100.0, 18.0, 6, 0.0, 11700.0, 0.0, 0.0, 11700.0),
('qi-2026-0113', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd39eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Private Gateway License', 'Cloud Infrastructure', 780.0, 190.0, 18.0, 6, 0.0, 4680.0, 0.0, 0.0, 4680.0),
('qi-2026-0114', 'f39ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd25eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wireless Access Point Wi-Fi 7', 'Hardware', 420.0, 240.0, 18.0, 15, 20.0, 6300.0, 1260.0, 0.0, 5040.0),
('qi-2026-0115', 'f39ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd31eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Container Security Operator', 'Cloud Infrastructure', 1850.0, 450.0, 18.0, 14, 12.5, 25900.0, 3237.5, 0.0, 22662.5),
('qi-2026-0116', 'f39ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 7, 0.0, 19950.0, 0.0, 0.0, 19950.0),
('qi-2026-0117', 'f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd32eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Multi-Cloud Cost Optimizer', 'Cloud Infrastructure', 950.0, 220.0, 18.0, 5, 20.0, 4750.0, 950.0, 0.0, 3800.0),
('qi-2026-0118', 'f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd29eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Data Loss Prevention Suite', 'Security & Compliance', 1600.0, 400.0, 18.0, 8, 5.0, 12800.0, 640.0, 0.0, 12160.0),
('qi-2026-0119', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Onsite Setup Service', 'Professional Services', 450.0, 180.0, 18.0, 10, 15.0, 4500.0, 675.0, 0.0, 3825.0),
('qi-2026-0120', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd30eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'AI Code Security Scanner', 'Security & Compliance', 2100.0, 500.0, 18.0, 5, 20.0, 10500.0, 2100.0, 0.0, 8400.0),
('qi-2026-0121', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 4, 20.0, 4400.0, 880.0, 0.0, 3520.0),
('qi-2026-0122', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 14, 12.5, 39900.0, 4987.5, 0.0, 34912.5),
('qi-2026-0123', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd33eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Disaster Recovery Site Setup', 'Professional Services', 6500.0, 2800.0, 18.0, 15, 18.0, 97500.0, 17550.0, 0.0, 79950.0),
('qi-2026-0124', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd23eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Fiber Channel Host Bus Adapter', 'Hardware', 680.0, 390.0, 18.0, 11, 10.0, 7480.0, 748.0, 0.0, 6732.0),
('qi-2026-0125', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 'Software Subscription', 480.0, 120.0, 18.0, 2, 12.5, 960.0, 120.0, 0.0, 840.0),
('qi-2026-0126', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd21eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Desktop Infrastructure Node', 'Cloud Infrastructure', 5400.0, 3600.0, 18.0, 6, 20.0, 32400.0, 6480.0, 0.0, 25920.0),
('qi-2026-0127', 'f43ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Load Balancer Hardware Appliance', 'Cloud Infrastructure', 2750.0, 1600.0, 18.0, 12, 12.5, 33000.0, 4125.0, 0.0, 28875.0),
('qi-2026-0128', 'f43ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 1, 12.5, 2850.0, 356.25, 0.0, 2493.75),
('qi-2026-0129', 'f44ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd38eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud Storage 100TB Tier', 'Cloud Infrastructure', 1400.0, 450.0, 18.0, 11, 10.0, 15400.0, 1540.0, 0.0, 13860.0),
('qi-2026-0130', 'f44ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 'Software Subscription', 480.0, 120.0, 18.0, 2, 12.5, 960.0, 120.0, 0.0, 840.0),
('qi-2026-0131', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 11, 10.0, 7150.0, 715.0, 0.0, 6435.0),
('qi-2026-0132', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Load Balancer Hardware Appliance', 'Cloud Infrastructure', 2750.0, 1600.0, 18.0, 9, 10.0, 24750.0, 2475.0, 0.0, 22275.0),
('qi-2026-0133', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd12eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'DevOps Cloud Automation Hub', 'Software Subscription', 1200.0, 300.0, 18.0, 2, 5.0, 2400.0, 120.0, 0.0, 2280.0),
('qi-2026-0134', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd40eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Identity Access Governance Suite', 'Security & Compliance', 3100.0, 750.0, 18.0, 9, 20.0, 27900.0, 5580.0, 0.0, 22320.0),
('qi-2026-0135', 'f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd32eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Multi-Cloud Cost Optimizer', 'Cloud Infrastructure', 950.0, 220.0, 18.0, 12, 15.0, 11400.0, 1710.0, 0.0, 9690.0),
('qi-2026-0136', 'f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Core Switch 48-Port 10GbE', 'Hardware', 1950.0, 1100.0, 18.0, 13, 0.0, 25350.0, 0.0, 0.0, 25350.0),
('qi-2026-0137', 'f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd14eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Database Managed SLA (Monthly)', 'Software Subscription', 850.0, 250.0, 18.0, 9, 0.0, 7650.0, 0.0, 0.0, 7650.0),
('qi-2026-0138', 'f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd22eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Load Balancer Hardware Appliance', 'Cloud Infrastructure', 2750.0, 1600.0, 18.0, 7, 15.0, 19250.0, 2887.5, 0.0, 16362.5),
('qi-2026-0139', 'f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd31eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Container Security Operator', 'Cloud Infrastructure', 1850.0, 450.0, 18.0, 12, 20.0, 22200.0, 4440.0, 0.0, 17760.0),
('qi-2026-0140', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Enterprise Server Rack 2U', 'Hardware', 4200.0, 2900.0, 18.0, 14, 12.5, 58800.0, 7350.0, 0.0, 51450.0),
('qi-2026-0141', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 'Support', 750.0, 200.0, 18.0, 12, 18.0, 9000.0, 1620.0, 0.0, 7380.0),
('qi-2026-0142', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd18eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Premium 1-Hour SLA Support', 'Support', 1450.0, 400.0, 18.0, 14, 15.0, 20300.0, 3045.0, 0.0, 17255.0),
('qi-2026-0143', 'f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Workstation Max 16', 'Hardware', 2850.0, 1950.0, 18.0, 13, 0.0, 37050.0, 0.0, 0.0, 37050.0),
('qi-2026-0144', 'f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd17eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'CyberSecurity Penetration Test', 'Security & Compliance', 5200.0, 2300.0, 18.0, 3, 5.0, 15600.0, 780.0, 0.0, 14820.0),
('qi-2026-0145', 'f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 'Support', 1100.0, 350.0, 18.0, 7, 10.0, 7700.0, 770.0, 0.0, 6930.0),
('qi-2026-0146', 'f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 'Software Subscription', 650.0, 220.0, 18.0, 11, 18.0, 7150.0, 1287.0, 0.0, 5863.0),
('qi-2026-0147', 'f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd10eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'NextGen Firewall Gateway', 'Security & Compliance', 3200.0, 1850.0, 18.0, 5, 18.0, 16000.0, 2880.0, 0.0, 13120.0);


-- 11. APPROVALS
INSERT INTO approvals (id, quotation_id, approver_id, approval_role, status, comments) VALUES
('app-0001-9c0b-4ef8-bb6d-6bb9bd380a77', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (14.9% vs 10% rep floor limit).'),
('app-0002-9c0b-4ef8-bb6d-6bb9bd380a77', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (7.6% vs 10% rep floor limit).'),
('app-0003-9c0b-4ef8-bb6d-6bb9bd380a77', 'f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (15.0% vs 10% rep floor limit).'),
('app-0004-9c0b-4ef8-bb6d-6bb9bd380a77', 'f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (19.6% vs 10% rep floor limit).'),
('app-0005-9c0b-4ef8-bb6d-6bb9bd380a77', 'f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (14.2% vs 10% rep floor limit).'),
('app-0006-9c0b-4ef8-bb6d-6bb9bd380a77', 'f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (19.6% vs 10% rep floor limit).'),
('app-0007-9c0b-4ef8-bb6d-6bb9bd380a77', 'f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (17.8% vs 10% rep floor limit).'),
('app-0008-9c0b-4ef8-bb6d-6bb9bd380a77', 'f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (12.5% vs 10% rep floor limit).'),
('app-0009-9c0b-4ef8-bb6d-6bb9bd380a77', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'REJECTED', 'Discount threshold checked (8.0% vs 10% rep floor limit).'),
('app-0010-9c0b-4ef8-bb6d-6bb9bd380a77', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (13.2% vs 10% rep floor limit).'),
('app-0011-9c0b-4ef8-bb6d-6bb9bd380a77', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (16.5% vs 10% rep floor limit).'),
('app-0012-9c0b-4ef8-bb6d-6bb9bd380a77', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (16.7% vs 10% rep floor limit).'),
('app-0013-9c0b-4ef8-bb6d-6bb9bd380a77', 'f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (5.9% vs 10% rep floor limit).'),
('app-0014-9c0b-4ef8-bb6d-6bb9bd380a77', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (12.3% vs 10% rep floor limit).'),
('app-0015-9c0b-4ef8-bb6d-6bb9bd380a77', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (9.5% vs 10% rep floor limit).'),
('app-0016-9c0b-4ef8-bb6d-6bb9bd380a77', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (15.1% vs 10% rep floor limit).'),
('app-0017-9c0b-4ef8-bb6d-6bb9bd380a77', 'f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (7.8% vs 10% rep floor limit).'),
('app-0018-9c0b-4ef8-bb6d-6bb9bd380a77', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (14.8% vs 10% rep floor limit).'),
('app-0019-9c0b-4ef8-bb6d-6bb9bd380a77', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (16.2% vs 10% rep floor limit).'),
('app-0020-9c0b-4ef8-bb6d-6bb9bd380a77', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (11.1% vs 10% rep floor limit).'),
('app-0021-9c0b-4ef8-bb6d-6bb9bd380a77', 'f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (4.9% vs 10% rep floor limit).'),
('app-0022-9c0b-4ef8-bb6d-6bb9bd380a77', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (14.9% vs 10% rep floor limit).'),
('app-0023-9c0b-4ef8-bb6d-6bb9bd380a77', 'f33ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (16.5% vs 10% rep floor limit).'),
('app-0024-9c0b-4ef8-bb6d-6bb9bd380a77', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (13.2% vs 10% rep floor limit).'),
('app-0025-9c0b-4ef8-bb6d-6bb9bd380a77', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (12.1% vs 10% rep floor limit).'),
('app-0026-9c0b-4ef8-bb6d-6bb9bd380a77', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (13.0% vs 10% rep floor limit).'),
('app-0027-9c0b-4ef8-bb6d-6bb9bd380a77', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (16.3% vs 10% rep floor limit).'),
('app-0028-9c0b-4ef8-bb6d-6bb9bd380a77', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (0.0% vs 10% rep floor limit).'),
('app-0029-9c0b-4ef8-bb6d-6bb9bd380a77', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (14.6% vs 10% rep floor limit).'),
('app-0030-9c0b-4ef8-bb6d-6bb9bd380a77', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (18.0% vs 10% rep floor limit).'),
('app-0031-9c0b-4ef8-bb6d-6bb9bd380a77', 'f43ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (12.5% vs 10% rep floor limit).'),
('app-0032-9c0b-4ef8-bb6d-6bb9bd380a77', 'f44ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'REJECTED', 'Discount threshold checked (10.1% vs 10% rep floor limit).'),
('app-0033-9c0b-4ef8-bb6d-6bb9bd380a77', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (14.3% vs 10% rep floor limit).'),
('app-0034-9c0b-4ef8-bb6d-6bb9bd380a77', 'f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'REJECTED', 'Discount threshold checked (3.9% vs 10% rep floor limit).'),
('app-0035-9c0b-4ef8-bb6d-6bb9bd380a77', 'f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (17.7% vs 10% rep floor limit).'),
('app-0036-9c0b-4ef8-bb6d-6bb9bd380a77', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'APPROVED', 'Discount threshold checked (13.6% vs 10% rep floor limit).'),
('app-0037-9c0b-4ef8-bb6d-6bb9bd380a77', 'f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SALES_MANAGER', 'PENDING', 'Discount threshold checked (18.0% vs 10% rep floor limit).');


-- 12. NEGOTIATIONS
INSERT INTO negotiations (id, quotation_id, quote_item_id, actor_id, actor_type, requested_quantity, requested_discount_percent, proposed_total, notes) VALUES
('neg-0001-1111-4ef8-bb6d-6bb9bd380a11', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 94610.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0002-1111-4ef8-bb6d-6bb9bd380a11', 'f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 93855.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0003-1111-4ef8-bb6d-6bb9bd380a11', 'f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 13977.5, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0004-1111-4ef8-bb6d-6bb9bd380a11', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 26514.5, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0005-1111-4ef8-bb6d-6bb9bd380a11', 'f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 11945.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0006-1111-4ef8-bb6d-6bb9bd380a11', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 63420.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0007-1111-4ef8-bb6d-6bb9bd380a11', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 103396.75, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0008-1111-4ef8-bb6d-6bb9bd380a11', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 176195.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0009-1111-4ef8-bb6d-6bb9bd380a11', 'f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 16960.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0010-1111-4ef8-bb6d-6bb9bd380a11', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 16995.3, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0011-1111-4ef8-bb6d-6bb9bd380a11', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 45027.5, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0012-1111-4ef8-bb6d-6bb9bd380a11', 'f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 76212.4, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0013-1111-4ef8-bb6d-6bb9bd380a11', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 196025.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0014-1111-4ef8-bb6d-6bb9bd380a11', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 18593.5, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0015-1111-4ef8-bb6d-6bb9bd380a11', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 53310.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0016-1111-4ef8-bb6d-6bb9bd380a11', 'f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, NULL, 'CUSTOMER', 5, 12.0, 58800.0, 'Customer requested additional 5% discount on line item configuration.'),
('neg-0017-1111-4ef8-bb6d-6bb9bd380a11', 'f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NULL, 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'USER', 5, 12.0, 18983.0, 'Customer requested additional 5% discount on line item configuration.');


-- 13. SUBSCRIPTIONS
INSERT INTO subscriptions (id, quotation_id, customer_id, product_id, product_name, unit_price, quantity, billing_cycle, amount, start_date, next_billing_date, status) VALUES
('sub-0001-9c0b-4ef8-bb6d-6bb9bd380a88', 'f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 1100.0, 45, 'YEARLY', 91300.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'PAUSED'),
('sub-0002-9c0b-4ef8-bb6d-6bb9bd380a88', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd36eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Hardware Maintenance 5yr Add-On', 1100.0, 29, 'QUARTERLY', 85800.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'CANCELLED'),
('sub-0003-9c0b-4ef8-bb6d-6bb9bd380a88', 'f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 750.0, 52, 'MONTHLY', 15750.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0004-9c0b-4ef8-bb6d-6bb9bd380a88', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 750.0, 30, 'QUARTERLY', 26250.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0005-9c0b-4ef8-bb6d-6bb9bd380a88', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 350.0, 65, 'YEARLY', 15750.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'CANCELLED'),
('sub-0006-9c0b-4ef8-bb6d-6bb9bd380a88', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 480.0, 45, 'MONTHLY', 28800.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0007-9c0b-4ef8-bb6d-6bb9bd380a88', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Care Plan 2yr', 650.0, 84, 'MONTHLY', 46150.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'CANCELLED'),
('sub-0008-9c0b-4ef8-bb6d-6bb9bd380a88', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd20eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Standard Support SLA', 350.0, 55, 'YEARLY', 20650.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0009-9c0b-4ef8-bb6d-6bb9bd380a88', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c23eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd39eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Virtual Private Gateway License', 780.0, 81, 'MONTHLY', 42120.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0010-9c0b-4ef8-bb6d-6bb9bd380a88', 'f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd32eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Multi-Cloud Cost Optimizer', 950.0, 11, 'MONTHLY', 51300.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE'),
('sub-0011-9c0b-4ef8-bb6d-6bb9bd380a88', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c17eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd11eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cloud SaaS Enterprise License', 480.0, 23, 'QUARTERLY', 42720.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'PAUSED'),
('sub-0012-9c0b-4ef8-bb6d-6bb9bd380a88', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c22eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd19eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business SLA Support', 750.0, 59, 'MONTHLY', 64500.0, '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'ACTIVE');


-- 14. INVOICES
INSERT INTO invoices (id, quotation_id, customer_id, subscription_id, invoice_number, type, amount, tax, total, paid_amount, status, due_date) VALUES
('inv-0100-9c0b-4ef8-bb6d-6bb9bd380a99', 'f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-100', 'ONE_TIME', 52237.5, 0.0, 52237.5, 52237.5, 'PAID', '2026-10-30 00:00:00+00'),
('inv-0101-9c0b-4ef8-bb6d-6bb9bd380a99', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-101', 'ONE_TIME', 53054.25, 0.0, 53054.25, 0.0, 'ISSUED', '2026-10-30 00:00:00+00'),
('inv-0102-9c0b-4ef8-bb6d-6bb9bd380a99', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-102', 'ONE_TIME', 111485.0, 0.0, 111485.0, 0.0, 'OVERDUE', '2026-10-30 00:00:00+00'),
('inv-0103-9c0b-4ef8-bb6d-6bb9bd380a99', 'f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-103', 'ONE_TIME', 61200.0, 0.0, 61200.0, 0.0, 'OVERDUE', '2026-10-30 00:00:00+00'),
('inv-0104-9c0b-4ef8-bb6d-6bb9bd380a99', 'f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-104', 'ONE_TIME', 5582.0, 0.0, 5582.0, 0.0, 'OVERDUE', '2026-10-30 00:00:00+00'),
('inv-0105-9c0b-4ef8-bb6d-6bb9bd380a99', 'f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-105', 'ONE_TIME', 6956.25, 0.0, 6956.25, 0.0, 'OVERDUE', '2026-10-30 00:00:00+00'),
('inv-0106-9c0b-4ef8-bb6d-6bb9bd380a99', 'f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c12eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-106', 'ONE_TIME', 12550.0, 0.0, 12550.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0107-9c0b-4ef8-bb6d-6bb9bd380a99', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-107', 'ONE_TIME', 64350.0, 0.0, 64350.0, 64350.0, 'PAID', '2026-10-30 00:00:00+00'),
('inv-0108-9c0b-4ef8-bb6d-6bb9bd380a99', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-108', 'ONE_TIME', 57424.0, 0.0, 57424.0, 0.0, 'ISSUED', '2026-10-30 00:00:00+00'),
('inv-0109-9c0b-4ef8-bb6d-6bb9bd380a99', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c19eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-109', 'ONE_TIME', 71087.2, 0.0, 71087.2, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0110-9c0b-4ef8-bb6d-6bb9bd380a99', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c16eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-110', 'ONE_TIME', 29077.9, 0.0, 29077.9, 29077.9, 'PAID', '2026-10-30 00:00:00+00'),
('inv-0111-9c0b-4ef8-bb6d-6bb9bd380a99', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-111', 'ONE_TIME', 22829.75, 0.0, 22829.75, 0.0, 'OVERDUE', '2026-10-30 00:00:00+00'),
('inv-0112-9c0b-4ef8-bb6d-6bb9bd380a99', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-112', 'ONE_TIME', 102782.5, 0.0, 102782.5, 102782.5, 'PAID', '2026-10-30 00:00:00+00'),
('inv-0113-9c0b-4ef8-bb6d-6bb9bd380a99', 'f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c24eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-113', 'ONE_TIME', 42755.0, 0.0, 42755.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0114-9c0b-4ef8-bb6d-6bb9bd380a99', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-114', 'ONE_TIME', 88057.5, 0.0, 88057.5, 35223.0, 'PARTIALLY_PAID', '2026-10-30 00:00:00+00'),
('inv-0115-9c0b-4ef8-bb6d-6bb9bd380a99', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-115', 'ONE_TIME', 25387.5, 0.0, 25387.5, 10155.0, 'PARTIALLY_PAID', '2026-10-30 00:00:00+00'),
('inv-0116-9c0b-4ef8-bb6d-6bb9bd380a99', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c11eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-116', 'ONE_TIME', 17545.0, 0.0, 17545.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0117-9c0b-4ef8-bb6d-6bb9bd380a99', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c23eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-117', 'ONE_TIME', 16380.0, 0.0, 16380.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0118-9c0b-4ef8-bb6d-6bb9bd380a99', 'f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c14eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-118', 'ONE_TIME', 15960.0, 0.0, 15960.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0119-9c0b-4ef8-bb6d-6bb9bd380a99', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c20eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-119', 'ONE_TIME', 50657.5, 0.0, 50657.5, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0120-9c0b-4ef8-bb6d-6bb9bd380a99', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c17eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-120', 'ONE_TIME', 113442.0, 0.0, 113442.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0121-9c0b-4ef8-bb6d-6bb9bd380a99', 'f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c9eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-121', 'ONE_TIME', 34122.5, 0.0, 34122.5, 0.0, 'DRAFT', '2026-10-30 00:00:00+00'),
('inv-0122-9c0b-4ef8-bb6d-6bb9bd380a99', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c22eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'INV-2026-122', 'ONE_TIME', 76085.0, 0.0, 76085.0, 0.0, 'DRAFT', '2026-10-30 00:00:00+00');


-- 15. PAYMENTS
INSERT INTO payments (id, invoice_id, amount, payment_method, reference, payment_date) VALUES
('pay-0001-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0100-9c0b-4ef8-bb6d-6bb9bd380a99', 52237.5, 'CASH', 'TXN-REF-00001', '2026-09-01 10:00:00+00'),
('pay-0002-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0107-9c0b-4ef8-bb6d-6bb9bd380a99', 64350.0, 'UPI', 'TXN-REF-00002', '2026-09-01 10:00:00+00'),
('pay-0003-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0110-9c0b-4ef8-bb6d-6bb9bd380a99', 29077.9, 'CASH', 'TXN-REF-00003', '2026-09-01 10:00:00+00'),
('pay-0004-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0112-9c0b-4ef8-bb6d-6bb9bd380a99', 102782.5, 'CARD', 'TXN-REF-00004', '2026-09-01 10:00:00+00'),
('pay-0005-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0114-9c0b-4ef8-bb6d-6bb9bd380a99', 35223.0, 'CASH', 'TXN-REF-00005', '2026-09-01 10:00:00+00'),
('pay-0006-9c0b-4ef8-bb6d-6bb9bd380a00', 'inv-0115-9c0b-4ef8-bb6d-6bb9bd380a99', 10155.0, 'BANK_TRANSFER', 'TXN-REF-00006', '2026-09-01 10:00:00+00');


-- 16. DEAL EVENTS
INSERT INTO deal_events (id, quotation_id, actor_id, event_type, description) VALUES
('evt-0001-9c0b-4ef8-bb6d-6bb9bd380a11', 'f01ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8401 status progressed to PENDING_APPROVAL.'),
('evt-0002-9c0b-4ef8-bb6d-6bb9bd380a11', 'f02ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8402 status progressed to CONFIRMED.'),
('evt-0003-9c0b-4ef8-bb6d-6bb9bd380a11', 'f03ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8403 status progressed to FULFILLED.'),
('evt-0004-9c0b-4ef8-bb6d-6bb9bd380a11', 'f04ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8404 status progressed to APPROVED.'),
('evt-0005-9c0b-4ef8-bb6d-6bb9bd380a11', 'f05ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8405 status progressed to FULFILLED.'),
('evt-0006-9c0b-4ef8-bb6d-6bb9bd380a11', 'f06ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8406 status progressed to DRAFT.'),
('evt-0007-9c0b-4ef8-bb6d-6bb9bd380a11', 'f07ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8407 status progressed to PENDING_APPROVAL.'),
('evt-0008-9c0b-4ef8-bb6d-6bb9bd380a11', 'f08ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8408 status progressed to PENDING_APPROVAL.'),
('evt-0009-9c0b-4ef8-bb6d-6bb9bd380a11', 'f09ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8409 status progressed to APPROVED.'),
('evt-0010-9c0b-4ef8-bb6d-6bb9bd380a11', 'f10ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8410 status progressed to DRAFT.'),
('evt-0011-9c0b-4ef8-bb6d-6bb9bd380a11', 'f11ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8411 status progressed to FULFILLED.'),
('evt-0012-9c0b-4ef8-bb6d-6bb9bd380a11', 'f12ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8412 status progressed to FULFILLED.'),
('evt-0013-9c0b-4ef8-bb6d-6bb9bd380a11', 'f13ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8413 status progressed to REJECTED.'),
('evt-0014-9c0b-4ef8-bb6d-6bb9bd380a11', 'f14ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8414 status progressed to NEGOTIATION.'),
('evt-0015-9c0b-4ef8-bb6d-6bb9bd380a11', 'f15ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8415 status progressed to CONFIRMED.'),
('evt-0016-9c0b-4ef8-bb6d-6bb9bd380a11', 'f16ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8416 status progressed to APPROVED.'),
('evt-0017-9c0b-4ef8-bb6d-6bb9bd380a11', 'f17ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8417 status progressed to CONFIRMED.'),
('evt-0018-9c0b-4ef8-bb6d-6bb9bd380a11', 'f18ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8418 status progressed to PENDING_APPROVAL.'),
('evt-0019-9c0b-4ef8-bb6d-6bb9bd380a11', 'f19ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8419 status progressed to PENDING_APPROVAL.'),
('evt-0020-9c0b-4ef8-bb6d-6bb9bd380a11', 'f20ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8420 status progressed to FULFILLED.'),
('evt-0021-9c0b-4ef8-bb6d-6bb9bd380a11', 'f21ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8421 status progressed to DRAFT.'),
('evt-0022-9c0b-4ef8-bb6d-6bb9bd380a11', 'f22ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8422 status progressed to PENDING_APPROVAL.'),
('evt-0023-9c0b-4ef8-bb6d-6bb9bd380a11', 'f23ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8423 status progressed to NEGOTIATION.'),
('evt-0024-9c0b-4ef8-bb6d-6bb9bd380a11', 'f24ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8424 status progressed to CONFIRMED.'),
('evt-0025-9c0b-4ef8-bb6d-6bb9bd380a11', 'f25ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8425 status progressed to PENDING_APPROVAL.'),
('evt-0026-9c0b-4ef8-bb6d-6bb9bd380a11', 'f26ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8426 status progressed to DRAFT.'),
('evt-0027-9c0b-4ef8-bb6d-6bb9bd380a11', 'f27ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8427 status progressed to APPROVED.'),
('evt-0028-9c0b-4ef8-bb6d-6bb9bd380a11', 'f28ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8428 status progressed to PENDING_APPROVAL.'),
('evt-0029-9c0b-4ef8-bb6d-6bb9bd380a11', 'f29ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8429 status progressed to PENDING_APPROVAL.'),
('evt-0030-9c0b-4ef8-bb6d-6bb9bd380a11', 'f30ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8430 status progressed to NEGOTIATION.'),
('evt-0031-9c0b-4ef8-bb6d-6bb9bd380a11', 'f31ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8431 status progressed to APPROVED.'),
('evt-0032-9c0b-4ef8-bb6d-6bb9bd380a11', 'f32ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8432 status progressed to APPROVED.'),
('evt-0033-9c0b-4ef8-bb6d-6bb9bd380a11', 'f33ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8433 status progressed to DRAFT.'),
('evt-0034-9c0b-4ef8-bb6d-6bb9bd380a11', 'f34ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8434 status progressed to CONFIRMED.'),
('evt-0035-9c0b-4ef8-bb6d-6bb9bd380a11', 'f35ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8435 status progressed to NEGOTIATION.'),
('evt-0036-9c0b-4ef8-bb6d-6bb9bd380a11', 'f36ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8436 status progressed to PENDING_APPROVAL.'),
('evt-0037-9c0b-4ef8-bb6d-6bb9bd380a11', 'f37ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8437 status progressed to APPROVED.'),
('evt-0038-9c0b-4ef8-bb6d-6bb9bd380a11', 'f38ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8438 status progressed to APPROVED.'),
('evt-0039-9c0b-4ef8-bb6d-6bb9bd380a11', 'f39ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8439 status progressed to DRAFT.'),
('evt-0040-9c0b-4ef8-bb6d-6bb9bd380a11', 'f40ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8440 status progressed to FULFILLED.'),
('evt-0041-9c0b-4ef8-bb6d-6bb9bd380a11', 'f41ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8441 status progressed to FULFILLED.'),
('evt-0042-9c0b-4ef8-bb6d-6bb9bd380a11', 'f42ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DISPATCH_RELEASED', 'Quotation QT-2026-8442 status progressed to FULFILLED.'),
('evt-0043-9c0b-4ef8-bb6d-6bb9bd380a11', 'f43ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QUOTE_CREATED', 'Quotation QT-2026-8443 status progressed to DRAFT.'),
('evt-0044-9c0b-4ef8-bb6d-6bb9bd380a11', 'f44ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8444 status progressed to REJECTED.'),
('evt-0045-9c0b-4ef8-bb6d-6bb9bd380a11', 'f45ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8445 status progressed to PENDING_APPROVAL.'),
('evt-0046-9c0b-4ef8-bb6d-6bb9bd380a11', 'f46ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8446 status progressed to REJECTED.'),
('evt-0047-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8447 status progressed to APPROVED.'),
('evt-0048-9c0b-4ef8-bb6d-6bb9bd380a11', 'f48ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVAL_GRANTED', 'Quotation QT-2026-8448 status progressed to APPROVED.'),
('evt-0049-9c0b-4ef8-bb6d-6bb9bd380a11', 'f49ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8449 status progressed to NEGOTIATION.'),
('evt-0050-9c0b-4ef8-bb6d-6bb9bd380a11', 'f50ebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'STATUS_UPDATED', 'Quotation QT-2026-8450 status progressed to PENDING_APPROVAL.');
