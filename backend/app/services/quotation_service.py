from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Approval,
    Customer,
    DealEvent,
    Product,
    Quotation,
    QuotationStatus,
    QuoteItem,
)
from app.schemas.quotation import QuotationCreate, QuotationUpdate
from app.services import pricing_service


def generate_quote_number(db: Session, company_id: uuid.UUID) -> str:
    """Generate a unique formatted quote number for the tenant company."""
    count = db.query(Quotation).filter(Quotation.company_id == company_id).count()
    return f"Q-{1001 + count}"


def create_quotation(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: QuotationCreate,
) -> Quotation:
    """
    Create a new commercial quotation with backend financial calculations,
    tier discount governance, risk scoring, product snapshots, and deal event logging.
    """
    # 1. Validate customer belongs to company
    customer = (
        db.query(Customer)
        .filter(Customer.id == payload.customer_id, Customer.company_id == company_id)
        .first()
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found or does not belong to your company",
        )

    # 2. Validate products belong to company
    product_ids = [item.product_id for item in payload.items]
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids), Product.company_id == company_id)
        .all()
    )

    products_map = {p.id: p for p in products}
    if len(products_map) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified products do not belong to your company",
        )

    # 3. Calculate financial totals and governance risk score using pricing_service
    items_input = [
        {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "discount_percentage": item.discount_percent,
        }
        for item in payload.items
    ]

    calc_result = pricing_service.calculate_quotation_totals(
        db=db,
        company_id=company_id,
        customer_tier=customer.tier,
        items_input=items_input,
        products_map=products_map,
    )

    # 4. Generate quote number
    quote_number = generate_quote_number(db, company_id)

    # 5. Create Quotation entity
    quotation = Quotation(
        company_id=company_id,
        customer_id=payload.customer_id,
        sales_rep_id=user_id,
        quote_number=quote_number,
        status=QuotationStatus.DRAFT,
        subtotal=calc_result.subtotal,
        discount_amount=calc_result.discount_amount,
        tax_amount=calc_result.tax_amount,
        total_amount=calc_result.total_amount,
        estimated_cost=calc_result.estimated_cost,
        margin_amount=calc_result.margin_amount,
        margin_percent=calc_result.margin_percent,
        risk_score=calc_result.risk_score,
        approval_required=calc_result.approval_required,
    )
    db.add(quotation)
    db.flush()

    # 6. Create QuoteItem records with product snapshots
    for calc_item in calc_result.items:
        quote_item = QuoteItem(
            quotation_id=quotation.id,
            product_id=calc_item.product_id,
            product_name=calc_item.product_name,
            category=calc_item.category,
            unit_price=calc_item.unit_price,
            unit_cost=calc_item.unit_cost,
            tax_rate=calc_item.tax_rate,
            quantity=calc_item.quantity,
            discount_percentage=calc_item.discount_percentage,
            line_total=calc_item.line_total,
        )
        db.add(quote_item)

    # 7. Create Deal Event log
    deal_event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type="QUOTATION_CREATED",
        description=f"Quotation {quote_number} created (Risk Score: {calc_result.risk_score})",
    )
    db.add(deal_event)

    db.commit()
    db.refresh(quotation)
    return quotation


def get_quotations(
    db: Session,
    company_id: uuid.UUID,
) -> List[Quotation]:
    """Retrieve all quotations belonging to the tenant company."""
    return (
        db.query(Quotation)
        .filter(Quotation.company_id == company_id)
        .order_by(Quotation.created_at.desc())
        .all()
    )


def get_quotation_by_id(
    db: Session,
    company_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> Optional[Quotation]:
    """Get a single quotation by ID scoped strictly to the company."""
    return (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.company_id == company_id)
        .first()
    )


def update_quotation(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
    payload: QuotationUpdate,
) -> Quotation:
    """Update quotation items or customer and recalculate backend financial metrics."""
    quotation = get_quotation_by_id(db, company_id, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    if payload.customer_id:
        customer = (
            db.query(Customer)
            .filter(Customer.id == payload.customer_id, Customer.company_id == company_id)
            .first()
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found in company",
            )
        quotation.customer_id = payload.customer_id

    customer = (
        db.query(Customer).filter(Customer.id == quotation.customer_id).first()
    )

    if payload.items is not None:
        # Validate updated items
        product_ids = [item.product_id for item in payload.items]
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids), Product.company_id == company_id)
            .all()
        )
        products_map = {p.id: p for p in products}
        if len(products_map) != len(set(product_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more specified products do not belong to your company",
            )

        # Remove existing quote items
        db.query(QuoteItem).filter(QuoteItem.quotation_id == quotation.id).delete()

        # Recalculate totals and risk score
        items_input = [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "discount_percentage": item.discount_percent,
            }
            for item in payload.items
        ]
        calc_result = pricing_service.calculate_quotation_totals(
            db=db,
            company_id=company_id,
            customer_tier=customer.tier,
            items_input=items_input,
            products_map=products_map,
        )

        quotation.subtotal = calc_result.subtotal
        quotation.discount_amount = calc_result.discount_amount
        quotation.tax_amount = calc_result.tax_amount
        quotation.total_amount = calc_result.total_amount
        quotation.estimated_cost = calc_result.estimated_cost
        quotation.margin_amount = calc_result.margin_amount
        quotation.margin_percent = calc_result.margin_percent
        quotation.risk_score = calc_result.risk_score
        quotation.approval_required = calc_result.approval_required

        # Insert new quote items with snapshots
        for calc_item in calc_result.items:
            quote_item = QuoteItem(
                quotation_id=quotation.id,
                product_id=calc_item.product_id,
                product_name=calc_item.product_name,
                category=calc_item.category,
                unit_price=calc_item.unit_price,
                unit_cost=calc_item.unit_cost,
                tax_rate=calc_item.tax_rate,
                quantity=calc_item.quantity,
                discount_percentage=calc_item.discount_percentage,
                line_total=calc_item.line_total,
            )
            db.add(quote_item)

    # Log Deal Event
    deal_event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type="QUOTATION_UPDATED",
        description=f"Quotation {quotation.quote_number} updated (Risk Score: {quotation.risk_score})",
    )
    db.add(deal_event)

    db.commit()
    db.refresh(quotation)
    return quotation


def submit_quotation(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> Quotation:
    """Submit quotation for approval or auto-approve if no governance thresholds triggered."""
    quotation = get_quotation_by_id(db, company_id, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    if quotation.status not in [QuotationStatus.DRAFT, QuotationStatus.NEGOTIATION]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation cannot be submitted from status '{quotation.status.value}'",
        )

    # Re-evaluate governance & risk requirements
    customer = db.query(Customer).filter(Customer.id == quotation.customer_id).first()
    product_ids = [item.product_id for item in quotation.items if item.product_id]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
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
        company_id=company_id,
        customer_tier=customer.tier,
        items_input=items_input,
        products_map=products_map,
    )

    quotation.risk_score = calc_result.risk_score
    quotation.approval_required = calc_result.approval_required

    # Clear previous approval records on resubmission
    db.query(Approval).filter(Approval.quotation_id == quotation.id).delete()

    if calc_result.approval_required:
        quotation.status = QuotationStatus.PENDING_APPROVAL
        for role in calc_result.required_roles:
            appr = Approval(
                quotation_id=quotation.id,
                approval_role=role,
                status="PENDING",
            )
            db.add(appr)

        roles_str = ", ".join([r.value for r in calc_result.required_roles])
        event_type = "QUOTATION_SUBMITTED_FOR_APPROVAL"
        desc = f"Quotation {quotation.quote_number} submitted for approval ({roles_str})"
    else:
        quotation.status = QuotationStatus.APPROVED
        event_type = "QUOTATION_AUTO_APPROVED"
        desc = f"Quotation {quotation.quote_number} submitted and auto-approved"

    deal_event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type=event_type,
        description=desc,
    )
    db.add(deal_event)

    db.commit()
    db.refresh(quotation)
    return quotation


def confirm_quotation(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> Quotation:
    """Confirm a quotation to lock deal agreement."""
    quotation = get_quotation_by_id(db, company_id, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    if quotation.status != QuotationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation must be APPROVED before confirmation. Current status: '{quotation.status.value}'",
        )

    quotation.status = QuotationStatus.CONFIRMED

    deal_event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type="QUOTATION_CONFIRMED",
        description=f"Quotation {quotation.quote_number} confirmed by customer",
    )
    db.add(deal_event)

    db.commit()
    db.refresh(quotation)
    return quotation
