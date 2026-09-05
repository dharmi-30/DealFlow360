from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel, Field

from app.db.models import InvoiceStatus, InvoiceType, PaymentMethod


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class InvoiceCreateRequest(BaseModel):
    """
    Request body for creating an invoice from a quotation.
    If invoice_type is not provided, defaults to ONE_TIME.
    due_date is optional (defaults to 30 days from creation if omitted).
    """
    type: InvoiceType = InvoiceType.ONE_TIME
    due_date: Optional[datetime] = None


class PaymentCreateRequest(BaseModel):
    """
    Request body for recording a payment against an invoice.
    """
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    payment_method: PaymentMethod
    reference: Optional[str] = Field(None, max_length=255, description="Transaction reference or notes")
    payment_date: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class PaymentResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    amount: Decimal
    payment_method: PaymentMethod
    reference: Optional[str]
    payment_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    invoice_number: str
    quotation_id: uuid.UUID
    customer_id: uuid.UUID
    type: InvoiceType
    amount: Decimal
    tax: Decimal
    total: Decimal
    paid_amount: Decimal
    due_date: Optional[datetime]
    status: InvoiceStatus
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentResponse] = []

    model_config = {"from_attributes": True}
