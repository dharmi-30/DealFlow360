"""
services/invoice_service.py
--------------------------
Invoice generation and payment processing service for DealFlow360.

Responsibilities:
- Generate ONE_TIME or RECURRING invoices from confirmed quotations using DB snapshot totals.
- Retrieve invoices scoped to user's company.
- Record payments, update cumulative paid amounts, update invoice statuses (ISSUED -> PARTIALLY_PAID -> PAID), and create audit deal events.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    DealEvent,
    Invoice,
    InvoiceStatus,
    InvoiceType,
    Payment,
    Quotation,
    QuotationStatus,
)
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceResponse,
    PaymentCreateRequest,
)


def _quantize(amount: Decimal) -> Decimal:
    """Round monetary value to 2 decimal places using banker's rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def create_invoice_from_quotation(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
    payload: InvoiceCreateRequest,
) -> InvoiceResponse:
    """
    Generate an invoice from an existing quotation.
    Reads financial totals directly from the database (subtotal, tax_amount, total_amount).
    """
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

    if quotation.status not in (QuotationStatus.CONFIRMED, QuotationStatus.APPROVED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoices can only be created for APPROVED or CONFIRMED quotations. Current status: {quotation.status.value}",
        )

    # Generate a unique invoice number
    random_code = uuid.uuid4().hex[:6].upper()
    quote_code = quotation.quote_number.replace("QT-", "") if quotation.quote_number else "QT"
    invoice_number = f"INV-{quote_code}-{random_code}"

    # Calculate financial totals from DB snapshot
    subtotal = _quantize(Decimal(str(quotation.subtotal)))
    tax = _quantize(Decimal(str(quotation.tax_amount)))
    total = _quantize(Decimal(str(quotation.total_amount)))

    due_date = payload.due_date
    if not due_date:
        due_date = datetime.now(timezone.utc) + timedelta(days=30)

    invoice = Invoice(
        quotation_id=quotation.id,
        customer_id=quotation.customer_id,
        invoice_number=invoice_number,
        type=payload.type,
        amount=subtotal,
        tax=tax,
        total=total,
        paid_amount=Decimal("0.00"),
        status=InvoiceStatus.ISSUED,
        due_date=due_date,
    )
    db.add(invoice)
    db.flush()

    # Log Deal Event
    db.add(
        DealEvent(
            quotation_id=quotation.id,
            actor_id=user_id,
            event_type="INVOICE_GENERATED",
            description=f"Invoice {invoice_number} ({payload.type.value}) generated for total amount {total}.",
        )
    )

    db.commit()
    db.refresh(invoice)

    return InvoiceResponse.model_validate(invoice)


def get_invoices(
    db: Session,
    company_id: uuid.UUID,
) -> List[InvoiceResponse]:
    """Retrieve all invoices belonging to the user's company."""
    invoices = (
        db.query(Invoice)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .filter(Quotation.company_id == company_id)
        .order_by(Invoice.created_at.desc())
        .all()
    )
    return [InvoiceResponse.model_validate(inv) for inv in invoices]


def get_invoice_by_id(
    db: Session,
    company_id: uuid.UUID,
    invoice_id: uuid.UUID,
) -> InvoiceResponse:
    """Retrieve a single invoice scoped to the user's company."""
    invoice = (
        db.query(Invoice)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .filter(Invoice.id == invoice_id, Quotation.company_id == company_id)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return InvoiceResponse.model_validate(invoice)


def record_payment(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    invoice_id: uuid.UUID,
    payload: PaymentCreateRequest,
) -> InvoiceResponse:
    """
    Record a financial payment against an invoice.
    Updates cumulative paid amount and updates invoice status (ISSUED -> PARTIALLY_PAID -> PAID).
    Logs a deal event on the associated quotation.
    """
    invoice = (
        db.query(Invoice)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .filter(Invoice.id == invoice_id, Quotation.company_id == company_id)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record payment for a CANCELLED invoice.",
        )

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already fully PAID.",
        )

    payment_amt = _quantize(Decimal(str(payload.amount)))
    payment_date = payload.payment_date or datetime.now(timezone.utc)

    payment = Payment(
        invoice_id=invoice.id,
        amount=payment_amt,
        payment_method=payload.payment_method,
        reference=payload.reference,
        payment_date=payment_date,
    )
    db.add(payment)

    # Calculate total paid amount
    existing_paid = Decimal(str(invoice.paid_amount or "0.00"))
    new_total_paid = _quantize(existing_paid + payment_amt)
    invoice.paid_amount = new_total_paid

    # Update status based on total paid vs total invoice amount
    invoice_total = Decimal(str(invoice.total))
    if new_total_paid >= invoice_total:
        invoice.status = InvoiceStatus.PAID
    elif new_total_paid > Decimal("0.00"):
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Log Deal Event
    db.add(
        DealEvent(
            quotation_id=invoice.quotation_id,
            actor_id=user_id,
            event_type="PAYMENT_RECEIVED",
            description=(
                f"Payment of {payment_amt} via {payload.payment_method.value} recorded for invoice {invoice.invoice_number}. "
                f"Total Paid: {new_total_paid}/{invoice_total}. Invoice Status: {invoice.status.value}"
            ),
        )
    )

    db.commit()
    db.refresh(invoice)

    return InvoiceResponse.model_validate(invoice)
