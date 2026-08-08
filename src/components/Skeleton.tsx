import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
};

export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card" style={{ padding: 20, minHeight: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Skeleton width="40%" height={14} />
            <Skeleton width={32} height={32} borderRadius="50%" />
          </div>
          <Skeleton width="70%" height={28} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={12} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: number; title?: string }> = ({
  height = 320,
  title,
}) => {
  return (
    <div className="skeleton-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={title ? 180 : 140} height={20} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={60} height={28} borderRadius={6} />
          <Skeleton width={60} height={28} borderRadius={6} />
        </div>
      </div>
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          paddingTop: 40,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {Array.from({ length: 12 }).map((_, idx) => {
          const randomH = 30 + ((idx * 17 + 45) % 65);
          return (
            <Skeleton
              key={idx}
              width="100%"
              height={`${randomH}%`}
              borderRadius="6px 6px 0 0"
              style={{ opacity: 0.7 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 8,
  cols = 6,
}) => {
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          gap: 16,
        }}
      >
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} width="70%" height={14} />
        ))}
      </div>

      {/* Table Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div key={colIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {colIdx === 0 && <Skeleton width={32} height={32} borderRadius="50%" />}
                <Skeleton
                  width={colIdx === 0 ? '60%' : colIdx === cols - 1 ? '40%' : '80%'}
                  height={16}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card" style={{ padding: 24, minHeight: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width="50%" height={20} />
            <Skeleton width={70} height={22} borderRadius={999} />
          </div>
          <Skeleton width="80%" height={14} style={{ marginBottom: 12 }} />
          <Skeleton width="60%" height={14} style={{ marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
            <Skeleton width="100%" height={36} borderRadius={8} />
            <Skeleton width="100%" height={36} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonUserProfile: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Skeleton width={64} height={64} borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={22} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Skeleton height={60} borderRadius={8} />
        <Skeleton height={60} borderRadius={8} />
        <Skeleton height={60} borderRadius={8} />
      </div>
      <Skeleton height={140} borderRadius={12} />
    </div>
  );
};
