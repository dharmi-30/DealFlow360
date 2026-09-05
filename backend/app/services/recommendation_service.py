from decimal import Decimal, ROUND_HALF_UP
from typing import List
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Product, Quotation, QuoteItem
from app.schemas.recommendation import RecommendationResponse


def quantize_money(amount: Decimal) -> Decimal:
    """Round monetary amount to 2 decimal places."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_quotation_recommendations(
    db: Session,
    company_id: uuid.UUID,
    quotation_id: uuid.UUID,
    limit: int = 10,
) -> List[RecommendationResponse]:
    """
    Calculates dynamic, deterministic product recommendations for a quotation.

    Rules Evaluated (No LLM / AI):
    1. Frequently paired products based on existing quotation history.
    2. Subscription add-ons for non-subscription hardware/license items.
    3. Same-category complementary products.
    4. Products with healthy gross margin (>= 25%).
    5. Active catalog products.
    """
    # 1. Validate quotation exists and belongs to company
    quotation = (
        db.query(Quotation)
        .filter(Quotation.id == quotation_id, Quotation.company_id == company_id)
        .first()
    )
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    # 2. Extract existing product IDs and categories in quotation
    existing_product_ids = {
        item.product_id for item in quotation.items if item.product_id
    }
    existing_categories = {
        item.category for item in quotation.items if item.category
    }

    # Check if quote has non-subscription items
    has_non_subscription = False
    for item in quotation.items:
        if item.product and not item.product.is_subscription:
            has_non_subscription = True
            break
        elif not item.product:
            has_non_subscription = True

    # 3. Query candidate active products excluding existing quote products
    query = db.query(Product).filter(
        Product.company_id == company_id,
        Product.active == True,
    )
    if existing_product_ids:
        query = query.filter(Product.id.not_in(existing_product_ids))

    candidate_products = query.all()
    if not candidate_products:
        return []

    # 4. Calculate co-occurrence count from other company quotations
    co_occurrence_counts: dict[uuid.UUID, int] = {}
    if existing_product_ids:
        other_quote_ids = (
            db.query(QuoteItem.quotation_id)
            .filter(
                QuoteItem.quotation_id != quotation_id,
                QuoteItem.product_id.in_(existing_product_ids),
            )
            .distinct()
            .all()
        )
        quote_ids_list = [q[0] for q in other_quote_ids]

        if quote_ids_list:
            co_items = (
                db.query(QuoteItem.product_id)
                .filter(
                    QuoteItem.quotation_id.in_(quote_ids_list),
                    QuoteItem.product_id.not_in(existing_product_ids),
                )
                .all()
            )
            for item_tuple in co_items:
                pid = item_tuple[0]
                if pid:
                    co_occurrence_counts[pid] = co_occurrence_counts.get(pid, 0) + 1

    # 5. Evaluate rules for each candidate product
    recommendations: List[RecommendationResponse] = []

    for product in candidate_products:
        unit_price = Decimal(str(product.unit_price))
        unit_cost = Decimal(str(product.unit_cost))
        margin_delta = quantize_money(unit_price - unit_cost)

        if unit_price > Decimal("0.00"):
            margin_pct = (unit_price - unit_cost) / unit_price
        else:
            margin_pct = Decimal("0.00")

        co_count = co_occurrence_counts.get(product.id, 0)

        # Rule evaluation hierarchy
        if co_count > 0:
            confidence = min(0.95, round(0.70 + (co_count * 0.05), 2))
            reason = "Frequently purchased together"
        elif product.is_subscription and has_non_subscription:
            confidence = 0.85
            reason = "Recommended recurring subscription add-on"
        elif product.category and product.category in existing_categories:
            confidence = 0.75
            reason = f"Same-category complementary product in '{product.category}'"
        elif margin_pct >= Decimal("0.25"):
            confidence = 0.65
            reason = f"High margin product ({int(margin_pct * 100)}% margin)"
        else:
            confidence = 0.50
            reason = "Popular active catalog product"

        recommendations.append(
            RecommendationResponse(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                reason=reason,
                margin_delta=margin_delta,
                promotion=None,
                confidence=confidence,
            )
        )

    # 6. Rank recommendations by confidence descending, then margin_delta descending
    recommendations.sort(key=lambda r: (r.confidence, r.margin_delta), reverse=True)

    return recommendations[:limit]
