from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.approval import (
    ApprovalDecisionRequest,
    ApprovalRejectRequest,
    ApprovalResponse,
    ApprovalReturnRequest,
)
from app.services import approval_service

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get(
    "",
    response_model=List[ApprovalResponse],
    summary="List approval tasks for company",
)
def list_approvals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter approvals by status (PENDING, APPROVED, REJECTED, RETURNED)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all approval records scoped to the authenticated user's company."""
    return approval_service.get_company_approvals(
        db=db, company_id=current_user.company_id, status_filter=status_filter
    )


@router.post(
    "/{approval_id}/approve",
    response_model=ApprovalResponse,
    summary="Approve quotation approval task",
)
def approve_task(
    approval_id: uuid.UUID,
    payload: Optional[ApprovalDecisionRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve a quotation approval task. Enforces sequential ordering (Sales Manager
    approval MUST be completed before Finance approval).
    """
    comments = payload.comments if payload else None
    return approval_service.approve_approval(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        approval_id=approval_id,
        comments=comments,
    )


@router.post(
    "/{approval_id}/reject",
    response_model=ApprovalResponse,
    summary="Reject quotation approval task",
)
def reject_task(
    approval_id: uuid.UUID,
    payload: Optional[ApprovalRejectRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a quotation approval task and update quotation status to REJECTED."""
    reason = payload.reason if payload else None
    return approval_service.reject_approval(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        approval_id=approval_id,
        reason=reason,
    )


@router.post(
    "/{approval_id}/return",
    response_model=ApprovalResponse,
    summary="Return quotation for revision",
)
def return_task(
    approval_id: uuid.UUID,
    payload: Optional[ApprovalReturnRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a quotation for revision, transitioning quotation status back to DRAFT."""
    reason = payload.reason if payload else None
    return approval_service.return_approval(
        db=db,
        company_id=current_user.company_id,
        current_user=current_user,
        approval_id=approval_id,
        reason=reason,
    )
