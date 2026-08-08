import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Share2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface WatchStreamViewProps {
  playbackId: string;
  streamTitle?: string;
  onBack?: () => void;
}

export const WatchStreamView = ({
  playbackId,
  streamTitle = 'FieldFlicks Live Court Broadcast',
  onBack,
}: WatchStreamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'CONNECTING' | 'LIVE' | 'BUFFERING' | 'OFFLINE'>('CONNECTING');
  const [statusMessage, setStatusMessage] = useState('Connecting to Edge Relay & Mux Live CDN...');

  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    let hls: Hls | null = null;
    let pollTimer: any = null;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        if (hls) {
          hls.destroy();
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 30,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 30,
          fragLoadingTimeOut: 15000,
          fragLoadingMaxRetry: 30,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 4,
          maxBufferLength: 8,
        });

        hls.loadSource(playbackUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('LIVE');
          setStatusMessage('Live Broadcast Active');
          video.play().catch(() => setIsPlaying(false));
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setStatus('BUFFERING');
            setStatusMessage('Waiting for initial camera keyframes from Edge bridge...');
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls?.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls?.recoverMediaError();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playbackUrl;
        video.addEventListener('loadedmetadata', () => {
          setStatus('LIVE');
          video.play().catch(() => setIsPlaying(false));
        });
      }
    };

    initPlayer();

    // Auto-retry polling every 3 seconds if connecting
    pollTimer = setInterval(() => {
      if (status === 'CONNECTING' || status === 'BUFFERING') {
        if (hls) {
          hls.startLoad();
        }
      }
    }, 3000);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (hls) hls.destroy();
    };
  }, [playbackId, playbackUrl]);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#05070B',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(12, 17, 26, 0.8)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(0, 230, 118, 0.15)',
                  border: '1px solid rgba(0, 230, 118, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00E676',
                }}
              >
                <Sparkles size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                Field<span style={{ color: '#00E676' }}>Flicks</span> Live
              </span>
            </div>
          )}

          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{streamTitle}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 20,
              backgroundColor:
                status === 'LIVE'
                  ? 'rgba(0, 230, 118, 0.15)'
                  : status === 'BUFFERING' || status === 'CONNECTING'
                  ? 'rgba(255, 214, 0, 0.15)'
                  : 'rgba(255, 61, 87, 0.15)',
              border: `1px solid ${
                status === 'LIVE'
                  ? 'rgba(0, 230, 118, 0.4)'
                  : status === 'BUFFERING' || status === 'CONNECTING'
                  ? 'rgba(255, 214, 0, 0.4)'
                  : 'rgba(255, 61, 87, 0.4)'
              }`,
              color:
                status === 'LIVE'
                  ? '#00E676'
                  : status === 'BUFFERING' || status === 'CONNECTING'
                  ? '#FFD600'
                  : '#FF3D57',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
            }}
          >
            <span className="live-pulse" />
            {status}
          </div>

          <button
            onClick={handleShare}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {copied ? <CheckCircle2 size={14} color="#00E676" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied!' : 'Share Stream'}</span>
          </button>
        </div>
      </header>

      {/* Main Video Arena */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            maxWidth: 1100,
            aspectRatio: '16/9',
            backgroundColor: '#000000',
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.12)',
          }}
        >
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            playsInline
            autoPlay
            muted={isMuted}
            onClick={togglePlay}
          />

          {/* Loading / Connecting Overlay */}
          {status !== 'LIVE' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 8, 14, 0.88)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 230, 118, 0.12)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00E676',
                }}
              >
                <RefreshCw size={26} className="spin" />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {status === 'CONNECTING' ? 'Initializing Live Stream' : 'Buffering Stream'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 6, lineHeight: 1.4 }}>
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Floating Controls Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '14px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
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
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                Ultra Low Latency HLS
              </span>
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
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
