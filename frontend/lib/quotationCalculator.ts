import type { ProductItem } from '@/types';

export interface CartLineItem {
  id: string;
  product: ProductItem;
  quantity: number;
  unitPrice: number;
  discountPercentage: number; // 0 - 100
  taxRate: number; // e.g. 0.10 for 10%
}

export type MarginHealthStatus = 'Healthy' | 'Watch' | 'At Risk';

export interface CalculationSummary {
  subtotalGross: number; // Before discount
  discountTotal: number;
  subtotalNet: number; // After discount
  taxTotal: number;
  grandTotal: number;
  totalCost: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
  marginHealth: MarginHealthStatus;
  requiresApproval: boolean;
  approvalReason?: string;
}

export function calculateQuotationSummary(
  lines: CartLineItem[],
  defaultTaxRate: number = 0.10
): CalculationSummary {
  if (lines.length === 0) {
    return {
      subtotalGross: 0,
      discountTotal: 0,
      subtotalNet: 0,
      taxTotal: 0,
      grandTotal: 0,
      totalCost: 0,
      grossMarginAmount: 0,
      grossMarginPercentage: 0,
      marginHealth: 'Healthy',
      requiresApproval: false,
    };
  }

  let subtotalGross = 0;
  let discountTotal = 0;
  let subtotalNet = 0;
  let taxTotal = 0;
  let totalCost = 0;

  lines.forEach((line) => {
    const lineGross = line.unitPrice * line.quantity;
    const lineDiscount = lineGross * (line.discountPercentage / 100);
    const lineNet = lineGross - lineDiscount;
    const lineTax = lineNet * (line.taxRate ?? defaultTaxRate);
    const lineCost = line.product.costPrice * line.quantity;

    subtotalGross += lineGross;
    discountTotal += lineDiscount;
    subtotalNet += lineNet;
    taxTotal += lineTax;
    totalCost += lineCost;
  });

  const grandTotal = subtotalNet + taxTotal;
  const grossMarginAmount = subtotalNet - totalCost;
  const grossMarginPercentage = subtotalNet > 0 ? (grossMarginAmount / subtotalNet) * 100 : 0;
  const overallDiscountPercent = subtotalGross > 0 ? (discountTotal / subtotalGross) * 100 : 0;

  // Margin Health Safeguard Assessment
  let marginHealth: MarginHealthStatus = 'Healthy';
  if (grossMarginPercentage < 20) {
    marginHealth = 'At Risk';
  } else if (grossMarginPercentage < 30) {
    marginHealth = 'Watch';
  }

  // Approval Requirements Check
  let requiresApproval = false;
  let approvalReason: string | undefined;

  if (marginHealth === 'At Risk') {
    requiresApproval = true;
    approvalReason = `Gross margin (${grossMarginPercentage.toFixed(1)}%) is below the 20% floor requirement.`;
  } else if (overallDiscountPercent > 15) {
    requiresApproval = true;
    approvalReason = `Overall proposal discount (${overallDiscountPercent.toFixed(1)}%) exceeds 15% rep authorization threshold.`;
  }

  return {
    subtotalGross,
    discountTotal,
    subtotalNet,
    taxTotal,
    grandTotal,
    totalCost,
    grossMarginAmount,
    grossMarginPercentage,
    marginHealth,
    requiresApproval,
    approvalReason,
  };
}
