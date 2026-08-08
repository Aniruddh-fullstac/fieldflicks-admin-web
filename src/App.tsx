import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { UsersCrmView } from './views/UsersCrmView';
import { TournamentsView } from './views/TournamentsView';
import { CouponsView } from './views/CouponsView';
import { LiveFleetView } from './views/LiveFleetView';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

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
          title: 'Analytics & System Overview',
          subtitle: 'Live platform revenue, athlete engagement, and recording health',
        };
      case 'users':
        return {
          title: 'Athlete CRM & Utility Tracking',
          subtitle: 'Detailed athlete profiles, recorded match history, and free passes',
        };
      case 'tournaments':
        return {
          title: 'Tournaments & Organizer Hub',
          subtitle: 'Approve incoming requests, manage brackets, prize pools, and live games',
        };
      case 'coupons':
        return {
          title: 'Discount Codes & Promo Passes',
          subtitle: 'Configure discount codes, VIP passes, and complimentary games',
        };
      case 'fleet':
        return {
          title: 'Fleet & Live Court Matrix',
          subtitle: 'Edge NVR cameras, RTSP streams, and on-demand Mux broadcast control',
        };
      default:
        return { title: 'Admin Console' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sleek Dark & Neon Green Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={title}
          subtitle={subtitle}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={activeTab === 'users'}
        />

        <main style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;
