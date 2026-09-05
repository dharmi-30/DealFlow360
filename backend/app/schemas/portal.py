from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel, Field

from app.db.models import QuotationStatus


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class PortalNegotiationRequest(BaseModel):
    """
    Request body submitted by customer on the portal to negotiate terms.
    """
    quote_item_id: Optional[uuid.UUID] = Field(None, description="Target quote item ID if item-specific")
    requested_quantity: Optional[int] = Field(None, ge=1, description="Requested updated quantity")
    requested_discount_percent: Optional[Decimal] = Field(
        None, ge=0, le=100, description="Requested updated discount percentage"
    )
    comment: Optional[str] = Field(None, max_length=1000, description="Customer comment or price request")


# ---------------------------------------------------------------------------
# Sanitized Customer Portal Response Schemas (No Internal Margins/Risk/Approvals)
# ---------------------------------------------------------------------------

class PortalQuoteItemResponse(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_name: str
    category: Optional[str]
    unit_price: Decimal
    quantity: int
    discount_percentage: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class PortalNegotiationHistoryResponse(BaseModel):
    id: uuid.UUID
    quote_item_id: Optional[uuid.UUID]
    actor_type: str
    requested_quantity: Optional[int]
    requested_discount_percent: Optional[Decimal]
    proposed_total: Decimal
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PortalQuotationResponse(BaseModel):
    """
    Sanitized quotation view for Customer Portal.
    EXCLUDES internal margin, internal risk score, internal approval comments, and sales notes.
    """
    id: uuid.UUID
    quote_number: str
    status: QuotationStatus
    customer_id: uuid.UUID
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    approval_required: bool
    created_at: datetime
    updated_at: datetime
    items: List[PortalQuoteItemResponse] = []
    negotiations: List[PortalNegotiationHistoryResponse] = []

    model_config = {"from_attributes": True}
