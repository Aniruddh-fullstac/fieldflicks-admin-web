import React from 'react';
import {
  AlertTriangle,
  X,
  RefreshCw,
  WifiOff,
  Server,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

export interface DiagnosticErrorInfo {
  title: string;
  category: 'DEVICE_OFFLINE' | 'BACKEND_DEPLOYING' | 'AUTH_ERROR' | 'API_ERROR' | 'UNKNOWN';
  message: string;
  statusCode?: number;
  deviceUrl?: string;
  courtName?: string;
  courtNumber?: number;
  troubleshootingSteps?: string[];
  rawError?: string;
}

interface DiagnosticErrorModalProps {
  error: DiagnosticErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const parseDiagnosticError = (
  err: any,
  context?: { courtName?: string; courtNumber?: number; deviceUrl?: string }
): DiagnosticErrorInfo => {
  const status = err?.response?.status || err?.status;
  const data = err?.response?.data;
  const backendMsg = typeof data === 'string' ? data : data?.message || err?.message || '';
  const errorType = data?.error || '';

  // 1. Priority: Raspberry Pi Device / Pinggy Tunnel Unreachable or Offline
  if (
    errorType.includes('Device Unresponsive') ||
    backendMsg.toLowerCase().includes('raspberry pi') ||
    backendMsg.toLowerCase().includes('pinggy') ||
    backendMsg.toLowerCase().includes('offline or unreachable') ||
    backendMsg.includes('ECONNREFUSED') ||
    backendMsg.includes('ETIMEDOUT') ||
    backendMsg.toLowerCase().includes('did not respond')
  ) {
    const isPinggy404 = backendMsg.includes('404');
    const displayMsg = isPinggy404
      ? `The Pinggy reverse tunnel for this court has expired or the Raspberry Pi bridge is unreachable (${data?.piUrl || context?.deviceUrl || 'Pinggy URL'} returned 404).`
      : backendMsg || `The edge Raspberry Pi at ${context?.courtName || 'the court'} is not responding to stream commands.`;

    return {
      title: 'Court Camera Edge Bridge (Raspberry Pi) Offline',
      category: 'DEVICE_OFFLINE',
      statusCode: status || 502,
      message: displayMsg,
      courtName: context?.courtName,
      courtNumber: context?.courtNumber,
      deviceUrl: data?.piUrl || context?.deviceUrl,
      troubleshootingSteps: [
        'The Pinggy free tunnel on the venue Raspberry Pi may have expired or changed its URL.',
        'Ensure the Raspberry Pi at the court is powered ON and connected to the internet.',
        'Run the Pinggy or Tailscale tunnel script on the Raspberry Pi to restore the bridge link.',
        'Confirm the NVR is powered on and streaming RTSP video on local court channel.',
      ],
      rawError: backendMsg,
    };
  }

  // 2. Render Backend 502 or ECONNRESET (when Render is restarting)
  if (
    status === 502 ||
    status === 503 ||
    backendMsg.includes('ECONNRESET') ||
    backendMsg.includes('Network Error')
  ) {
    return {
      title: 'Backend Server Restarting / Deploying',
      category: 'BACKEND_DEPLOYING',
      statusCode: status || 502,
      message:
        'The Render backend server is currently rebuilding or restarting with the latest updates. Network requests are temporarily unavailable.',
      courtName: context?.courtName,
      deviceUrl: 'https://api.fieldflicks.com',
      troubleshootingSteps: [
        'Render takes ~30-45 seconds to spin up the container after a Git push.',
        'Wait 10-15 seconds and click "Retry Connection" below.',
        'If the issue persists, verify backend build status in Render dashboard.',
      ],
      rawError: backendMsg,
    };
  }

  // 3. 401 Unauthorized
  if (status === 401) {
    return {
      title: 'Unauthorized Request',
      category: 'AUTH_ERROR',
      statusCode: 401,
      message: 'The request was rejected due to missing or expired authorization credentials.',
      troubleshootingSteps: [
        'Refresh your browser page to reload active credentials.',
        'Verify the backend endpoint has appropriate public/admin access permissions.',
      ],
      rawError: backendMsg,
    };
  }

  // 4. Default Fallback
  return {
    title: 'Stream Command Failed',
    category: 'API_ERROR',
    statusCode: status || 500,
    message:
      backendMsg ||
      'An unexpected error occurred while communicating with the video streaming service.',
    courtName: context?.courtName,
    courtNumber: context?.courtNumber,
    deviceUrl: context?.deviceUrl,
    troubleshootingSteps: [
      'Check browser console and backend logs for specific stack traces.',
      'Retry the action or sync fleet status.',
    ],
    rawError: backendMsg,
  };
};

export const DiagnosticErrorModal: React.FC<DiagnosticErrorModalProps> = ({
  error,
  onClose,
  onRetry,
}) => {
  if (!error) return null;

  const isOffline = error.category === 'DEVICE_OFFLINE';
  const isDeploying = error.category === 'BACKEND_DEPLOYING';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 300,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 580,
          backgroundColor: '#0E131C',
          borderRadius: 16,
          border: `1px solid ${
            isOffline ? 'rgba(255, 61, 87, 0.5)' : isDeploying ? 'rgba(255, 214, 0, 0.5)' : 'rgba(255, 61, 87, 0.4)'
          }`,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 61, 87, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: isOffline
              ? 'rgba(255, 61, 87, 0.08)'
              : isDeploying
              ? 'rgba(255, 214, 0, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isOffline
                  ? 'rgba(255, 61, 87, 0.15)'
                  : isDeploying
                  ? 'rgba(255, 214, 0, 0.15)'
                  : 'rgba(255, 61, 87, 0.15)',
                border: `1px solid ${
                  isOffline
                    ? 'var(--accent-crimson)'
                    : isDeploying
                    ? '#FFD600'
                    : 'var(--accent-crimson)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isOffline ? '#FF3D57' : isDeploying ? '#FFD600' : '#FF3D57',
              }}
            >
              {isOffline ? (
                <WifiOff size={22} />
              ) : isDeploying ? (
                <Server size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isOffline ? '#FF3D57' : isDeploying ? '#FFD600' : 'var(--text-muted)',
                }}
              >
                Diagnostic Alert • HTTP {error.statusCode || 500}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0' }}>
                {error.title}
              </h3>
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Error Explanation */}
          <div
            style={{
              padding: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#FFFFFF', lineHeight: 1.5, fontWeight: 500 }}>
              {error.message}
            </div>

            {(error.courtName || error.deviceUrl) && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: '0.75rem',
                }}
              >
                {error.courtName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                    <Cpu size={13} color="var(--primary-neon)" />
                    Target Court: <strong style={{ color: '#FFFFFF' }}>{error.courtName}</strong>
                    {error.courtNumber && <span>(Channel {error.courtNumber})</span>}
                  </div>
                )}
                {error.deviceUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                    <Server size={13} color="#00E5FF" />
                    Target Bridge URL:{' '}
                    <code style={{ color: '#00E5FF', wordBreak: 'break-all' }}>{error.deviceUrl}</code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actionable Troubleshooting Steps */}
          {error.troubleshootingSteps && error.troubleshootingSteps.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldAlert size={14} color="#FFD600" />
                Troubleshooting Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {error.troubleshootingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 230, 118, 0.1)',
                        color: 'var(--primary-neon)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
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
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>

          {onRetry && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
