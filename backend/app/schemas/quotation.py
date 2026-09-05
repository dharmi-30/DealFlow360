from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field
from app.db.models import CustomerTier, QuotationStatus


class QuoteItemInput(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0, description="Quantity of items")
    discount_percent: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        alias="discount_percentage",
        description="Discount percentage (0-100)",
    )

    model_config = ConfigDict(populate_by_name=True)


class QuotationCreate(BaseModel):
    customer_id: uuid.UUID
    items: List[QuoteItemInput] = Field(..., min_length=1)


class QuotationUpdate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    items: Optional[List[QuoteItemInput]] = None


class CustomerBriefResponse(BaseModel):
    id: uuid.UUID
    contact_name: str
    email: str
    company_name: Optional[str] = None
    tier: CustomerTier

    model_config = ConfigDict(from_attributes=True)


class QuoteItemResponse(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_name: str
    category: Optional[str] = None
    unit_price: Decimal
    unit_cost: Decimal
    tax_rate: Decimal
    quantity: int
    discount_percentage: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class QuotationResponse(BaseModel):
    id: uuid.UUID
    quote_number: str
    customer_id: uuid.UUID
    customer: CustomerBriefResponse
    items: List[QuoteItemResponse]
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    estimated_cost: Decimal
    margin_amount: Decimal
    margin_percent: Decimal
    status: QuotationStatus
    risk_score: Decimal
    approval_required: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
