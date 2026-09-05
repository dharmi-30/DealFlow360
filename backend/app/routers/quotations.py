from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.fulfillment import (
    FulfillmentOverrideRequest,
    FulfillmentResponse,
)
from app.schemas.quotation import (
    QuotationCreate,
    QuotationResponse,
    QuotationUpdate,
)
from app.schemas.recommendation import RecommendationResponse
from app.services import (
    fulfillment_service,
    quotation_service,
    recommendation_service,
)

router = APIRouter(prefix="/quotations", tags=["Quotations & Fulfillment"])


@router.post(
    "",
    response_model=QuotationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new commercial quotation",
)
def create_quotation(
    payload: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new commercial quotation with backend calculations for subtotal,
    discounts, tax, total, estimated cost, margin, risk score, and deal events.
    """
    return quotation_service.create_quotation(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        payload=payload,
    )


@router.get(
    "",
    response_model=List[QuotationResponse],
    summary="List all company quotations",
)
def list_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all quotations belonging to the authenticated user's company."""
    return quotation_service.get_quotations(
        db=db, company_id=current_user.company_id
    )


@router.get(
    "/{quotation_id}",
    response_model=QuotationResponse,
    summary="Get quotation details by ID",
)
def get_quotation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single quotation belonging to current user's company."""
    quotation = quotation_service.get_quotation_by_id(
        db=db, company_id=current_user.company_id, quotation_id=quotation_id
    )
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )
    return quotation


@router.get(
    "/{quotation_id}/recommendations",
    response_model=List[RecommendationResponse],
    summary="Get dynamic product recommendations for quotation",
)
def get_recommendations(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns dynamically calculated product recommendations for a quotation
    based on co-occurrence, complementary categories, subscription add-ons, and margin metrics.
    """
    return recommendation_service.get_quotation_recommendations(
        db=db,
        company_id=current_user.company_id,
        quotation_id=quotation_id,
    )


@router.get(
    "/{quotation_id}/fulfillment",
    response_model=FulfillmentResponse,
    summary="Get recommended warehouse inventory fulfillment allocation",
)
def get_fulfillment_recommendation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates dynamic warehouse allocation from available inventory,
    minimizing shipments and determining estimated shipping cost and backorders.
    """
    return fulfillment_service.calculate_recommended_fulfillment(
        db=db,
        company_id=current_user.company_id,
        quotation_id=quotation_id,
    )


@router.post(
    "/{quotation_id}/fulfillment/accept",
    response_model=FulfillmentResponse,
    summary="Accept recommended warehouse inventory allocation",
)
def accept_fulfillment(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts the recommended warehouse allocation, updates reserved stock in inventory records,
    and logs a deal event.
    """
    return fulfillment_service.accept_fulfillment(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
    )


@router.post(
    "/{quotation_id}/fulfillment/override",
    response_model=FulfillmentResponse,
    summary="Apply manual warehouse inventory allocation override",
)
def override_fulfillment(
    quotation_id: uuid.UUID,
    payload: FulfillmentOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Applies an explicit manual warehouse allocation override. Validates company ownership
    and stock availability before updating reserved inventory and logging a deal event.
    """
    return fulfillment_service.override_fulfillment(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
        payload=payload,
    )


@router.put(
    "/{quotation_id}",
    response_model=QuotationResponse,
    summary="Update quotation items or customer",
)
def update_quotation(
    quotation_id: uuid.UUID,
    payload: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing quotation within the authenticated user's company."""
    return quotation_service.update_quotation(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
        payload=payload,
    )


@router.post(
    "/{quotation_id}/submit",
    response_model=QuotationResponse,
    summary="Submit quotation for approval",
)
def submit_quotation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit quotation for managerial/financial approval or auto-approve."""
    return quotation_service.submit_quotation(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
    )


@router.post(
    "/{quotation_id}/confirm",
    response_model=QuotationResponse,
    summary="Confirm quotation deal",
)
def confirm_quotation(
    quotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm a quotation to finalize commercial agreement."""
    return quotation_service.confirm_quotation(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        quotation_id=quotation_id,
    )
