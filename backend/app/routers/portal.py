"""
routers/portal.py
-----------------
Customer Portal endpoints for viewing, negotiating, and confirming commercial quotations.

Endpoints:
  GET  /portal/quotations/{quotation_id}             - View sanitized quotation details
  POST /portal/quotations/{quotation_id}/negotiation   - Submit quantity/discount negotiation request
  POST /portal/quotations/{quotation_id}/confirm       - Confirm deal proposal (requires prior approval)
"""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.portal import (
    PortalNegotiationRequest,
    PortalQuotationResponse,
)
from app.services import portal_service

router = APIRouter(prefix="/portal", tags=["Customer Portal & Negotiation"])


@router.get(
    "/quotations/{quotation_id}",
    response_model=PortalQuotationResponse,
    summary="View sanitized quotation on Customer Portal",
)
def get_portal_quotation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieve sanitized quotation details for customer viewing.
    Excludes internal business metrics (margins, risk scores, internal approval comments).
    """
    return portal_service.get_portal_quotation(db=db, quotation_id=quotation_id)


@router.post(
    "/quotations/{quotation_id}/negotiation",
    response_model=PortalQuotationResponse,
    summary="Submit negotiation request from Customer Portal",
)
def submit_negotiation(
    quotation_id: uuid.UUID,
    payload: PortalNegotiationRequest,
    db: Session = Depends(get_db),
):
    """
    Submit a customer negotiation request with quantity and/or discount adjustments.
    Recalculates totals, margin, risk score, and requires approval if limits are exceeded.
    """
    return portal_service.submit_customer_negotiation(
        db=db,
        quotation_id=quotation_id,
        payload=payload,
    )


@router.post(
    "/quotations/{quotation_id}/confirm",
    response_model=PortalQuotationResponse,
    summary="Confirm quotation deal from Customer Portal",
)
def confirm_quotation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Confirm quotation deal from the Customer Portal.
    Rejects confirmation if approval is required and still pending.
    """
    return portal_service.confirm_customer_quotation(
        db=db,
        quotation_id=quotation_id,
    )
