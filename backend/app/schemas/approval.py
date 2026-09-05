from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict
from app.db.models import ApprovalRole


class ApprovalDecisionRequest(BaseModel):
    comments: Optional[str] = None


class ApprovalRejectRequest(BaseModel):
    reason: Optional[str] = None


class ApprovalReturnRequest(BaseModel):
    reason: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: uuid.UUID
    quotation_id: uuid.UUID
    approver_id: Optional[uuid.UUID] = None
    approval_role: ApprovalRole
    status: str
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
