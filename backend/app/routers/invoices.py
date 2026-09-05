"""
routers/invoices.py
-------------------
Invoice generation and payment collection endpoints for DealFlow360.

Endpoints:
  POST /quotations/{quotation_id}/invoice  - Generate invoice from quotation
  GET  /invoices                            - List all company invoices
  GET  /invoices/{invoice_id}               - Get single invoice details
  POST /invoices/{invoice_id}/payment       - Record a payment against an invoice
"""

from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceResponse,
    PaymentCreateRequest,
)
from app.services import invoice_service

# ---------------------------------------------------------------------------
# Router for /quotations/{quotation_id}/invoice
# ---------------------------------------------------------------------------
quotation_invoice_router = APIRouter(prefix="/quotations", tags=["Invoices & Payments"])


@quotation_invoice_router.post(
    "/{quotation_id}/invoice",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an invoice from a quotation",
)
def create_invoice(
    quotation_id: uuid.UUID,
    payload: InvoiceCreateRequest = InvoiceCreateRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a ONE_TIME or RECURRING invoice for an APPROVED or CONFIRMED quotation.
    Reads monetary totals directly from the database snapshot.
    """
    return invoice_service.create_invoice_from_quotation(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
        payload=payload,
    )


# ---------------------------------------------------------------------------
# Router for /invoices
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/invoices", tags=["Invoices & Payments"])


@router.get(
    "",
    response_model=List[InvoiceResponse],
    summary="List all invoices for current company",
)
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all invoices belonging to the authenticated user's company."""
    return invoice_service.get_invoices(db=db, company_id=current_user.company_id)


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Get invoice details by ID",
)
def get_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single invoice scoped to current user's company."""
    return invoice_service.get_invoice_by_id(
        db=db,
        company_id=current_user.company_id,
        invoice_id=invoice_id,
    )


@router.post(
    "/{invoice_id}/payment",
    response_model=InvoiceResponse,
    status_code=status.HTTP_200_OK,
    summary="Record a payment against an invoice",
)
def record_payment(
    invoice_id: uuid.UUID,
    payload: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a financial payment against an invoice using payment methods (CARD, BANK_TRANSFER, UPI, CASH).
    Updates paid amount and updates status to PARTIALLY_PAID or PAID.
    """
    return invoice_service.record_payment(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        invoice_id=invoice_id,
        payload=payload,
    )
