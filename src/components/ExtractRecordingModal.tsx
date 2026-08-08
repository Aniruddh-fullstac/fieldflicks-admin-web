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
  Calendar,
  Layers,
  ArrowRight,
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

  // Picker Mode: 'preset' | 'custom'
  const [pickerMode, setPickerMode] = useState<'preset' | 'custom'>('preset');

  // Preset configuration
  const [presetDuration, setPresetDuration] = useState<number>(1);
  const [presetOffsetMinutes, setPresetOffsetMinutes] = useState<number>(15);

  // Custom Calendar & Time Picker state
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedStartTime, setSelectedStartTime] = useState<string>(''); // HH:MM
  const [selectedDuration, setSelectedDuration] = useState<number>(5); // in minutes
  const [useExplicitEndTime, setUseExplicitEndTime] = useState<boolean>(false);
  const [selectedEndTime, setSelectedEndTime] = useState<string>(''); // HH:MM

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

  // Initialize dates & times
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Default Date to Today (Local)
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setSelectedDate(todayStr);

    // Default Start Time to 15 minutes ago
    const fifteenAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const startStr = `${pad(fifteenAgo.getHours())}:${pad(fifteenAgo.getMinutes())}`;
    setSelectedStartTime(startStr);

    // Default End Time to 10 minutes ago (5 min clip)
    const tenAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const endStr = `${pad(tenAgo.getHours())}:${pad(tenAgo.getMinutes())}`;
    setSelectedEndTime(endStr);
  }, []);

  // Fetch venues if not provided
  useEffect(() => {
    if (!passedVenues || passedVenues.length === 0) {
      setLoadingVenues(true);
      AdminApi.getFleet()
        .then((data) => {
          setVenues(data);
          if (data.length > 0) {
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

  const handleVenueChange = (newVenueId: string) => {
    setSelectedVenueId(newVenueId);
    const venue = venues.find((v) => v.turfId === newVenueId);
    if (venue && venue.courts.length > 0) {
      setSelectedCameraId(venue.courts[0].cameraId);
    } else {
      setSelectedCameraId('');
    }
    setResult(null);
    setError(null);
  };

  const handleCourtChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    setResult(null);
    setError(null);
  };

  const isConfigured = !!(
    selectedCourt &&
    selectedCourt.raspberryPiBaseUrl &&
    selectedCourt.raspberryPiBaseUrl.trim().length > 0
  );

  // Quick Date Pill helper
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setSelectedDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  // Quick Time Pill helper
  const setQuickTime = (hours: number, minutes: number = 0) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    setSelectedStartTime(`${pad(hours)}:${pad(minutes)}`);
  };

  // Compute calculated timestamps for Custom Mode
  const getCalculatedTimeWindow = () => {
    if (pickerMode === 'preset') {
      const now = new Date();
      const end = new Date(now.getTime() - (presetOffsetMinutes - presetDuration) * 60 * 1000);
      const start = new Date(now.getTime() - presetOffsetMinutes * 60 * 1000);
      return {
        startDate: start,
        endDate: end,
        durationMinutes: presetDuration,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      };
    } else {
      if (!selectedDate || !selectedStartTime) {
        return null;
      }
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [startH, startM] = selectedStartTime.split(':').map(Number);

      const start = new Date(year, month - 1, day, startH, startM, 0, 0);

      let end: Date;
      let dur: number;

      if (useExplicitEndTime && selectedEndTime) {
        const [endH, endM] = selectedEndTime.split(':').map(Number);
        end = new Date(year, month - 1, day, endH, endM, 0, 0);
        if (end <= start) {
          // If end time is earlier, assume next day midnight overlap
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
        dur = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
      } else {
        dur = selectedDuration;
        end = new Date(start.getTime() + selectedDuration * 60 * 1000);
      }

      return {
        startDate: start,
        endDate: end,
        durationMinutes: dur,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      };
    }
  };

  const calculatedWindow = getCalculatedTimeWindow();

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

    if (!calculatedWindow) {
      setError('Please choose a valid Date and Start Time.');
      return;
    }

    if (calculatedWindow.endDate <= calculatedWindow.startDate) {
      setError('End Time must be strictly after Start Time.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(1);

    try {
      const payload: any = {
        cameraId: selectedCourt.cameraId,
        startTime: calculatedWindow.startIso,
        endTime: calculatedWindow.endIso,
      };

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
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: result?.playableUrl ? 960 : 720,
          backgroundColor: '#0A0F1A',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.15)',
          transition: 'max-width 0.3s ease',
          maxHeight: '94vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
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
                Select court, date & time window to extract match MP4 video from Dahua NVR storage
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
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {/* SECTION 1: VENUE & COURT SELECTION MATRIX */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              padding: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
            }}
          >
            {/* Venue Selector */}
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <MapPin size={12} color="var(--primary-neon)" /> 1. Select Venue / Arena
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
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
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
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Camera size={12} color="var(--primary-neon)" /> 2. Select Court / Channel
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
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
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

            {/* Hardware Status Pill */}
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 6,
                borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                fontSize: '0.72rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-dim)' }}>Edge Hardware:</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.68rem',
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

          {/* SECTION 2: RESULT PLAYER OR TIME PICKER */}
          {result?.playableUrl ? (
            /* Inline Video Player Box */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  padding: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: '0.72rem',
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
            /* SECTION 3: CALENDAR & TIME PICKER CONTROLS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Mode Switch Tabs */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: 4,
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPickerMode('preset')}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: pickerMode === 'preset' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                    color: pickerMode === 'preset' ? 'var(--primary-neon)' : 'var(--text-dim)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Clock size={14} /> Quick Presets (Recent Footage)
                </button>

                <button
                  type="button"
                  onClick={() => setPickerMode('custom')}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: pickerMode === 'custom' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                    color: pickerMode === 'custom' ? 'var(--primary-neon)' : 'var(--text-dim)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Calendar size={14} /> Calendar & Time Picker (Any Date/Hour)
                </button>
              </div>

              {pickerMode === 'preset' ? (
                /* PRESETS MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                    SELECT RECENT TIME SLICE
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                      { dur: 1, offset: 15, label: '1-Min Test Clip', sub: '15 mins ago (Instant Verify)' },
                      { dur: 3, offset: 15, label: '3-Min Highlight', sub: '15 mins ago' },
                      { dur: 5, offset: 20, label: '5-Min Segment', sub: '20 mins ago' },
                      { dur: 10, offset: 30, label: '10-Min Clip', sub: '30 mins ago' },
                      { dur: 30, offset: 60, label: '30-Min Half Match', sub: '1 hour ago' },
                      { dur: 60, offset: 90, label: '60-Min Full Match', sub: '90 mins ago' },
                    ].map((p) => {
                      const isSel = presetDuration === p.dur && presetOffsetMinutes === p.offset;
                      return (
                        <button
                          key={`${p.dur}-${p.offset}`}
                          type="button"
                          onClick={() => {
                            setPresetDuration(p.dur);
                            setPresetOffsetMinutes(p.offset);
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: isSel ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                            backgroundColor: isSel ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            color: isSel ? 'var(--primary-neon)' : '#FFFFFF',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{p.label}</div>
                          <div style={{ fontSize: '0.68rem', color: isSel ? '#00E676' : 'var(--text-dim)', marginTop: 2 }}>
                            {p.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* CUSTOM CALENDAR & TIME PICKER */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Row 1: Date Picker with Quick Date Pills */}
                  <div
                    style={{
                      padding: 14,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Calendar size={13} color="var(--primary-neon)" /> 1. Select Match Date
                      </label>

                      {/* Quick Date Pills */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setQuickDate(0)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDate(1)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          Yesterday
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDate(2)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          2 Days Ago
                        </button>
                      </div>
                    </div>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        outline: 'none',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>

                  {/* Row 2: Start Time & Duration / End Time */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {/* Start Time Column */}
                    <div
                      style={{
                        padding: 14,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <label
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Clock size={13} color="var(--primary-neon)" /> 2. Start Time
                      </label>

                      <input
                        type="time"
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#FFFFFF',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          outline: 'none',
                          colorScheme: 'dark',
                        }}
                      />

                      {/* Quick Start Time Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                          { h: 8, m: 0, l: '8:00 AM' },
                          { h: 10, m: 0, l: '10:00 AM' },
                          { h: 14, m: 0, l: '2:00 PM' },
                          { h: 16, m: 0, l: '4:00 PM' },
                          { h: 18, m: 0, l: '6:00 PM' },
                          { h: 20, m: 0, l: '8:00 PM' },
                        ].map((t) => (
                          <button
                            key={t.l}
                            type="button"
                            onClick={() => setQuickTime(t.h, t.m)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: '0.65rem',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                            }}
                          >
                            {t.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration / End Time Column */}
                    <div
                      style={{
                        padding: 14,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Layers size={13} color="var(--primary-neon)" /> 3. Match Duration
                        </label>

                        <button
                          type="button"
                          onClick={() => setUseExplicitEndTime(!useExplicitEndTime)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {useExplicitEndTime ? 'Switch to Duration (Mins)' : 'Or Exact End Time'}
                        </button>
                      </div>

                      {useExplicitEndTime ? (
                        <input
                          type="time"
                          value={selectedEndTime}
                          onChange={(e) => setSelectedEndTime(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            outline: 'none',
                            colorScheme: 'dark',
                          }}
                        />
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                          {[1, 2, 5, 10, 30, 60].map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => setSelectedDuration(dur)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: selectedDuration === dur ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                                backgroundColor: selectedDuration === dur ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                color: selectedDuration === dur ? 'var(--primary-neon)' : '#FFFFFF',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {dur === 60 ? '60m (1 hr)' : `${dur} mins`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE CALCULATED MATCH WINDOW BANNER */}
              {calculatedWindow && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 230, 118, 0.05)',
                    border: '1px solid rgba(0, 230, 118, 0.25)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={16} color="var(--primary-neon)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {calculatedWindow.startDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {calculatedWindow.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' '}<ArrowRight size={12} style={{ display: 'inline', margin: '0 2px' }} />{' '}
                        {calculatedWindow.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                        Extracting {calculatedWindow.durationMinutes} minute(s) segment from NVR HDD storage
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(0, 230, 118, 0.12)',
                      border: '1px solid rgba(0, 230, 118, 0.3)',
                      borderRadius: 12,
                      color: 'var(--primary-neon)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {calculatedWindow.durationMinutes} MINS
                  </span>
                </div>
              )}

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
