import React, { useMemo, useState } from 'react';
import {
  X,
  Building2,
  LayoutGrid,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import {
  SPORTS_OPTIONS,
  type CourtSetupDraft,
  type SportOption,
  type VenueSetupDraft,
} from '../types';

const STEPS = [
  { id: 'venue', label: 'Venue / Arena', icon: Building2 },
  { id: 'courts', label: 'Courts', icon: LayoutGrid },
  { id: 'edge', label: 'Pi & NVR', icon: Cpu },
  { id: 'review', label: 'Review & Save', icon: CheckCircle2 },
] as const;

const DEFAULT_DRAFT: VenueSetupDraft = {
  name: '',
  sportsSupported: ['Pickleball'],
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  location: '',
  description: '',
  openingTime: '06:00:00',
  closingTime: '22:00:00',
  latitude: '19.0760',
  longitude: '72.8777',
  contactPhone: '',
  contactEmail: '',
  courts: [
    {
      courtNumber: 1,
      name: 'Court 1',
      raspberryPiBaseUrl: '',
      nvrChannels: '1',
    },
  ],
};

function emptyCourt(number: number): CourtSetupDraft {
  return {
    courtNumber: number,
    name: `Court ${number}`,
    raspberryPiBaseUrl: '',
    nvrChannels: String(number),
  };
}

function buildEvmsCourtChannels(courts: CourtSetupDraft[]): string {
  return courts
    .filter((c) => c.nvrChannels.trim())
    .map((c) => `${c.courtNumber}:${c.nvrChannels.replace(/\s+/g, '')}`)
    .join(';');
}

interface VenueSetupWizardModalProps {
  onClose: () => void;
  onComplete: (turfId: string) => void;
}

export const VenueSetupWizardModal: React.FC<VenueSetupWizardModalProps> = ({
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<VenueSetupDraft>({ ...DEFAULT_DRAFT, courts: [emptyCourt(1)] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evmsPreview = useMemo(() => buildEvmsCourtChannels(draft.courts), [draft.courts]);

  const updateDraft = (patch: Partial<VenueSetupDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateCourt = (index: number, patch: Partial<CourtSetupDraft>) => {
    setDraft((prev) => ({
      ...prev,
      courts: prev.courts.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  const addCourt = () => {
    const nextNum = Math.max(0, ...draft.courts.map((c) => c.courtNumber)) + 1;
    setDraft((prev) => ({ ...prev, courts: [...prev.courts, emptyCourt(nextNum)] }));
  };

  const removeCourt = (index: number) => {
    if (draft.courts.length <= 1) return;
    setDraft((prev) => ({ ...prev, courts: prev.courts.filter((_, i) => i !== index) }));
  };

  const toggleSport = (sport: SportOption) => {
    setDraft((prev) => {
      const has = prev.sportsSupported.includes(sport);
      return {
        ...prev,
        sportsSupported: has
          ? prev.sportsSupported.filter((s) => s !== sport)
          : [...prev.sportsSupported, sport],
      };
    });
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!draft.name.trim()) return 'Venue / arena name is required.';
      if (!draft.closingTime.trim()) return 'Closing time is required.';
      if (draft.sportsSupported.length === 0) return 'Select at least one sport.';
      if (!draft.city.trim()) return 'City is required.';
    }
    if (step === 1) {
      if (draft.courts.length === 0) return 'Add at least one court.';
      for (const c of draft.courts) {
        if (c.courtNumber < 1 || c.courtNumber > 99) return 'Court numbers must be between 1 and 99.';
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSave = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const lat = parseFloat(draft.latitude) || 19.076;
      const lng = parseFloat(draft.longitude) || 72.8777;

      const turf = await AdminApi.createTurf({
        name: draft.name.trim(),
        closing_time: draft.closingTime.trim(),
        opening_time: draft.openingTime.trim() || undefined,
        sports_supported: draft.sportsSupported,
        city: draft.city.trim(),
        state: draft.state.trim() || undefined,
        country: draft.country.trim() || undefined,
        location: draft.location.trim() || draft.city.trim(),
        description: draft.description.trim() || undefined,
        latitude: lat,
        longitude: lng,
        contact_phone: draft.contactPhone.trim() || undefined,
        contact_email: draft.contactEmail.trim() || undefined,
      });

      const turfId = turf.id;
      if (!turfId) throw new Error('Venue created but no turf ID returned from API.');

      for (const court of draft.courts) {
        await AdminApi.createCameraMapping({
          turfId,
          court_number: court.courtNumber,
          name: court.name.trim() || `Court ${court.courtNumber}`,
          raspberryPiBaseUrl: court.raspberryPiBaseUrl.trim() || undefined,
        });
      }

      onComplete(turfId);
      onClose();
    } catch (saveErr: any) {
      setError(saveErr.response?.data?.message || saveErr.message || 'Failed to save venue setup.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: '#FFFFFF',
    fontSize: '0.88rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0, 229, 255, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Venue Setup Wizard
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Arena → Courts → Pi gateway (NVR is configured on the Pi, not in the database)
              </p>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: active ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(0, 229, 255, 0.35)' : 'var(--border-subtle)'}`,
                    color: done ? 'var(--primary-neon)' : active ? '#FFFFFF' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={12} />
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: 16,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 61, 87, 0.1)',
                border: '1px solid var(--accent-crimson)',
                color: 'var(--accent-crimson)',
                display: 'flex',
                gap: 10,
                fontSize: '0.8rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Venue / Arena name *</label>
                <input
                  style={inputStyle}
                  placeholder="TSG Sports Arena | Eskay Resort"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Sports supported *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SPORTS_OPTIONS.map((sport) => {
                    const selected = draft.sportsSupported.includes(sport);
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => toggleSport(sport)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          border: `1px solid ${selected ? 'var(--primary-neon)' : 'var(--border-subtle)'}`,
                          backgroundColor: selected ? 'rgba(0, 230, 118, 0.12)' : 'transparent',
                          color: selected ? 'var(--primary-neon)' : 'var(--text-muted)',
                        }}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input style={inputStyle} value={draft.city} onChange={(e) => updateDraft({ city: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input style={inputStyle} value={draft.state} onChange={(e) => updateDraft({ state: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Location / address label</label>
                <input
                  style={inputStyle}
                  placeholder="Eskay Resort, Santacruz West"
                  value={draft.location}
                  onChange={(e) => updateDraft({ location: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Opening</label>
                  <input style={inputStyle} value={draft.openingTime} onChange={(e) => updateDraft({ openingTime: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Closing *</label>
                  <input style={inputStyle} value={draft.closingTime} onChange={(e) => updateDraft({ closingTime: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input style={inputStyle} value={draft.country} onChange={(e) => updateDraft({ country: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Latitude</label>
                  <input style={inputStyle} value={draft.latitude} onChange={(e) => updateDraft({ latitude: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Longitude</label>
                  <input style={inputStyle} value={draft.longitude} onChange={(e) => updateDraft({ longitude: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Each court becomes one row in the <code style={{ color: 'var(--accent-cyan)' }}>cameras</code> table, linked to this venue.
              </p>

              {draft.courts.map((court, index) => (
                <div
                  key={`court-${index}`}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>Court #{index + 1}</span>
                    {draft.courts.length > 1 && (
                      <button type="button" onClick={() => removeCourt(index)} style={{ background: 'none', border: 'none', color: 'var(--accent-crimson)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Number *</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        style={inputStyle}
                        value={court.courtNumber}
                        onChange={(e) => updateCourt(index, { courtNumber: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Display label</label>
                      <input
                        style={inputStyle}
                        value={court.name}
                        onChange={(e) => updateCourt(index, { name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Raspberry Pi gateway URL</label>
                    <input
                      style={inputStyle}
                      placeholder="https://raspberrypi-court11.taild82368.ts.net:8443"
                      value={court.raspberryPiBaseUrl}
                      onChange={(e) => updateCourt(index, { raspberryPiBaseUrl: e.target.value })}
                    />
                  </div>
                </div>
              ))}

              <button type="button" onClick={addCourt} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 10 }}>
                <Plus size={14} />
                Add another court
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                NVR credentials are <strong style={{ color: '#FFFFFF' }}>not stored in Postgres</strong>. Configure them on the Raspberry Pi at the venue.
              </p>

              {draft.courts.map((court, index) => (
                <div key={`nvr-${index}`} style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>
                    Court {court.courtNumber} — NVR channel(s)
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="1,2"
                    value={court.nvrChannels}
                    onChange={(e) => updateCourt(index, { nvrChannels: e.target.value })}
                  />
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    Comma-separated NVR channels for this court (used to generate Pi env below)
                  </p>
                </div>
              ))}

              <div
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Copy to Pi <code style={{ color: 'var(--accent-cyan)' }}>EVMS_COURT_CHANNELS</code>
                </div>
                <pre style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {evmsPreview || '(set NVR channels on previous fields)'}
                </pre>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Also set on Pi: <code>EVMS_NVR_HOST</code>, <code>EVMS_NVR_USERNAME</code>, <code>EVMS_NVR_PASSWORD</code>,{' '}
                <code>EVMS_NVR_TIMEZONE=Asia/Kolkata</code>, and live gateway <code>FINAL_SETUP_API_KEY</code> matching Render{' '}
                <code>PI_LIVE_API_KEY</code>.
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.82rem' }}>
              <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>1. Venue → turfs</div>
                <div style={{ color: 'var(--text-muted)' }}>{draft.name}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 4 }}>
                  {draft.city}, {draft.state} · {draft.sportsSupported.join(', ')}
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  2. Courts → cameras ({draft.courts.length})
                </div>
                {draft.courts.map((c) => (
                  <div key={c.courtNumber} style={{ marginBottom: 8, color: 'var(--text-muted)' }}>
                    Court {c.courtNumber}: {c.name || `Court ${c.courtNumber}`}
                    {c.raspberryPiBaseUrl ? (
                      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>
                        {c.raspberryPiBaseUrl}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-amber)' }}>Pi URL not set — live/extract disabled</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>3. Pi env (manual)</div>
                <pre style={{ fontSize: '0.72rem', color: 'var(--primary-neon)', margin: 0 }}>{evmsPreview}</pre>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || saving}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', opacity: step === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}>
              Next
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}
            >
              {saving ? 'Saving…' : 'Save to database'}
              <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
