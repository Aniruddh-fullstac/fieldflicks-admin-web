import {
  BarChart3,
  Users,
  Trophy,
  Ticket,
  Video,
  Radio,
  Film,
  Zap,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeStreamsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
  activeStreamsCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'users', label: 'Athlete CRM & Utility', icon: Users },
    { id: 'tournaments', label: 'Tournaments Hub', icon: Trophy },
    { id: 'coupons', label: 'Coupons & Free Games', icon: Ticket },
    { id: 'fleet', label: 'Fleet & Live Courts', icon: Video, badge: activeStreamsCount > 0 ? `${activeStreamsCount} Live` : undefined },
    { id: 'recordings', label: 'Match Recordings', icon: Film },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`sidebar-drawer ${isOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          backgroundColor: '#0A0E17',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 95,
          padding: '24px 16px',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 230, 118, 0.4)',
            }}>
              <Zap size={22} color="#05070A" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                Field<span style={{ color: 'var(--primary-neon)' }}>Flicks</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span className="live-pulse" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="mobile-hamburger-btn"
              style={{ padding: 6, display: 'flex' }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 6px' }}>
            Management
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'linear-gradient(90deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 230, 118, 0.03) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-neon)' : '3px solid transparent',
                  color: isActive ? 'var(--primary-neon)' : 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={18} color={isActive ? 'var(--primary-neon)' : '#94A3B8'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="badge-neon green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    <Radio size={10} /> {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div style={{
          padding: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={16} color="var(--primary-neon)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>Backend Connected</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Status: <code style={{ color: 'var(--primary-neon)' }}>Live & Operational</code>
          </div>
        </div>
      </aside>
    </>
  );
};
