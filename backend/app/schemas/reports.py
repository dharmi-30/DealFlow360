from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel


class SalesReportResponse(BaseModel):
    """Aggregated sales performance metrics report."""
    total_sales: Decimal
    total_quotation_value: Decimal
    total_discount: Decimal
    average_margin: Decimal
    approval_rate: Decimal
    confirmed_quote_count: int


class ProductReportItem(BaseModel):
    """Product-level performance breakdown."""
    product_id: Optional[uuid.UUID]
    product_name: str
    category: Optional[str]
    units_sold: int
    revenue: Decimal
    average_discount: Decimal
    margin: Decimal


class ApprovalReportResponse(BaseModel):
    """Approval workflow efficiency metrics report."""
    pending: int
    approved: int
    rejected: int
    average_approval_time_hours: float
