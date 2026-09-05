"""
services/dashboard_service.py
-----------------------------
Dashboard analytics and reporting service for DealFlow360.

Calculates real-time summary metrics, pipeline breakdown, and recent activity timeline directly
from database tables (Quotations, Invoices, Payments, Approvals, DealEvents).
Includes role-based scoping (Sales Reps see their assigned deals; Managers/Admins see company-wide).
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import (
    DealEvent,
    Invoice,
    Quotation,
    QuotationStatus,
    User,
    UserRole,
)
from app.schemas.dashboard import (
    ActivityItem,
    DashboardPipelineResponse,
    DashboardSummaryResponse,
    PipelineStageItem,
)


def _quantize(amount: Decimal) -> Decimal:
    """Round monetary value to 2 decimal places using banker's rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _get_base_quotation_query(db: Session, current_user: User):
    """
    Constructs base query for quotations scoped to user's company and role.
    Sales Reps see only their assigned quotations; Managers & Admins see all company quotations.
    """
    query = db.query(Quotation).filter(Quotation.company_id == current_user.company_id)
    if current_user.role == UserRole.SALES_REP:
        query = query.filter(Quotation.sales_rep_id == current_user.id)
    return query


def get_dashboard_summary(
    db: Session,
    current_user: User,
) -> DashboardSummaryResponse:
    """
    Calculates dynamic summary metrics:
    - total_pipeline: total value of active quotations (DRAFT, PENDING_APPROVAL, NEGOTIATION, APPROVED)
    - quotation_value: total value of all quotations created
    - pending_approvals: count of quotations currently PENDING_APPROVAL
    - revenue: cumulative paid amount across all invoices
    - average_margin: average gross margin percentage across quotations
    - at_risk_deals: count of quotations with risk_score > 0 or requiring approval
    """
    base_q = _get_base_quotation_query(db, current_user)

    # 1. Total Pipeline (active stages: DRAFT, PENDING_APPROVAL, NEGOTIATION, APPROVED)
    active_statuses = [
        QuotationStatus.DRAFT,
        QuotationStatus.PENDING_APPROVAL,
        QuotationStatus.NEGOTIATION,
        QuotationStatus.APPROVED,
    ]
    pipeline_val = (
        base_q.filter(Quotation.status.in_(active_statuses))
        .with_entities(func.coalesce(func.sum(Quotation.total_amount), 0))
        .scalar()
    )

    # 2. Total Quotation Value (all quotations)
    total_quote_val = (
        base_q.with_entities(func.coalesce(func.sum(Quotation.total_amount), 0)).scalar()
    )

    # 3. Pending Approvals count
    pending_appr_count = base_q.filter(
        Quotation.status == QuotationStatus.PENDING_APPROVAL
    ).count()

    # 4. Total Revenue (sum of paid_amount across company invoices)
    rev_query = (
        db.query(func.coalesce(func.sum(Invoice.paid_amount), 0))
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .filter(Quotation.company_id == current_user.company_id)
    )
    if current_user.role == UserRole.SALES_REP:
        rev_query = rev_query.filter(Quotation.sales_rep_id == current_user.id)
    revenue_val = rev_query.scalar()

    # 5. Average Margin Percent
    avg_margin_val = (
        base_q.with_entities(func.coalesce(func.avg(Quotation.margin_percent), 0)).scalar()
    )

    # 6. At Risk Deals count (risk_score > 0 or approval_required == True)
    at_risk_count = base_q.filter(
        (Quotation.risk_score > 0) | (Quotation.approval_required == True)
    ).count()

    return DashboardSummaryResponse(
        total_pipeline=_quantize(Decimal(str(pipeline_val))),
        quotation_value=_quantize(Decimal(str(total_quote_val))),
        pending_approvals=pending_appr_count,
        revenue=_quantize(Decimal(str(revenue_val))),
        average_margin=_quantize(Decimal(str(avg_margin_val))),
        at_risk_deals=at_risk_count,
    )


def get_dashboard_pipeline(
    db: Session,
    current_user: User,
) -> DashboardPipelineResponse:
    """
    Calculates pipeline distribution aggregated by stage:
    DRAFT, PENDING_APPROVAL, NEGOTIATION, APPROVED, CONFIRMED.
    """
    base_q = _get_base_quotation_query(db, current_user)

    stages_to_track = [
        QuotationStatus.DRAFT,
        QuotationStatus.PENDING_APPROVAL,
        QuotationStatus.NEGOTIATION,
        QuotationStatus.APPROVED,
        QuotationStatus.CONFIRMED,
    ]

    # Query counts and total values grouped by status
    stage_data = (
        base_q.with_entities(
            Quotation.status,
            func.count(Quotation.id).label("count"),
            func.coalesce(func.sum(Quotation.total_amount), 0).label("value"),
        )
        .group_by(Quotation.status)
        .all()
    )

    data_map = {row.status: (row.count, Decimal(str(row.value))) for row in stage_data}

    stage_items: List[PipelineStageItem] = []
    total_count = 0
    total_val = Decimal("0.00")

    for status_enum in stages_to_track:
        count, val = data_map.get(status_enum, (0, Decimal("0.00")))
        stage_items.append(
            PipelineStageItem(
                stage=status_enum.value,
                count=count,
                value=_quantize(val),
            )
        )
        total_count += count
        total_val += val

    return DashboardPipelineResponse(
        stages=stage_items,
        total_count=total_count,
        total_value=_quantize(total_val),
    )


def get_dashboard_recent_activity(
    db: Session,
    current_user: User,
    limit: int = 15,
) -> List[ActivityItem]:
    """
    Retrieves recent activity timeline events from deal_events table.
    Filtered by tenant company and user role permissions.
    """
    query = (
        db.query(DealEvent, Quotation, User)
        .join(Quotation, DealEvent.quotation_id == Quotation.id)
        .outerjoin(User, DealEvent.actor_id == User.id)
        .filter(Quotation.company_id == current_user.company_id)
    )

    if current_user.role == UserRole.SALES_REP:
        query = query.filter(Quotation.sales_rep_id == current_user.id)

    events_data = (
        query.order_by(DealEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    activities: List[ActivityItem] = []
    for event, quotation, actor in events_data:
        actor_name = actor.full_name if actor else "System/Customer"
        activities.append(
            ActivityItem(
                id=event.id,
                quotation_id=event.quotation_id,
                quote_number=quotation.quote_number,
                actor_name=actor_name,
                event_type=event.event_type,
                description=event.description,
                created_at=event.created_at,
            )
        )

    return activities
