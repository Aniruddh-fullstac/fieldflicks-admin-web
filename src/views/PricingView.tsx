import { useState } from 'react';
import {
  Tag,
  CheckCircle2,
  DollarSign,
  Layers,
  Percent,
  Sparkles,
  Save,
  Zap,
} from 'lucide-react';

interface ContentPriceRule {
  id: string;
  name: string;
  category: 'MATCH_UNLOCK' | 'HIGHLIGHTS' | 'STREAMING' | 'REEL';
  basePriceInr: number;
  promoPriceInr?: number;
  description: string;
  isLive: boolean;
}

interface SubscriptionTier {
  id: string;
  title: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  priceInr: number;
  includedMatches: number;
  aiHighlightsPerMonth: number;
  is4kExportEnabled: boolean;
  priorityQueue: boolean;
  activeSubscribersCount: number;
}

export const PricingView = () => {
  const [contentPrices, setContentPrices] = useState<ContentPriceRule[]>([
    {
      id: 'cp-1',
      name: 'Full 60-Min Match Footage Unlock',
      category: 'MATCH_UNLOCK',
      basePriceInr: 299,
      promoPriceInr: 249,
      description: 'Raw high-definition NVR footage download with permanent cloud access',
      isLive: true,
    },
    {
      id: 'cp-2',
      name: 'AI Highlight Reel (Top 10 Moments)',
      category: 'HIGHLIGHTS',
      basePriceInr: 149,
      promoPriceInr: 99,
      description: 'Automated goal, smash, and skill detection with music & telemetry overlay',
      isLive: true,
    },
    {
      id: 'cp-3',
      name: 'Single Clip Custom Manual Trim',
      category: 'REEL',
      basePriceInr: 49,
      description: 'Up to 60-second custom trimmed video clip from match timeline',
      isLive: true,
    },
    {
      id: 'cp-4',
      name: 'Live Tournament Match Stream Pass',
      category: 'STREAMING',
      basePriceInr: 99,
      description: 'Spectator live viewing pass with low-latency chat and multi-angle camera view',
      isLive: true,
    },
  ]);

  const [subscriptions] = useState<SubscriptionTier[]>([
    {
      id: 'sub-1',
      title: 'Pro Athlete Monthly Pass',
      billingCycle: 'MONTHLY',
      priceInr: 999,
      includedMatches: 8,
      aiHighlightsPerMonth: 15,
      is4kExportEnabled: true,
      priorityQueue: true,
      activeSubscribersCount: 242,
    },
    {
      id: 'sub-2',
      title: 'Tournament League Quarterly',
      billingCycle: 'QUARTERLY',
      priceInr: 2499,
      includedMatches: 25,
      aiHighlightsPerMonth: 50,
      is4kExportEnabled: true,
      priorityQueue: true,
      activeSubscribersCount: 88,
    },
    {
      id: 'sub-3',
      title: 'Club Academy Annual VIP',
      billingCycle: 'ANNUAL',
      priceInr: 7999,
      includedMatches: 120,
      aiHighlightsPerMonth: 200,
      is4kExportEnabled: true,
      priorityQueue: true,
      activeSubscribersCount: 34,
    },
  ]);

  // Tax & Fee Controls
  const [gstRate, setGstRate] = useState<number>(18);
  const [gatewayConvenienceFee, setGatewayConvenienceFee] = useState<number>(2);
  const [platformFeeInr, setPlatformFeeInr] = useState<number>(10);
  const [weekendSurgeActive, setWeekendSurgeActive] = useState<boolean>(true);
  const [weekendSurgePercent, setWeekendSurgePercent] = useState<number>(15);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setContentPrices((prev) =>
      prev.map((cp) => (cp.id === id ? { ...cp, basePriceInr: newPrice } : cp))
    );
  };

  const handleToggleRule = (id: string) => {
    setContentPrices((prev) =>
      prev.map((cp) => (cp.id === id ? { ...cp, isLive: !cp.isLive } : cp))
    );
  };

  const handleSaveAll = () => {
    showToast('✨ Pricing matrix, subscription tiers, and tax rules saved and published to mobile app!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid var(--primary-neon)',
            boxShadow: '0 8px 32px rgba(0, 230, 118, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <Sparkles size={18} color="var(--primary-neon)" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={26} color="var(--primary-neon)" />
            Pricing, Packages & Monetization Matrix
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Configure base content prices, athlete subscription memberships, taxes, and dynamic surge rules
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          <Save size={18} />
          Publish Price Changes
        </button>
      </div>

      {/* Section 1: Base Content Pricing Matrix */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="var(--primary-neon)" />
              Pay-Per-Match & Highlight Pricing
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Standard retail pricing charged to non-subscribed athletes upon video unlock
            </p>
          </div>
          <span className="badge-neon green">Active In App Store</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {contentPrices.map((cp) => (
            <div
              key={cp.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 229, 255, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {cp.category}
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={cp.isLive}
                      onChange={() => handleToggleRule(cp.id)}
                    />
                    Live
                  </label>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginTop: 10 }}>{cp.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                  {cp.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Base Price (INR)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary-neon)', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    value={cp.basePriceInr}
                    onChange={(e) => handleUpdatePrice(cp.id, Number(e.target.value))}
                    style={{
                      width: 80,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: '#FFF',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      textAlign: 'right',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Subscription Membership Tiers */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} color="var(--accent-purple)" />
              Athlete Subscription Membership Tiers
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Recurring recurring plans granting monthly match quotas and priority NVR extraction
            </p>
          </div>
          <span className="badge-neon purple">{subscriptions.reduce((a, s) => a + s.activeSubscribersCount, 0)} Total Active Subscribers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.04) 0%, rgba(18, 24, 34, 0.7) 100%)',
                border: '1px solid rgba(179, 136, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                    {sub.billingCycle} PLAN
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    {sub.activeSubscribersCount} athletes enrolled
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', marginTop: 8 }}>{sub.title}</h4>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-neon)', marginTop: 4 }}>
                  ₹{sub.priceInr}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {sub.billingCycle.toLowerCase()}</span>
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF' }}>
                    <CheckCircle2 size={14} color="var(--primary-neon)" />
                    <span><strong>{sub.includedMatches}</strong> Full Match Recordings / month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF' }}>
                    <CheckCircle2 size={14} color="var(--primary-neon)" />
                    <span><strong>{sub.aiHighlightsPerMonth}</strong> AI Highlight Clips / month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF' }}>
                    <CheckCircle2 size={14} color="var(--primary-neon)" />
                    <span>4K Ultra-HD Raw Download Support</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF' }}>
                    <CheckCircle2 size={14} color="var(--primary-neon)" />
                    <span>VIP Priority NVR Render Queue</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Taxes, Gateway & Dynamic Surge Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Taxes & Surcharges */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Percent size={18} color="var(--accent-amber)" />
            Statutory Tax & Platform Fees
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>Goods & Services Tax (GST)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Indian digital services tax rate</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', color: '#FFF', textAlign: 'right' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>Gateway Convenience Fee</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Razorpay online payment processing charge</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={gatewayConvenienceFee}
                  onChange={(e) => setGatewayConvenienceFee(Number(e.target.value))}
                  style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', color: '#FFF', textAlign: 'right' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>Fixed Technology Platform Surcharge</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per-transaction cloud storage fee</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹</span>
                <input
                  type="number"
                  value={platformFeeInr}
                  onChange={(e) => setPlatformFeeInr(Number(e.target.value))}
                  style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', color: '#FFF', textAlign: 'right' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Weekend Surge Rules */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="var(--accent-cyan)" />
              Dynamic Peak & Weekend Surge
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#FFF', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={weekendSurgeActive}
                onChange={() => setWeekendSurgeActive(!weekendSurgeActive)}
              />
              Enable Surge
            </label>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Automatically apply weekend & prime-time match extraction demand pricing (Saturday - Sunday 6 PM - 11 PM).
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>Prime Time Surge Percentage</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--primary-neon)', fontWeight: 700 }}>+</span>
              <input
                type="number"
                value={weekendSurgePercent}
                onChange={(e) => setWeekendSurgePercent(Number(e.target.value))}
                style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', color: '#FFF', textAlign: 'right' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
