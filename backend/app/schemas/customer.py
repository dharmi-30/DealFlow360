from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr
from app.db.models import CustomerTier


class CustomerCreate(BaseModel):
    contact_name: str
    email: EmailStr
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: CustomerTier = CustomerTier.BRONZE
    status: str = "ACTIVE"


class CustomerUpdate(BaseModel):
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[CustomerTier] = None
    status: Optional[str] = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: CustomerTier
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
