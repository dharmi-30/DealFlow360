"""
routers/deal_health.py
----------------------
Deal Health and Risk Diagnostics endpoints for DealFlow360.

Endpoints:
  GET /deal-health                 - Retrieve health scores and risk alerts for all company deals
  GET /deal-health/{quotation_id}  - Retrieve health score and risk alerts for a single quotation
"""

from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User, UserRole
from app.schemas.deal_health import DealHealthResponse
from app.services import deal_health_service

router = APIRouter(prefix="/deal-health", tags=["Deal Health & Risk Diagnostics"])


@router.get(
    "",
    response_model=List[DealHealthResponse],
    summary="List deal health evaluations for company quotations",
)
def list_deal_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve deal health metrics (score 0-100, status, risk alerts)
    for all active/relevant quotations within user company and role scope.
    """
    is_rep = (current_user.role == UserRole.SALES_REP)
    return deal_health_service.get_all_deal_health(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        is_sales_rep=is_rep,
    )


@router.get(
    "/{quotation_id}",
    response_model=DealHealthResponse,
    summary="Get deal health evaluation for a single quotation",
)
def get_deal_health(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve health score (0-100), health status (HEALTHY, WATCH, AT_RISK, CRITICAL),
    and risk alerts (stalled deal, discount anomaly, low margin, delivery risk, approval delay)
    for a specific quotation.
    """
    return deal_health_service.get_deal_health_by_id(
        db=db,
        company_id=current_user.company_id,
        quotation_id=quotation_id,
    )
