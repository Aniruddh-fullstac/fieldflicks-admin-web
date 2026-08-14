import React, { useEffect, useState } from 'react';
import {
  X,
  Database,
  RefreshCw,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type { DatabaseSnapshot, VenueFleet } from '../types';

interface DatabaseSnapshotModalProps {
  onClose: () => void;
  highlightTurfId?: string;
}

function TreeRow({
  label,
  sublabel,
  mono,
  accent,
  depth = 0,
}: {
  label: string;
  sublabel?: string;
  mono?: string;
  accent?: string;
  depth?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        paddingLeft: 12 + depth * 20,
        borderLeft: depth > 0 ? `2px solid ${accent || 'rgba(0, 230, 118, 0.25)'}` : undefined,
        marginLeft: depth > 0 ? 8 : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
        )}
        {mono && (
          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              color: 'var(--accent-cyan)',
              marginTop: 4,
              wordBreak: 'break-all',
            }}
          >
            {mono}
          </div>
        )}
      </div>
    </div>
  );
}

function VenueTree({ venue, expanded }: { venue: VenueFleet; expanded: boolean }) {
  if (!expanded) {
    return (
      <TreeRow
        label={venue.turfName}
        sublabel={`${venue.city || '—'} · ${venue.courts?.length || 0} court(s)`}
        mono={`turfs.id → ${venue.turfId}`}
        accent="rgba(0, 229, 255, 0.35)"
      />
    );
  }

  return (
    <>
      <TreeRow
        label={venue.turfName}
        sublabel={`${venue.city || '—'} · ${(venue.sportsSupported || []).join(', ') || 'No sport tagged'}`}
        mono={`turfs.id → ${venue.turfId}`}
        accent="rgba(0, 229, 255, 0.35)"
      />
      {(venue.courts || []).length === 0 ? (
        <TreeRow label="No courts yet" sublabel="cameras table empty for this venue" depth={1} />
      ) : (
        venue.courts.map((court) => (
          <TreeRow
            key={court.cameraId}
            depth={1}
            label={`Court ${court.courtNumber}: ${court.name}`}
            sublabel={
              court.raspberryPiBaseUrl
                ? `Pi configured · ${court.status}`
                : `Pi not set · ${court.status}`
            }
            mono={`cameras.id → ${court.cameraId}`}
            accent="rgba(0, 230, 118, 0.35)"
          />
        ))
      )}
    </>
  );
}

export const DatabaseSnapshotModal: React.FC<DatabaseSnapshotModalProps> = ({
  onClose,
  highlightTurfId,
}) => {
  const [snapshot, setSnapshot] = useState<DatabaseSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    AdminApi.getDatabaseSnapshot()
      .then((data) => {
        setSnapshot(data);
        const initial = new Set<string>();
        if (highlightTurfId) initial.add(highlightTurfId);
        else if (data.fleet.length === 1) initial.add(data.fleet[0].turfId);
        else data.fleet.forEach((v) => initial.add(v.turfId));
        setExpandedVenues(initial);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load database snapshot');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [highlightTurfId]);

  const toggleVenue = (turfId: string) => {
    setExpandedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(turfId)) next.delete(turfId);
      else next.add(turfId);
      return next;
    });
  };

  const handleCopy = async () => {
    if (!snapshot) return;
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        zIndex: 1100,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0, 230, 118, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(0, 230, 118, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} color="var(--primary-neon)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Database Snapshot
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Live view of turfs → cameras as stored in Neon Postgres
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={load}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading database snapshot…</p>
          )}
          {error && (
            <div style={{ color: 'var(--accent-crimson)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>
          )}

          {snapshot && !loading && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {snapshot.tableCounts.map((row) => (
                  <div
                    key={row.table}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginTop: 4 }}>
                      {row.count}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                      {row.table}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="var(--primary-neon)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>
                    Hierarchy (Arena → Courts)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawJson((v) => !v)}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                >
                  {showRawJson ? 'Tree view' : 'Raw JSON'}
                </button>
              </div>

              {showRawJson ? (
                <pre
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.68rem',
                    color: 'var(--accent-cyan)',
                    overflow: 'auto',
                    maxHeight: 360,
                  }}
                >
                  {JSON.stringify(snapshot, null, 2)}
                </pre>
              ) : (
                <div
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}
                >
                  {snapshot.fleet.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No venues in `turfs` yet. Use Venue Setup Wizard to add your first arena.
                    </div>
                  ) : (
                    snapshot.fleet.map((venue: VenueFleet) => {
                      const expanded = expandedVenues.has(venue.turfId);
                      const isHighlight = highlightTurfId === venue.turfId;
                      return (
                        <div
                          key={venue.turfId}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isHighlight ? 'rgba(0, 230, 118, 0.06)' : undefined,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleVenue(venue.turfId)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '10px 12px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>
                              {venue.turfName}
                            </span>
                            <span style={{ fontSize: '0.68rem', marginLeft: 'auto' }}>
                              {venue.courts?.length || 0} court(s)
                            </span>
                          </button>
                          {expanded && <VenueTree venue={venue} expanded={expanded} />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 16 }}>
                Generated {new Date(snapshot.generatedAt).toLocaleString()} · NVR config lives on Pi env, not in Postgres
              </p>
            </>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: '0.8rem' }}
            disabled={!snapshot}
          >
            {copied ? <CheckCircle2 size={14} color="var(--primary-neon)" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
