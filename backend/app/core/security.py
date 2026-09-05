from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User, UserRole

# Passlib CryptContext for secure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 bearer token scheme for FastAPI Swagger docs integration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a secure hash from a plain text password."""
    return pwd_context.hash(password)


def create_access_token(
    user_id: Union[str, uuid.UUID],
    company_id: Union[str, uuid.UUID],
    role: Union[str, UserRole],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token containing user_id (sub), company_id,
    user role, and expiration time.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    role_str = role.value if isinstance(role, UserRole) else str(role)

    to_encode = {
        "sub": str(user_id),
        "company_id": str(company_id),
        "role": role_str,
        "exp": expire,
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.PyJWTError:
        return None


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to authenticate and return the current user from JWT token.
    Raises 401 Unauthorized for missing, invalid, or expired tokens.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user or not user.is_active:
        raise credentials_exception

    return user


class RequireRole:
    """
    Reusable dependency class to enforce role-based access control (RBAC).
    """

    def __init__(self, *allowed_roles: UserRole):
        self.allowed_roles = set(allowed_roles)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role.value}'",
            )
        return current_user


# Role protection dependencies
require_admin = RequireRole(UserRole.ADMIN)
require_sales_ops_director = RequireRole(UserRole.SALES_OPS_DIRECTOR, UserRole.ADMIN)
require_sales_manager = RequireRole(UserRole.SALES_MANAGER, UserRole.SALES_OPS_DIRECTOR, UserRole.ADMIN)
require_finance = RequireRole(UserRole.FINANCE, UserRole.ADMIN)
require_sales_rep = RequireRole(
    UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.SALES_OPS_DIRECTOR, UserRole.ADMIN
)
require_customer = RequireRole(UserRole.CUSTOMER)
require_internal_user = RequireRole(
    UserRole.ADMIN, UserRole.SALES_OPS_DIRECTOR, UserRole.SALES_MANAGER, UserRole.SALES_REP, UserRole.FINANCE
)


def enforce_company_access(target_company_id: uuid.UUID, current_user: User):
    """
    Enforce multi-tenant company data isolation.
    Ensures a user from Company A cannot access Company B's records.
    """
    if target_company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-company record access is strictly forbidden",
        )
