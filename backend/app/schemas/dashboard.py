from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    """Summary metric cards for executive & sales dashboard."""
    total_pipeline: Decimal
    quotation_value: Decimal
    pending_approvals: int
    revenue: Decimal
    average_margin: Decimal
    at_risk_deals: int


class PipelineStageItem(BaseModel):
    """Metrics breakdown for a single quotation stage."""
    stage: str
    count: int
    value: Decimal


class DashboardPipelineResponse(BaseModel):
    """Pipeline distribution across all quotation stages."""
    stages: List[PipelineStageItem]
    total_count: int
    total_value: Decimal


class ActivityItem(BaseModel):
    """Recent timeline activity log from deal events."""
    id: uuid.UUID
    quotation_id: uuid.UUID
    quote_number: Optional[str] = None
    actor_name: Optional[str] = None
    event_type: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}
