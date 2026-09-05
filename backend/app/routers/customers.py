from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get(
    "",
    response_model=List[CustomerResponse],
    summary="List all company customers with optional search filter",
)
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, company, or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all customers scoped to the authenticated user's company."""
    return customer_service.get_customers(
        db=db, company_id=current_user.company_id, search=search
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get customer details by ID",
)
def get_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single customer belonging to current user's company."""
    customer = customer_service.get_customer_by_id(
        db=db, company_id=current_user.company_id, customer_id=customer_id
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer",
)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new customer record associated with current user's company."""
    return customer_service.create_customer(
        db=db, company_id=current_user.company_id, payload=payload
    )


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update customer details",
)
def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing customer within the authenticated user's company."""
    customer = customer_service.update_customer(
        db=db,
        company_id=current_user.company_id,
        customer_id=customer_id,
        payload=payload,
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a customer",
)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a customer record belonging to the authenticated user's company."""
    success = customer_service.delete_customer(
        db=db, company_id=current_user.company_id, customer_id=customer_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return {"message": "Customer deleted successfully"}
