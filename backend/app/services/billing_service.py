"""
services/billing_service.py
---------------------------
Subscription and billing logic for DealFlow360.

Responsibilities:
- Create subscriptions from confirmed quotation items (subscription products only).
- Calculate next billing date based on billing cycle.
- Calculate prorated charges/credits on quantity changes mid-cycle.
- Handle immediate and end-of-period cancellations.

No external payment gateway is used. All calculations are deterministic.
"""

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List
import uuid

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    BillingCycle,
    Customer,
    DealEvent,
    Product,
    Quotation,
    QuotationStatus,
    Subscription,
    SubscriptionStatus,
)
from app.schemas.subscription import (
    CancelRequest,
    CancellationResponse,
    ChangeQuantityRequest,
    CreateSubscriptionsRequest,
    ProratedChangeResponse,
    SubscriptionResponse,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _quantize(amount: Decimal) -> Decimal:
    """Round monetary value to 2 decimal places using banker's rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _next_billing_date(start: datetime, cycle: BillingCycle) -> datetime:
    """
    Calculate the next billing date based on the cycle:
      MONTHLY   → +1 month
      QUARTERLY → +3 months
      YEARLY    → +1 year
    Uses dateutil.relativedelta for correct month-end handling.
    """
    if cycle == BillingCycle.MONTHLY:
        return start + relativedelta(months=1)
    elif cycle == BillingCycle.QUARTERLY:
        return start + relativedelta(months=3)
    elif cycle == BillingCycle.YEARLY:
        return start + relativedelta(years=1)
    else:
        raise ValueError(f"Unknown billing cycle: {cycle}")


def _cycle_days(start: datetime, cycle: BillingCycle) -> int:
    """Return the total number of days in the billing period starting from `start`."""
    end = _next_billing_date(start, cycle)
    return (end.date() - start.date()).days


# ---------------------------------------------------------------------------
# Create Subscriptions
# ---------------------------------------------------------------------------

def create_subscriptions(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
    payload: CreateSubscriptionsRequest,
) -> List[SubscriptionResponse]:
    """
    Create one or more subscriptions from a confirmed quotation.

    Rules:
    - Quotation must belong to the company and be CONFIRMED.
    - Each requested product_id must be in the quotation's items AND have is_subscription=True.
    - A subscription line may not be duplicated for the same product on the same quotation.
    - Amount = quantity × unit_price (captured from quotation item snapshot).
    """
    # Validate quotation ownership and status
    quotation = (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.company_id == company_id)
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")

    if quotation.status != QuotationStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subscriptions can only be created for CONFIRMED quotations. "
                   f"Current status: {quotation.status.value}",
        )

    # Build lookup: product_id → quote_item for quick validation
    qi_map = {str(item.product_id): item for item in quotation.items if item.product_id}

    # Existing subscriptions on this quotation to prevent duplicates
    existing_sub_product_ids = {
        str(s.product_id)
        for s in db.query(Subscription).filter(Subscription.quotation_id == quotation_id).all()
    }

    created: List[Subscription] = []

    for req in payload.items:
        pid_str = str(req.product_id)

        # Product must be in the quotation
        if pid_str not in qi_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {req.product_id} is not part of this quotation",
            )

        # Prevent duplicate subscriptions for the same product
        if pid_str in existing_sub_product_ids:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Subscription for product {req.product_id} already exists on this quotation",
            )

        # Product must be flagged as a subscription product
        product = (
            db.query(Product)
            .filter(Product.id == req.product_id, Product.company_id == company_id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {req.product_id} not found",
            )
        if not product.is_subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is not a subscription product. "
                       f"Only products with is_subscription=True can be subscribed.",
            )

        qi = qi_map[pid_str]
        unit_price = Decimal(str(qi.unit_price))  # use snapshot price from quote item
        amount = _quantize(unit_price * req.quantity)
        next_bd = _next_billing_date(req.start_date, req.billing_cycle)

        sub = Subscription(
            quotation_id=quotation_id,
            customer_id=quotation.customer_id,
            product_id=req.product_id,
            product_name=qi.product_name,
            unit_price=unit_price,
            quantity=req.quantity,
            billing_cycle=req.billing_cycle,
            amount=amount,
            start_date=req.start_date,
            next_billing_date=next_bd,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(sub)
        created.append(sub)

    db.flush()  # assign IDs before logging events

    for sub in created:
        db.add(DealEvent(
            quotation_id=quotation_id,
            actor_id=user_id,
            event_type="SUBSCRIPTION_CREATED",
            description=(
                f"Subscription created for '{sub.product_name}' "
                f"— {sub.billing_cycle.value} billing, "
                f"qty {sub.quantity}, amount {sub.amount}"
            ),
        ))

    db.commit()
    for sub in created:
        db.refresh(sub)

    return [SubscriptionResponse.model_validate(s) for s in created]


# ---------------------------------------------------------------------------
# List Subscriptions
# ---------------------------------------------------------------------------

def get_subscriptions(
    db: Session,
    company_id: uuid.UUID,
) -> List[SubscriptionResponse]:
    """Return all subscriptions belonging to the company (via quotation ownership)."""
    subs = (
        db.query(Subscription)
        .join(Quotation, Subscription.quotation_id == Quotation.id)
        .filter(Quotation.company_id == company_id)
        .all()
    )
    return [SubscriptionResponse.model_validate(s) for s in subs]


def get_subscription_by_id(
    db: Session,
    company_id: uuid.UUID,
    subscription_id: uuid.UUID,
) -> SubscriptionResponse:
    """Return a single subscription scoped to the company."""
    sub = (
        db.query(Subscription)
        .join(Quotation, Subscription.quotation_id == Quotation.id)
        .filter(
            Subscription.id == subscription_id,
            Quotation.company_id == company_id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return SubscriptionResponse.model_validate(sub)


# ---------------------------------------------------------------------------
# Change Quantity (with proration)
# ---------------------------------------------------------------------------

def change_subscription_quantity(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    subscription_id: uuid.UUID,
    payload: ChangeQuantityRequest,
) -> ProratedChangeResponse:
    """
    Change the quantity of an active subscription mid-cycle.

    Proration formula:
        prorated_amount = (price_delta_per_cycle) × (days_remaining / total_days)

    - Positive prorated_amount → additional charge (quantity increased).
    - Negative prorated_amount → credit due (quantity decreased).
    """
    sub = _get_active_subscription(db, company_id, subscription_id)

    old_qty = sub.quantity
    new_qty = payload.new_quantity

    if old_qty == new_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New quantity is the same as the current quantity. No change applied.",
        )

    # Proration calculation
    now_utc = datetime.now(timezone.utc)
    next_bd = sub.next_billing_date

    # Ensure both datetimes are timezone-aware
    if next_bd.tzinfo is None:
        next_bd = next_bd.replace(tzinfo=timezone.utc)

    total_days = _cycle_days(sub.start_date, sub.billing_cycle)
    remaining_days = max((next_bd.date() - now_utc.date()).days, 0)

    unit_price = Decimal(str(sub.unit_price))
    old_amount_per_cycle = _quantize(unit_price * old_qty)
    new_amount_per_cycle = _quantize(unit_price * new_qty)
    delta_per_cycle = new_amount_per_cycle - old_amount_per_cycle

    if total_days > 0:
        prorated_amount = _quantize(delta_per_cycle * Decimal(remaining_days) / Decimal(total_days))
    else:
        prorated_amount = Decimal("0.00")

    # Apply the change
    sub.quantity = new_qty
    sub.amount = new_amount_per_cycle

    # Build a human-readable note
    if prorated_amount > 0:
        note = (
            f"Quantity increased from {old_qty} to {new_qty}. "
            f"Prorated charge of {prorated_amount} for {remaining_days} remaining days in the cycle."
        )
    elif prorated_amount < 0:
        note = (
            f"Quantity decreased from {old_qty} to {new_qty}. "
            f"Prorated credit of {abs(prorated_amount)} for {remaining_days} remaining days in the cycle."
        )
    else:
        note = (
            f"Quantity changed from {old_qty} to {new_qty}. "
            f"No proration applied (change effective at start of period or same-day)."
        )

    db.add(DealEvent(
        quotation_id=sub.quotation_id,
        actor_id=user_id,
        event_type="SUBSCRIPTION_QUANTITY_CHANGED",
        description=note,
    ))
    db.commit()
    db.refresh(sub)

    return ProratedChangeResponse(
        subscription=SubscriptionResponse.model_validate(sub),
        old_quantity=old_qty,
        new_quantity=new_qty,
        days_remaining=remaining_days,
        total_days_in_period=total_days,
        prorated_amount=prorated_amount,
        note=note,
    )


# ---------------------------------------------------------------------------
# Cancel Subscription
# ---------------------------------------------------------------------------

def cancel_subscription(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    subscription_id: uuid.UUID,
    payload: CancelRequest,
) -> CancellationResponse:
    """
    Cancel a subscription.

    immediate:
        - Status set to CANCELLED immediately.
        - Compute prorated credit for unused days remaining in the current cycle.
        - end_date = now.

    end_of_period:
        - Status set to CANCELLED.
        - end_date = next_billing_date (subscription runs until period ends).
        - No credit issued.
    """
    sub = _get_active_subscription(db, company_id, subscription_id)

    now_utc = datetime.now(timezone.utc)
    next_bd = sub.next_billing_date
    if next_bd.tzinfo is None:
        next_bd = next_bd.replace(tzinfo=timezone.utc)

    if payload.cancellation_type == "immediate":
        total_days = _cycle_days(sub.start_date, sub.billing_cycle)
        remaining_days = max((next_bd.date() - now_utc.date()).days, 0)

        if total_days > 0:
            credit_amount = _quantize(
                Decimal(str(sub.amount)) * Decimal(remaining_days) / Decimal(total_days)
            )
        else:
            credit_amount = Decimal("0.00")

        effective_date = now_utc
        cancellation_note = (
            f"Immediately cancelled by user. "
            f"Prorated credit of {credit_amount} issued for {remaining_days} "
            f"unused days out of {total_days} in billing cycle."
        )
        if payload.reason:
            cancellation_note += f" Reason: {payload.reason}"

        sub.status = SubscriptionStatus.CANCELLED
        sub.end_date = now_utc
        sub.cancellation_note = cancellation_note

        note = cancellation_note

    else:  # end_of_period
        credit_amount = Decimal("0.00")
        effective_date = next_bd
        cancellation_note = (
            f"Scheduled for cancellation at end of current billing period "
            f"({next_bd.strftime('%Y-%m-%d')}). No credit issued."
        )
        if payload.reason:
            cancellation_note += f" Reason: {payload.reason}"

        sub.status = SubscriptionStatus.CANCELLED
        sub.end_date = next_bd
        sub.cancellation_note = cancellation_note

        note = cancellation_note

    db.add(DealEvent(
        quotation_id=sub.quotation_id,
        actor_id=user_id,
        event_type="SUBSCRIPTION_CANCELLED",
        description=cancellation_note,
    ))
    db.commit()
    db.refresh(sub)

    return CancellationResponse(
        subscription=SubscriptionResponse.model_validate(sub),
        cancellation_type=payload.cancellation_type,
        credit_amount=credit_amount,
        effective_date=effective_date,
        note=note,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_active_subscription(
    db: Session,
    company_id: uuid.UUID,
    subscription_id: uuid.UUID,
) -> Subscription:
    """
    Fetch an ACTIVE subscription scoped to the company.
    Raises 404 if not found, 409 if already cancelled/paused.
    """
    sub = (
        db.query(Subscription)
        .join(Quotation, Subscription.quotation_id == Quotation.id)
        .filter(
            Subscription.id == subscription_id,
            Quotation.company_id == company_id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    if sub.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subscription is not ACTIVE (current status: {sub.status.value}). "
                   f"Only ACTIVE subscriptions can be changed or cancelled.",
        )
    return sub
