from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    description: Optional[str] = None
    unit_price: Decimal = Field(..., decimal_places=2, ge=0)
    unit_cost: Decimal = Field(..., decimal_places=2, ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.00"), decimal_places=2, ge=0)
    is_subscription: bool = False
    active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, decimal_places=2, ge=0)
    unit_cost: Optional[Decimal] = Field(None, decimal_places=2, ge=0)
    tax_rate: Optional[Decimal] = Field(None, decimal_places=2, ge=0)
    is_subscription: Optional[bool] = None
    active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    sku: str
    category: Optional[str] = None
    description: Optional[str] = None
    unit_price: Decimal
    unit_cost: Decimal
    tax_rate: Decimal
    is_subscription: bool
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
