import { Search, Bell, Radio, UserCheck, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
  onToggleMobileSidebar?: () => void;
}

export const Header = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  showSearch = false,
  onToggleMobileSidebar,
}: HeaderProps) => {
  return (
    <header
      className="header-container"
      style={{
        minHeight: 'var(--header-height)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(7, 9, 14, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        zIndex: 40,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="mobile-hamburger-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{title}</h2>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {showSearch && onSearchChange && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minWidth: 200,
            maxWidth: '100%',
          }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Search athletes, phone, turf..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 12px 7px 36px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                outline: 'none',
                transition: 'border 0.2s ease',
              }}
            />
          </div>
        )}

        {/* Live Broadcast Indicator */}
        <div className="badge-neon green" style={{ padding: '6px 10px', fontSize: '0.7rem', gap: 6, whiteSpace: 'nowrap' }}>
          <Radio size={12} /> System Online
        </div>

        {/* Notification Bell */}
        <button style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          <Bell size={16} />
        </button>

        {/* Admin Profile */}
        <div className="header-actions-group" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-neon)',
            color: '#07090E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}>
            <UserCheck size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>Master Admin</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary-neon)' }}>Superuser</div>
          </div>
        </div>
      </div>
    </header>
  );
};
