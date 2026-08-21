import React, { useState } from 'react';
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type { CourtCamera } from '../types';

interface ConfigureCourtModalProps {
  court?: CourtCamera | null;
  venueId: string;
  venueName: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ConfigureCourtModal: React.FC<ConfigureCourtModalProps> = ({
  court,
  venueId,
  venueName,
  onClose,
  onSaved,
}) => {
  const isEditing = !!court;

  const [name, setName] = useState(court?.name || '');
  const [courtNumber, setCourtNumber] = useState<number>(court?.courtNumber ?? 1);
  const [piUrl, setPiUrl] = useState(court?.raspberryPiBaseUrl || '');
  const [piApiKey, setPiApiKey] = useState(court?.raspberryPiApiKey || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestConnectivity = async () => {
    if (!piUrl.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Please enter a Raspberry Pi URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await AdminApi.testPiConnectivity(piUrl.trim());
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message || (res.success ? 'Device reached successfully!' : 'Device unreachable.'),
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing && court) {
        await AdminApi.updateCameraMapping(court.cameraId, {
          name: name.trim() || `Court ${courtNumber}`,
          court_number: courtNumber,
          raspberryPiBaseUrl: piUrl.trim() || undefined,
          raspberryPiApiKey: piApiKey.trim() || undefined,
        });
      } else {
        await AdminApi.createCameraMapping({
          turfId: venueId,
          name: name.trim() || `Court ${courtNumber}`,
          court_number: courtNumber,
          raspberryPiBaseUrl: piUrl.trim() || undefined,
          raspberryPiApiKey: piApiKey.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save court device configuration.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 540,
          backgroundColor: '#0C111C',
          borderRadius: 16,
          border: '1px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 230, 118, 0.12)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 230, 118, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(0, 230, 118, 0.12)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-neon)',
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {isEditing ? 'Configure Court Hardware Bridge' : 'Add Court Camera Mapping'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {venueName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 61, 87, 0.1)',
                border: '1px solid var(--accent-crimson)',
                color: 'var(--accent-crimson)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.8rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Court Number and Display Label */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Court Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={courtNumber}
                onChange={(e) => setCourtNumber(parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Display Label
              </label>
              <input
                type="text"
                placeholder={`Court ${courtNumber}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Raspberry Pi Gateway Base URL */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Raspberry Pi Gateway Base URL
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                Port 8443 (Live) / Tailscale
              </span>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="url"
                placeholder="https://raspberrypi-court11.taild82368.ts.net:8443"
                value={piUrl}
                onChange={(e) => {
                  setPiUrl(e.target.value);
                  setTestResult(null);
                }}
                style={{
                  width: '100%',
                  padding: '11px 85px 11px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleTestConnectivity}
                disabled={isTesting || !piUrl.trim()}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  bottom: 6,
                  padding: '0 12px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(0, 230, 118, 0.15)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  color: 'var(--primary-neon)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isTesting || !piUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: isTesting || !piUrl.trim() ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {isTesting ? (
                  <RefreshCw size={12} className="spin" />
                ) : (
                  <Wifi size={12} />
                )}
                <span>{isTesting ? 'Testing' : 'Test'}</span>
              </button>
            </div>

            {/* Quick insert preset button */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Quick Preset:</span>
              <button
                type="button"
                onClick={() => {
                  setPiUrl('https://raspberrypi-court11.taild82368.ts.net:8443');
                  setTestResult(null);
                }}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'monospace',
                }}
              >
                <Sparkles size={10} />
                Court 11 Tailscale Gateway (:8443)
              </button>
            </div>
          </div>

          {/* Custom X-API-KEY */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                X-API-KEY (Optional)
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <input
                type="text"
                placeholder="Custom API Key for Edge Node"
                value={piApiKey}
                onChange={(e) => setPiApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Overrides the global API key. Essential for custom nodes like cpu.taild82368.ts.net
            </p>
          </div>

          {/* Test Connectivity Result Box */}
          {testResult && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: testResult.success ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 87, 0.1)',
                border: `1px solid ${testResult.success ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 87, 0.3)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: '0.8rem',
              }}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} color="var(--primary-neon)" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertCircle size={16} color="var(--accent-crimson)" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div>
                <div style={{ fontWeight: 700, color: testResult.success ? 'var(--primary-neon)' : 'var(--accent-crimson)' }}>
                  {testResult.success ? '✓ Gateway Reachable & Online' : '✗ Gateway Connection Failed'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#E2E8F0', marginTop: 2, fontFamily: 'monospace' }}>
                  {testResult.message}
                </div>
              </div>
            </div>
          )}

          {/* Explanatory Info Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFFFFF', fontWeight: 600, marginBottom: 4 }}>
              <ShieldCheck size={14} color="var(--primary-neon)" />
              <span>How Stream Activation Works</span>
            </div>
            When an athlete or admin starts a live stream, FieldFlicks backend instructs FFmpeg on this Raspberry Pi URL to capture the RTSP sub-stream and transcode it to Mux RTMP in real-time.
          </div>

          {/* Modal Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
              <span>{isEditing ? 'Save Configuration' : 'Add Court'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
