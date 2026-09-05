from datetime import datetime, timezone
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


# ==========================================
# Enumerations
# ==========================================

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SALES_REP = "SALES_REP"
    SALES_MANAGER = "SALES_MANAGER"
    FINANCE = "FINANCE"


class CustomerTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"


class QuotationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    NEGOTIATION = "NEGOTIATION"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ApprovalRole(str, enum.Enum):
    SALES_MANAGER = "SALES_MANAGER"
    FINANCE = "FINANCE"


class BillingCycle(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    PAUSED = "PAUSED"


class InvoiceType(str, enum.Enum):
    ONE_TIME = "ONE_TIME"
    RECURRING = "RECURRING"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    UPI = "UPI"
    CASH = "CASH"


# ==========================================
# SQLAlchemy Models
# ==========================================

class Company(Base):
    """
    Company tenant model. Top-level organization encapsulating all users,
    customers, products, warehouses, and deal flow transactions.
    """
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="company", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="company", cascade="all, delete-orphan")
    discount_rules = relationship("DiscountRule", back_populates="company", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="company", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    """
    Internal application user belonging to a company with specific access roles.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SALES_REP)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="users")
    quotations = relationship("Quotation", back_populates="sales_rep", foreign_keys="[Quotation.sales_rep_id]")
    approvals = relationship("Approval", back_populates="approver")


class Customer(Base):
    """
    External customer entity associated with a company, categorized by tier and status.
    """
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(255), nullable=True)
    contact_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    tier = Column(Enum(CustomerTier), nullable=False, default=CustomerTier.BRONZE)
    status = Column(String(50), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="customers")
    quotations = relationship("Quotation", back_populates="customer")


class Product(Base):
    """
    Product or service item belonging to a company with default pricing and tax configuration.
    """
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0.00)
    is_subscription = Column(Boolean, nullable=False, default=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="products")
    inventory_items = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")


class DiscountRule(Base):
    """
    Tier-based or volume-based pricing discount rules for a company.
    """
    __tablename__ = "discount_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    customer_tier = Column(Enum(CustomerTier), nullable=True)
    min_quantity = Column(Integer, nullable=False, default=1)
    discount_percentage = Column(Numeric(5, 2), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="discount_rules")


class Warehouse(Base):
    """
    Physical or logical storage facility owned by a company.
    """
    __tablename__ = "warehouses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    shipping_cost = Column(Numeric(12, 2), nullable=False, default=500.00)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="warehouses")
    inventory_items = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")


class Inventory(Base):
    """
    Stock availability tracking connecting products to specific warehouses.
    """
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    warehouse = relationship("Warehouse", back_populates="inventory_items")
    product = relationship("Product", back_populates="inventory_items")


class Quotation(Base):
    """
    Central commercial proposal/quote entity connecting customer, sales rep, line items,
    financial metrics, approvals, negotiations, subscriptions, invoices, and deal events.
    """
    __tablename__ = "quotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    sales_rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quote_number = Column(String(100), unique=True, nullable=False)
    status = Column(Enum(QuotationStatus), nullable=False, default=QuotationStatus.DRAFT)

    # Financial Totals & Margins
    subtotal = Column(Numeric(14, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    tax_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    estimated_cost = Column(Numeric(14, 2), nullable=False, default=0.00)
    margin_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    margin_percent = Column(Numeric(5, 2), nullable=False, default=0.00)

    # Risk & Governance Flags
    risk_score = Column(Numeric(5, 2), nullable=False, default=0.00)
    approval_required = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="quotations")
    customer = relationship("Customer", back_populates="quotations")
    sales_rep = relationship("User", back_populates="quotations", foreign_keys=[sales_rep_id])
    items = relationship("QuoteItem", back_populates="quotation", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="quotation", cascade="all, delete-orphan")
    negotiations = relationship("Negotiation", back_populates="quotation", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="quotation", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="quotation", cascade="all, delete-orphan")
    deal_events = relationship("DealEvent", back_populates="quotation", cascade="all, delete-orphan")


class QuoteItem(Base):
    """
    Line item inside a quotation storing historical snapshots of product metadata
    (product_name, category, unit_price, unit_cost, tax_rate) to maintain quote stability.
    """
    __tablename__ = "quote_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Historical Snapshots
    product_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0.00)

    # Quantities & Totals
    quantity = Column(Integer, nullable=False, default=1)
    discount_percentage = Column(Numeric(5, 2), nullable=False, default=0.00)
    line_total = Column(Numeric(14, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")


class Approval(Base):
    """
    Approval decision log for a quotation requiring Sales Manager or Finance approval.
    """
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approval_role = Column(Enum(ApprovalRole), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING")
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")


class Negotiation(Base):
    """
    Record of price/term negotiation rounds on a quotation.
    """
    __tablename__ = "negotiations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    quote_item_id = Column(UUID(as_uuid=True), ForeignKey("quote_items.id", ondelete="SET NULL"), nullable=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_type = Column(String(50), nullable=False, default="USER")
    requested_quantity = Column(Integer, nullable=True)
    requested_discount_percent = Column(Numeric(5, 2), nullable=True)
    proposed_total = Column(Numeric(14, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="negotiations")
    quote_item = relationship("QuoteItem")
    actor = relationship("User")


class Subscription(Base):
    """
    Recurring billing agreement associated with a confirmed quotation line item.
    Tracks billing cycle, proration, and cancellation metadata.
    """
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Product snapshot (denormalized for billing stability)
    product_name = Column(String(255), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)

    # Billing details
    quantity = Column(Integer, nullable=False, default=1)
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    amount = Column(Numeric(12, 2), nullable=False)  # quantity * unit_price per cycle
    start_date = Column(DateTime(timezone=True), nullable=False)
    next_billing_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)  # set on cancellation

    # Status
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
    cancellation_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="subscriptions")
    customer = relationship("Customer")
    product = relationship("Product")


class Invoice(Base):
    """
    Billing invoice generated from a quotation.
    """
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    invoice_number = Column(String(100), unique=True, nullable=False)
    type = Column(Enum(InvoiceType), nullable=False, default=InvoiceType.ONE_TIME)
    amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    tax = Column(Numeric(14, 2), nullable=False, default=0.00)
    total = Column(Numeric(14, 2), nullable=False, default=0.00)
    paid_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    status = Column(Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.ISSUED)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quotation = relationship("Quotation", back_populates="invoices")
    customer = relationship("Customer")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class Payment(Base):
    """
    Financial payment transaction recorded against an invoice.
    """
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    reference = Column(String(255), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")


class DealEvent(Base):
    """
    Audit log event tracking life-cycle changes and activity timeline on a quotation.
    """
    __tablename__ = "deal_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    quotation = relationship("Quotation", back_populates="deal_events")
    actor = relationship("User")
