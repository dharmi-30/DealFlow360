from typing import List, Optional
import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.models import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_products(
    db: Session,
    company_id: uuid.UUID,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Product]:
    """
    Retrieve all products belonging to the tenant company.
    Supports search across name, sku, category, and filtering by category.
    """
    query = db.query(Product).filter(Product.company_id == company_id)

    if category:
        query = query.filter(Product.category == category)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.sku.ilike(search_pattern),
                Product.category.ilike(search_pattern),
            )
        )

    return query.order_by(Product.created_at.desc()).all()


def get_product_by_id(
    db: Session,
    company_id: uuid.UUID,
    product_id: uuid.UUID,
) -> Optional[Product]:
    """Get a single product by ID scoped strictly to the company."""
    return (
        db.query(Product)
        .filter(Product.id == product_id, Product.company_id == company_id)
        .first()
    )


def create_product(
    db: Session,
    company_id: uuid.UUID,
    payload: ProductCreate,
) -> Product:
    """Create a new product record for the tenant company."""
    product = Product(company_id=company_id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session,
    company_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: ProductUpdate,
) -> Optional[Product]:
    """Update an existing product within the tenant company."""
    product = get_product_by_id(db, company_id, product_id)
    if not product:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(
    db: Session,
    company_id: uuid.UUID,
    product_id: uuid.UUID,
) -> bool:
    """Delete a product record within the tenant company."""
    product = get_product_by_id(db, company_id, product_id)
    if not product:
        return False

    db.delete(product)
    db.commit()
    return True
