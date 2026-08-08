import { Search, Bell, Radio, UserCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export const Header = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  showSearch = false,
}: HeaderProps) => {
  return (
    <header style={{
      height: 'var(--header-height)',
      position: 'sticky',
      top: 0,
      backgroundColor: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 40,
    }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF' }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {showSearch && onSearchChange && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Search athletes, phone, turf, tournament..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: 300,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px 8px 36px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border 0.2s ease',
              }}
            />
          </div>
        )}

        {/* Live Broadcast Indicator */}
        <div className="badge-neon green" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 6 }}>
          <Radio size={14} /> System Operational
        </div>

        {/* Notification Bell */}
        <button style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
        }}>
          <Bell size={18} />
        </button>

        {/* Admin Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-neon)',
            color: '#07090E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
          }}>
            <UserCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>Master Admin</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary-neon)' }}>Superuser</div>
          </div>
        </div>
      </div>
    </header>
  );
};
