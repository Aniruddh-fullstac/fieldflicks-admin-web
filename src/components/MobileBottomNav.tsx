import { BarChart3, Users, Trophy, Ticket, Video } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav = ({
  activeTab,
  setActiveTab,
}: MobileBottomNavProps) => {
  const tabs = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Athletes', icon: Users },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'fleet', label: 'Fleet', icon: Video },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mobile-nav-tab ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
