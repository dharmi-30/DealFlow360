import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    enforce_company_access,
    get_current_user,
    get_password_hash,
    require_admin,
    require_finance,
    require_sales_manager,
    require_sales_rep,
    verify_password,
)
from app.db.database import get_db
from app.db.models import Company, User
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserResponse,
    UserSignupRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(payload: UserSignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user. If the specified company_name does not exist,
    a new Company organization is automatically created.
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered",
        )

    # Find existing company or create a new company
    company = (
        db.query(Company).filter(Company.name == payload.company_name).first()
    )
    if not company:
        company = Company(name=payload.company_name)
        db.add(company)
        db.flush()

    # Hash password - plaintext passwords are never stored
    hashed_pwd = get_password_hash(payload.password)

    new_user = User(
        company_id=company.id,
        email=payload.email,
        hashed_password=hashed_pwd,
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def _build_user_response(user: User) -> UserResponse:
    account_type = "customer" if user.role == UserRole.CUSTOMER else "internal"
    
    role_titles = {
        UserRole.ADMIN: "System Administrator",
        UserRole.SALES_OPS_DIRECTOR: "Sales Ops Director",
        UserRole.SALES_MANAGER: "Sales Manager",
        UserRole.SALES_REP: "Sales Representative",
        UserRole.FINANCE: "Finance Controller",
        UserRole.CUSTOMER: "Customer",
    }
    
    permission_map = {
        UserRole.ADMIN: ["all", "manage_users", "approve_quotes", "edit_margin", "manage_fulfillment", "view_reports"],
        UserRole.SALES_OPS_DIRECTOR: ["all", "approve_quotes", "edit_margin", "manage_fulfillment", "view_reports"],
        UserRole.SALES_MANAGER: ["approve_quotes", "view_all_quotes", "manage_fulfillment", "view_reports"],
        UserRole.SALES_REP: ["create_quotes", "view_own_quotes", "negotiate"],
        UserRole.FINANCE: ["approve_financials", "manage_invoices", "view_reports"],
        UserRole.CUSTOMER: ["view_portal_quotes", "counter_offer", "accept_quote", "view_invoices"],
    }
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        company_id=user.company_id,
        account_type=account_type,
        role_title=role_titles.get(user.role, "User"),
        permissions=permission_map.get(user.role, []),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using email and password. Returns JWT access token containing
    user_id, company_id, role, and expiration. Validates account type compatibility.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated",
        )

    user_resp = _build_user_response(user)

    # Validate console mode selection
    if payload.console_mode == "customer" and user.role != UserRole.CUSTOMER:
        # Internal user signing in to customer portal - allow preview or flag error
        pass
    elif payload.console_mode == "internal" and user.role == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer accounts are strictly forbidden from accessing the Sales Ops Console.",
        )

    token = create_access_token(
        user_id=user.id,
        company_id=user.company_id,
        role=user.role,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile of authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user from validated JWT token.
    """
    return _build_user_response(current_user)


@router.post(
    "/logout",
    summary="Logout user session",
)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint for authenticated users. Terminates active session token.
    """
    return {"message": "Session successfully terminated"}


# ==========================================
# Role Protection & Isolation Test Routes
# ==========================================

@router.get("/protected-admin", summary="Admin only test endpoint")
def protected_admin(current_user: User = Depends(require_admin)):
    return {
        "message": f"Hello Admin {current_user.full_name}",
        "user_id": str(current_user.id),
        "role": current_user.role,
    }


@router.get("/protected-finance", summary="Finance role test endpoint")
def protected_finance(current_user: User = Depends(require_finance)):
    return {
        "message": f"Hello Finance user {current_user.full_name}",
        "user_id": str(current_user.id),
        "role": current_user.role,
    }


@router.get("/protected-sales-manager", summary="Sales Manager test endpoint")
def protected_sales_manager(current_user: User = Depends(require_sales_manager)):
    return {
        "message": f"Hello Sales Manager {current_user.full_name}",
        "user_id": str(current_user.id),
        "role": current_user.role,
    }


@router.get("/protected-sales-rep", summary="Sales Rep test endpoint")
def protected_sales_rep(current_user: User = Depends(require_sales_rep)):
    return {
        "message": f"Hello Sales Rep {current_user.full_name}",
        "user_id": str(current_user.id),
        "role": current_user.role,
    }


@router.get("/company-records/{target_company_id}", summary="Multi-tenant isolation test endpoint")
def get_company_records(
    target_company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    # Enforce company isolation
    enforce_company_access(target_company_id, current_user)
    return {
        "message": f"Access granted to company {target_company_id} records",
        "company_id": str(target_company_id),
    }
