import { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Download,
  Film,
  Clock,
  Sparkles,
  Server,
  CloudUpload,
  MapPin,
  Camera,
  Check,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type { CourtCamera, VenueFleet } from '../types';

interface ExtractRecordingModalProps {
  initialCourt?: CourtCamera;
  initialVenueName?: string;
  venues?: VenueFleet[];
  onClose: () => void;
  onExtractionSuccess?: () => void;
}

export const ExtractRecordingModal = ({
  initialCourt,
  initialVenueName,
  venues: passedVenues,
  onClose,
  onExtractionSuccess,
}: ExtractRecordingModalProps) => {
  const [venues, setVenues] = useState<VenueFleet[]>(passedVenues || []);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>(initialCourt?.cameraId || '');
  const [loadingVenues, setLoadingVenues] = useState<boolean>(false);

  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    recordingId: string;
    status: string;
    playableUrl?: string;
    s3Path?: string;
    startTime: string;
    endTime: string;
    cached?: boolean;
    venueName?: string;
    courtName?: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch venues if not provided
  useEffect(() => {
    if (!passedVenues || passedVenues.length === 0) {
      setLoadingVenues(true);
      AdminApi.getFleet()
        .then((data) => {
          setVenues(data);
          if (data.length > 0) {
            // Find initial venue if initialCourt provided
            if (initialCourt) {
              const matchedVenue = data.find((v) =>
                v.courts.some((c) => c.cameraId === initialCourt.cameraId)
              );
              if (matchedVenue) {
                setSelectedVenueId(matchedVenue.turfId);
                setSelectedCameraId(initialCourt.cameraId);
                return;
              }
            }
            setSelectedVenueId(data[0].turfId);
            if (data[0].courts.length > 0) {
              setSelectedCameraId(data[0].courts[0].cameraId);
            }
          }
        })
        .catch((err) => console.error('Failed to load venues for extraction:', err))
        .finally(() => setLoadingVenues(false));
    } else {
      setVenues(passedVenues);
      if (initialCourt) {
        const matched = passedVenues.find((v) =>
          v.courts.some((c) => c.cameraId === initialCourt.cameraId)
        );
        if (matched) {
          setSelectedVenueId(matched.turfId);
          setSelectedCameraId(initialCourt.cameraId);
        } else if (passedVenues.length > 0) {
          setSelectedVenueId(passedVenues[0].turfId);
        }
      } else if (passedVenues.length > 0) {
        setSelectedVenueId(passedVenues[0].turfId);
        if (passedVenues[0].courts.length > 0) {
          setSelectedCameraId(passedVenues[0].courts[0].cameraId);
        }
      }
    }
  }, [passedVenues, initialCourt]);

  // Current selected venue and court
  const currentVenue = venues.find((v) => v.turfId === selectedVenueId) || venues[0];
  const availableCourts = currentVenue ? currentVenue.courts : [];
  const selectedCourt =
    availableCourts.find((c) => c.cameraId === selectedCameraId) ||
    availableCourts[0] ||
    initialCourt;

  // When venue changes, update selected camera to first court in that venue
  const handleVenueChange = (newVenueId: string) => {
    setSelectedVenueId(newVenueId);
    const venue = venues.find((v) => v.turfId === newVenueId);
    if (venue && venue.courts.length > 0) {
      setSelectedCameraId(venue.courts[0].cameraId);
    } else {
      setSelectedCameraId('');
    }
    // Clear previous extraction result when switching court/venue
    setResult(null);
    setError(null);
  };

  const handleCourtChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    setResult(null);
    setError(null);
  };

  // Initialize custom timestamps (15 minutes ago to 14 minutes ago)
  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getTime() - 14 * 60 * 1000);
    const start = new Date(end.getTime() - 1 * 60 * 1000);

    const toLocalIso = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setStartTime(toLocalIso(start));
    setEndTime(toLocalIso(end));
  }, []);

  const isConfigured = !!(
    selectedCourt &&
    selectedCourt.raspberryPiBaseUrl &&
    selectedCourt.raspberryPiBaseUrl.trim().length > 0
  );

  const handleExtract = async () => {
    if (!selectedCourt || !selectedCourt.cameraId) {
      setError('Please select a valid court camera first.');
      return;
    }

    if (!isConfigured) {
      setError(
        `Court "${selectedCourt.name}" is not configured with an active Raspberry Pi Edge Gateway URL. Please configure it in Fleet & Live Courts first.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(1);

    try {
      const payload: any = {
        cameraId: selectedCourt.cameraId,
      };

      if (useCustomTime && startTime && endTime) {
        payload.startTime = new Date(startTime).toISOString();
        payload.endTime = new Date(endTime).toISOString();
      } else {
        payload.durationMinutes = durationMinutes;
      }

      // Progress animation simulation
      const stepTimer1 = setTimeout(() => setCurrentStep(2), 2500);
      const stepTimer2 = setTimeout(() => setCurrentStep(3), 8000);

      const res = await AdminApi.triggerTestExtraction(payload);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setCurrentStep(4);
      setResult({
        ...res,
        venueName: currentVenue?.turfName || initialVenueName || 'Venue',
        courtName: selectedCourt.name || `Court ${selectedCourt.courtNumber || 1}`,
      });
      if (onExtractionSuccess) onExtractionSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to extract recording from NVR. Please check Edge Pi connectivity.',
      );
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (result?.playableUrl) {
      navigator.clipboard.writeText(result.playableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(4, 7, 13, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: result?.playableUrl ? 960 : 700,
          backgroundColor: '#0A0F1A',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.15)',
          transition: 'max-width 0.3s ease',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 230, 118, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 230, 118, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-neon)',
              }}
            >
              <Film size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Fetch Match Recording from NVR
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                Select any venue and court to extract recorded match MP4 footage from Dahua NVR
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
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
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {/* VENUE & COURT SELECTION MATRIX */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              padding: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
            }}
          >
            {/* Venue Selector */}
            <div>
              <label
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <MapPin size={13} color="var(--primary-neon)" /> 1. Select Venue / Arena
              </label>
              <select
                value={selectedVenueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                disabled={loading || loadingVenues}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {venues.map((v) => (
                  <option key={v.turfId} value={v.turfId}>
                    {v.turfName} ({v.courts.length} Courts)
                  </option>
                ))}
              </select>
            </div>

            {/* Court / Camera Selector */}
            <div>
              <label
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Camera size={13} color="var(--primary-neon)" /> 2. Select Court / Channel
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => handleCourtChange(e.target.value)}
                disabled={loading || availableCourts.length === 0}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableCourts.length === 0 ? (
                  <option value="">No courts registered</option>
                ) : (
                  availableCourts.map((c) => (
                    <option key={c.cameraId} value={c.cameraId}>
                      {c.name || `Court ${c.courtNumber}`} (Channel {c.courtNumber}) —{' '}
                      {c.isConfigured || c.raspberryPiBaseUrl ? 'Configured' : 'Unconfigured'}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Court Status Pill & Edge Info */}
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>Edge Hardware Status:</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: isConfigured
                      ? 'rgba(0, 230, 118, 0.12)'
                      : 'rgba(255, 171, 0, 0.12)',
                    color: isConfigured ? '#00E676' : '#FFAB00',
                    border: `1px solid ${
                      isConfigured ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 171, 0, 0.3)'
                    }`,
                  }}
                >
                  {isConfigured ? <Check size={11} /> : <AlertCircle size={11} />}
                  {isConfigured ? 'EDGE PI CONFIGURED' : 'UNCONFIGURED (NO PI LINKED)'}
                </span>
              </div>

              {selectedCourt?.raspberryPiBaseUrl && (
                <div style={{ color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  Gateway: {selectedCourt.raspberryPiBaseUrl}
                </div>
              )}
            </div>
          </div>

          {/* If Result with Playable URL exists, show Inline Video Player */}
          {result?.playableUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 230, 118, 0.1)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  borderRadius: 8,
                }}
              >
                <CheckCircle2 size={18} color="var(--primary-neon)" />
                <div style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>
                  <strong>Video Extracted Successfully!</strong> Recorded match footage from NVR is ready to play.
                </div>
              </div>

              {/* Video Player Box */}
              <div
                ref={containerRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundColor: '#000000',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  src={result.playableUrl}
                  playsInline
                  autoPlay
                  controls={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onClick={togglePlay}
                />

                {/* Video Controls Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px 18px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      onClick={togglePlay}
                      style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={toggleMute}
                      style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', fontWeight: 600 }}>
                      {result.venueName} — {result.courtName}
                    </span>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>

              {/* Extraction Metadata Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  padding: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Recording ID:</span>
                  <div style={{ color: '#FFFFFF', fontFamily: 'monospace', marginTop: 2 }}>{result.recordingId}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Time Window:</span>
                  <div style={{ color: '#FFFFFF', marginTop: 2 }}>
                    {new Date(result.startTime).toLocaleTimeString()} - {new Date(result.endTime).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Status:</span>
                  <div style={{ color: 'var(--primary-neon)', fontWeight: 700, marginTop: 2 }}>
                    {result.status.toUpperCase()} {result.cached ? '(Cached)' : ''}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Time Range & Extraction Selection Controls */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Dahua NVR continuously records 24/7 video footage. Select a time slice to extract the match MP4 file and upload it to the cloud:
              </div>

              {/* Preset selection tabs */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  EXTRACTION PRESETS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomTime(false);
                      setDurationMinutes(1);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: !useCustomTime && durationMinutes === 1 ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                      backgroundColor: !useCustomTime && durationMinutes === 1 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: !useCustomTime && durationMinutes === 1 ? 'var(--primary-neon)' : '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} /> 1 Min Test Clip
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomTime(false);
                      setDurationMinutes(3);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: !useCustomTime && durationMinutes === 3 ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                      backgroundColor: !useCustomTime && durationMinutes === 3 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: !useCustomTime && durationMinutes === 3 ? 'var(--primary-neon)' : '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} /> 3 Min Segment
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomTime(false);
                      setDurationMinutes(5);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: !useCustomTime && durationMinutes === 5 ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                      backgroundColor: !useCustomTime && durationMinutes === 5 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: !useCustomTime && durationMinutes === 5 ? 'var(--primary-neon)' : '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} /> 5 Min Segment
                  </button>
                </div>
              </div>

              {/* Custom Date Time toggle */}
              <div style={{ marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setUseCustomTime(!useCustomTime)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: useCustomTime ? 'var(--primary-neon)' : 'var(--text-dim)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={13} />
                  <span>{useCustomTime ? 'Using Custom Start & End Time (Click for Presets)' : 'Or Specify Custom Start & End Time'}</span>
                </button>

                {useCustomTime && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                        START TIME
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '8px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                        END TIME
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '8px 10px',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Steps during Extraction */}
              {loading && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 230, 118, 0.05)',
                    border: '1px solid rgba(0, 230, 118, 0.2)',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-neon)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <RefreshCw size={16} className="spin" />
                    <span>Extracting footage from Dahua NVR...</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: currentStep >= 1 ? '#00E676' : 'var(--text-dim)' }}>
                      <Server size={14} /> 1. Contacting Raspberry Pi EVMS Gateway
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: currentStep >= 2 ? '#00E676' : 'var(--text-dim)' }}>
                      <Film size={14} /> 2. Slicing MP4 segment from NVR HDD storage
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: currentStep >= 3 ? '#00E676' : 'var(--text-dim)' }}>
                      <CloudUpload size={14} /> 3. Uploading MP4 to AWS S3 & signing playback stream
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 61, 87, 0.1)',
                    border: '1px solid rgba(255, 61, 87, 0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--accent-crimson)',
                    fontSize: '0.8rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {result?.playableUrl ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                <input
                  type="text"
                  readOnly
                  value={result.playableUrl}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCopyUrl}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {copied ? <CheckCircle2 size={13} color="var(--primary-neon)" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={result.playableUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <Download size={13} /> Download MP4
                </a>
                <a
                  href={result.playableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Open Tab
                </a>
                <button onClick={onClose} className="btn-primary" style={{ padding: '7px 18px', fontSize: '0.75rem' }}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.8rem' }} disabled={loading}>
                Cancel
              </button>

              <button
                onClick={handleExtract}
                disabled={loading || !isConfigured}
                className="btn-primary"
                style={{
                  padding: '8px 22px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: loading || !isConfigured ? 0.6 : 1,
                  backgroundColor: isConfigured ? 'var(--primary-neon)' : '#64748B',
                  color: '#05070A',
                  fontWeight: 700,
                  cursor: isConfigured && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Film size={14} />}
                <span>
                  {!isConfigured
                    ? 'Configure Court to Extract'
                    : loading
                    ? 'Extracting from NVR...'
                    : 'Fetch & Extract Video'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
