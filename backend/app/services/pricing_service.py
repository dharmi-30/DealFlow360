from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List
import uuid

from sqlalchemy.orm import Session

from app.db.models import ApprovalRole, CustomerTier, Product
from app.services import discount_service


def quantize_money(amount: Decimal) -> Decimal:
    """Helper to round monetary values to 2 decimal places using standard HALF_UP rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass
class CalculatedItem:
    product_id: Any
    product_name: str
    category: str | None
    unit_price: Decimal
    unit_cost: Decimal
    tax_rate: Decimal
    quantity: int
    discount_percentage: Decimal
    line_gross: Decimal
    line_discount: Decimal
    line_net: Decimal
    line_cost: Decimal
    line_tax: Decimal
    line_total: Decimal


@dataclass
class QuotationCalculationResult:
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    estimated_cost: Decimal
    margin_amount: Decimal
    margin_percent: Decimal
    risk_score: Decimal
    approval_required: bool
    required_roles: List[ApprovalRole]
    items: List[CalculatedItem]


def calculate_quotation_totals(
    db: Session,
    company_id: uuid.UUID,
    customer_tier: CustomerTier,
    items_input: List[Dict[str, Any]],
    products_map: Dict[Any, Product],
) -> QuotationCalculationResult:
    """
    Core pricing engine for DealFlow360.
    Calculates subtotal, discounts, tax, total, estimated cost, gross margin,
    margin percentage, risk score (0-100), and governance approval requirements.
    """
    calculated_items: List[CalculatedItem] = []

    subtotal = Decimal("0.00")
    discount_amount = Decimal("0.00")
    tax_amount = Decimal("0.00")
    estimated_cost = Decimal("0.00")

    for item_in in items_input:
        product_id = item_in["product_id"]
        quantity = int(item_in["quantity"])
        discount_percentage = Decimal(
            str(item_in.get("discount_percentage", item_in.get("discount_percent", 0)))
        )

        product = products_map[product_id]

        unit_price = Decimal(str(product.unit_price))
        unit_cost = Decimal(str(product.unit_cost))
        tax_rate = Decimal(str(product.tax_rate or 0))

        qty_dec = Decimal(quantity)
        line_gross = quantize_money(qty_dec * unit_price)
        line_discount = quantize_money(
            line_gross * (discount_percentage / Decimal("100.00"))
        )
        line_net = line_gross - line_discount
        line_cost = quantize_money(qty_dec * unit_cost)
        line_tax = quantize_money(line_net * (tax_rate / Decimal("100.00")))
        line_total = line_net

        subtotal += line_gross
        discount_amount += line_discount
        tax_amount += line_tax
        estimated_cost += line_cost

        calculated_items.append(
            CalculatedItem(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                unit_price=unit_price,
                unit_cost=unit_cost,
                tax_rate=tax_rate,
                quantity=quantity,
                discount_percentage=discount_percentage,
                line_gross=line_gross,
                line_discount=line_discount,
                line_net=line_net,
                line_cost=line_cost,
                line_tax=line_tax,
                line_total=line_total,
            )
        )

    net_revenue = subtotal - discount_amount
    total_amount = quantize_money(net_revenue + tax_amount)
    margin_amount = quantize_money(net_revenue - estimated_cost)

    if net_revenue > Decimal("0.00"):
        margin_percent = quantize_money((margin_amount / net_revenue) * Decimal("100.00"))
    else:
        margin_percent = Decimal("0.00")

    # Risk Score & Approval Evaluation via discount_service
    risk_score, approval_required, required_roles = (
        discount_service.calculate_risk_score_and_approvals(
            db=db,
            company_id=company_id,
            customer_tier=customer_tier,
            items_input=items_input,
            products_map=products_map,
            subtotal=subtotal,
            discount_amount=discount_amount,
            margin_percent=margin_percent,
        )
    )

    return QuotationCalculationResult(
        subtotal=subtotal,
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        estimated_cost=estimated_cost,
        margin_amount=margin_amount,
        margin_percent=margin_percent,
        risk_score=risk_score,
        approval_required=approval_required,
        required_roles=required_roles,
        items=calculated_items,
    )
