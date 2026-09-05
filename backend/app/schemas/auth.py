from typing import Optional, List
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr
from app.db.models import UserRole


class UserSignupRequest(BaseModel):
    full_name: str
    company_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.SALES_REP
    account_type: str = "internal"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    console_mode: Optional[str] = "internal"  # "internal" (Sales Ops Console) | "customer" (Customer Portal)


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    company_id: uuid.UUID
    account_type: str = "internal"
    role_title: Optional[str] = None
    permissions: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

