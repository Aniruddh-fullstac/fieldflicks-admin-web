import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OverviewView } from './views/OverviewView';
import { UsersCrmView } from './views/UsersCrmView';
import { TournamentsView } from './views/TournamentsView';
import { CouponsView } from './views/CouponsView';
import { LiveFleetView } from './views/LiveFleetView';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'users':
        return <UsersCrmView />;
      case 'tournaments':
        return <TournamentsView />;
      case 'coupons':
        return <CouponsView />;
      case 'fleet':
        return <LiveFleetView />;
      default:
        return <OverviewView />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Analytics & Trends',
          subtitle: 'Live platform revenue, athlete engagement, and recording health',
        };
      case 'users':
        return {
          title: 'Athlete CRM & Utility',
          subtitle: 'Detailed athlete profiles, recorded match history, and free passes',
        };
      case 'tournaments':
        return {
          title: 'Tournaments Hub',
          subtitle: 'Approve incoming requests, manage brackets, prize pools, and live games',
        };
      case 'coupons':
        return {
          title: 'Coupons & Free Passes',
          subtitle: 'Configure discount codes, VIP passes, and complimentary games',
        };
      case 'fleet':
        return {
          title: 'Fleet & Live Courts',
          subtitle: 'Edge NVR cameras, RTSP streams, and on-demand Mux broadcast control',
        };
      default:
        return { title: 'Admin Console' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <div className="app-layout">
      {/* Sleek Dark & Neon Green Navigation Sidebar with mobile drawer support */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          title={title}
          subtitle={subtitle}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={activeTab === 'users'}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          {renderActiveView()}
        </main>

        {/* Quick Thumb Bottom Navigation for Mobile Devices */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default App;
