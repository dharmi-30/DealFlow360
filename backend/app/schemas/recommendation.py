from decimal import Decimal
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict


class RecommendationResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    category: Optional[str] = None
    reason: str
    margin_delta: Decimal
    promotion: Optional[str] = None
    confidence: float

    model_config = ConfigDict(from_attributes=True)
