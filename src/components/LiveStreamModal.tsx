import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Copy,
  CheckCircle2,
  ExternalLink,
  Radio,
  Wifi,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { CourtCamera } from '../types';

interface LiveStreamModalProps {
  court: CourtCamera;
  venueName: string;
  playbackUrl: string;
  onClose: () => void;
  onStopStream?: () => void;
}

export const LiveStreamModal = ({
  court,
  venueName,
  playbackUrl,
  onClose,
  onStopStream,
}: LiveStreamModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [streamHealth, setStreamHealth] = useState<'CONNECTING' | 'LIVE' | 'BUFFERING' | 'ERROR'>('CONNECTING');
  const [stats, setStats] = useState({
    resolution: '1080p HD',
    fps: 30,
    bitrate: '2.4 Mbps',
    latency: '1.2s',
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
      });

      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamHealth('LIVE');
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setStreamHealth('LIVE');
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
        if (data.details.totalduration) {
          const level = hls?.levels[hls.currentLevel];
          if (level) {
            setStats((prev) => ({
              ...prev,
              resolution: `${level.width}x${level.height}`,
              bitrate: `${(level.bitrate / 1000000).toFixed(1)} Mbps`,
            }));
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamHealth('BUFFERING');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamHealth('BUFFERING');
              hls?.recoverMediaError();
              break;
            default:
              setStreamHealth('ERROR');
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        setStreamHealth('LIVE');
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setStreamHealth('ERROR');
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [playbackUrl]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(16px)',
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
          maxWidth: 960,
          backgroundColor: '#0C1017',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 230, 118, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                backgroundColor:
                  streamHealth === 'LIVE'
                    ? 'rgba(0, 230, 118, 0.15)'
                    : streamHealth === 'BUFFERING'
                    ? 'rgba(255, 214, 0, 0.15)'
                    : 'rgba(255, 61, 87, 0.15)',
                border: `1px solid ${
                  streamHealth === 'LIVE'
                    ? 'rgba(0, 230, 118, 0.4)'
                    : streamHealth === 'BUFFERING'
                    ? 'rgba(255, 214, 0, 0.4)'
                    : 'rgba(255, 61, 87, 0.4)'
                }`,
                color:
                  streamHealth === 'LIVE'
                    ? '#00E676'
                    : streamHealth === 'BUFFERING'
                    ? '#FFD600'
                    : '#FF3D57',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              <span className="live-pulse" />
              {streamHealth}
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {venueName} — {court.name} (Court {court.courtNumber})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                Relayed from NVR via Raspberry Pi Edge Bridge to Mux Broadcast CDN
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onStopStream && (
              <button
                onClick={onStopStream}
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-crimson)',
                  borderColor: 'rgba(255, 61, 87, 0.3)',
                }}
              >
                End Stream
              </button>
            )}

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
        </div>

        {/* Video Player Canvas */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={togglePlay}
          />

          {/* Buffering or Offline Overlay */}
          {streamHealth === 'BUFFERING' && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '16px 24px',
                borderRadius: 12,
                backdropFilter: 'blur(8px)',
              }}
            >
              <RefreshCw size={24} className="spin" color="var(--primary-neon)" />
              <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600 }}>
                Connecting to Mux Ingest Pipeline...
              </span>
            </div>
          )}

          {streamHealth === 'ERROR' && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(20, 10, 10, 0.85)',
                padding: '20px 28px',
                borderRadius: 12,
                border: '1px solid rgba(255, 61, 87, 0.4)',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={28} color="var(--accent-crimson)" />
              <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700 }}>
                Stream Initializing or Signal Standby
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: 360 }}>
                The Pi bridge is starting the FFmpeg relay. Video will begin automatically once chunks are ingested.
              </span>
            </div>
          )}

          {/* Stream Overlay HUD (Top Left) */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              display: 'flex',
              gap: 8,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.7rem',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              <Wifi size={12} color="var(--primary-neon)" />
              {stats.resolution} • {stats.fps} FPS
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.7rem',
                color: '#00E5FF',
                fontWeight: 600,
              }}
            >
              <Activity size={12} color="#00E5FF" />
              {stats.latency} Latency
            </div>
          </div>

          {/* Video Control Bar (Bottom) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '14px 20px',
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={togglePlay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#FFFFFF', fontWeight: 600 }}>
                <Radio size={14} color="var(--primary-neon)" />
                <span>COURT LIVE BROADCAST</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={toggleFullscreen}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Fullscreen"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stream Sharing & Edge Metadata */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 320 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              HLS Stream URL:
            </div>
            <input
              type="text"
              readOnly
              value={playbackUrl}
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '6px 10px',
                color: 'var(--primary-neon)',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCopyLink}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <CheckCircle2 size={13} color="var(--primary-neon)" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={playbackUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Open Stream
            </a>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ padding: '6px 18px', fontSize: '0.75rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
