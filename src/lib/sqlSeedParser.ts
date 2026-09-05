import rawSchemaSql from '../../schema.sql?raw';
import {
  Customer,
  Product,
  Category,
  Quotation,
  ApprovalRecord,
  FulfillmentRecord,
  FulfillmentStatus,
  SubscriptionRecord,
  InvoiceRecord,
  DealHealthScore,
  QuotationItem,
  NegotiationMessage,
  WarehouseInventoryRecord,
} from '../types';

interface ParsedRow {
  [column: string]: any;
}

// Helper to parse SQL INSERT INTO statements
function parseTableInserts(sql: string, tableName: string): ParsedRow[] {
  const regex = new RegExp(
    `INSERT\\s+INTO\\s+${tableName}\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]+?);`,
    'gi'
  );
  const match = regex.exec(sql);
  if (!match) return [];

  const columnsStr = match[1];
  const valuesBlock = match[2].trim();
  const columns = columnsStr.split(',').map((c) => c.trim().toLowerCase());

  const rows: ParsedRow[] = [];

  let inString = false;
  let currentTuple = '';
  let insideTuple = false;

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];
    const nextChar = valuesBlock[i + 1];

    if (char === "'") {
      if (inString && nextChar === "'") {
        currentTuple += "''";
        i++; // skip escaped quote
        continue;
      }
      inString = !inString;
      if (insideTuple) currentTuple += char;
      continue;
    }

    if (!inString) {
      if (char === '(' && !insideTuple) {
        insideTuple = true;
        currentTuple = '';
        continue;
      }
      if (char === ')' && insideTuple) {
        insideTuple = false;

        const parsedValues: any[] = [];
        const valRegex = /'((?:''|[^'])*)'|([^,\s]+)/g;
        let valMatch;

        while ((valMatch = valRegex.exec(currentTuple)) !== null) {
          if (valMatch[1] !== undefined) {
            parsedValues.push(valMatch[1].replace(/''/g, "'"));
          } else {
            const rawVal = valMatch[2].trim();
            if (rawVal.toUpperCase() === 'NULL') {
              parsedValues.push(null);
            } else if (rawVal.toLowerCase() === 'true') {
              parsedValues.push(true);
            } else if (rawVal.toLowerCase() === 'false') {
              parsedValues.push(false);
            } else if (!isNaN(Number(rawVal))) {
              parsedValues.push(Number(rawVal));
            } else {
              parsedValues.push(rawVal);
            }
          }
        }

        if (parsedValues.length === columns.length) {
          const rowObj: ParsedRow = {};
          columns.forEach((col, idx) => {
            rowObj[col] = parsedValues[idx];
          });
          rows.push(rowObj);
        }
        currentTuple = '';
        continue;
      }
    }

    if (insideTuple) {
      currentTuple += char;
    }
  }

  return rows;
}


export function parseSchemaSqlSeedData() {
  const sql = rawSchemaSql;

  const rawUsers = parseTableInserts(sql, 'users');
  const rawCustomers = parseTableInserts(sql, 'customers');
  const rawCategories = parseTableInserts(sql, 'categories');
  const rawProducts = parseTableInserts(sql, 'products');
  const rawQuotations = parseTableInserts(sql, 'quotations');
  const rawQuoteItems = parseTableInserts(sql, 'quote_items');
  const rawApprovals = parseTableInserts(sql, 'approvals');
  const rawNegotiations = parseTableInserts(sql, 'negotiations');
  const rawSubscriptions = parseTableInserts(sql, 'subscriptions');
  const rawInvoices = parseTableInserts(sql, 'invoices');
  const rawDealEvents = parseTableInserts(sql, 'deal_events');
  const rawWarehouses = parseTableInserts(sql, 'warehouses');
  const rawInventory = parseTableInserts(sql, 'inventory');

  // Categories
  const categories: Category[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Map Rep ID -> Full Name
  const userMap = new Map<string, string>();
  rawUsers.forEach((u) => userMap.set(u.id, u.full_name));

  // Map Customer ID -> Customer Obj
  const customerMap = new Map<string, any>();
  rawCustomers.forEach((c) => customerMap.set(c.id, c));

  // 1. CUSTOMERS
  const customers: Customer[] = rawCustomers.map((c, idx) => ({
    id: `cust-${idx + 1}`,
    name: c.company_name || 'Customer',
    code: (c.company_name || 'CUST').substring(0, 4).toUpperCase() + '-ENT',
    contactName: c.contact_name,
    contactEmail: c.email,
    tier: c.tier === 'GOLD' ? 'Enterprise' : c.tier === 'SILVER' ? 'Strategic' : 'Mid-Market',
    creditLimit: c.tier === 'GOLD' ? 500000 : c.tier === 'SILVER' ? 250000 : 100000,
    openBalance: idx % 2 === 0 ? 42500 : 118000,
    accountManager: 'Sarah Jenkins',
    shippingAddress: c.address || 'Enterprise HQ',
  }));

  // 2. PRODUCTS
  const products: Product[] = rawProducts.map((p, idx) => {
    const qtyHand = p.quantity_on_hand !== undefined && p.quantity_on_hand !== null ? Number(p.quantity_on_hand) : (p.is_subscription ? 999 : ((idx * 23) % 450) + 45);
    const unitMeasure = p.unit_of_measure || p.unit || (p.category?.includes('Subscription') || p.category?.includes('Support') ? 'Contract' : p.category?.includes('Services') ? 'Session' : 'Unit');
    return {
      id: `prod-${idx + 1}`,
      sku: p.sku,
      name: p.name,
      category: p.category || 'General',
      description: p.description || '',
      listPrice: Number(p.unit_price),
      cogs: Number(p.unit_cost),
      minMarginPct: p.category === 'Professional Services' ? 35.0 : p.category === 'Support' ? 50.0 : 18.0,
      defaultDiscountPct: p.category === 'Hardware' ? 5.0 : 0.0,
      upsellIds: idx === 0 ? ['prod-3', 'prod-5'] : [],
      crossSellIds: idx === 0 ? ['prod-4', 'prod-2'] : [],
      inStock: qtyHand,
      unitOfMeasure: unitMeasure,
      quantityOnHand: qtyHand,
      status: p.active === false ? 'Inactive' : 'Active',
    };
  });

  const productMap = new Map<string, Product>();
  products.forEach((p, idx) => {
    const rawP = rawProducts[idx];
    if (rawP) productMap.set(rawP.id, p);
  });

  // 3. QUOTATIONS & ITEMS
  const quoteItemsMap = new Map<string, QuotationItem[]>();
  rawQuoteItems.forEach((qi, idx) => {
    const prod = productMap.get(qi.product_id);
    const item: QuotationItem = {
      id: qi.id || `qi-${idx}`,
      productId: prod?.id || 'prod-1',
      productName: qi.product_name,
      sku: prod?.sku || 'HW-SKU',
      quantity: Number(qi.quantity),
      unitPrice: Number(qi.unit_price),
      cogs: Number(qi.unit_cost),
      discountPct: Number(qi.discount_percent),
      lineTotal: Number(qi.line_total),
      marginPct: Number(
        (
          ((Number(qi.unit_price) * (1 - Number(qi.discount_percent) / 100) - Number(qi.unit_cost)) /
            (Number(qi.unit_price) * (1 - Number(qi.discount_percent) / 100))) *
          100
        ).toFixed(1)
      ),
    };
    const list = quoteItemsMap.get(qi.quotation_id) || [];
    list.push(item);
    quoteItemsMap.set(qi.quotation_id, list);
  });

  // Map Negotiations
  const negotiationsMap = new Map<string, NegotiationMessage[]>();
  rawNegotiations.forEach((n, idx) => {
    const msg: NegotiationMessage = {
      id: n.id || `msg-${idx}`,
      quotationId: n.quotation_id,
      senderRole: n.actor_type === 'USER' ? 'sales_rep' : 'customer',
      senderName: n.actor_id ? userMap.get(n.actor_id) || 'Sales Rep' : 'Customer Contact',
      timestamp: '2026-09-01 10:00',
      message: n.notes || 'Counter offer details submitted.',
      proposedDiscountPct: n.requested_discount_percent ? Number(n.requested_discount_percent) : undefined,
    };
    const list = negotiationsMap.get(n.quotation_id) || [];
    list.push(msg);
    negotiationsMap.set(n.quotation_id, list);
  });

  const quotations: Quotation[] = rawQuotations.map((q, idx) => {
    const cust = customerMap.get(q.customer_id);
    const repName = userMap.get(q.sales_rep_id) || 'Sarah Jenkins';
    const items = quoteItemsMap.get(q.id) || [];
    const negHistory = negotiationsMap.get(q.id) || [];

    const statusMap: Record<string, Quotation['status']> = {
      DRAFT: 'draft',
      PENDING_APPROVAL: 'pending_approval',
      APPROVED: 'approved',
      NEGOTIATION: 'customer_countered',
      CONFIRMED: 'accepted',
      REJECTED: 'rejected',
      CANCELLED: 'rejected',
    };

    return {
      id: `q-${1000 + idx}`,
      code: q.quote_number,
      customerId: cust ? `cust-${rawCustomers.indexOf(cust) + 1}` : 'cust-1',
      customerName: cust?.company_name || 'Acme Corp',
      customerContact: cust?.contact_name || 'Marcus Vance',
      customerEmail: cust?.email || 'm.vance@acme-corp.com',
      createdDate: '2026-09-01',
      validUntil: '2026-09-30',
      salesRep: repName,
      warehouseHub: idx % 2 === 0 ? 'Dallas (HUB-01)' : 'Chicago (HUB-02)',
      status: statusMap[q.status] || 'draft',
      requiresApproval: Boolean(q.approval_required),
      approvalReason: q.approval_required ? 'Discount exceeds allowed rep limit threshold.' : undefined,
      subtotal: items.length > 0
        ? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        : 0,
      discountAmount: items.length > 0
        ? items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.discountPct) / 100, 0)
        : 0,
      grandTotal: items.length > 0
        ? items.reduce((sum, item) => sum + item.lineTotal, 0)
        : 0,
      totalCogs: items.length > 0
        ? items.reduce((sum, item) => sum + item.cogs * item.quantity, 0)
        : 0,
      marginPct: items.length > 0 && items.reduce((sum, item) => sum + item.lineTotal, 0) > 0
        ? Number(
            (
              ((items.reduce((sum, item) => sum + item.lineTotal, 0) -
                items.reduce((sum, item) => sum + item.cogs * item.quantity, 0)) /
                items.reduce((sum, item) => sum + item.lineTotal, 0)) *
              100
            ).toFixed(1)
          )
        : 0,
      deliveryRequestDate: '2026-09-20',
      customerComments: 'Parsed live from PostgreSQL schema.sql seed queries.',
      shippingAddress: cust?.address || '100 Industrial Parkway, Suite 400, Dallas, TX 75201',
      items,
      negotiationHistory: negHistory,
    };
  });

  // 4. APPROVALS
  const approvals: ApprovalRecord[] = rawApprovals.map((a, idx) => {
    const q = rawQuotations.find((rawQ) => rawQ.id === a.quotation_id);
    const cust = q ? customerMap.get(q.customer_id) : null;
    const statusVal = a.status === 'APPROVED' ? 'approved' : a.status === 'REJECTED' ? 'rejected' : 'pending';

    return {
      id: `app-${idx + 1}`,
      quotationId: q ? `q-${1000 + rawQuotations.indexOf(q)}` : 'q-1000',
      quotationCode: q?.quote_number || 'QT-2026-8492',
      customerName: cust?.company_name || 'Acme Corp',
      salesRep: 'Sarah Jenkins',
      requestedDiscountPct: 18.5,
      marginPct: q ? Number(q.margin_percent) : 33.9,
      grandTotal: q ? Number(q.total_amount) : 12400.0,
      triggerReason: a.comments || 'Discount exceeds Rep Max Threshold (10.0%)',
      tier: a.approval_role === 'FINANCE' ? 'VP Sales Approval' : 'Manager Approval',
      status: statusVal,
      submittedAt: '2026-09-01 10:14',
      reviewedBy: a.status === 'APPROVED' ? 'Alex Morgan (Sales Manager)' : undefined,
      reviewedAt: a.status === 'APPROVED' ? '2026-09-01 11:30' : undefined,
      rationale: a.status === 'APPROVED' ? a.comments : undefined,
    };
  });

  // 5. FULFILLMENTS
  const fulfillments: FulfillmentRecord[] = rawQuotations
    .map((q, idx) => {
      const cust = customerMap.get(q.customer_id);
      const quoteItems = quoteItemsMap.get(q.id) || [];
      const totalUnits = quoteItems.reduce((sum, item) => sum + item.quantity, 0) || 12;

      let status: FulfillmentStatus = 'pending_pick';
      if (idx === 0) status = 'pending_pick';
      else if (idx === 1) status = 'packing';
      else if (idx === 2) status = 'dispatched';
      else status = 'delivered';

      return {
        id: `ful-${idx + 1}`,
        quotationId: `q-${1000 + rawQuotations.indexOf(q)}`,
        quotationCode: q.quote_number,
        customerName: cust?.company_name || 'Acme Corp',
        warehouseHub: idx % 3 === 0 ? 'Dallas (HUB-01)' : idx % 3 === 1 ? 'Chicago (HUB-02)' : 'Frankfurt (HUB-03)',
        itemsCount: totalUnits,
        status,
        carrier: status === 'dispatched' || status === 'delivered' ? 'FedEx Freight Direct' : undefined,
        trackingNumber: status === 'dispatched' || status === 'delivered' ? `FX-8849201${idx}-US` : undefined,
        dispatchDate: status === 'dispatched' || status === 'delivered' ? '2026-09-02' : undefined,
        estimatedDelivery: '2026-09-07',
        notes: status === 'pending_pick'
          ? 'Quotation approved. Awaiting warehouse pick and palletizing.'
          : status === 'packing'
          ? 'Items picked. Packing and preparing carrier dispatch.'
          : 'Order released and picked based on schema.sql warehouse inventory.',
      };
    });

  // 6. SUBSCRIPTIONS
  const subscriptions: SubscriptionRecord[] = rawSubscriptions.map((s, idx) => {
    const cust = customerMap.get(s.customer_id);
    return {
      id: `sub-${idx + 1}`,
      code: `SUB-${(cust?.company_name || 'CUST').substring(0, 4).toUpperCase()}-0${idx + 1}`,
      customerName: cust?.company_name || 'Acme Corp',
      planName: s.product_name || 'Care Plan 2yr + Premium Support',
      mrr: Number(s.amount),
      arr: Number(s.amount) * 12,
      billingCycle: s.billing_cycle === 'YEARLY' ? 'Annual' : 'Monthly',
      startDate: String(s.start_date).split(' ')[0],
      renewalDate: String(s.next_billing_date).split(' ')[0],
      status: s.status === 'ACTIVE' ? 'active' : 'pending_renewal',
      autoRenew: true,
      seats: Number(s.quantity),
    };
  });

  // 7. INVOICES
  const invoices: InvoiceRecord[] = rawInvoices.map((inv, idx) => {
    const q = rawQuotations.find((rawQ) => rawQ.id === inv.quotation_id);
    const cust = customerMap.get(inv.customer_id);
    const statusMap: Record<string, InvoiceRecord['status']> = {
      ISSUED: 'sent',
      PAID: 'paid',
      PARTIALLY_PAID: 'overdue',
      OVERDUE: 'overdue',
    };

    return {
      id: `inv-${idx + 1}`,
      invoiceNumber: inv.invoice_number,
      quotationCode: q?.quote_number || 'QT-2026-8495',
      customerName: cust?.company_name || 'Acme Corp',
      issueDate: '2026-09-02',
      dueDate: String(inv.due_date).split(' ')[0],
      totalAmount: Number(inv.total),
      amountPaid: Number(inv.paid_amount),
      status: statusMap[inv.status] || 'sent',
      paymentTerms: 'Net 30',
    };
  });

  // 8. DEAL HEALTH SCORES
  const dealHealthScores: DealHealthScore[] = rawQuotations.map((q, idx) => {
    const cust = customerMap.get(q.customer_id);
    const score = Number(q.risk_score) || 75;
    const riskLevel = score > 75 ? 'Moderate Risk' : score < 50 ? 'High Risk' : 'Low Risk';

    return {
      id: `dh-${idx + 1}`,
      quotationCode: q.quote_number,
      customerName: cust?.company_name || 'Acme Corp',
      grandTotal: Number(q.total_amount),
      overallScore: score,
      marginScore: Math.min(100, Math.round(Number(q.margin_percent) * 2.2)),
      velocityScore: 70,
      engagementScore: 85,
      riskLevel,
      riskFactors: q.approval_required
        ? ['Discount held in Manager Approval Queue', 'Hardware margin near rep threshold floor']
        : [],
      recommendedActions: ['Fast-track Manager Approval sign-off', 'Offer complimentary Care Plan'],
    };
  });

  // 9. WAREHOUSE INVENTORY (600 records)
  const warehouseMap = new Map<string, any>();
  rawWarehouses.forEach((w) => warehouseMap.set(w.id, w));

  const rawProdMap = new Map<string, any>();
  rawProducts.forEach((p) => rawProdMap.set(p.id, p));

  const warehouseInventory: WarehouseInventoryRecord[] = rawInventory.map((inv, idx) => {
    const wh = warehouseMap.get(inv.warehouse_id);
    const prod = rawProdMap.get(inv.product_id) || rawProducts[idx % rawProducts.length];
    const qty = Number(inv.quantity) || 100;
    const res = Number(inv.reserved_quantity) || 0;
    const avail = Math.max(0, qty - res);
    const unit = prod?.unit_of_measure || (prod?.category?.includes('Subscription') ? 'Contract' : prod?.category?.includes('Services') ? 'Session' : 'Unit');

    return {
      id: inv.id || `inv-rec-${idx + 1}`,
      warehouseId: inv.warehouse_id,
      warehouseName: wh?.name || 'Dallas Warehouse (HUB-01)',
      location: wh?.location || 'Dallas, TX',
      productId: inv.product_id,
      productName: prod?.name || 'Enterprise Hardware SKU',
      sku: prod?.sku || `SKU-PROD-${(idx % 300) + 1}`,
      category: prod?.category || 'Hardware',
      quantity: qty,
      reservedQuantity: res,
      availableStock: avail,
      unitOfMeasure: unit,
      status: avail < 20 ? 'Critical' : avail < 50 ? 'Low Stock' : 'In Stock',
    };
  });

  return {
    customers,
    categories,
    products,
    quotations,
    approvals,
    fulfillments,
    subscriptions,
    invoices,
    dealHealthScores,
    warehouseInventory,
  };
}
