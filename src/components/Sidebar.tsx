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
  Sparkles,
  CreditCard,
  Tag,
  Bell,
  Award,
  Megaphone,
  FileSpreadsheet,
  FileText,
  Shield,
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
  const navSections = [
    {
      title: 'Core Operations',
      items: [
        { id: 'overview', label: 'Analytics & KPIs', icon: BarChart3 },
        { id: 'fleet', label: 'Fleet & NVR Cameras', icon: Video, badge: activeStreamsCount > 0 ? `${activeStreamsCount} Live` : undefined },
        { id: 'recordings', label: 'Match Vault & AI', icon: Film },
        { id: 'pipeline', label: 'Extraction Pipeline', icon: ShieldCheck },
        { id: 'flickshorts', label: 'FlickShorts Moderation', icon: Sparkles, badge: 'Queue' },
      ],
    },
    {
      title: 'Athletes & Engagement',
      items: [
        { id: 'users', label: 'Athlete CRM & Passes', icon: Users },
        { id: 'gamification', label: 'Gamification & XP', icon: Award },
        { id: 'leaderboard', label: 'Multi-Sport Rankings', icon: Trophy },
        { id: 'notifications', label: 'Broadcast Campaigns', icon: Bell },
      ],
    },
    {
      title: 'Tournaments & Commerce',
      items: [
        { id: 'tournaments', label: 'Tournaments Hub', icon: Trophy },
        { id: 'coupons', label: 'Coupons & Free Games', icon: Ticket },
        { id: 'payments', label: 'Payments & Refunds', icon: CreditCard },
        { id: 'pricing', label: 'Pricing & Monetization', icon: Tag },
        { id: 'ads', label: 'Ads & Brand Sponsors', icon: Megaphone },
      ],
    },
    {
      title: 'Platform Administration',
      items: [
        { id: 'reports', label: 'Reports & BI Exports', icon: FileSpreadsheet },
        { id: 'cms', label: 'CMS & Legal Policies', icon: FileText },
        { id: 'settings', label: 'Security, RBAC & Audit', icon: Shield },
      ],
    },
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
          padding: '20px 14px',
          overflowY: 'auto',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 230, 118, 0.4)',
              }}
            >
              <Zap size={20} color="#05070A" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                Field<span style={{ color: 'var(--primary-neon)' }}>Flicks</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span className="live-pulse" />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Enterprise Admin
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

        {/* Navigation Sections */}
        <nav style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, paddingBottom: 16 }}>
          {navSections.map((section) => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                }}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
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
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 230, 118, 0.02) 100%)'
                        : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-neon)' : '3px solid transparent',
                      color: isActive ? 'var(--primary-neon)' : 'var(--text-muted)',
                      fontSize: '0.825rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} color={isActive ? 'var(--primary-neon)' : '#94A3B8'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="badge-neon green"
                        style={{
                          fontSize: '0.62rem',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        {item.badge === 'Queue' ? 'Mod' : <><Radio size={8} /> {item.badge}</>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / System Status */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <ShieldCheck size={15} color="var(--primary-neon)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF' }}>Core Engine Online</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Dahua NVR + Mux + S3 • <code style={{ color: 'var(--primary-neon)' }}>v2.4.0</code>
          </div>
        </div>
      </aside>
    </>
  );
};
