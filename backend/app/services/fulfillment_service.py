from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Set
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    DealEvent,
    Inventory,
    Product,
    Quotation,
    Warehouse,
)
from app.schemas.fulfillment import (
    AllocationItem,
    FulfillmentOverrideRequest,
    FulfillmentResponse,
)


def quantize_money(amount: Decimal) -> Decimal:
    """Helper to round monetary values to 2 decimal places."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_recommended_fulfillment(
    db: Session,
    company_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> FulfillmentResponse:
    """
    Calculates dynamic, recommended warehouse inventory allocation for a quotation.
    Prioritizes warehouses with higher available stock to minimize shipment count.
    Identifies any backordered quantity if available stock is insufficient.
    """
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

    allocations: List[AllocationItem] = []
    backordered_quantity = 0

    for item in quotation.items:
        if not item.product_id:
            backordered_quantity += item.quantity
            continue

        req_qty = item.quantity

        # Query available inventory records across warehouses belonging to tenant company
        inv_records = (
            db.query(Inventory, Warehouse)
            .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
            .filter(
                Inventory.product_id == item.product_id,
                Warehouse.company_id == company_id,
            )
            .all()
        )

        # Sort candidate warehouses by net available stock descending
        candidates = []
        for inv, wh in inv_records:
            net_avail = inv.quantity_available - inv.quantity_reserved
            if net_avail > 0:
                candidates.append((net_avail, inv, wh))

        candidates.sort(key=lambda c: c[0], reverse=True)

        for net_avail, inv, wh in candidates:
            if req_qty == 0:
                break

            alloc_qty = min(req_qty, net_avail)
            allocations.append(
                AllocationItem(
                    warehouse_id=wh.id,
                    warehouse_name=wh.name,
                    product_id=item.product_id,
                    quantity=alloc_qty,
                )
            )
            req_qty -= alloc_qty

        if req_qty > 0:
            backordered_quantity += req_qty

    # Calculate metrics
    unique_wh_ids: Set[uuid.UUID] = {alloc.warehouse_id for alloc in allocations}
    shipment_count = len(unique_wh_ids)

    if unique_wh_ids:
        warehouses = (
            db.query(Warehouse).filter(Warehouse.id.in_(unique_wh_ids)).all()
        )
        shipping_cost = sum((Decimal(str(wh.shipping_cost)) for wh in warehouses), Decimal("0.00"))
    else:
        shipping_cost = Decimal("0.00")

    return FulfillmentResponse(
        quotation_id=quotation.id,
        allocations=allocations,
        shipment_count=shipment_count,
        estimated_shipping_cost=quantize_money(shipping_cost),
        backordered_quantity=backordered_quantity,
    )


def accept_fulfillment(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
) -> FulfillmentResponse:
    """
    Accepts the recommended fulfillment allocation, updates reserved stock
    in inventory records, and logs a deal event.
    """
    fulfillment = calculate_recommended_fulfillment(db, company_id, quotation_id)
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()

    for alloc in fulfillment.allocations:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.warehouse_id == alloc.warehouse_id,
                Inventory.product_id == alloc.product_id,
            )
            .first()
        )
        if inv:
            inv.quantity_reserved += alloc.quantity

    event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type="FULFILLMENT_ACCEPTED",
        description=(
            f"Fulfillment accepted for quotation {quotation.quote_number} across "
            f"{fulfillment.shipment_count} shipments (Backordered: {fulfillment.backordered_quantity})"
        ),
    )
    db.add(event)

    db.commit()
    return fulfillment


def override_fulfillment(
    db: Session,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    quotation_id: uuid.UUID,
    payload: FulfillmentOverrideRequest,
) -> FulfillmentResponse:
    """
    Applies explicit manual warehouse allocation override. Validates company ownership
    and stock availability before updating reserved inventory and logging a deal event.
    """
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

    # 1. Validation phase
    wh_ids = {alloc.warehouse_id for alloc in payload.allocations}
    prod_ids = {alloc.product_id for alloc in payload.allocations}

    warehouses = (
        db.query(Warehouse)
        .filter(Warehouse.id.in_(wh_ids), Warehouse.company_id == company_id)
        .all()
    )
    wh_map = {w.id: w for w in warehouses}

    if len(wh_map) != len(wh_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified warehouses do not belong to your company",
        )

    products = (
        db.query(Product)
        .filter(Product.id.in_(prod_ids), Product.company_id == company_id)
        .all()
    )
    prod_map = {p.id: p for p in products}

    if len(prod_map) != len(prod_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified products do not belong to your company",
        )

    allocations: List[AllocationItem] = []

    for alloc_in in payload.allocations:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.warehouse_id == alloc_in.warehouse_id,
                Inventory.product_id == alloc_in.product_id,
            )
            .first()
        )
        available_qty = (inv.quantity_available - inv.quantity_reserved) if inv else 0

        if alloc_in.quantity > available_qty:
            wh_name = wh_map[alloc_in.warehouse_id].name
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested override quantity ({alloc_in.quantity}) exceeds available stock "
                    f"({available_qty}) in warehouse '{wh_name}'"
                ),
            )

        # Update inventory reservation
        if inv:
            inv.quantity_reserved += alloc_in.quantity

        allocations.append(
            AllocationItem(
                warehouse_id=alloc_in.warehouse_id,
                warehouse_name=wh_map[alloc_in.warehouse_id].name,
                product_id=alloc_in.product_id,
                quantity=alloc_in.quantity,
            )
        )

    # Calculate backordered quantity for quotation items
    backordered_quantity = 0
    for item in quotation.items:
        allocated_for_product = sum(
            a.quantity for a in allocations if a.product_id == item.product_id
        )
        if allocated_for_product < item.quantity:
            backordered_quantity += item.quantity - allocated_for_product

    # Calculate metrics
    unique_wh_ids = {alloc.warehouse_id for alloc in allocations}
    shipment_count = len(unique_wh_ids)
    shipping_cost = sum(
        (Decimal(str(wh_map[wid].shipping_cost)) for wid in unique_wh_ids),
        Decimal("0.00"),
    )

    event = DealEvent(
        quotation_id=quotation.id,
        actor_id=user_id,
        event_type="FULFILLMENT_OVERRIDDEN",
        description=(
            f"Manual fulfillment override applied for quotation {quotation.quote_number} "
            f"across {shipment_count} shipments (Backordered: {backordered_quantity})"
        ),
    )
    db.add(event)

    db.commit()

    return FulfillmentResponse(
        quotation_id=quotation.id,
        allocations=allocations,
        shipment_count=shipment_count,
        estimated_shipping_cost=quantize_money(shipping_cost),
        backordered_quantity=backordered_quantity,
    )
