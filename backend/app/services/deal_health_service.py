"""
services/deal_health_service.py
-------------------------------
Deal Health scoring and risk diagnostic service for DealFlow360.

Evaluates 5 deterministic factors:
1. Approval Delay
2. Customer Inactivity (Stalled Deal)
3. Discount Anomaly (comparing quote discount against rep historical average)
4. Margin Risk (gross margin percentage below threshold)
5. Delivery / Fulfillment Risk (stock availability deficit)

Calculates health_score (0-100) and status (HEALTHY, WATCH, AT_RISK, CRITICAL)
and generates actionable alerts.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import (
    Customer,
    DealEvent,
    Inventory,
    Quotation,
    QuotationStatus,
    QuoteItem,
    User,
    Warehouse,
)
from app.schemas.deal_health import DealHealthAlert, DealHealthResponse


def calculate_deal_health(
    db: Session,
    quotation: Quotation,
    stalled_threshold_days: int = 5,
) -> DealHealthResponse:
    """
    Evaluates quotation health score (0-100), health status, and specific risk alerts.
    Deterministic, explainable, and fully backend-calculated.
    """
    now = datetime.now(timezone.utc)
    score = 100
    alerts: List[DealHealthAlert] = []

    customer = db.query(Customer).filter(Customer.id == quotation.customer_id).first()
    customer_name = customer.contact_name if customer else "Unknown Customer"

    # -----------------------------------------------------------------------
    # Factor 1: Approval Delay
    # -----------------------------------------------------------------------
    if quotation.status == QuotationStatus.PENDING_APPROVAL:
        # Check how long it has been in PENDING_APPROVAL
        latest_event = (
            db.query(DealEvent)
            .filter(
                DealEvent.quotation_id == quotation.id,
                DealEvent.event_type.in_(["QUOTATION_SUBMITTED_FOR_APPROVAL", "CUSTOMER_NEGOTIATION_SUBMITTED"]),
            )
            .order_by(DealEvent.created_at.desc())
            .first()
        )
        days_pending = 0
        if latest_event and latest_event.created_at:
            ref_date = latest_event.created_at
            if ref_date.tzinfo is None:
                ref_date = ref_date.replace(tzinfo=timezone.utc)
            days_pending = (now - ref_date).days

        if days_pending >= 3:
            score -= 25
            alerts.append(
                DealHealthAlert(
                    type="APPROVAL_DELAY",
                    severity="HIGH",
                    message=f"Quotation has been pending approval for {days_pending} days.",
                    recommended_action="Nudge assigned Sales Manager or Finance approver for decision",
                )
            )
        else:
            score -= 15
            alerts.append(
                DealHealthAlert(
                    type="APPROVAL_DELAY",
                    severity="MEDIUM",
                    message="Quotation is currently waiting for manager/finance approval.",
                    recommended_action="Review approval queue and decision comments",
                )
            )

    # -----------------------------------------------------------------------
    # Factor 2: Customer Inactivity (Stalled Deal)
    # -----------------------------------------------------------------------
    if quotation.status not in (QuotationStatus.CONFIRMED, QuotationStatus.CANCELLED, QuotationStatus.REJECTED):
        latest_act_event = (
            db.query(DealEvent)
            .filter(DealEvent.quotation_id == quotation.id)
            .order_by(DealEvent.created_at.desc())
            .first()
        )
        ref_time = latest_act_event.created_at if latest_act_event else quotation.updated_at
        if ref_time:
            if ref_time.tzinfo is None:
                ref_time = ref_time.replace(tzinfo=timezone.utc)
            inactive_days = (now - ref_time).days
            if inactive_days >= stalled_threshold_days:
                score -= 20
                alerts.append(
                    DealHealthAlert(
                        type="STALLED_DEAL",
                        severity="HIGH",
                        message=f"No meaningful activity recorded on this quotation for {inactive_days} days.",
                        recommended_action="Follow up with customer to re-engage commercial discussion",
                    )
                )

    # -----------------------------------------------------------------------
    # Factor 3: Discount Anomaly
    # -----------------------------------------------------------------------
    # Calculate current quote max line discount
    quote_discounts = [float(item.discount_percentage) for item in quotation.items]
    current_max_discount = max(quote_discounts) if quote_discounts else 0.0

    # Historical average discount for the sales rep (or company)
    rep_avg_discount = 10.0  # default baseline
    if quotation.sales_rep_id:
        rep_avg = (
            db.query(func.coalesce(func.avg(QuoteItem.discount_percentage), 10.0))
            .join(Quotation, QuoteItem.quotation_id == Quotation.id)
            .filter(
                Quotation.sales_rep_id == quotation.sales_rep_id,
                Quotation.id != quotation.id,
            )
            .scalar()
        )
        if rep_avg is not None:
            rep_avg_discount = float(rep_avg)

    if current_max_discount > (rep_avg_discount + 10.0) or current_max_discount >= 25.0:
        score -= 20
        alerts.append(
            DealHealthAlert(
                type="DISCOUNT_ANOMALY",
                severity="HIGH",
                message=(
                    f"Requested discount of {current_max_discount:.1f}% exceeds sales rep's "
                    f"historical average of {rep_avg_discount:.1f}%."
                ),
                recommended_action="Review requested discount justification with Sales Manager",
            )
        )

    # -----------------------------------------------------------------------
    # Factor 4: Margin Risk
    # -----------------------------------------------------------------------
    margin_pct = float(quotation.margin_percent or 0.0)
    if margin_pct < 5.0:
        score -= 30
        alerts.append(
            DealHealthAlert(
                type="LOW_MARGIN",
                severity="CRITICAL",
                message=f"Critically low gross margin of {margin_pct:.1f}% (below 5% floor).",
                recommended_action="Escalate to Finance for margin correction or price adjustment",
            )
        )
    elif margin_pct < 15.0:
        score -= 15
        alerts.append(
            DealHealthAlert(
                type="LOW_MARGIN",
                severity="MEDIUM",
                message=f"Gross margin of {margin_pct:.1f}% is below target threshold of 15%.",
                recommended_action="Consider reducing line discounts to optimize profitability",
            )
        )

    # -----------------------------------------------------------------------
    # Factor 5: Delivery / Fulfillment Risk
    # -----------------------------------------------------------------------
    has_delivery_risk = False
    for item in quotation.items:
        if not item.product_id:
            continue
        stock_records = (
            db.query(Inventory)
            .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
            .filter(
                Inventory.product_id == item.product_id,
                Warehouse.company_id == quotation.company_id,
            )
            .all()
        )
        total_net_available = sum(
            (inv.quantity_available - inv.quantity_reserved) for inv in stock_records
        )
        if total_net_available < item.quantity:
            has_delivery_risk = True
            deficit = item.quantity - total_net_available
            alerts.append(
                DealHealthAlert(
                    type="DELIVERY_RISK",
                    severity="HIGH",
                    message=(
                        f"Stock deficit for '{item.product_name}' "
                        f"(Required: {item.quantity}, Available: {total_net_available}, Deficit: {deficit})."
                    ),
                    recommended_action="Trigger procurement replenishment or check warehouse stock allocation",
                )
            )

    if has_delivery_risk:
        score -= 25

    # -----------------------------------------------------------------------
    # Score & Status Mapping
    # -----------------------------------------------------------------------
    final_score = max(0, score)
    if final_score >= 80:
        health_status = "HEALTHY"
    elif final_score >= 60:
        health_status = "WATCH"
    elif final_score >= 40:
        health_status = "AT_RISK"
    else:
        health_status = "CRITICAL"

    return DealHealthResponse(
        quotation_id=quotation.id,
        quote_number=quotation.quote_number,
        customer_name=customer_name,
        health_score=final_score,
        status=health_status,
        alerts=alerts,
    )


def get_all_deal_health(
    db: Session,
    company_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
    is_sales_rep: bool = False,
) -> List[DealHealthResponse]:
    """Retrieve deal health evaluations for company quotations."""
    query = db.query(Quotation).filter(Quotation.company_id == company_id)
    if is_sales_rep and user_id:
        query = query.filter(Quotation.sales_rep_id == user_id)

    quotations = query.order_by(Quotation.created_at.desc()).all()
    return [calculate_deal_health(db, q) for q in quotations]


def get_deal_health_by_id(
    db: Session,
    company_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> DealHealthResponse:
    """Retrieve deal health evaluation for a single quotation."""
    quotation = (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.company_id == company_id)
        .first()
    )
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )
    return calculate_deal_health(db, quotation)
