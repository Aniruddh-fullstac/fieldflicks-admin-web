import { useState, useEffect } from 'react';
import { AdminApi } from '../services/api';
import {
  Trophy,
  Sparkles,
  Search,
  Flame,
  Gift,
  AlertTriangle,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  athleteId: string;
  athleteName: string;
  athletePhone: string;
  city: string;
  sport: string;
  matchesPlayed: number;
  totalXp: number;
  highlightClips: number;
  currentStreak: number;
  awardedPrize?: string;
}

export const LeaderboardView = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeCycle, setTimeCycle] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('WEEKLY');
  const [penaltyModalEntry, setPenaltyModalEntry] = useState<LeaderboardEntry | null>(null);
  const [penaltyXpAmount, setPenaltyXpAmount] = useState<number>(500);
  const [penaltyReason, setPenaltyReason] = useState<string>('Unsportsmanlike conduct / Disqualification');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchLeaderboard = () => {
    setLoading(true);
    const period = timeCycle === 'MONTHLY' ? 'monthly' : timeCycle === 'ALL_TIME' ? 'all' : 'weekly';
    AdminApi.getLeaderboard(period, 50)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LeaderboardEntry[] = data.map((item: any, idx: number) => ({
            rank: item.rank || idx + 1,
            athleteId: item.userId || item.id || `u-${idx}`,
            athleteName: item.name || item.userName || 'Athlete',
            athletePhone: item.phoneNumber || item.phone || '',
            city: item.city || 'Mumbai',
            sport: item.sport || 'Pickleball',
            matchesPlayed: item.matchesPlayed || item.matchCount || 0,
            totalXp: item.totalPoints || item.points || item.xp || 0,
            highlightClips: item.highlightClips || item.clipsCount || 0,
            currentStreak: item.streak || 0,
            awardedPrize: idx === 0 ? '🥇 Gold Tier: 100% Free Match Pass' : idx === 1 ? '🥈 Silver Tier: 50% Off Coupon' : idx === 2 ? '🥉 Bronze Tier: 25% Off Coupon' : undefined,
          }));
          setLeaderboard(mapped);
        } else {
          setLeaderboard([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeCycle]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleApplyPenalty = () => {
    if (!penaltyModalEntry) return;
    setLeaderboard((prev) =>
      prev.map((entry) =>
        entry.athleteId === penaltyModalEntry.athleteId
          ? {
              ...entry,
              totalXp: Math.max(0, entry.totalXp - penaltyXpAmount),
            }
          : entry
      )
    );
    showToast(`⚡️ Applied ${penaltyXpAmount} XP fair-play penalty to ${penaltyModalEntry.athleteName}`);
    setPenaltyModalEntry(null);
  };

  const handleTriggerAutoRewards = () => {
    showToast('🏆 Top 3 athletes auto-awarded monthly VIP coupons & push notifications sent!');
  };

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const matchesSport = selectedSport === 'ALL' || entry.sport.toUpperCase() === selectedSport.toUpperCase();
    const matchesSearch =
      entry.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.athletePhone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

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
            <Trophy size={26} color="var(--accent-amber)" />
            Athlete Leaderboards & Cycle Rewards
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Multi-sport athlete ranking engine, weekly/monthly resets, automated podium prize distributions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleTriggerAutoRewards}
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
            <Gift size={16} />
            Distribute Cycle Prizes
          </button>
        </div>
      </div>

      {/* Podium Top 3 Cards */}
      {leaderboard.length >= 3 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Rank 1 Gold */}
          <div
            className="glass-card"
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.1) 0%, rgba(18, 24, 34, 0.8) 100%)',
              border: '1px solid rgba(255, 214, 0, 0.4)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem' }}>🥇</span>
                <span className="badge-neon amber" style={{ fontSize: '0.75rem' }}>
                  RANK 1 CHAMPION
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: 10 }}>{leaderboard[0].athleteName}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{leaderboard[0].city} • {leaderboard[0].sport}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: 8 }}>
                {leaderboard[0].totalXp.toLocaleString()} XP
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontSize: '0.75rem', color: '#FFF' }}>
              🏆 <strong>Reward:</strong> 100% Free Match Download Pass
            </div>
          </div>

          {/* Rank 2 Silver */}
          <div
            className="glass-card"
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(18, 24, 34, 0.8) 100%)',
              border: '1px solid rgba(226, 232, 240, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem' }}>🥈</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
                  RANK 2 RUNNER UP
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: 10 }}>{leaderboard[1].athleteName}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{leaderboard[1].city} • {leaderboard[1].sport}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E2E8F0', marginTop: 8 }}>
                {leaderboard[1].totalXp.toLocaleString()} XP
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontSize: '0.75rem', color: '#FFF' }}>
              🥈 <strong>Reward:</strong> 50% Off Match Unlock Coupon
            </div>
          </div>

          {/* Rank 3 Bronze */}
          <div
            className="glass-card"
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.08) 0%, rgba(18, 24, 34, 0.8) 100%)',
              border: '1px solid rgba(205, 127, 50, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem' }}>🥉</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(205, 127, 50, 0.2)', color: '#FFB088' }}>
                  RANK 3 PODIUM
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: 10 }}>{leaderboard[2].athleteName}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{leaderboard[2].city} • {leaderboard[2].sport}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFB088', marginTop: 8 }}>
                {leaderboard[2].totalXp.toLocaleString()} XP
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontSize: '0.75rem', color: '#FFF' }}>
              🥉 <strong>Reward:</strong> 25% Off Match Unlock Coupon
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Trophy size={40} style={{ margin: '0 auto 12px', opacity: 0.6, display: 'block', color: 'var(--accent-amber)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>Leaderboard Standing Queue</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Athletes earn XP based on match completions, highlight shares, and streaks. Top 3 champions will be featured here dynamically.
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Cycle selector */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-md)' }}>
            {(['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setTimeCycle(cycle)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: timeCycle === cycle ? 'var(--accent-amber)' : 'transparent',
                  color: timeCycle === cycle ? '#05070A' : 'var(--text-muted)',
                }}
              >
                {cycle}
              </button>
            ))}
          </div>

          {/* Sport selector */}
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{
              background: 'rgba(15, 20, 29, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              color: '#FFF',
              fontSize: '0.8rem',
            }}
          >
            <option value="ALL">All Sports</option>
            <option value="FOOTBALL">Football</option>
            <option value="CRICKET">Cricket</option>
            <option value="BADMINTON">Badminton</option>
            <option value="PADEL">Padel</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 320 }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search athlete or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Rank</th>
                <th style={{ padding: '14px 20px' }}>Athlete</th>
                <th style={{ padding: '14px 20px' }}>Sport & City</th>
                <th style={{ padding: '14px 20px' }}>Matches</th>
                <th style={{ padding: '14px 20px' }}>Highlights</th>
                <th style={{ padding: '14px 20px' }}>Streak</th>
                <th style={{ padding: '14px 20px' }}>Total XP</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry) => (
                <tr key={entry.athleteId} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: entry.rank <= 3 ? '1.1rem' : '0.9rem',
                        color:
                          entry.rank === 1
                            ? 'var(--accent-amber)'
                            : entry.rank === 2
                            ? '#E2E8F0'
                            : entry.rank === 3
                            ? '#FFB088'
                            : 'var(--text-muted)',
                      }}
                    >
                      #{entry.rank}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#FFF' }}>{entry.athleteName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{entry.athletePhone}</div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{entry.sport}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{entry.city}</div>
                  </td>

                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#FFF' }}>{entry.matchesPlayed} games</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}>{entry.highlightClips} clips</td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-amber)', fontWeight: 700 }}>
                      <Flame size={14} />
                      {entry.currentStreak}d
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-neon)' }}>
                      {entry.totalXp.toLocaleString()} XP
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => setPenaltyModalEntry(entry)}
                      style={{
                        background: 'rgba(255, 61, 87, 0.1)',
                        border: '1px solid rgba(255, 61, 87, 0.3)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        color: 'var(--accent-crimson)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      <AlertTriangle size={13} />
                      Penalty
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Trophy size={40} style={{ margin: '0 auto 14px', opacity: 0.4, display: 'block', color: 'var(--accent-amber)' }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>No Athletes Found on Leaderboard</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      Athletes playing matches across venues and collecting points will be computed and ranked here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penalty Modal */}
      {penaltyModalEntry && (
        <div className="modal-backdrop" onClick={() => setPenaltyModalEntry(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={22} />
              Apply Leaderboard XP Penalty
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Deduct XP from <strong style={{ color: '#FFF' }}>{penaltyModalEntry.athleteName}</strong> for misconduct, forfeited tournament match, or rank tampering.
            </p>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  XP Deduction Amount
                </label>
                <input
                  type="number"
                  value={penaltyXpAmount}
                  onChange={(e) => setPenaltyXpAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Penalty Justification
                </label>
                <select
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 20, 29, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="Unsportsmanlike conduct / Disqualification">Unsportsmanlike conduct / Disqualification</option>
                  <option value="Tournament Match Forfeiture / No-show">Tournament Match Forfeiture / No-show</option>
                  <option value="Collusion or fraudulent match recording claim">Collusion or fraudulent match recording claim</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setPenaltyModalEntry(null)}
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
                  type="button"
                  onClick={handleApplyPenalty}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-crimson)',
                    border: 'none',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Penalty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
