"""
routers/subscriptions.py
------------------------
Subscription management endpoints for DealFlow360.

Endpoints:
  POST   /quotations/{quotation_id}/subscriptions  – create subscriptions from a quotation
  GET    /subscriptions                             – list all company subscriptions
  GET    /subscriptions/{id}                        – get a single subscription
  POST   /subscriptions/{id}/change                 – change quantity (with proration)
  POST   /subscriptions/{id}/cancel                 – cancel (immediate or end_of_period)
"""

from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.subscription import (
    CancelRequest,
    CancellationResponse,
    ChangeQuantityRequest,
    CreateSubscriptionsRequest,
    ProratedChangeResponse,
    SubscriptionResponse,
)
from app.services import billing_service

# ---------------------------------------------------------------------------
# Router for /quotations/{quotation_id}/subscriptions
# ---------------------------------------------------------------------------
quotation_sub_router = APIRouter(prefix="/quotations", tags=["Subscriptions"])


@quotation_sub_router.post(
    "/{quotation_id}/subscriptions",
    response_model=List[SubscriptionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create subscriptions from a confirmed quotation",
)
def create_subscriptions(
    quotation_id: uuid.UUID,
    payload: CreateSubscriptionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create recurring subscriptions from subscription-eligible line items
    of a CONFIRMED quotation. One-time products are ignored.
    Duplicate subscriptions for the same product are rejected.
    """
    return billing_service.create_subscriptions(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
        payload=payload,
    )


# ---------------------------------------------------------------------------
# Router for /subscriptions
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get(
    "",
    response_model=List[SubscriptionResponse],
    summary="List all subscriptions for this company",
)
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all subscriptions belonging to the authenticated user's company."""
    return billing_service.get_subscriptions(db=db, company_id=current_user.company_id)


@router.get(
    "/{subscription_id}",
    response_model=SubscriptionResponse,
    summary="Get a single subscription by ID",
)
def get_subscription(
    subscription_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single subscription scoped to the current user's company."""
    return billing_service.get_subscription_by_id(
        db=db,
        company_id=current_user.company_id,
        subscription_id=subscription_id,
    )


@router.post(
    "/{subscription_id}/change",
    response_model=ProratedChangeResponse,
    summary="Change subscription quantity with prorated billing adjustment",
)
def change_quantity(
    subscription_id: uuid.UUID,
    payload: ChangeQuantityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the quantity of an ACTIVE subscription.

    Calculates a prorated charge (quantity increase) or credit (quantity decrease)
    based on remaining days in the current billing cycle.
    """
    return billing_service.change_subscription_quantity(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        subscription_id=subscription_id,
        payload=payload,
    )


@router.post(
    "/{subscription_id}/cancel",
    response_model=CancellationResponse,
    summary="Cancel an active subscription",
)
def cancel_subscription(
    subscription_id: uuid.UUID,
    payload: CancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an ACTIVE subscription.

    - **immediate**: Cancels now. Prorated credit is calculated for unused days.
    - **end_of_period**: Runs until next_billing_date, then cancels. No credit issued.
    """
    return billing_service.cancel_subscription(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        subscription_id=subscription_id,
        payload=payload,
    )
