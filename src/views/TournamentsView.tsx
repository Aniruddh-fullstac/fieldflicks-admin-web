import { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Radio,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';
import { CompactDateBadge } from '../components/CompactDateBadge';
import type { Tournament } from '../types';

export const TournamentsView = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSport, setFilterSport] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Pickleball',
    venue: '',
    city: 'Mumbai',
    prizePool: 50000,
    entryFee: 1000, // 0 for free/unpaid
    isPaid: true,
    startDate: '',
    maxParticipants: 32,
    skillLevel: 'Intermediate / Open',
    championPrize: '₹ 25,000 + Trophy',
    runnerUpPrize: '₹ 15,000',
  });

  const fetchTournaments = () => {
    setLoading(true);
    setError(null);
    AdminApi.listTournaments()
      .then((res) => {
        setTournaments(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tournaments:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Could not load tournaments from database.'
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await AdminApi.updateTournamentStatus(id, newStatus);
      setTournaments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus as any } : t))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update tournament status');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Tournament> = {
      name: formData.name,
      sport: formData.sport,
      venue: formData.venue || 'Bandra Arena',
      city: formData.city,
      prizePool: Number(formData.prizePool),
      entryFee: formData.isPaid ? Number(formData.entryFee) : 0,
      startDate: formData.startDate || new Date().toISOString(),
      maxParticipants: Number(formData.maxParticipants),
      skillLevel: formData.skillLevel,
      status: 'Upcoming',
      prizes: {
        champion: formData.championPrize,
        runnerUp: formData.runnerUpPrize,
        semiFinalists: 'Medals & Goodies',
      },
    };

    try {
      const created = await AdminApi.createTournament(payload);
      setTournaments([created, ...tournaments]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        sport: 'Pickleball',
        venue: '',
        city: 'Mumbai',
        prizePool: 50000,
        entryFee: 1000,
        isPaid: true,
        startDate: '',
        maxParticipants: 32,
        skillLevel: 'Intermediate / Open',
        championPrize: '₹ 25,000 + Trophy',
        runnerUpPrize: '₹ 15,000',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish tournament');
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchSport = filterSport === 'All' || t.sport.toLowerCase() === filterSport.toLowerCase();
    const matchStatus = filterStatus === 'All' || t.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSport && matchStatus;
  });

  return (
    <div className="view-padding" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sport Filter */}
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="All">All Sports</option>
            <option value="Pickleball">Pickleball</option>
            <option value="Padel">Padel</option>
            <option value="Cricket">Cricket</option>
            <option value="Football">Football</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Pending_Approval">Pending Organizer Requests</option>
            <option value="Completed">Completed</option>
          </select>

          <button onClick={fetchTournaments} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <Plus size={18} />
          Create Tournament
        </button>
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

      {/* Tournaments Grid */}
      {loading ? (
        <SkeletonCardList count={6} />
      ) : filteredTournaments.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 600 }}>No tournaments found.</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Click "Create Tournament" above to add the first tournament.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: 20,
        }}>
          {filteredTournaments.map((t) => (
            <div key={t.id} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span className="badge-neon green">{t.sport}</span>
                  {t.status === 'Live' && (
                    <span className="badge-neon green" style={{ gap: 4 }}>
                      <Radio size={12} /> LIVE NOW
                    </span>
                  )}
                  {t.status === 'Pending_Approval' && (
                    <span className="badge-neon amber" style={{ gap: 4 }}>
                      <Clock size={12} /> Pending Review
                    </span>
                  )}
                  {t.status === 'Upcoming' && (
                    <span className="badge-neon cyan">Upcoming</span>
                  )}
                  {t.status === 'Completed' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>COMPLETED</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                  {t.name}
                </h3>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={15} color="var(--primary-neon)" />
                    <span>{t.venue}, {t.city}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CompactDateBadge date={t.startDate} tilt={false} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={15} color="#FFD600" />
                    <span>{t.participantsCount || 0} / {t.maxParticipants || 32} Registered</span>
                  </div>
                </div>

                {/* Entry Fee & Prize Pool */}
                <div style={{
                  marginTop: 18,
                  padding: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entry Fee</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: t.entryFee === 0 ? 'var(--primary-neon)' : '#FFFFFF' }}>
                      {t.entryFee === 0 ? 'FREE GAME' : `₹ ${t.entryFee}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Prize Pool</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFD600' }}>
                      ₹ {(t.prizePool || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Organizer Info if requested */}
                {t.organizer && (
                  <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Organizer: <strong style={{ color: 'var(--text-muted)' }}>{t.organizer.name}</strong> ({t.organizer.contactPhone})
                  </div>
                )}
              </div>

              {/* Admin Actions Toolbar */}
              <div style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 8,
              }}>
                {t.status === 'Pending_Approval' ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(t.id, 'Upcoming')}
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                      <CheckCircle size={14} /> Accept Request
                    </button>
                    <button
                      onClick={() => handleStatusChange(t.id, 'Cancelled')}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--accent-crimson)' }}
                    >
                      Reject
                    </button>
                  </>
                ) : t.status === 'Upcoming' ? (
                  <button
                    onClick={() => handleStatusChange(t.id, 'Live')}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    <Radio size={14} /> Go Live & Activate
                  </button>
                ) : t.status === 'Live' ? (
                  <button
                    onClick={() => handleStatusChange(t.id, 'Completed')}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    Mark Tournament Completed
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Archive mode</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            className="glass-card responsive-modal-content"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0C1017',
              padding: 28,
              position: 'relative',
              border: '1px solid rgba(0, 230, 118, 0.3)',
            }}
          >
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

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 20 }}>
              Create New Tournament
            </h3>

            <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Monsoon Pickleball Cup 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sport</label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      color: '#FFFFFF',
                      marginTop: 6,
                    }}
                  >
                    <option value="Pickleball">Pickleball</option>
                    <option value="Padel">Padel</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Venue & City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bandra Arena, Mumbai"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
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

              {/* Paid vs Free Game Switch */}
              <div style={{
                padding: '14px',
                backgroundColor: 'rgba(0, 230, 118, 0.05)',
                border: '1px solid rgba(0, 230, 118, 0.2)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF' }}>Tournament Monetization</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formData.isPaid ? 'Paid Event (Requires athlete entry fee)' : 'Free Game / Community event'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: false })}
                    className={!formData.isPaid ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Free Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: true })}
                    className={formData.isPaid ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Paid
                  </button>
                </div>
              </div>

              {formData.isPaid && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entry Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
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
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Prize Pool (₹)</label>
                    <input
                      type="number"
                      value={formData.prizePool}
                      onChange={(e) => setFormData({ ...formData, prizePool: Number(e.target.value) })}
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
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Max Participants</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
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
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
