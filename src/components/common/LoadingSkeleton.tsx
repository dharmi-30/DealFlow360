import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="table-container" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="skeleton-row"
                style={{
                  flex: cIdx === 0 ? 1.5 : 1,
                  height: '18px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
