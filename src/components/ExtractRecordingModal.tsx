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
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type { CourtCamera } from '../types';

interface ExtractRecordingModalProps {
  court: CourtCamera;
  venueName: string;
  onClose: () => void;
  onExtractionSuccess?: () => void;
}

export const ExtractRecordingModal = ({
  court,
  venueName,
  onClose,
  onExtractionSuccess,
}: ExtractRecordingModalProps) => {
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
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(1);

    try {
      // Step 1: Send request to backend
      const payload: any = {
        cameraId: court.cameraId,
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
      setResult(res);
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
          maxWidth: result?.playableUrl ? 960 : 640,
          backgroundColor: '#0A0F1A',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.15)',
          transition: 'max-width 0.3s ease',
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
                {venueName} — {court.name} (Court {court.courtNumber})
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
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* If Result with Playable URL exists, show Player */}
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
                      NVR RECORDED MATCH
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
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '8px 22px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  backgroundColor: 'var(--primary-neon)',
                  color: '#05070A',
                  fontWeight: 700,
                }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Film size={14} />}
                <span>{loading ? 'Extracting from NVR...' : 'Fetch & Extract Video'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
