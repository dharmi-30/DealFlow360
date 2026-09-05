from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
import uuid

from pydantic import BaseModel, Field

from app.db.models import BillingCycle, SubscriptionStatus


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SubscriptionItemRequest(BaseModel):
    """
    Defines one subscription line requested from a quotation.
    Only quote items whose product has is_subscription=True are eligible.
    """
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1, description="Number of subscription units")
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    start_date: datetime = Field(..., description="ISO-8601 UTC start date for the subscription")


class CreateSubscriptionsRequest(BaseModel):
    """
    Request body to create one or more subscriptions from a confirmed quotation.
    Only subscription-eligible quote items may be listed; one-time products are ignored.
    """
    items: List[SubscriptionItemRequest] = Field(..., min_length=1)


class ChangeQuantityRequest(BaseModel):
    """Request body to change active subscription quantity mid-cycle."""
    new_quantity: int = Field(..., ge=1, description="Updated subscription quantity")


class CancelRequest(BaseModel):
    """
    Request body for subscription cancellation.
    - immediate: cancels now, generates prorated credit note.
    - end_of_period: marks subscription for cancellation at next billing date.
    """
    cancellation_type: Literal["immediate", "end_of_period"] = "end_of_period"
    reason: Optional[str] = Field(None, max_length=500)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    quotation_id: uuid.UUID
    customer_id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_name: str
    unit_price: Decimal
    quantity: int
    billing_cycle: BillingCycle
    amount: Decimal           # quantity * unit_price for one billing cycle
    start_date: datetime
    next_billing_date: datetime
    end_date: Optional[datetime]
    status: SubscriptionStatus
    cancellation_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProratedChangeResponse(BaseModel):
    """
    Response returned when a subscription quantity is changed mid-cycle.
    Includes both the updated subscription state and proration calculation details.
    """
    subscription: SubscriptionResponse
    old_quantity: int
    new_quantity: int
    # Remaining days in the current billing period
    days_remaining: int
    total_days_in_period: int
    # Positive = charge (quantity increased), Negative = credit (quantity decreased)
    prorated_amount: Decimal
    note: str


class CancellationResponse(BaseModel):
    """
    Response returned when a subscription is cancelled.
    Includes credit/refund note for immediate cancellations.
    """
    subscription: SubscriptionResponse
    cancellation_type: str
    credit_amount: Decimal       # 0 for end_of_period, prorated credit for immediate
    effective_date: datetime
    note: str
