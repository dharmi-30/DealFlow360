import React from 'react';
import { Inbox, FilterX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  isFilter?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching your current filters or query.',
  actionText,
  onAction,
  isFilter = false,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {isFilter ? <FilterX size={36} /> : <Inbox size={36} />}
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-sub">{description}</p>
      {actionText && onAction && (
        <button className="btn btn-secondary btn-sm" onClick={onAction} style={{ marginTop: '16px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
