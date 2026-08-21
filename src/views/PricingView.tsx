import { useState, useEffect } from 'react';
import {
  Tag,
  DollarSign,
  Percent,
  Sparkles,
  Save,
} from 'lucide-react';
import { AdminApi } from '../services/api';

export const PricingView = () => {
  const [pricingConfig, setPricingConfig] = useState({
    cricket_hourly_rate: 240,
    cricket_half_hourly_rate: 120,
    pickleball_hourly_rate: 1000,
    pickleball_half_hourly_rate: 500,
    padel_hourly_rate: 1500,
    padel_half_hourly_rate: 750,
    default_hourly_rate: 500,
    default_half_hourly_rate: 250,
    highlight_base_price: 149,
    shorts_base_price: 49,
    gst_rate: 0.18,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    AdminApi.getPricingConfig()
      .then((data) => {
        if (data && data.data) {
          setPricingConfig(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const [gatewayConvenienceFee, setGatewayConvenienceFee] = useState<number>(2);
  const [platformFeeInr, setPlatformFeeInr] = useState<number>(10);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdatePrice = (key: keyof typeof pricingConfig, value: number) => {
    setPricingConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    try {
      await AdminApi.updatePricingConfig(pricingConfig);
      showToast('✨ Pricing configuration saved successfully and synced to app!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to save pricing config');
    }
  };

  if (isLoading) return <div style={{ color: '#fff' }}>Loading pricing config...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={26} color="var(--primary-neon)" />
            Pricing & Monetization Configuration
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Configure sport-wise half-hourly unlock rates, highlights, and tax rules from the backend database.
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
          Save Changes
        </button>
      </div>

      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="var(--primary-neon)" />
              Pay-Per-Match & Content Pricing
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Sport-based half-hourly unlock rates (billed in 30-minute blocks) and media add-on base prices
            </p>
          </div>
          <span className="badge-neon green">Active In App</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { id: 'cricket_half_hourly_rate', name: 'Cricket Match (30 min)', desc: 'Unlock price per 30-minute block for Cricket' },
            { id: 'pickleball_half_hourly_rate', name: 'Pickleball Match (30 min)', desc: 'Unlock price per 30-minute block for Pickleball' },
            { id: 'padel_half_hourly_rate', name: 'Padel Match (30 min)', desc: 'Unlock price per 30-minute block for Padel' },
            { id: 'default_half_hourly_rate', name: 'Default Match (30 min)', desc: 'Unlock price per 30-minute block for unconfigured sports' },
            { id: 'cricket_hourly_rate', name: 'Cricket Match (Hourly ref)', desc: 'Reference hourly rate (not used for billing when half-hourly is set)' },
            { id: 'pickleball_hourly_rate', name: 'Pickleball Match (Hourly ref)', desc: 'Reference hourly rate' },
            { id: 'padel_hourly_rate', name: 'Padel Match (Hourly ref)', desc: 'Reference hourly rate' },
            { id: 'default_hourly_rate', name: 'Default Match (Hourly ref)', desc: 'Reference hourly rate' },
            { id: 'highlight_base_price', name: 'AI Highlight Reel', desc: 'Flat fee to unlock the AI Highlight Reel' },
            { id: 'shorts_base_price', name: 'Premium Short Clip', desc: 'Flat fee to export a premium manual clip' },
          ].map((cp) => (
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
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>{cp.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                  {cp.desc}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Base Price (INR)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary-neon)', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    value={pricingConfig[cp.id as keyof typeof pricingConfig]}
                    onChange={(e) => handleUpdatePrice(cp.id as keyof typeof pricingConfig, Number(e.target.value))}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Percent size={18} color="var(--accent-amber)" />
            Statutory Tax & Platform Fees
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>Goods & Services Tax (GST)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax rate applied to base price (e.g., 0.18 for 18%)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  step="0.01"
                  value={pricingConfig.gst_rate}
                  onChange={(e) => handleUpdatePrice('gst_rate', Number(e.target.value))}
                  style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', color: '#FFF', textAlign: 'right' }}
                />
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
      </div>
    </div>
  );
};
