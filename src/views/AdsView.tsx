import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  Eye,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface AdCampaign {
  id: string;
  sponsorName: string;
  campaignTitle: string;
  placement: 'HOME_BANNER' | 'PRE_ROLL_VIDEO' | 'TOURNAMENT_SPONSOR' | 'FEATURED_TURF';
  creativeUrl: string;
  clickUrl: string;
  targetSport: string;
  targetCity: string;
  budgetInr: number;
  impressions: number;
  clicks: number;
  status: 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'ENDED';
  startDate: string;
  endDate: string;
}

export const AdsView = () => {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [placement, setPlacement] = useState<'HOME_BANNER' | 'PRE_ROLL_VIDEO' | 'TOURNAMENT_SPONSOR' | 'FEATURED_TURF'>('HOME_BANNER');
  const [clickUrl, setClickUrl] = useState('https://');
  const [targetSport, setTargetSport] = useState('Football');
  const [targetCity, setTargetCity] = useState('All Metros');
  const [budgetInr, setBudgetInr] = useState(25000);
  const [startDate, setStartDate] = useState('2026-08-10');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleStatus = (id: string) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? { ...ad, status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : ad
      )
    );
    showToast('⚡️ Campaign status toggled successfully.');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this sponsor campaign?')) {
      setAds((prev) => prev.filter((a) => a.id !== id));
      showToast('🗑️ Campaign removed.');
    }
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAd: AdCampaign = {
      id: `ad-${Date.now().toString().slice(-4)}`,
      sponsorName,
      campaignTitle,
      placement,
      creativeUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&auto=format&fit=crop&q=60',
      clickUrl,
      targetSport,
      targetCity,
      budgetInr,
      impressions: 0,
      clicks: 0,
      status: 'ACTIVE',
      startDate,
      endDate,
    };

    setAds([newAd, ...ads]);
    setIsCreateModalOpen(false);
    setSponsorName('');
    setCampaignTitle('');
    showToast(`🚀 New sponsor campaign "${sponsorName}" published to app inventory!`);
  };

  const totalImpressions = ads.reduce((a, b) => a + b.impressions, 0);
  const totalClicks = ads.reduce((a, b) => a + b.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const totalAdRevenue = ads.reduce((a, b) => a + b.budgetInr, 0);

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
            <Megaphone size={26} color="var(--primary-neon)" />
            Advertisement & Sponsorship Campaigns
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Manage in-app banner inventory, pre-roll video commercials, tournament brand takeovers, and CTR analytics
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <Plus size={18} />
          Create Sponsor Campaign
        </button>
      </div>

      {/* Ad Inventory KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--primary-neon)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Ad Revenue (INR)</span>
            <DollarSign size={18} color="var(--primary-neon)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            ₹{totalAdRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', marginTop: 4 }}>
            Direct brand sponsorships
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Ad Impressions</span>
            <Eye size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            {totalImpressions.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: 4 }}>
            Across App & Web Viewers
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Clicks Captured</span>
            <MousePointerClick size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            {totalClicks.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Direct outbound leads
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Average CTR</span>
            <TrendingUp size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            {avgCtr}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginTop: 4 }}>
            High athlete engagement
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Sponsor & Campaign</th>
                <th style={{ padding: '14px 20px' }}>Placement Slot</th>
                <th style={{ padding: '14px 20px' }}>Targeting</th>
                <th style={{ padding: '14px 20px' }}>Schedule</th>
                <th style={{ padding: '14px 20px' }}>Impressions & CTR</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={ad.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={ad.creativeUrl}
                          alt={ad.sponsorName}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#FFF' }}>{ad.sponsorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ad.campaignTitle}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                        {ad.placement}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ color: '#FFF', fontWeight: 600 }}>{ad.targetSport}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ad.targetCity}</div>
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>{ad.startDate}</div>
                      <div>to {ad.endDate}</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{ad.impressions.toLocaleString()} views</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-neon)' }}>
                        {ad.clicks.toLocaleString()} clicks ({ctr}% CTR)
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {ad.status === 'ACTIVE' ? (
                        <span className="badge-neon green">
                          <CheckCircle2 size={12} /> ACTIVE
                        </span>
                      ) : (
                        <span className="badge-neon amber">
                          <Pause size={12} /> PAUSED
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          onClick={() => handleToggleStatus(ad.id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 6,
                            padding: '6px 10px',
                            color: '#FFF',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.75rem',
                          }}
                        >
                          {ad.status === 'ACTIVE' ? <Pause size={13} /> : <Play size={13} />}
                          {ad.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                        </button>

                        <button
                          onClick={() => handleDelete(ad.id)}
                          style={{
                            background: 'rgba(255, 61, 87, 0.1)',
                            border: '1px solid rgba(255, 61, 87, 0.3)',
                            borderRadius: 6,
                            padding: '6px 8px',
                            color: 'var(--accent-crimson)',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ads.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Megaphone size={40} style={{ margin: '0 auto 14px', opacity: 0.4, display: 'block', color: 'var(--accent-purple)' }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>No Ad Campaigns Configured</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      Create sponsor banners, pre-roll video ads, or tournament brand placements using the "Create New Campaign" button above.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ad Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={22} color="var(--primary-neon)" />
              Create Sponsor Campaign
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Launch in-app banner placements or video sponsorships targeting athletes.
            </p>

            <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Sponsor Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Puma Sports India"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Campaign Title / Tagline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Future Ultimate Football Boots Launch"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Placement Slot
                  </label>
                  <select
                    value={placement}
                    onChange={(e: any) => setPlacement(e.target.value)}
                    style={{ width: '100%', background: 'rgba(15, 20, 29, 0.95)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  >
                    <option value="HOME_BANNER">Home Screen Top Banner</option>
                    <option value="PRE_ROLL_VIDEO">15s Pre-Roll Video Ad</option>
                    <option value="TOURNAMENT_SPONSOR">Tournament Header Sponsor</option>
                    <option value="FEATURED_TURF">Featured Turf Spot</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Budget (INR)
                  </label>
                  <input
                    type="number"
                    value={budgetInr}
                    onChange={(e) => setBudgetInr(Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Target Sport
                  </label>
                  <select
                    value={targetSport}
                    onChange={(e) => setTargetSport(e.target.value)}
                    style={{ width: '100%', background: 'rgba(15, 20, 29, 0.95)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  >
                    <option value="Football">Football</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Pickleball">Pickleball</option>
                    <option value="All Sports">All Sports</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Target City
                  </label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Outbound Destination Click URL
                </label>
                <input
                  type="text"
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: '#FFF', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
