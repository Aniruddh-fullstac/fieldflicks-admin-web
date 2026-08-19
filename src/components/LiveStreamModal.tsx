import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  ExternalLink,
  Radio,
  RefreshCw,
  Share2,
  Video,
} from "lucide-react";
import type { CourtCamera } from "../types";

// ==========================================
// Inner Stream Player Component
// ==========================================
interface StreamPlayerProps {
  playbackUrl: string;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  label?: string;
}

const StreamPlayer = ({
  playbackUrl,
  isPlaying,
  isMuted,
  onTogglePlay,
  label,
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamHealth, setStreamHealth] = useState<
    "CONNECTING" | "LIVE" | "BUFFERING" | "ERROR"
  >("CONNECTING");
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to Edge Relay & Mux Live CDN...",
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    let hls: Hls | null = null;
    let pollInterval: any = null;

    const startHls = () => {
      if (Hls.isSupported()) {
        if (hls) hls.destroy();

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
          setStreamHealth("LIVE");
          setStatusMessage("Live Broadcast Active");
          if (isPlaying) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (
            data.response?.code === 412 ||
            (data.details && data.details.includes("manifestLoadError"))
          ) {
            setStreamHealth("CONNECTING");
            setStatusMessage(
              "Mux stream idle — awaiting live RTMP ingest feed from venue camera...",
            );
            setTimeout(() => {
              hls?.loadSource(playbackUrl);
            }, 3000);
            return;
          }

          if (data.fatal) {
            setStreamHealth("BUFFERING");
            setStatusMessage("Syncing live frames with low-latency CDN...");
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls?.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls?.recoverMediaError();
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
        video.addEventListener("loadedmetadata", () => {
          setStreamHealth("LIVE");
          setStatusMessage("Live Broadcast Active");
          if (isPlaying) video.play().catch(() => {});
        });
        video.addEventListener("error", () => {
          setStreamHealth("CONNECTING");
          setStatusMessage("Awaiting live feed from venue camera...");
          setTimeout(() => {
            if (video) video.src = playbackUrl;
          }, 3000);
        });
      }
    };

    startHls();

    pollInterval = setInterval(() => {
      if (streamHealth === "CONNECTING" || streamHealth === "BUFFERING") {
        if (hls) {
          hls.loadSource(playbackUrl);
          hls.startLoad();
        }
      }
    }, 4000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (hls) hls.destroy();
    };
  }, [playbackUrl]);

  // Sync play/pause from parent
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 30,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "4px 8px",
            borderRadius: 4,
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      )}
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          cursor: "pointer",
        }}
        onClick={onTogglePlay}
      />

      {streamHealth !== "LIVE" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            backgroundColor: "rgba(6, 10, 18, 0.88)",
            backdropFilter: "blur(10px)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 230, 118, 0.12)",
              border: "1px solid rgba(0, 230, 118, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00E676",
            }}
          >
            <RefreshCw size={22} className="spin" />
          </div>
          <div
            style={{ textAlign: "center", maxWidth: "80%", padding: "0 20px" }}
          >
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              Connecting {label} Pipeline
            </h4>
            <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>
              {statusMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Main Modal Component
// ==========================================
interface LiveStreamModalProps {
  court: CourtCamera;
  venueName: string;
  playbackUrl: string;
  secondaryPlaybackUrl?: string;
  dualChannelNote?: string;
  onClose: () => void;
  onStopStream?: () => void;
}

export const LiveStreamModal = ({
  court,
  venueName,
  playbackUrl,
  secondaryPlaybackUrl,
  dualChannelNote,
  onClose,
  onStopStream,
}: LiveStreamModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedWatchLink, setCopiedWatchLink] = useState(false);
  const [copiedHlsLink, setCopiedHlsLink] = useState(false);

  const playbackId = playbackUrl.split("/").pop()?.replace(".m3u8", "") || "";
  const watchWebUrl = `${window.location.origin}/?stream=${playbackId}&title=${encodeURIComponent(
    `${venueName} — ${court.name}`,
  )}`;

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCopyWatchLink = () => {
    navigator.clipboard.writeText(watchWebUrl);
    setCopiedWatchLink(true);
    setTimeout(() => setCopiedWatchLink(false), 2500);
  };

  const handleCopyHls = () => {
    navigator.clipboard.writeText(playbackUrl);
    setCopiedHlsLink(true);
    setTimeout(() => setCopiedHlsLink(false), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(4, 7, 13, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 200,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: secondaryPlaybackUrl ? 1200 : 960,
          backgroundColor: "rgba(10, 15, 24, 0.95)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              {venueName} — {court.name}
            </h3>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#94A3B8",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-neon)",
                  boxShadow: "0 0 8px var(--primary-neon)",
                }}
              />
              Live Direct Connect
              {dualChannelNote ? ` · ${dualChannelNote}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onStopStream && (
              <button
                onClick={onStopStream}
                className="btn-secondary"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.75rem",
                  color: "var(--accent-crimson)",
                  borderColor: "rgba(255, 61, 87, 0.3)",
                }}
              >
                Stop Stream
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                cursor: "pointer",
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
            position: "relative",
            width: "100%",
            aspectRatio: secondaryPlaybackUrl ? "auto" : "16/9",
            height: secondaryPlaybackUrl ? "60vh" : "auto",
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Left / Primary Stream */}
          <StreamPlayer
            playbackUrl={playbackUrl}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onTogglePlay={togglePlay}
            label={secondaryPlaybackUrl ? "Channel 1" : undefined}
          />

          {/* Right / Secondary Stream */}
          {secondaryPlaybackUrl && (
            <>
              <div
                style={{ width: 2, backgroundColor: "#1E293B", zIndex: 20 }}
              />
              <StreamPlayer
                playbackUrl={secondaryPlaybackUrl}
                isPlaying={isPlaying}
                isMuted={isMuted}
                onTogglePlay={togglePlay}
                label="Channel 2"
              />
            </>
          )}

          {/* Bottom Floating Controls Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "12px 18px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 40,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                onClick={togglePlay}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={toggleMute}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.75rem",
                  color: "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                <Radio size={14} color="var(--primary-neon)" />
                <span>COURT LIVE BROADCAST</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={toggleFullscreen}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Fullscreen"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stream Sharing & Links */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Share Watch URL for Any Browser */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              minWidth: 320,
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              Browser Watch Link:
            </div>
            <input
              type="text"
              readOnly
              value={watchWebUrl}
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                padding: "6px 10px",
                color: "var(--accent-cyan)",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                outline: "none",
              }}
            />
            <button
              onClick={handleCopyWatchLink}
              className="btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {copiedWatchLink ? (
                <CheckCircle2 size={13} color="var(--primary-neon)" />
              ) : (
                <Share2 size={13} />
              )}
              {copiedWatchLink ? "Copied Link" : "Copy Watch Link"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href={watchWebUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{
                padding: "7px 14px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                backgroundColor: "var(--primary-neon)",
                color: "#05070A",
                fontWeight: 700,
              }}
            >
              <ExternalLink size={13} /> Open Player
            </a>

            <button
              onClick={handleCopyHls}
              className="btn-secondary"
              title="Copy raw .m3u8 stream manifest for VLC / OBS"
              style={{
                padding: "6px 10px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Video size={12} />
              <span>{copiedHlsLink ? "Copied m3u8" : "Raw HLS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
