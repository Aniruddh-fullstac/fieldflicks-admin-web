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
  Download,
  Video,
} from 'lucide-react';

interface PlayVideoModalProps {
  title: string;
  subtitle?: string;
  videoUrl: string;
  onClose: () => void;
}

export const PlayVideoModal = ({
  title,
  subtitle,
  videoUrl,
  onClose,
}: PlayVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isHls = videoUrl.includes('.m3u8');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    let hls: Hls | null = null;
    setLoading(true);

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          }
        }
      });
    } else {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        setDuration(video.duration || 0);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('canplay', () => setLoading(false));
    }

    const handleTimeUpdate = () => {
      if (video) {
        setCurrentTime(video.currentTime);
        if (video.duration) setDuration(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (hls) hls.destroy();
    };
  }, [videoUrl, isHls]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          maxWidth: 960,
          backgroundColor: '#0A0F1A',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.15)',
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
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 230, 118, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-neon)',
              }}
            >
              <Video size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                  {subtitle}
                </p>
              )}
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

        {/* Video Canvas */}
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
            controls={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={togglePlay}
          />

          {loading && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                color: 'var(--primary-neon)',
              }}
            >
              <span className="spin" style={{ width: 28, height: 28, border: '3px solid rgba(0, 230, 118, 0.2)', borderTopColor: '#00E676', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Loading recording...</span>
            </div>
          )}

          {/* Video Controls Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 18px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 20,
            }}
          >
            {/* Seek Bar */}
            {duration > 0 && (
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary-neon)',
                  cursor: 'pointer',
                  height: 4,
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
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
                  title="Fullscreen"
                >
                  <Maximize size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & links */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Playable URL:
            </span>
            <input
              type="text"
              readOnly
              value={videoUrl}
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
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <CheckCircle2 size={13} color="var(--primary-neon)" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Download size={13} /> Direct File
            </a>

            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Open Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
