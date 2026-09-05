from typing import List, Optional
import uuid

from pydantic import BaseModel


class DealHealthAlert(BaseModel):
    """Specific risk factor alert on a quotation."""
    type: str  # STALLED_DEAL, DISCOUNT_ANOMALY, DELIVERY_RISK, LOW_MARGIN, APPROVAL_DELAY
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    message: str
    recommended_action: str


class DealHealthResponse(BaseModel):
    """Calculated health score and risk diagnostics for a quotation."""
    quotation_id: uuid.UUID
    quote_number: str
    customer_name: Optional[str] = None
    health_score: int
    status: str  # HEALTHY, WATCH, AT_RISK, CRITICAL
    alerts: List[DealHealthAlert] = []

    model_config = {"from_attributes": True}
