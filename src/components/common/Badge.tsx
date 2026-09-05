import React from 'react';
import { QuotationStatus, ApprovalStatus, FulfillmentStatus, SubscriptionStatus, InvoiceStatus } from '../../types';

interface BadgeProps {
  status: QuotationStatus | ApprovalStatus | FulfillmentStatus | SubscriptionStatus | InvoiceStatus | string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  let badgeClass = 'badge-neutral';
  let displayLabel = label || status.replace(/_/g, ' ');

  switch (status) {
    case 'approved':
    case 'accepted':
    case 'active':
    case 'paid':
    case 'delivered':
      badgeClass = 'badge-success';
      break;

    case 'pending_approval':
    case 'pending':
    case 'customer_countered':
    case 'pending_renewal':
    case 'pending_pick':
    case 'packing':
    case 'partially_paid':
      badgeClass = 'badge-warning';
      break;

    case 'rejected':
    case 'canceled':
    case 'overdue':
    case 'on_hold':
      badgeClass = 'badge-danger';
      break;

    case 'dispatched':
    case 'in_transit':
    case 'sent_to_customer':
    case 'sent':
    case 'expansion_requested':
      badgeClass = 'badge-info';
      break;

    case 'draft':
    default:
      badgeClass = 'badge-neutral';
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      <span>{displayLabel}</span>
    </span>
  );
};
