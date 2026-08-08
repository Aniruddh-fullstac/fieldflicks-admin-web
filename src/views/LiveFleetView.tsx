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
  Settings,
  Plus,
  Wifi,
  WifiOff,
  AlertCircle,
  Film,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonCardList } from '../components/Skeleton';
import { LiveStreamModal } from '../components/LiveStreamModal';
import { ConfigureCourtModal } from '../components/ConfigureCourtModal';
import { ExtractRecordingModal } from '../components/ExtractRecordingModal';
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
  
  // Live player modal
  const [activeModal, setActiveModal] = useState<{
    court: CourtCamera;
    venueName: string;
    playbackUrl: string;
  } | null>(null);

  // Extract Recording Modal state
  const [extractModal, setExtractModal] = useState<{
    court: CourtCamera;
    venueName: string;
  } | null>(null);

  // Configure / Add Court Modal state
  const [configureModal, setConfigureModal] = useState<{
    court?: CourtCamera | null;
    venueId: string;
    venueName: string;
  } | null>(null);

  // Unconfigured court warning prompt modal
  const [unconfiguredWarning, setUnconfiguredWarning] = useState<{
    court: CourtCamera;
    venueId: string;
    venueName: string;
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

  const handleStartStream = async (court: CourtCamera, venue: VenueFleet) => {
    // STREAMING GUARD: Immediately notify if court isn't configured
    const isConfigured = !!(court.raspberryPiBaseUrl && court.raspberryPiBaseUrl.trim().length > 0);
    if (!isConfigured) {
      setUnconfiguredWarning({
        court,
        venueId: venue.turfId,
        venueName: venue.turfName,
      });
      return;
    }

    setActionLoadingId(court.cameraId);
    try {
      const res = await AdminApi.startLiveStream(court.cameraId, `${venue.turfName} ${court.name}`);
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
        venueName: venue.turfName,
        playbackUrl,
      });
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venue.turfName} — ${court.name}`,
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

  // Fleet summary stats
  const totalCourts = fleet.reduce((sum, v) => sum + (v.courts?.length || 0), 0);
  const configuredCourts = fleet.reduce(
    (sum, v) =>
      sum +
      (v.courts?.filter((c) => !!(c.raspberryPiBaseUrl && c.raspberryPiBaseUrl.trim().length > 0))
        ?.length || 0),
    0
  );
  const activeStreams = fleet.reduce(
    (sum, v) => sum + (v.courts?.filter((c) => !!c.isLiveStreaming)?.length || 0),
    0
  );

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Quick Stats Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Configured: </span>
              <strong style={{ color: '#00E676' }}>
                {configuredCourts}/{totalCourts}
              </strong>
            </div>
            <div style={{ width: 1, height: 12, backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Live: </span>
              <strong style={{ color: '#00E5FF' }}>{activeStreams}</strong>
            </div>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                      <Cpu size={15} color="var(--primary-neon)" />
                      Courts: <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{venue.courts?.length || 0}</span>
                    </div>
                  </div>

                  {/* Add Court Button for this Venue */}
                  <button
                    onClick={() =>
                      setConfigureModal({
                        court: null,
                        venueId: venue.turfId,
                        venueName: venue.turfName,
                      })
                    }
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Plus size={13} />
                    Add Court
                  </button>
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
                  const isConfigured = !!(
                    court.raspberryPiBaseUrl && court.raspberryPiBaseUrl.trim().length > 0
                  );
                  const isActionLoading = actionLoadingId === court.cameraId;

                  return (
                    <div
                      key={court.cameraId}
                      style={{
                        padding: 18,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isLive
                          ? 'rgba(0, 230, 118, 0.08)'
                          : isConfigured
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 171, 0, 0.03)',
                        border: isLive
                          ? '1px solid rgba(0, 230, 118, 0.4)'
                          : isConfigured
                          ? '1px solid var(--border-subtle)'
                          : '1px solid rgba(255, 171, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 16,
                        boxShadow: isLive ? '0 0 20px rgba(0, 230, 118, 0.1)' : undefined,
                      }}
                    >
                      <div>
                        {/* Court Name and Status Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>
                            {court.name}
                          </span>
                          {isLive ? (
                            <span className="badge-neon green" style={{ gap: 5, fontSize: '0.65rem', fontWeight: 800 }}>
                              <span className="live-pulse" /> LIVE STREAMING
                            </span>
                          ) : isConfigured ? (
                            <span
                              className="badge-neon cyan"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem' }}
                            >
                              <Wifi size={10} /> CONFIG & ONLINE
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 100,
                                backgroundColor: 'rgba(255, 171, 0, 0.15)',
                                color: '#FFB300',
                                border: '1px solid rgba(255, 171, 0, 0.4)',
                              }}
                            >
                              <WifiOff size={10} /> NOT CONFIGURED
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div>Court Number: <strong style={{ color: '#FFFFFF' }}>Court {court.courtNumber}</strong></div>
                          <div>Camera ID: <code style={{ color: 'var(--text-muted)' }}>{court.cameraId.slice(0, 16)}...</code></div>
                          
                          {isConfigured ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <RadioTower size={12} color="var(--primary-neon)" />
                              <span style={{ color: 'var(--text-dim)' }}>Bridge: </span>
                              <code style={{ color: 'var(--primary-neon)', fontSize: '0.7rem' }}>
                                {court.raspberryPiBaseUrl}
                              </code>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: '#FFB300' }}>
                              <AlertCircle size={12} />
                              <span style={{ fontSize: '0.7rem' }}>No Raspberry Pi gateway linked</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stream Action Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {isLive ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {/* JOIN STREAM BUTTON */}
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
                              <Play size={14} fill="#05070A" /> Join Live Stream
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
                        ) : isConfigured ? (
                          /* CONFIGURED COURT: Start Stream, Fetch Video & Settings buttons */
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleStartStream(court, venue)}
                              disabled={isActionLoading}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                opacity: isActionLoading ? 0.7 : 1,
                              }}
                            >
                              {isActionLoading ? (
                                <>
                                  <RefreshCw size={13} className="spin" />
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <Radio size={13} /> Live Stream
                                </>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                setExtractModal({
                                  court,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Fetch and test video recording extraction from Dahua NVR"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--accent-cyan)',
                                borderColor: 'rgba(0, 229, 255, 0.3)',
                              }}
                            >
                              <Film size={13} /> Fetch Video
                            </button>

                            <button
                              onClick={() =>
                                setConfigureModal({
                                  court,
                                  venueId: venue.turfId,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Edit Court Pi Gateway Base URL"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Settings size={13} />
                            </button>
                          </div>
                        ) : (
                          /* UNCONFIGURED COURT: Setup Pi button */
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() =>
                                setConfigureModal({
                                  court,
                                  venueId: venue.turfId,
                                  venueName: venue.turfName,
                                })
                              }
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(255, 171, 0, 0.12)',
                                border: '1px solid rgba(255, 171, 0, 0.4)',
                                color: '#FFB300',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Settings size={14} /> Configure Device URL
                            </button>
                          </div>
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

      {/* Configure / Add Court Device Modal */}
      {configureModal && (
        <ConfigureCourtModal
          court={configureModal.court}
          venueId={configureModal.venueId}
          venueName={configureModal.venueName}
          onClose={() => setConfigureModal(null)}
          onSaved={() => {
            fetchFleet();
          }}
        />
      )}

      {/* Unconfigured Streaming Guard Notification Modal */}
      {unconfiguredWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(3, 6, 12, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setUnconfiguredWarning(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 460,
              backgroundColor: '#0C111C',
              borderRadius: 16,
              border: '1px solid rgba(255, 171, 0, 0.4)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 171, 0, 0.15)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 171, 0, 0.15)',
                  border: '1px solid rgba(255, 171, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFB300',
                  flexShrink: 0,
                }}
              >
                <WifiOff size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Court Not Configured
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {unconfiguredWarning.venueName} — {unconfiguredWarning.court.name}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
              This court does not have a Raspberry Pi gateway URL linked to it. Please configure the
              Edge hardware URL before starting a live stream.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setUnconfiguredWarning(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const target = unconfiguredWarning;
                  setUnconfiguredWarning(null);
                  setConfigureModal({
                    court: target.court,
                    venueId: target.venueId,
                    venueName: target.venueName,
                  });
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFB300',
                  color: '#05070A',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 171, 0, 0.3)',
                }}
              >
                <Settings size={14} />
                Configure Court Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Diagnostic Error Modal */}
      <DiagnosticErrorModal
        error={diagnosticError}
        onClose={() => setDiagnosticError(null)}
        onRetry={() => {
          if (diagnosticError?.category === 'BACKEND_DEPLOYING') {
            fetchFleet();
          }
        }}
      />

      {/* Extract Recording Modal */}
      {extractModal && (
        <ExtractRecordingModal
          initialCourt={extractModal.court}
          initialVenueName={extractModal.venueName}
          venues={fleet}
          onClose={() => setExtractModal(null)}
        />
      )}
    </div>
  );
};

