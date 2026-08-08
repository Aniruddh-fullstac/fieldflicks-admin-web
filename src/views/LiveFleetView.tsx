import { useState, useEffect } from 'react';
import {
  Radio,
  Square,
  Play,
  MapPin,
  Cpu,
  RefreshCw,
  AlertTriangle,
  RadioTower,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';
import { LiveStreamModal } from '../components/LiveStreamModal';
import {
  DiagnosticErrorModal,
  parseDiagnosticError,
  type DiagnosticErrorInfo,
} from '../components/DiagnosticErrorModal';
import type { VenueFleet, CourtCamera } from '../types';

export const LiveFleetView = () => {
  const [fleet, setFleet] = useState<VenueFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<DiagnosticErrorInfo | null>(null);
  const [activeModal, setActiveModal] = useState<{
    court: CourtCamera;
    venueName: string;
    playbackUrl: string;
  } | null>(null);

  const fetchFleet = () => {
    setLoading(true);
    setError(null);
    AdminApi.getFleet()
      .then((res) => {
        setFleet(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load fleet:', err);
        const diag = parseDiagnosticError(err);
        setError(diag.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleStartStream = async (court: CourtCamera, venueName: string) => {
    setActionLoadingId(court.cameraId);
    try {
      const res = await AdminApi.startLiveStream(court.cameraId, `${venueName} ${court.name}`);
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`;

      // Update fleet state
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) =>
            c.cameraId === court.cameraId
              ? { ...c, isLiveStreaming: true, status: 'STREAMING', livePlaybackUrl: playbackUrl }
              : c
          ),
        }))
      );

      // Open stream player modal
      setActiveModal({
        court: { ...court, isLiveStreaming: true, livePlaybackUrl: playbackUrl },
        venueName,
        playbackUrl,
      });
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venueName} — ${court.name}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };

  const handleStopStream = async (court: CourtCamera, venueName: string) => {
    setActionLoadingId(court.cameraId);
    try {
      await AdminApi.stopLiveStream(court.cameraId);
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) =>
            c.cameraId === court.cameraId
              ? { ...c, isLiveStreaming: false, status: 'ONLINE', livePlaybackUrl: undefined }
              : c
          ),
        }))
      );
      if (activeModal?.court.cameraId === court.cameraId) {
        setActiveModal(null);
      }
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venueName} — ${court.name}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };

  const handleJoinStream = (court: CourtCamera, venueName: string) => {
    const url = court.livePlaybackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`;
    setActiveModal({
      court,
      venueName,
      playbackUrl: url,
    });
  };

  return (
    <div className="view-padding" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
            Fleet Management & Camera Edge Matrix
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time Raspberry Pi bridges, Mux stream relays, and live court broadcast monitoring
          </p>
        </div>

        <button
          onClick={fetchFleet}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} />
          Sync Fleet Status
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
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchFleet}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--accent-crimson)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Venues & Courts Matrix */}
      {loading ? (
        <SkeletonCardList count={3} />
      ) : fleet.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 600 }}>No venues or cameras registered yet.</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Add turfs and court cameras in the database to manage fleet live broadcasts.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {fleet.map((venue) => (
            <div key={venue.turfId} className="glass-card" style={{ padding: 24 }}>
              {/* Venue Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>{venue.turfName}</h3>
                    <span className="badge-neon green" style={{ fontSize: '0.65rem' }}>{venue.city}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <MapPin size={13} color="var(--primary-neon)" />
                    {venue.address || `${venue.turfName}, ${venue.city}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Cpu size={15} color="var(--primary-neon)" />
                    Courts: <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{venue.courts.length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    Status: <span style={{ color: 'var(--primary-neon)', fontWeight: 600 }}>Connected</span>
                  </div>
                </div>
              </div>

              {/* Courts Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: 16,
              }}>
                {venue.courts.map((court) => {
                  const isLive = !!court.isLiveStreaming;
                  const isActionLoading = actionLoadingId === court.cameraId;

                  return (
                    <div
                      key={court.cameraId}
                      style={{
                        padding: 18,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isLive
                          ? 'rgba(0, 230, 118, 0.08)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isLive
                          ? '1px solid rgba(0, 230, 118, 0.4)'
                          : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 16,
                        boxShadow: isLive ? '0 0 20px rgba(0, 230, 118, 0.1)' : undefined,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>{court.name}</span>
                          {isLive ? (
                            <span className="badge-neon green" style={{ gap: 5, fontSize: '0.65rem', fontWeight: 800 }}>
                              <span className="live-pulse" /> LIVE STREAMING
                            </span>
                          ) : court.status === 'ONLINE' ? (
                            <span className="badge-neon cyan" style={{ fontSize: '0.65rem' }}>ONLINE</span>
                          ) : (
                            <span className="badge-neon crimson" style={{ fontSize: '0.65rem' }}>OFFLINE</span>
                          )}
                        </div>

                        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div>Court Number: <strong style={{ color: '#FFFFFF' }}>Court {court.courtNumber}</strong></div>
                          <div>Camera ID: <code style={{ color: 'var(--text-muted)' }}>{court.cameraId.slice(0, 16)}...</code></div>
                          {court.raspberryPiBaseUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <RadioTower size={12} color="var(--primary-neon)" />
                              <span style={{ color: 'var(--text-dim)' }}>Bridge: </span>
                              <code style={{ color: 'var(--primary-neon)', fontSize: '0.7rem' }}>{court.raspberryPiBaseUrl}</code>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stream Action Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {isLive ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {/* JOIN STREAM BUTTON - Only clickable when stream is active */}
                            <button
                              onClick={() => handleJoinStream(court, venue.turfName)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                                color: '#05070A',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              <Play size={14} fill="#05070A" /> Join Stream
                            </button>

                            {/* STOP STREAM BUTTON */}
                            <button
                              onClick={() => handleStopStream(court, venue.turfName)}
                              disabled={isActionLoading}
                              className="btn-secondary"
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.75rem',
                                color: 'var(--accent-crimson)',
                                borderColor: 'rgba(255, 61, 87, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                opacity: isActionLoading ? 0.6 : 1,
                              }}
                            >
                              <Square size={13} fill="currentColor" /> Stop
                            </button>
                          </div>
                        ) : (
                          /* START LIVE STREAM - When inactive */
                          <button
                            onClick={() => handleStartStream(court, venue.turfName)}
                            disabled={isActionLoading}
                            className="btn-primary"
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              opacity: isActionLoading ? 0.7 : 1,
                            }}
                          >
                            {isActionLoading ? (
                              <>
                                <RefreshCw size={14} className="spin" />
                                Connecting to Device...
                              </>
                            ) : (
                              <>
                                <Radio size={14} /> Start Live Stream
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Live Video Player Modal */}
      {activeModal && (
        <LiveStreamModal
          court={activeModal.court}
          venueName={activeModal.venueName}
          playbackUrl={activeModal.playbackUrl}
          onClose={() => setActiveModal(null)}
          onStopStream={() => handleStopStream(activeModal.court, activeModal.venueName)}
        />
      )}

      {/* Deep Diagnostic Error Modal (replaces browser alert popups) */}
      <DiagnosticErrorModal
        error={diagnosticError}
        onClose={() => setDiagnosticError(null)}
        onRetry={() => {
          if (diagnosticError?.category === 'BACKEND_DEPLOYING') {
            fetchFleet();
          }
        }}
      />
    </div>
  );
};
