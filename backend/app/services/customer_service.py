from typing import List, Optional
import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.models import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_customers(
    db: Session,
    company_id: uuid.UUID,
    search: Optional[str] = None,
) -> List[Customer]:
    """
    Retrieve all customers belonging to the tenant company.
    Supports search across contact_name, company_name, and email.
    """
    query = db.query(Customer).filter(Customer.company_id == company_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.contact_name.ilike(search_pattern),
                Customer.company_name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
            )
        )
    return query.order_by(Customer.created_at.desc()).all()


def get_customer_by_id(
    db: Session,
    company_id: uuid.UUID,
    customer_id: uuid.UUID,
) -> Optional[Customer]:
    """Get a single customer by ID scoped strictly to the company."""
    return (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.company_id == company_id)
        .first()
    )


def create_customer(
    db: Session,
    company_id: uuid.UUID,
    payload: CustomerCreate,
) -> Customer:
    """Create a new customer record for the tenant company."""
    customer = Customer(company_id=company_id, **payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(
    db: Session,
    company_id: uuid.UUID,
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
) -> Optional[Customer]:
    """Update an existing customer within the tenant company."""
    customer = get_customer_by_id(db, company_id, customer_id)
    if not customer:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(
    db: Session,
    company_id: uuid.UUID,
    customer_id: uuid.UUID,
) -> bool:
    """Delete a customer record within the tenant company."""
    customer = get_customer_by_id(db, company_id, customer_id)
    if not customer:
        return False

    db.delete(customer)
    db.commit()
    return True
