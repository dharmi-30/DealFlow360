"""
routers/reports.py
------------------
Reporting & Business Intelligence endpoints for DealFlow360.

Endpoints:
  GET /reports/sales     - Sales performance summary report
  GET /reports/products  - Product performance breakdown report
  GET /reports/approvals - Approval workflow efficiency report
"""

from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.reports import (
    ApprovalReportResponse,
    ProductReportItem,
    SalesReportResponse,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reporting & Business Intelligence"])


@router.get(
    "/sales",
    response_model=SalesReportResponse,
    summary="Get Sales Performance Report",
)
def get_sales_report(
    period: Optional[str] = Query(None, description="Period filter: today, this_week, this_month, this_year, all_time"),
    sales_rep: Optional[uuid.UUID] = Query(None, description="Filter by Sales Rep ID"),
    approval_status: Optional[str] = Query(None, description="Filter by quotation approval/status"),
    product: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    category: Optional[str] = Query(None, description="Filter by Product Category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate Sales Report with metrics for total sales, quotation value,
    total discounts, average margin %, approval rate %, and confirmed deal counts.
    """
    return report_service.get_sales_report(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        period=period,
        sales_rep_id=sales_rep,
        approval_status=approval_status,
        product_id=product,
        category=category,
    )


@router.get(
    "/products",
    response_model=List[ProductReportItem],
    summary="Get Product Performance Report",
)
def get_product_report(
    period: Optional[str] = Query(None, description="Period filter: today, this_week, this_month, this_year, all_time"),
    sales_rep: Optional[uuid.UUID] = Query(None, description="Filter by Sales Rep ID"),
    approval_status: Optional[str] = Query(None, description="Filter by quotation approval/status"),
    product: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    category: Optional[str] = Query(None, description="Filter by Product Category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate Product Report with units sold, total revenue, average discount %,
    and gross margin % broken down by product and category.
    """
    return report_service.get_product_report(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        period=period,
        sales_rep_id=sales_rep,
        approval_status=approval_status,
        product_id=product,
        category=category,
    )


@router.get(
    "/approvals",
    response_model=ApprovalReportResponse,
    summary="Get Approval Workflow Efficiency Report",
)
def get_approval_report(
    period: Optional[str] = Query(None, description="Period filter: today, this_week, this_month, this_year, all_time"),
    sales_rep: Optional[uuid.UUID] = Query(None, description="Filter by Sales Rep ID"),
    approval_status: Optional[str] = Query(None, description="Filter by approval status"),
    product: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    category: Optional[str] = Query(None, description="Filter by Product Category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate Approval Report with counts for pending, approved, and rejected
    approval decisions, and average decision turnaround time (in hours).
    """
    return report_service.get_approval_report(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        period=period,
        sales_rep_id=sales_rep,
        approval_status=approval_status,
        product_id=product,
        category=category,
    )
