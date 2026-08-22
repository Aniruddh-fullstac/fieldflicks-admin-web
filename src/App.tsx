import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';

// Views
import { OverviewView } from './views/OverviewView';
import { UsersCrmView } from './views/UsersCrmView';
import { TournamentsView } from './views/TournamentsView';
import { CouponsView } from './views/CouponsView';
import { LiveFleetView } from './views/LiveFleetView';
import { WatchStreamView } from './views/WatchStreamView';
import { RecordingsVaultView } from './views/RecordingsVaultView';
import { ExtractionPipelineView } from './views/ExtractionPipelineView';
import { FlickShortsView } from './views/FlickShortsView';
import { PaymentsView } from './views/PaymentsView';
import { PricingView } from './views/PricingView';
import { NotificationsView } from './views/NotificationsView';
import { GamificationView } from './views/GamificationView';
import { LeaderboardView } from './views/LeaderboardView';
import { AdsView } from './views/AdsView';
import { ReportsView } from './views/ReportsView';
import { CmsView } from './views/CmsView';
import { SettingsView } from './views/SettingsView';

import { LoginView } from './views/LoginView';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('fieldflix_admin_token');
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('fieldflix_admin_tab') || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('fieldflix_admin_tab', activeTab);
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [watchStreamId, setWatchStreamId] = useState<string | null>(null);
  const [watchStreamTitle, setWatchStreamTitle] = useState<string>('');
  const [publicStreamId, setPublicStreamId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stream = params.get('stream');
    const title = params.get('title');
    const publicStream = params.get('public_stream');
    
    if (publicStream) {
      setPublicStreamId(publicStream);
    } else if (stream) {
      setWatchStreamId(stream);
      if (title) setWatchStreamTitle(title);
    }
  }, []);

  if (publicStreamId) {
    return (
      <WatchStreamView
        playbackId={publicStreamId}
        streamTitle="FieldFlicks Live Broadcast"
        onBack={() => {
          // Send public users to the main marketing site when they exit
          window.location.href = 'https://fieldflicks.in';
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (watchStreamId) {
    return (
      <WatchStreamView
        playbackId={watchStreamId}
        streamTitle={watchStreamTitle || 'FieldFlicks Court Live Stream'}
        onBack={() => {
          setWatchStreamId(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'fleet':
        return <LiveFleetView />;
      case 'recordings':
        return <RecordingsVaultView />;
      case 'pipeline':
        return <ExtractionPipelineView />;
      case 'flickshorts':
        return <FlickShortsView />;
      case 'users':
        return <UsersCrmView />;
      case 'gamification':
        return <GamificationView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'notifications':
        return <NotificationsView />;
      case 'tournaments':
        return <TournamentsView />;
      case 'coupons':
        return <CouponsView />;
      case 'payments':
        return <PaymentsView />;
      case 'pricing':
        return <PricingView />;
      case 'ads':
        return <AdsView />;
      case 'reports':
        return <ReportsView />;
      case 'cms':
        return <CmsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Analytics & Platform KPIs',
          subtitle: 'Live platform revenue, athlete engagement, and camera fleet health',
        };
      case 'fleet':
        return {
          title: 'Fleet & NVR Cameras',
          subtitle: 'Edge NVR cameras, RTSP streams, and on-demand Mux broadcast control',
        };
      case 'recordings':
        return {
          title: 'Match Recordings Vault & AI Highlights',
          subtitle: '7-stage extraction pipeline, AI moments verification, and 4K raw downloads',
        };
      case 'pipeline':
        return {
          title: 'Extraction Pipeline Monitor',
          subtitle: 'Date-wise match requests, live DB status, highlights in window, S3 vs Mux',
        };
      case 'flickshorts':
        return {
          title: 'FlickShorts Moderation Desk',
          subtitle: 'Approve, reject, or feature 9:16 vertical athlete viral reels & clips',
        };
      case 'users':
        return {
          title: 'Athlete CRM & Utility',
          subtitle: 'Detailed athlete profiles, recorded match history, and free passes',
        };
      case 'gamification':
        return {
          title: 'Gamification & XP Points Engine',
          subtitle: 'Configure XP point rules, milestone levels, perks, and manual adjustments',
        };
      case 'leaderboard':
        return {
          title: 'Multi-Sport Leaderboards',
          subtitle: 'Athletes ranking engine, weekly/monthly cycle resets, and podium coupon awards',
        };
      case 'notifications':
        return {
          title: 'Broadcast Notifications & Campaigns',
          subtitle: 'Targeted Push (FCM), SMS (MSG91), and in-app banner announcements',
        };
      case 'tournaments':
        return {
          title: 'Tournaments Hub',
          subtitle: 'Approve incoming requests, manage brackets, prize pools, and live games',
        };
      case 'coupons':
        return {
          title: 'Coupons & Free Game Grants',
          subtitle: 'Configure discount codes, VIP passes, and complimentary games',
        };
      case 'payments':
        return {
          title: 'Payments, Settlements & Refunds',
          subtitle: 'Razorpay gross transaction ledger, refund desk, and GST invoice previews',
        };
      case 'pricing':
        return {
          title: 'Pricing & Monetization Matrix',
          subtitle: 'Base match unlocks, subscription tiers, GST rates, and dynamic prime-time surge',
        };
      case 'ads':
        return {
          title: 'Ads & Brand Sponsorships',
          subtitle: 'In-app hero banners, 15s pre-roll video commercials, and CTR performance',
        };
      case 'reports':
        return {
          title: 'Reports Center & BI Exports',
          subtitle: 'One-click CSV exports for revenue reconciliation, cohort retention, and NVR SLA',
        };
      case 'cms':
        return {
          title: 'CMS & Legal Policies',
          subtitle: 'Live editor for Terms of Service, Privacy Policies, FAQs, and Release Notes',
        };
      case 'settings':
        return {
          title: 'Security, RBAC & Audit Trails',
          subtitle: '8 Admin role definitions, permissions matrix, and audit trail activity logs',
        };
      default:
        return { title: 'Enterprise Admin Console' };
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

        <main style={{ flex: 1, backgroundColor: 'var(--bg-main)', padding: '24px 32px 48px' }}>
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
