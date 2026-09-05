"""
services/portal_service.py
--------------------------
Customer Portal quotation view, negotiation, and confirmation service for DealFlow360.

Responsibilities:
- Provide sanitized quotation views for customers (HIDES internal margin, internal risk score, and internal approval comments).
- Process customer negotiation requests (qty/discount adjustments).
- Recalculate price, margin, risk score, and approval thresholds dynamically.
- Transition quotation status to PENDING_APPROVAL if risk limits exceeded, or APPROVED if within limits.
- Handle customer deal confirmation once approvals are complete.
"""

from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Approval,
    Customer,
    DealEvent,
    Negotiation,
    Product,
    Quotation,
    QuotationStatus,
    QuoteItem,
)
from app.schemas.portal import (
    PortalNegotiationRequest,
    PortalQuotationResponse,
)
from app.services import pricing_service


def get_portal_quotation(
    db: Session,
    quotation_id: uuid.UUID,
) -> PortalQuotationResponse:
    """
    Retrieve sanitized quotation details for Customer Portal view.
    Excludes internal margins, risk score, and internal approval notes.
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )
    return PortalQuotationResponse.model_validate(quotation)


def submit_customer_negotiation(
    db: Session,
    quotation_id: uuid.UUID,
    payload: PortalNegotiationRequest,
) -> PortalQuotationResponse:
    """
    Process a customer negotiation request (quantity or discount change).
    Recalculates pricing, margin, risk score, and approval requirements.
    Transitions quotation status to PENDING_APPROVAL if governance limits exceeded.
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    if quotation.status in (QuotationStatus.CONFIRMED, QuotationStatus.CANCELLED, QuotationStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot negotiate a quotation in '{quotation.status.value}' status",
        )

    # 1. Identify target quote item
    target_item: Optional[QuoteItem] = None
    if payload.quote_item_id:
        target_item = (
            db.query(QuoteItem)
            .filter(
                QuoteItem.id == payload.quote_item_id,
                QuoteItem.quotation_id == quotation_id,
            )
            .first()
        )
        if not target_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified quote item not found on this quotation",
            )
    elif quotation.items:
        target_item = quotation.items[0]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation has no line items to negotiate",
        )

    # 2. Update requested quantity/discount on target item
    if payload.requested_quantity is not None:
        target_item.quantity = payload.requested_quantity

    if payload.requested_discount_percent is not None:
        target_item.discount_percentage = payload.requested_discount_percent

    # 3. Recalculate quotation metrics & governance
    customer = db.query(Customer).filter(Customer.id == quotation.customer_id).first()
    product_ids = [item.product_id for item in quotation.items if item.product_id]
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids), Product.company_id == quotation.company_id)
        .all()
    )
    products_map = {p.id: p for p in products}

    items_input = [
        {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "discount_percentage": item.discount_percentage,
        }
        for item in quotation.items
    ]

    calc_result = pricing_service.calculate_quotation_totals(
        db=db,
        company_id=quotation.company_id,
        customer_tier=customer.tier,
        items_input=items_input,
        products_map=products_map,
    )

    # Update quotation totals
    quotation.subtotal = calc_result.subtotal
    quotation.discount_amount = calc_result.discount_amount
    quotation.tax_amount = calc_result.tax_amount
    quotation.total_amount = calc_result.total_amount
    quotation.estimated_cost = calc_result.estimated_cost
    quotation.margin_amount = calc_result.margin_amount
    quotation.margin_percent = calc_result.margin_percent
    quotation.risk_score = calc_result.risk_score
    quotation.approval_required = calc_result.approval_required

    # Update individual QuoteItem totals
    for calc_item in calc_result.items:
        item_obj = next((i for i in quotation.items if i.product_id == calc_item.product_id), None)
        if item_obj:
            item_obj.line_total = calc_item.line_total
            item_obj.unit_price = calc_item.unit_price

    # 4. Create Negotiation record
    negotiation = Negotiation(
        quotation_id=quotation.id,
        quote_item_id=target_item.id if target_item else None,
        actor_type="CUSTOMER",
        requested_quantity=payload.requested_quantity,
        requested_discount_percent=payload.requested_discount_percent,
        proposed_total=calc_result.total_amount,
        notes=payload.comment,
    )
    db.add(negotiation)

    # 5. Handle approval requirements
    if calc_result.approval_required:
        quotation.status = QuotationStatus.PENDING_APPROVAL

        # Clear old approval records
        db.query(Approval).filter(Approval.quotation_id == quotation.id).delete()

        # Add new pending approvals for required roles
        for role in calc_result.required_roles:
            appr = Approval(
                quotation_id=quotation.id,
                approval_role=role,
                status="PENDING",
            )
            db.add(appr)

        roles_str = ", ".join([r.value for r in calc_result.required_roles])
        desc = (
            f"Customer requested negotiation terms on '{target_item.product_name}' "
            f"(Qty: {target_item.quantity}, Discount: {target_item.discount_percentage}%). "
            f"Exceeded risk limit (Risk Score: {calc_result.risk_score}). Approval required ({roles_str})."
        )
    else:
        quotation.status = QuotationStatus.APPROVED
        desc = (
            f"Customer requested negotiation terms on '{target_item.product_name}' "
            f"(Qty: {target_item.quantity}, Discount: {target_item.discount_percentage}%). "
            f"Within safe risk limits. Auto-approved."
        )

    # 6. Log Deal Event
    db.add(
        DealEvent(
            quotation_id=quotation.id,
            actor_id=None,  # Customer action
            event_type="CUSTOMER_NEGOTIATION_SUBMITTED",
            description=desc,
        )
    )

    db.commit()
    db.refresh(quotation)

    return PortalQuotationResponse.model_validate(quotation)


def confirm_customer_quotation(
    db: Session,
    quotation_id: uuid.UUID,
) -> PortalQuotationResponse:
    """
    Confirm quotation from Customer Portal.
    If approval is still pending/required, confirmation is rejected.
    If approval is complete, transitions status to CONFIRMED.
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    # Check if approval is required and pending
    if quotation.status == QuotationStatus.PENDING_APPROVAL or (
        quotation.approval_required and quotation.status != QuotationStatus.APPROVED
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation requires Manager/Finance approval before customer confirmation.",
        )

    if quotation.status != QuotationStatus.CONFIRMED:
        quotation.status = QuotationStatus.CONFIRMED
        db.add(
            DealEvent(
                quotation_id=quotation.id,
                actor_id=None,
                event_type="QUOTATION_CONFIRMED_BY_CUSTOMER",
                description=f"Quotation {quotation.quote_number} confirmed by customer via portal.",
            )
        )
        db.commit()
        db.refresh(quotation)

    return PortalQuotationResponse.model_validate(quotation)
