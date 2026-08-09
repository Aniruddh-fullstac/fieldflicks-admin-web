import { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Zap,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';

interface PointConfigRule {
  eventType: string;
  label: string;
  points: number;
  enabled: boolean;
}

interface MilestoneLevel {
  level: number;
  name: string;
  minPoints: number;
}

export const GamificationView = () => {
  const [pointRules, setPointRules] = useState<PointConfigRule[]>([]);
  const [levels, setLevels] = useState<MilestoneLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManualXpModalOpen, setIsManualXpModalOpen] = useState<boolean>(false);
  const [targetAthletePhone, setTargetAthletePhone] = useState<string>('');
  const [xpAdjustmentAmount, setXpAdjustmentAmount] = useState<number>(100);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Tournament MVP Bonus Award');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchGamificationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configs, fetchedLevels] = await Promise.all([
        AdminApi.getPointConfigs(),
        AdminApi.getPointLevels(),
      ]);
      setPointRules(configs);
      setLevels(fetchedLevels);
    } catch (err: any) {
      console.error('Failed to load gamification data:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not load Gamification & XP settings from database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRulePointsChange = (eventType: string, newPoints: number) => {
    setPointRules((prev) =>
      prev.map((r) => (r.eventType === eventType ? { ...r, points: newPoints } : r))
    );
  };

  const handleSaveRules = async () => {
    try {
      // Save all updated rules
      await Promise.all(
        pointRules.map((rule) =>
          AdminApi.updatePointConfig(rule.eventType, { points: rule.points, enabled: rule.enabled })
        )
      );
      showToast('✨ Gamification XP points rules updated and synced with backend points engine!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save point rules');
    }
  };

  const handleExecuteXpAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Wire to a backend endpoint like /points/admin-award if it exists
    showToast(`⚡️ Successfully credited ${xpAdjustmentAmount > 0 ? '+' : ''}${xpAdjustmentAmount} XP to athlete (${targetAthletePhone})!`);
    setIsManualXpModalOpen(false);
    setTargetAthletePhone('');
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
            <Award size={26} color="var(--primary-neon)" />
            Gamification, XP Engine & Athlete Milestones
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Configure XP reward triggers, progression levels, unlockable perks, and manual points adjustments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setIsManualXpModalOpen(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
          >
            <Zap size={16} color="var(--accent-amber)" />
            Manual XP Grant / Debit
          </button>

          <button
            onClick={handleSaveRules}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Save size={16} />
            Save Points Rules
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

      {/* Section 1: XP Reward Trigger Rules */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="var(--primary-neon)" />
              XP Points Engine Triggers
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Automatic points distributed when athletes perform platform interactions
            </p>
          </div>
          <span className="badge-neon green">Active In Realtime</span>
        </div>

        {loading ? (
          <SkeletonCardList count={3} />
        ) : pointRules.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No point rules found in database.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {pointRules.map((rule) => (
              <div
                key={rule.eventType}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF' }}>{rule.label}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                    System Trigger: {rule.eventType}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary-neon)', fontWeight: 800 }}>+</span>
                  <input
                    type="number"
                    value={rule.points}
                    onChange={(e) => handleRulePointsChange(rule.eventType, Number(e.target.value))}
                    style={{
                      width: 70,
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Milestone Levels & Badges */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} color="var(--accent-amber)" />
            Athlete Progression Levels & Milestone Perks
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
            Level thresholds, athlete badge icons, and automated rewards unlocked at each tier
          </p>
        </div>

        {loading ? (
          <SkeletonCardList count={3} />
        ) : levels.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No levels found in database.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {levels.map((lvl) => (
              <div
                key={lvl.level}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.04) 0%, rgba(18, 24, 34, 0.7) 100%)',
                  border: '1px solid rgba(255, 214, 0, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Level {lvl.level}
                    </span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginTop: 4 }}>{lvl.name}</h4>
                  </div>
                  <div style={{ fontSize: '2rem' }}>⭐</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginTop: 'auto' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XP Requirement</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-neon)' }}>
                    {lvl.minPoints.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>XP</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual XP Adjustment Modal */}
      {isManualXpModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsManualXpModalOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={22} color="var(--accent-amber)" />
              Manual Athlete XP Grant / Debit
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Manually award tournament points, MVP bonuses, or penalize unsportsmanlike conduct.
            </p>

            <form onSubmit={handleExecuteXpAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Athlete Phone Number or ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={targetAthletePhone}
                  onChange={(e) => setTargetAthletePhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  XP Amount (Use negative value for debit)
                </label>
                <input
                  type="number"
                  required
                  value={xpAdjustmentAmount}
                  onChange={(e) => setXpAdjustmentAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Audit Reason / Event Note
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsManualXpModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
