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


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using email and password. Returns JWT access token containing
    user_id, company_id, role, and expiration.
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

    token = create_access_token(
        user_id=user.id,
        company_id=user.company_id,
        role=user.role,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
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
    return current_user


@router.post(
    "/logout",
    summary="Logout user session",
)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint for authenticated users.
    """
    return {"message": "Successfully logged out"}


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
