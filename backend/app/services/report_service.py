"""
services/report_service.py
--------------------------
Reporting analytics service for DealFlow360.

Provides SQL-aggregated reports for:
1. Sales performance (total sales, quotation value, discounts, average margin, approval rate, confirmed quotes)
2. Product performance (units sold, revenue, average discount, margin percentage by product & category)
3. Approval workflow efficiency (pending, approved, rejected counts and average decision turnaround time)

Filters supported across all reports:
- period (today, this_week, this_month, this_year, all_time)
- sales_rep_id
- approval_status
- product_id
- category
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import (
    Approval,
    Quotation,
    QuotationStatus,
    QuoteItem,
    User,
    UserRole,
)
from app.schemas.reports import (
    ApprovalReportResponse,
    ProductReportItem,
    SalesReportResponse,
)


def _quantize(amount: Decimal) -> Decimal:
    """Round monetary value to 2 decimal places using banker's rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _apply_period_filter(query, date_column, period: Optional[str]):
    """Applies a date range filter based on period keyword."""
    if not period or period == "all_time":
        return query

    now = datetime.now(timezone.utc)
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_week":
        start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        return query

    return query.filter(date_column >= start_date)


def _build_quotation_query(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    period: Optional[str] = None,
    sales_rep_id: Optional[uuid.UUID] = None,
    approval_status: Optional[str] = None,
    product_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
):
    """
    Builds a filtered base query for quotations respecting multi-tenant authorization
    and user role permissions.
    """
    query = db.query(Quotation).filter(Quotation.company_id == company_id)

    # Role permission scoping
    if current_user.role == UserRole.SALES_REP:
        query = query.filter(Quotation.sales_rep_id == current_user.id)
    elif sales_rep_id:
        query = query.filter(Quotation.sales_rep_id == sales_rep_id)

    # Period filter
    query = _apply_period_filter(query, Quotation.created_at, period)

    # Approval / Quotation status filter
    if approval_status:
        query = query.filter(Quotation.status == approval_status)

    # Product or Category filters (requires join with QuoteItem)
    if product_id or category:
        query = query.join(QuoteItem, Quotation.id == QuoteItem.quotation_id)
        if product_id:
            query = query.filter(QuoteItem.product_id == product_id)
        if category:
            query = query.filter(QuoteItem.category == category)

    return query.distinct()


def get_sales_report(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    period: Optional[str] = None,
    sales_rep_id: Optional[uuid.UUID] = None,
    approval_status: Optional[str] = None,
    product_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
) -> SalesReportResponse:
    """Calculates aggregated sales performance metrics with optional filters."""
    base_q = _build_quotation_query(
        db, company_id, current_user, period, sales_rep_id, approval_status, product_id, category
    )

    # 1. Total Sales (Confirmed Quotes)
    confirmed_q = base_q.filter(Quotation.status == QuotationStatus.CONFIRMED)
    total_sales = confirmed_q.with_entities(
        func.coalesce(func.sum(Quotation.total_amount), 0)
    ).scalar()
    confirmed_count = confirmed_q.count()

    # 2. Total Quotation Value
    total_quote_val = base_q.with_entities(
        func.coalesce(func.sum(Quotation.total_amount), 0)
    ).scalar()

    # 3. Total Discount Amount
    total_discount = base_q.with_entities(
        func.coalesce(func.sum(Quotation.discount_amount), 0)
    ).scalar()

    # 4. Average Margin Percent
    avg_margin = base_q.with_entities(
        func.coalesce(func.avg(Quotation.margin_percent), 0)
    ).scalar()

    # 5. Approval Rate calculation
    submitted_statuses = [
        QuotationStatus.APPROVED,
        QuotationStatus.CONFIRMED,
        QuotationStatus.PENDING_APPROVAL,
        QuotationStatus.REJECTED,
    ]
    submitted_count = base_q.filter(Quotation.status.in_(submitted_statuses)).count()
    approved_count = base_q.filter(
        Quotation.status.in_([QuotationStatus.APPROVED, QuotationStatus.CONFIRMED])
    ).count()

    approval_rate = (
        Decimal(str((approved_count / submitted_count) * 100))
        if submitted_count > 0
        else Decimal("0.00")
    )

    return SalesReportResponse(
        total_sales=_quantize(Decimal(str(total_sales))),
        total_quotation_value=_quantize(Decimal(str(total_quote_val))),
        total_discount=_quantize(Decimal(str(total_discount))),
        average_margin=_quantize(Decimal(str(avg_margin))),
        approval_rate=_quantize(approval_rate),
        confirmed_quote_count=confirmed_count,
    )


def get_product_report(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    period: Optional[str] = None,
    sales_rep_id: Optional[uuid.UUID] = None,
    approval_status: Optional[str] = None,
    product_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
) -> List[ProductReportItem]:
    """Calculates product performance breakdown (units sold, revenue, avg discount, margin)."""
    query = (
        db.query(
            QuoteItem.product_id,
            QuoteItem.product_name,
            QuoteItem.category,
            func.sum(QuoteItem.quantity).label("units_sold"),
            func.sum(QuoteItem.line_total).label("revenue"),
            func.avg(QuoteItem.discount_percentage).label("avg_discount"),
            func.sum(QuoteItem.unit_cost * QuoteItem.quantity).label("total_cost"),
        )
        .join(Quotation, QuoteItem.quotation_id == Quotation.id)
        .filter(Quotation.company_id == company_id)
    )

    if current_user.role == UserRole.SALES_REP:
        query = query.filter(Quotation.sales_rep_id == current_user.id)
    elif sales_rep_id:
        query = query.filter(Quotation.sales_rep_id == sales_rep_id)

    query = _apply_period_filter(query, Quotation.created_at, period)

    if approval_status:
        query = query.filter(Quotation.status == approval_status)
    if product_id:
        query = query.filter(QuoteItem.product_id == product_id)
    if category:
        query = query.filter(QuoteItem.category == category)

    results = (
        query.group_by(QuoteItem.product_id, QuoteItem.product_name, QuoteItem.category)
        .order_by(func.sum(QuoteItem.line_total).desc())
        .all()
    )

    report_items: List[ProductReportItem] = []
    for row in results:
        rev = Decimal(str(row.revenue or 0))
        cost = Decimal(str(row.total_cost or 0))
        margin_pct = (
            ((rev - cost) / rev * Decimal("100")) if rev > Decimal("0") else Decimal("0.00")
        )

        report_items.append(
            ProductReportItem(
                product_id=row.product_id,
                product_name=row.product_name,
                category=row.category,
                units_sold=int(row.units_sold or 0),
                revenue=_quantize(rev),
                average_discount=_quantize(Decimal(str(row.avg_discount or 0))),
                margin=_quantize(margin_pct),
            )
        )

    return report_items


def get_approval_report(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    period: Optional[str] = None,
    sales_rep_id: Optional[uuid.UUID] = None,
    approval_status: Optional[str] = None,
    product_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
) -> ApprovalReportResponse:
    """Calculates approval workflow counts and turnaround time metrics."""
    query = (
        db.query(Approval)
        .join(Quotation, Approval.quotation_id == Quotation.id)
        .filter(Quotation.company_id == company_id)
    )

    if current_user.role == UserRole.SALES_REP:
        query = query.filter(Quotation.sales_rep_id == current_user.id)
    elif sales_rep_id:
        query = query.filter(Quotation.sales_rep_id == sales_rep_id)

    query = _apply_period_filter(query, Approval.created_at, period)

    if approval_status:
        query = query.filter(Approval.status == approval_status)

    if product_id or category:
        query = query.join(QuoteItem, Quotation.id == QuoteItem.quotation_id)
        if product_id:
            query = query.filter(QuoteItem.product_id == product_id)
        if category:
            query = query.filter(QuoteItem.category == category)

    approvals = query.all()

    pending = sum(1 for a in approvals if a.status == "PENDING")
    approved = sum(1 for a in approvals if a.status == "APPROVED")
    rejected = sum(1 for a in approvals if a.status == "REJECTED")

    # Turnaround time for completed decisions
    completed_durations = []
    for a in approvals:
        if a.status in ("APPROVED", "REJECTED") and a.updated_at and a.created_at:
            created = a.created_at
            updated = a.updated_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if updated.tzinfo is None:
                updated = updated.replace(tzinfo=timezone.utc)
            duration_hours = (updated - created).total_seconds() / 3600.0
            completed_durations.append(duration_hours)

    avg_time = (
        sum(completed_durations) / len(completed_durations) if completed_durations else 0.0
    )

    return ApprovalReportResponse(
        pending=pending,
        approved=approved,
        rejected=rejected,
        average_approval_time_hours=round(avg_time, 2),
    )
