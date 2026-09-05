from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Approval,
    ApprovalRole,
    Company,
    DealEvent,
    Quotation,
    QuotationStatus,
    User,
    UserRole,
)


def get_company_approvals(
    db: Session,
    company_id: uuid.UUID,
    status_filter: Optional[str] = None,
) -> List[Approval]:
    """Retrieve approval records scoped to the tenant company."""
    query = (
        db.query(Approval)
        .join(Quotation, Approval.quotation_id == Quotation.id)
        .filter(Quotation.company_id == company_id)
    )
    if status_filter:
        query = query.filter(Approval.status == status_filter)

    return query.order_by(Approval.created_at.desc()).all()


def get_approval_by_id(
    db: Session,
    company_id: uuid.UUID,
    approval_id: uuid.UUID,
) -> Optional[Approval]:
    """Get a single approval record scoped strictly to the company."""
    return (
        db.query(Approval)
        .join(Quotation, Approval.quotation_id == Quotation.id)
        .filter(Approval.id == approval_id, Quotation.company_id == company_id)
        .first()
    )


def verify_approver_permission(user: User, required_role: ApprovalRole):
    """
    Verify that the user possesses the necessary role to act on an approval decision.
    ADMINs can approve all roles; otherwise user role must match required approval role.
    """
    if user.role == UserRole.ADMIN:
        return

    if required_role == ApprovalRole.SALES_MANAGER and user.role != UserRole.SALES_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Sales Managers or Admins can perform this approval decision",
        )

    if required_role == ApprovalRole.FINANCE and user.role != UserRole.FINANCE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Finance users or Admins can perform this approval decision",
        )


def approve_approval(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    approval_id: uuid.UUID,
    comments: Optional[str] = None,
) -> Approval:
    """
    Process an approval decision. Enforces strict sequential ordering:
    Sales Manager approval MUST be completed before Finance approval.
    """
    approval = get_approval_by_id(db, company_id, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval record not found",
        )

    # 1. Verify user role permission
    verify_approver_permission(current_user, approval.approval_role)

    quotation = approval.quotation

    # 2. Enforce sequential order: Sales Manager MUST approve before Finance
    if approval.approval_role == ApprovalRole.FINANCE:
        manager_approval = (
            db.query(Approval)
            .filter(
                Approval.quotation_id == quotation.id,
                Approval.approval_role == ApprovalRole.SALES_MANAGER,
            )
            .first()
        )
        if manager_approval and manager_approval.status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sales Manager approval must be completed before Finance approval can be processed",
            )

    # 3. Update approval record
    approval.status = "APPROVED"
    approval.approver_id = current_user.id
    approval.comments = comments

    # 4. Log deal event
    comment_str = f": {comments}" if comments else ""
    event = DealEvent(
        quotation_id=quotation.id,
        actor_id=current_user.id,
        event_type="APPROVAL_APPROVED",
        description=f"{approval.approval_role.value} approved quotation {quotation.quote_number}{comment_str}",
    )
    db.add(event)

    # 5. Check if all required approvals for this quotation are completed
    all_approvals = (
        db.query(Approval)
        .filter(Approval.quotation_id == quotation.id)
        .all()
    )

    if all(appr.status == "APPROVED" for appr in all_approvals):
        quotation.status = QuotationStatus.APPROVED
        full_approved_event = DealEvent(
            quotation_id=quotation.id,
            actor_id=current_user.id,
            event_type="QUOTATION_FULLY_APPROVED",
            description=f"Quotation {quotation.quote_number} fully approved and ready for confirmation",
        )
        db.add(full_approved_event)

    db.commit()
    db.refresh(approval)
    return approval


def reject_approval(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    approval_id: uuid.UUID,
    reason: Optional[str] = None,
) -> Approval:
    """Reject an approval request and update quotation status to REJECTED."""
    approval = get_approval_by_id(db, company_id, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval record not found",
        )

    verify_approver_permission(current_user, approval.approval_role)

    quotation = approval.quotation

    approval.status = "REJECTED"
    approval.approver_id = current_user.id
    approval.comments = reason

    quotation.status = QuotationStatus.REJECTED

    reason_str = f": {reason}" if reason else ""
    event = DealEvent(
        quotation_id=quotation.id,
        actor_id=current_user.id,
        event_type="APPROVAL_REJECTED",
        description=f"{approval.approval_role.value} rejected quotation {quotation.quote_number}{reason_str}",
    )
    db.add(event)

    db.commit()
    db.refresh(approval)
    return approval


def return_approval(
    db: Session,
    company_id: uuid.UUID,
    current_user: User,
    approval_id: uuid.UUID,
    reason: Optional[str] = None,
) -> Approval:
    """Return an approval request for revision, transitioning quotation status back to DRAFT."""
    approval = get_approval_by_id(db, company_id, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval record not found",
        )

    verify_approver_permission(current_user, approval.approval_role)

    quotation = approval.quotation

    approval.status = "RETURNED"
    approval.approver_id = current_user.id
    approval.comments = reason

    # Return quotation to DRAFT status for revision by sales rep
    quotation.status = QuotationStatus.DRAFT

    reason_str = f": {reason}" if reason else ""
    event = DealEvent(
        quotation_id=quotation.id,
        actor_id=current_user.id,
        event_type="APPROVAL_RETURNED",
        description=f"{approval.approval_role.value} returned quotation {quotation.quote_number} for revision{reason_str}",
    )
    db.add(event)

    db.commit()
    db.refresh(approval)
    return approval
