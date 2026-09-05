"""
routers/dashboard.py
--------------------
Executive & Sales Rep Dashboard Analytics endpoints for DealFlow360.

Endpoints:
  GET /dashboard/summary          - Summary KPI cards (total pipeline, revenue, pending approvals, margin, risk)
  GET /dashboard/pipeline         - Pipeline distribution count and value by quotation stage
  GET /dashboard/recent-activity  - Timeline log of recent deal events
"""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.dashboard import (
    ActivityItem,
    DashboardPipelineResponse,
    DashboardSummaryResponse,
)
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get summary KPI cards for dashboard",
)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real-time aggregated metrics for total pipeline, total quotation value,
    pending approvals count, total revenue, average margin %, and at-risk deals count.
    Scoped to user company and role permissions.
    """
    return dashboard_service.get_dashboard_summary(db=db, current_user=current_user)


@router.get(
    "/pipeline",
    response_model=DashboardPipelineResponse,
    summary="Get quotation pipeline breakdown by stage",
)
def get_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns counts and total monetary values grouped by quotation stage
    (DRAFT, PENDING_APPROVAL, NEGOTIATION, APPROVED, CONFIRMED).
    """
    return dashboard_service.get_dashboard_pipeline(db=db, current_user=current_user)


@router.get(
    "/recent-activity",
    response_model=List[ActivityItem],
    summary="Get recent activity timeline from deal events",
)
def get_recent_activity(
    limit: int = Query(15, ge=1, le=100, description="Max number of recent events to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns recent deal events log for tenant company scoped to user permissions.
    """
    return dashboard_service.get_dashboard_recent_activity(
        db=db, current_user=current_user, limit=limit
    )
