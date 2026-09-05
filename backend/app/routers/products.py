from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services import product_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=List[ProductResponse],
    summary="List products with search and category filters",
)
def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or category"),
    category: Optional[str] = Query(None, description="Filter products by exact category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all products scoped to the authenticated user's company."""
    return product_service.get_products(
        db=db,
        company_id=current_user.company_id,
        search=search,
        category=category,
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product details by ID",
)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single product belonging to current user's company."""
    product = product_service.get_product_by_id(
        db=db, company_id=current_user.company_id, product_id=product_id
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product record associated with current user's company."""
    return product_service.create_product(
        db=db, company_id=current_user.company_id, payload=payload
    )


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details",
)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing product within the authenticated user's company."""
    product = product_service.update_product(
        db=db,
        company_id=current_user.company_id,
        product_id=product_id,
        payload=payload,
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a product",
)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a product record belonging to the authenticated user's company."""
    success = product_service.delete_product(
        db=db, company_id=current_user.company_id, product_id=product_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return {"message": "Product deleted successfully"}
