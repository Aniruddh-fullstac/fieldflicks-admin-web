import React, { useState, useEffect, useMemo } from 'react';
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
  Play,
  Square,
  Video,
  Image as ImageIcon,
  Loader2,
  Link,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';
import { CompactDateBadge } from '../components/CompactDateBadge';
import { LiveStreamModal } from '../components/LiveStreamModal';
import type { Tournament, VenueFleet, CourtCamera, TournamentLiveStream } from '../types';
import { resolveBotanicalPosterCourt } from '../utils/botanicalCourt';

export const getChannelForCourt = (
  venueName: string,
  courtNumber: number | undefined | null,
  isCh2: boolean,
  cameraId?: string | null,
): number => {
  if (venueName.toLowerCase().includes('botanical')) {
    const posterCourt = resolveBotanicalPosterCourt(cameraId, courtNumber);
    switch (posterCourt) {
      case 1: return isCh2 ? 7 : 6;
      case 2: return isCh2 ? 12 : 4;
      case 3: return isCh2 ? 9 : 8;
      case 4: return isCh2 ? 11 : 5;
      case 5: return isCh2 ? 3 : 2;
      case 6: return isCh2 ? 10 : 1;
      default: return isCh2 ? 2 : 1;
    }
  }
  return isCh2 ? 2 : 1;
};

export const TournamentsView = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fleet, setFleet] = useState<VenueFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSport, setFilterSport] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [streamLoadingId, setStreamLoadingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeStreamModal, setActiveStreamModal] = useState<{
    court: CourtCamera;
    venueName: string;
    playbackUrl: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sport: 'Pickleball',
    turfId: '',
    cameraIds: [] as string[],
    city: 'Mumbai',
    prizePool: 50000,
    entryFee: 1000,
    isPaid: true,
    startDate: '',
    maxParticipants: 32,
    skillLevel: 'Intermediate / Open',
    championPrize: '₹ 25,000 + Trophy',
    runnerUpPrize: '₹ 15,000',
    bannerImage: '',
  });

  const selectedVenue = useMemo(
    () => fleet.find((v) => v.turfId === formData.turfId),
    [fleet, formData.turfId],
  );

  const venueCourts = selectedVenue?.courts ?? [];

  const fetchFleet = () => {
    AdminApi.getFleet()
      .then(setFleet)
      .catch((err) => console.error('Failed to load fleet for tournaments:', err));
  };

  const findCourtInFleet = (cameraId: string): { court: CourtCamera; venue: VenueFleet } | null => {
    for (const venue of fleet) {
      const court = venue.courts.find((c) => c.cameraId === cameraId);
      if (court) return { court, venue };
    }
    return null;
  };

  const persistLiveStreams = async (tournament: Tournament, liveStreams: TournamentLiveStream[]) => {
    const updated = await AdminApi.updateTournamentLiveStreams(tournament.id, liveStreams);
    setTournaments((prev) => prev.map((t) => (t.id === tournament.id ? { ...t, ...updated, liveStreams } : t)));
    return updated;
  };

  const handleCopyPublicLink = (playbackId: string) => {
    const url = `${window.location.origin}/?public_stream=${playbackId}`;
    navigator.clipboard.writeText(url);
    alert('Public stream link copied to clipboard!');
  };

  const handleStartStream = async (tournament: Tournament, cameraId: string) => {
    const isCh2 = cameraId.endsWith('_ch2');
    const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
    
    const match = findCourtInFleet(baseCameraId);
    if (!match) {
      alert('Camera not found in fleet. Refresh and try again.');
      return;
    }
    const { court, venue } = match;
    const channel = getChannelForCourt(venue.turfName, court.courtNumber, isCh2, court.cameraId);

    if (!court.raspberryPiBaseUrl?.trim()) {
      alert(`${court.name} is not configured with a Pi URL. Configure it in Camera Fleet first.`);
      return;
    }

    setStreamLoadingId(cameraId);
    try {
      const res = await AdminApi.startLiveStream(
        baseCameraId,
        `${venue.turfName} ${court.name} (Ch ${channel})`,
        channel,
        isCh2 ? 2 : 1,
      );
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${baseCameraId}.m3u8`;
      const existing = tournament.liveStreams ?? [];
      const nextStreams: TournamentLiveStream[] = [
        ...existing.filter((s) => s.cameraId !== cameraId),
        {
          cameraId,
          cameraName: court.name + (isCh2 ? ' (Ch 2)' : ' (Ch 1)'),
          courtNumber: court.courtNumber,
          playbackUrl,
          isLive: true,
        },
      ];
      await persistLiveStreams(tournament, nextStreams);
      setActiveStreamModal({
        court: { ...court, isLiveStreaming: !isCh2, isLiveStreamingCh2: isCh2, livePlaybackUrl: playbackUrl },
        venueName: venue.turfName,
        playbackUrl,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to start stream');
    } finally {
      setStreamLoadingId(null);
    }
  };

  const handleStopStream = async (tournament: Tournament, cameraId: string) => {
    const isCh2 = cameraId.endsWith('_ch2');
    const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
    
    const match = findCourtInFleet(baseCameraId);
    let channel = isCh2 ? 2 : 1;
    if (match) {
      channel = getChannelForCourt(match.venue.turfName, match.court.courtNumber, isCh2, match.court.cameraId);
    }

    setStreamLoadingId(cameraId);
    try {
      await AdminApi.stopLiveStream(baseCameraId, channel, isCh2 ? 2 : 1);
      const nextStreams = (tournament.liveStreams ?? []).map((s) =>
        s.cameraId === cameraId ? { ...s, isLive: false, playbackUrl: undefined } : s,
      );
      await persistLiveStreams(tournament, nextStreams);
      if (activeStreamModal?.court.cameraId === baseCameraId) {
        setActiveStreamModal(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to stop stream');
    } finally {
      setStreamLoadingId(null);
    }
  };

  const handleWatchStream = (tournament: Tournament, cameraId: string) => {
    const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
    const match = findCourtInFleet(baseCameraId);
    const stream = tournament.liveStreams?.find((s) => s.cameraId === cameraId);
    if (!match || !stream?.playbackUrl) {
      alert('No active playback URL for this camera.');
      return;
    }
    setActiveStreamModal({
      court: match.court,
      venueName: match.venue.turfName,
      playbackUrl: stream.playbackUrl,
    });
  };

  const toggleCameraSelection = (cameraId: string) => {
    setFormData((prev) => {
      const has = prev.cameraIds.includes(cameraId);
      return {
        ...prev,
        cameraIds: has
          ? prev.cameraIds.filter((id) => id !== cameraId)
          : [...prev.cameraIds, cameraId],
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({ ...prev, bannerImage: base64String }));
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read file as Base64');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
      setUploadingImage(false);
    }
  };

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
    fetchFleet();
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

  const handleDeleteTournament = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
      return;
    }
    try {
      await AdminApi.deleteTournament(id);
      setTournaments((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete tournament');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.turfId) {
      alert('Please select a venue from the fleet.');
      return;
    }
    if (formData.cameraIds.length === 0) {
      alert('Select at least one camera for this tournament.');
      return;
    }

    const venue = fleet.find((v) => v.turfId === formData.turfId);
    const liveStreams: TournamentLiveStream[] = formData.cameraIds.map((selectedId) => {
      // selectedId is like "uuid_ch1" or "uuid_ch2"
      const isCh2 = selectedId.endsWith('_ch2');
      const baseCameraId = selectedId.replace('_ch1', '').replace('_ch2', '');
      const court = venue?.courts.find((c) => c.cameraId === baseCameraId);
      return {
        cameraId: selectedId,
        cameraName: (court?.name || `Camera ${baseCameraId.slice(0, 6)}`) + (isCh2 ? ' (Ch 2)' : ' (Ch 1)'),
        courtNumber: court?.courtNumber,
        isLive: false,
      };
    });

    const payload: Partial<Tournament> = {
      name: formData.name,
      sport: formData.sport,
      venue: venue?.turfName || 'Venue',
      turfId: formData.turfId,
      cameraIds: formData.cameraIds,
      liveStreams,
      city: venue?.city || formData.city,
      prizePool: Number(formData.prizePool),
      entryFee: formData.isPaid ? Number(formData.entryFee) : 0,
      startDate: formData.startDate || new Date().toISOString(),
      maxParticipants: Number(formData.maxParticipants),
      skillLevel: formData.skillLevel,
      status: 'Upcoming',
      bannerImage: formData.bannerImage,
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
        turfId: '',
        cameraIds: [],
        city: 'Mumbai',
        prizePool: 50000,
        entryFee: 1000,
        isPaid: true,
        startDate: '',
        maxParticipants: 32,
        skillLevel: 'Intermediate / Open',
        championPrize: '₹ 25,000 + Trophy',
        runnerUpPrize: '₹ 15,000',
        bannerImage: '',
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

                {/* Assigned cameras & live stream controls */}
                {(t.cameraIds?.length ?? 0) > 0 && (
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: 'rgba(0, 230, 118, 0.04)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(0, 230, 118, 0.15)',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Live Cameras ({t.cameraIds?.length ?? 0})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(t.cameraIds ?? []).map((cameraId) => {
                        const stream = t.liveStreams?.find((s) => s.cameraId === cameraId);
                        const courtInfo = findCourtInFleet(cameraId);
                        const label = stream?.cameraName || courtInfo?.court.name || cameraId.slice(0, 8);
                        const isLive = !!stream?.isLive;
                        const busy = streamLoadingId === cameraId;
                        return (
                          <div
                            key={cameraId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '8px 10px',
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', color: '#FFF', fontWeight: 600 }}>{label}</div>
                              <div style={{ fontSize: '0.7rem', color: isLive ? 'var(--primary-neon)' : 'var(--text-dim)' }}>
                                {isLive ? '● STREAMING' : 'Offline'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {!isLive ? (
                                <button
                                  type="button"
                                  disabled={busy || t.status === 'Completed'}
                                  onClick={() => handleStartStream(t, cameraId)}
                                  className="btn-primary"
                                  style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                >
                                  <Play size={12} /> Start
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleWatchStream(t, cameraId)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                  >
                                    <Video size={12} /> Watch
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleStopStream(t, cameraId)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--accent-crimson)' }}
                                  >
                                    <Square size={12} /> Stop
                                  </button>
                                  {stream?.playbackUrl && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const match = stream.playbackUrl?.match(/stream\.mux\.com\/([^.]+)\.m3u8/);
                                        if (match && match[1]) {
                                          handleCopyPublicLink(match[1]);
                                        }
                                      }}
                                      className="btn-secondary"
                                      title="Copy Public Stream Link"
                                      style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}
                                    >
                                      <Link size={12} /> Link
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                <button
                  onClick={() => handleDeleteTournament(t.id)}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--accent-crimson)' }}
                >
                  Delete
                </button>
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
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Venue</label>
                  <select
                    required
                    value={formData.turfId}
                    onChange={(e) =>
                      setFormData({ ...formData, turfId: e.target.value, cameraIds: [] })
                    }
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
                    <option value="">Select venue from fleet…</option>
                    {fleet.map((v) => (
                      <option key={v.turfId} value={v.turfId}>
                        {v.turfName} — {v.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tournament Banner Image (Optional)</label>
                <div style={{
                  marginTop: 6,
                  padding: 12,
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  {formData.bannerImage ? (
                    <div style={{ position: 'relative', width: '100px', height: '60px', borderRadius: 4, overflow: 'hidden' }}>
                      <img src={formData.bannerImage} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setFormData({ ...formData, bannerImage: '' })} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', padding: 4, cursor: 'pointer' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {uploadingImage ? <Loader2 size={18} className="spin" color="var(--primary-neon)" /> : <ImageIcon size={18} color="var(--text-muted)" />}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{uploadingImage ? 'Uploading...' : 'No image uploaded'}</span>
                    </div>
                  )}
                  
                  <div>
                    <input type="file" id="banner-upload" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                    <label htmlFor="banner-upload" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: uploadingImage ? 'not-allowed' : 'pointer', display: 'inline-block', margin: 0 }}>
                      Choose Image
                    </label>
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>This image will appear on the front of the tournament card in the mobile app.</p>
              </div>

              {formData.turfId && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Cameras to include (select one or more)
                  </label>
                  <div style={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 180,
                    overflowY: 'auto',
                    padding: 10,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {venueCourts.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        No cameras configured for this venue.
                      </span>
                    ) : (
                      venueCourts.map((court) => (
                        <React.Fragment key={court.cameraId}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: '0.85rem',
                              color: '#FFF',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.cameraIds.includes(`${court.cameraId}_ch1`)}
                              onChange={() => toggleCameraSelection(`${court.cameraId}_ch1`)}
                            />
                            <span>
                              {court.name} (Ch 1) (Court {court.courtNumber})
                              {!court.raspberryPiBaseUrl?.trim() && (
                                <span style={{ color: 'var(--accent-crimson)', marginLeft: 6 }}>— not configured</span>
                              )}
                            </span>
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: '0.85rem',
                              color: '#FFF',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.cameraIds.includes(`${court.cameraId}_ch2`)}
                              onChange={() => toggleCameraSelection(`${court.cameraId}_ch2`)}
                            />
                            <span>
                              {court.name} (Ch 2) (Court {court.courtNumber})
                              {!court.raspberryPiBaseUrl?.trim() && (
                                <span style={{ color: 'var(--accent-crimson)', marginLeft: 6 }}>— not configured</span>
                              )}
                            </span>
                          </label>
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              )}

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

      {activeStreamModal && (
        <LiveStreamModal
          court={activeStreamModal.court}
          venueName={activeStreamModal.venueName}
          playbackUrl={activeStreamModal.playbackUrl}
          onClose={() => setActiveStreamModal(null)}
        />
      )}
    </div>
  );
};
