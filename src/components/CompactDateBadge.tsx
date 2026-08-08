import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface CompactDateBadgeProps {
  date: string | number | Date | null | undefined;
  showTime?: boolean;
  tilt?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function formatCompactDateTime(
  dateInput: string | number | Date | null | undefined
): { dateStr: string; timeStr: string; fullStr: string } {
  if (!dateInput) {
    return { dateStr: '—', timeStr: '', fullStr: 'No date available' };
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return { dateStr: 'Invalid date', timeStr: '', fullStr: 'Invalid date' };
  }

  // Format: "08 Aug '26"
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  const dateStr = `${day} ${month} '${year}`;

  // Format 12-hour: "04:21 PM" (NO SECONDS)
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = hours.toString().padStart(2, '0');
  const timeStr = `${formattedHours}:${minutes} ${ampm}`;

  const fullStr = `${d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} at ${timeStr}`;

  return { dateStr, timeStr, fullStr };
}

export const CompactDateBadge: React.FC<CompactDateBadgeProps> = ({
  date,
  showTime = true,
  tilt = false,
  className = '',
  style = {},
}) => {
  const { dateStr, timeStr, fullStr } = formatCompactDateTime(date);

  if (dateStr === '—') {
    return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>;
  }

  return (
    <div
      className={`compact-date-badge ${tilt ? 'tilt' : ''} ${className}`}
      title={fullStr}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '3px 8px',
        borderRadius: 6,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={11} color="var(--primary-neon)" style={{ opacity: 0.8 }} />
        <span className="date-part" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#F1F5F9' }}>
          {dateStr}
        </span>
      </div>
      {showTime && timeStr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <Clock size={10} color="var(--text-dim)" />
          <span className="time-part" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {timeStr}
          </span>
        </div>
      )}
    </div>
  );
};
