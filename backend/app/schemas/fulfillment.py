from decimal import Decimal
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class AllocationItem(BaseModel):
    warehouse_id: uuid.UUID
    warehouse_name: str
    product_id: uuid.UUID
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class FulfillmentResponse(BaseModel):
    quotation_id: uuid.UUID
    allocations: List[AllocationItem]
    shipment_count: int
    estimated_shipping_cost: Decimal
    backordered_quantity: int

    model_config = ConfigDict(from_attributes=True)


class OverrideAllocationInput(BaseModel):
    warehouse_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)


class FulfillmentOverrideRequest(BaseModel):
    allocations: List[OverrideAllocationInput]
