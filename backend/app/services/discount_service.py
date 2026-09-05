from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Tuple
import uuid

from sqlalchemy.orm import Session

from app.db.models import ApprovalRole, CustomerTier, DiscountRule, Product

# Base Maximum Allowed Discount by Customer Tier
TIER_BASE_DISCOUNT_LIMITS: Dict[CustomerTier, Decimal] = {
    CustomerTier.BRONZE: Decimal("5.00"),
    CustomerTier.SILVER: Decimal("10.00"),
    CustomerTier.GOLD: Decimal("15.00"),
}


def get_allowed_discount_for_line(
    db: Session,
    company_id: uuid.UUID,
    customer_tier: CustomerTier,
    product: Product,
    quantity: int,
) -> Decimal:
    """
    Determines the maximum allowed discount percentage for a quotation line item.
    Compares the customer's base tier limit against any company category/tier discount rules.
    Uses the stricter (lower) applicable threshold.
    """
    base_limit = TIER_BASE_DISCOUNT_LIMITS.get(customer_tier, Decimal("5.00"))

    # Check for specific discount rules in DB for company
    rule_query = (
        db.query(DiscountRule)
        .filter(
            DiscountRule.company_id == company_id,
            DiscountRule.is_active == True,
            DiscountRule.min_quantity <= quantity,
        )
    )

    rules = rule_query.all()
    applicable_limits = [base_limit]

    for rule in rules:
        if rule.customer_tier is None or rule.customer_tier == customer_tier:
            applicable_limits.append(Decimal(str(rule.discount_percentage)))

    # Use the stricter (lower) applicable limit
    return min(applicable_limits)


def calculate_risk_score_and_approvals(
    db: Session,
    company_id: uuid.UUID,
    customer_tier: CustomerTier,
    items_input: List[Dict[str, Any]],
    products_map: Dict[uuid.UUID, Product],
    subtotal: Decimal,
    discount_amount: Decimal,
    margin_percent: Decimal,
) -> Tuple[Decimal, bool, List[ApprovalRole]]:
    """
    Evaluates requested line discounts against governance thresholds,
    calculates a deterministic 0-100 risk score, and determines required approval roles.

    Risk Score Factors (0 - 100):
    1. Excess discount above allowed limit (0-50 pts)
    2. Low gross margin below safe 30% threshold (0-30 pts)
    3. Count of risky lines where requested > allowed (0-10 pts)
    4. High average discount percentage (0-10 pts)

    Approval Logic:
    - Risk 0-30: No approval required
    - Risk 31-60: Sales Manager approval
    - Risk 61-100: Sales Manager + Finance approval
    """
    max_excess_discount = Decimal("0.00")
    risky_lines_count = 0

    for item_in in items_input:
        product_id = item_in["product_id"]
        quantity = int(item_in["quantity"])
        requested_discount = Decimal(
            str(item_in.get("discount_percentage", item_in.get("discount_percent", 0)))
        )

        product = products_map[product_id]
        allowed_discount = get_allowed_discount_for_line(
            db=db,
            company_id=company_id,
            customer_tier=customer_tier,
            product=product,
            quantity=quantity,
        )

        if requested_discount > allowed_discount:
            excess = requested_discount - allowed_discount
            if excess > max_excess_discount:
                max_excess_discount = excess
            risky_lines_count += 1

    # Factor 1: Discount Excess (0 - 50 points)
    excess_score = min(Decimal("50.00"), max_excess_discount * Decimal("4.0"))

    # Factor 2: Low Margin (0 - 30 points, safe margin = 30.0%)
    target_margin = Decimal("30.00")
    if margin_percent < target_margin:
        margin_score = min(
            Decimal("30.00"), (target_margin - margin_percent) * Decimal("1.5")
        )
    else:
        margin_score = Decimal("0.00")

    # Factor 3: Risky Lines Count (0 - 10 points)
    risky_lines_score = min(Decimal("10.00"), Decimal(risky_lines_count) * Decimal("5.0"))

    # Factor 4: Total Discount Amount Ratio (0 - 10 points)
    if subtotal > Decimal("0.00"):
        avg_discount_pct = (discount_amount / subtotal) * Decimal("100.00")
    else:
        avg_discount_pct = Decimal("0.00")

    total_discount_score = min(Decimal("10.00"), avg_discount_pct * Decimal("0.5"))

    # Combined Risk Score (0 - 100)
    raw_risk_score = (
        excess_score + margin_score + risky_lines_score + total_discount_score
    )
    risk_score = min(
        Decimal("100.00"),
        raw_risk_score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
    )

    # Determine required approval roles based on Risk Score
    required_roles: List[ApprovalRole] = []
    approval_required = False

    if risk_score <= Decimal("30.00"):
        approval_required = False
        required_roles = []
    elif Decimal("31.00") <= risk_score <= Decimal("60.00"):
        approval_required = True
        required_roles = [ApprovalRole.SALES_MANAGER]
    else:  # Risk 61 - 100
        approval_required = True
        required_roles = [ApprovalRole.SALES_MANAGER, ApprovalRole.FINANCE]

    return risk_score, approval_required, required_roles
