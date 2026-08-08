import { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Gift,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';
import type { CouponItem } from '../types';

export const CouponsView = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Form State for creating coupon
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    label: '',
    discountPercent: 50,
    maxRecordings: 1,
  });

  // Form State for granting free pass
  const [grantData, setGrantData] = useState({
    phoneOrUserId: '',
    couponCode: 'VIPFREE100',
    note: 'Admin Complimentary Free Match Pass',
  });
  const [grantMessage, setGrantMessage] = useState<string | null>(null);

  const fetchCoupons = () => {
    setLoading(true);
    setError(null);
    AdminApi.listCoupons()
      .then((res) => {
        setCoupons(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to list coupons:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Could not load coupons from backend database.'
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await AdminApi.createCoupon(newCoupon);
      setCoupons([created, ...coupons]);
      setShowCreateModal(false);
      setNewCoupon({ code: '', label: '', discountPercent: 50, maxRecordings: 1 });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create coupon code');
    }
  };

  const handleGrantFreePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminApi.assignFreeGame(grantData.phoneOrUserId, grantData.couponCode, grantData.note);
      setGrantMessage(`Granted ${grantData.couponCode} free pass successfully!`);
      setTimeout(() => {
        setGrantMessage(null);
        setShowGrantModal(false);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign coupon to user');
    }
  };

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
            Discount Codes & Free Game Passes
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Manage pricing promotions, referral perks, and VIP athlete passes
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={fetchCoupons} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowGrantModal(true)}
            className="btn-secondary"
            style={{ padding: '10px 16px', color: 'var(--primary-neon)', borderColor: 'rgba(0, 230, 118, 0.3)' }}
          >
            <Gift size={16} />
            Issue Free Game Pass
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ padding: '10px 18px' }}
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 16,
          backgroundColor: 'rgba(255, 61, 87, 0.1)',
          border: '1px solid var(--accent-crimson)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-crimson)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.85rem',
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <SkeletonCardList count={3} />
      ) : coupons.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 600 }}>No coupons created yet.</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Click "Create Coupon" to create your first discount promotion.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {coupons.map((c) => (
            <div key={c.id} className="glass-card" style={{ padding: 24, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: c.discountPercent === 100 ? 'var(--primary-neon)' : '#00E5FF',
                      letterSpacing: '0.04em',
                    }}>
                      {c.code}
                    </code>
                    <span className={`badge-neon ${c.discountPercent === 100 ? 'green' : 'cyan'}`}>
                      {c.discountPercent === 100 ? '100% FREE' : `${c.discountPercent}% OFF`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                    {c.label}
                  </div>
                </div>

                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ticket size={18} color="var(--primary-neon)" />
                </div>
              </div>

              <div style={{
                marginTop: 20,
                padding: '12px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
              }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Redemptions Allowed</div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{c.maxRecordings} match / user</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Claimed So Far</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-neon)', marginTop: 2 }}>
                    {c.totalRedemptions || 0} redeemed
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: 24,
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: '#0C1017',
            padding: 32,
            position: 'relative',
            border: '1px solid rgba(0, 230, 118, 0.3)',
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 20 }}>
              Create Discount Code
            </h3>

            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON50"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    marginTop: 6,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon 50% Off Match Video"
                  value={newCoupon.label}
                  onChange={(e) => setNewCoupon({ ...newCoupon, label: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    marginTop: 6,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Discount % (1–100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newCoupon.discountPercent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      color: '#FFFFFF',
                      marginTop: 6,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Max Match Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.maxRecordings}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxRecordings: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      color: '#FFFFFF',
                      marginTop: 6,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Free Pass Modal */}
      {showGrantModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: 24,
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: '#0C1017',
            padding: 32,
            position: 'relative',
            border: '1px solid rgba(0, 230, 118, 0.3)',
          }}>
            <button
              onClick={() => setShowGrantModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
              Issue 100% Free Game Pass
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Directly credit a free match video unlock to an athlete’s account
            </p>

            {grantMessage && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid var(--primary-neon)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--primary-neon)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
              }}>
                <CheckCircle2 size={16} />
                {grantMessage}
              </div>
            )}

            <form onSubmit={handleGrantFreePass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Athlete Phone Number or User ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9820112233"
                  value={grantData.phoneOrUserId}
                  onChange={(e) => setGrantData({ ...grantData, phoneOrUserId: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    marginTop: 6,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Pass Code to Assign
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIPFREE100"
                  value={grantData.couponCode}
                  onChange={(e) => setGrantData({ ...grantData, couponCode: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    marginTop: 6,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Admin Note
                </label>
                <input
                  type="text"
                  value={grantData.note}
                  onChange={(e) => setGrantData({ ...grantData, note: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#FFFFFF',
                    marginTop: 6,
                  }}
                />
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowGrantModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Grant Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
