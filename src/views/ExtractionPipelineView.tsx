import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  PlayCircle,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type {
  AdminExtractionRequestItem,
  AdminPipelineStorageAudit,
} from '../types';

function todayIstDateInput(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatIstTime(iso?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function formatIstDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function statusTone(status: string): { bg: string; color: string; label: string } {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'ready') {
    return { bg: 'rgba(0,230,118,0.12)', color: '#00E676', label: status };
  }
  if (normalized === 'failed' || normalized === 'cancelled') {
    return { bg: 'rgba(255,61,87,0.12)', color: '#FF3D57', label: status };
  }
  if (normalized === 'uploaded' || normalized === 'uploading' || normalized === 'processing') {
    return { bg: 'rgba(0,229,255,0.12)', color: '#00E5FF', label: status };
  }
  if (normalized === 'extracting' || normalized === 'requested' || normalized === 'pending') {
    return { bg: 'rgba(255,214,0,0.12)', color: '#FFD600', label: status };
  }
  return { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', label: status || 'unknown' };
}

export const ExtractionPipelineView = () => {
  const [selectedDate, setSelectedDate] = useState(todayIstDateInput());
  const [requests, setRequests] = useState<AdminExtractionRequestItem[]>([]);
  const [audit, setAudit] = useState<AdminPipelineStorageAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reattachingId, setReattachingId] = useState<string | null>(null);
  const [muxCycleRunning, setMuxCycleRunning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [reqRes, auditRes] = await Promise.allSettled([
        AdminApi.getExtractionRequests({ date: selectedDate, limit: 200 }),
        AdminApi.getPipelineStorageAudit(),
      ]);

      if (reqRes.status === 'fulfilled') {
        setRequests(reqRes.value.requests || []);
      } else {
        throw reqRes.reason;
      }

      if (auditRes.status === 'fulfilled') {
        setAudit(auditRes.value);
      } else {
        console.warn('Pipeline storage audit failed:', auditRes.reason);
        setAudit(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load extraction pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleReattachHighlights = async (recordingId: string) => {
    setReattachingId(recordingId);
    try {
      const result = await AdminApi.reattachRecordingHighlights(recordingId);
      showToast(`Attached ${result.attached} highlight(s) to ${recordingId.slice(0, 8)}`);
      await fetchAll(true);
    } catch (err: any) {
      showToast(err?.message || 'Failed to reattach highlights');
    } finally {
      setReattachingId(null);
    }
  };

  const handleStartMuxCycle = async () => {
    setMuxCycleRunning(true);
    try {
      const result = await AdminApi.runMuxIngestionCycle(selectedDate);
      const started = result.summary.mux_upload_started ?? 0;
      const polled = result.summary.polled_mux_asset ?? 0;
      const skipped =
        (result.summary.already_ready ?? 0) +
        (result.summary.no_source_video ?? 0);
      const failed = result.summary.failed ?? 0;
      showToast(
        `Mux cycle ${selectedDate}: ${started} upload(s) started, ${polled} polled, ${skipped} skipped, ${failed} failed (${result.processed}/${result.totalCandidates})`,
      );
      await fetchAll(true);
    } catch (err: any) {
      showToast(err?.message || 'Mux ingestion cycle failed');
    } finally {
      setMuxCycleRunning(false);
    }
  };

  const pendingMuxForDay = useMemo(
    () => requests.filter((row) => row.hasS3 && !row.hasMux).length,
    [requests],
  );

  const summary = useMemo(() => {
    const inFlight = requests.filter((r) =>
      ['extracting', 'requested', 'pending', 'uploading', 'uploaded', 'processing'].includes(
        String(r.status).toLowerCase(),
      ),
    ).length;
    const ready = requests.filter((r) =>
      ['completed', 'ready'].includes(String(r.status).toLowerCase()),
    ).length;
    const failed = requests.filter((r) =>
      ['failed', 'cancelled'].includes(String(r.status).toLowerCase()),
    ).length;
    return { inFlight, ready, failed, total: requests.length };
  }, [requests]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toastMsg ? (
        <div
          className="glass-card"
          style={{
            padding: '12px 16px',
            borderColor: 'var(--border-glow)',
            color: 'var(--primary-neon)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {toastMsg}
        </div>
      ) : null}
      <div
        className="glass-card"
        style={{
          padding: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Database size={18} color="var(--primary-neon)" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Extraction Pipeline Monitor</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            One row per match session (dual NVR channels grouped). Use{' '}
            <strong style={{ color: 'var(--primary-neon)' }}>Sync HL</strong> to pull S3 highlights
            or <strong style={{ color: 'var(--primary-neon)' }}>Start Mux Cycle</strong> to ingest
            all S3-ready videos for the selected day into Mux (one by one).
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Calendar size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                color: 'var(--text-main)',
                padding: '8px 12px',
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={handleStartMuxCycle}
            disabled={muxCycleRunning || refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            title={
              pendingMuxForDay > 0
                ? `${pendingMuxForDay} session(s) with S3 but no Mux`
                : 'Retry Mux ingest for all recordings on this date'
            }
          >
            <PlayCircle size={16} className={muxCycleRunning ? 'spin' : undefined} />
            {muxCycleRunning ? 'Mux cycle running…' : 'Start Mux Cycle'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : undefined} />
            {refreshing ? 'Refreshing…' : 'Refresh from DB'}
          </button>
        </div>
      </div>

      {audit && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No Mux playback</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)' }}>
              {audit.withoutMuxTotal}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>S3 uploaded, no Mux</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {audit.withS3NoMux}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Today in-flight</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-neon)' }}>
              {summary.inFlight}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Today ready</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00E676' }}>{summary.ready}</div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Today failed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF3D57' }}>{summary.failed}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ padding: 16, borderColor: 'rgba(255,61,87,0.35)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#FF3D57' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            Loading extraction requests…
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No extraction requests for {selectedDate}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {[
                    'Athlete',
                    'Venue / Court',
                    'Time slot (IST)',
                    'NVR',
                    'Status',
                    'Highlights',
                    'Pipeline',
                    'Updated',
                    'Recording ID',
                    'Actions',
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        fontSize: 12,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--text-dim)',
                        borderBottom: '1px solid var(--border-subtle)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((row) => {
                  const tone = statusTone(row.status);
                  const nvrLabel =
                    row.nvrChannelLabel ||
                    (row.nvrChannels?.length
                      ? `Ch ${row.nvrChannels.join(' + ')}`
                      : `Ch ${row.nvrChannel}`);
                  const primaryId = row.id;

                  return (
                    <tr
                      key={row.extractSessionKey || row.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <User size={14} color="var(--text-dim)" />
                          <div>
                            <div style={{ fontWeight: 600 }}>{row.userName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              {row.userPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <MapPin size={14} color="var(--text-dim)" style={{ marginTop: 2 }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{row.venueName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {row.courtName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Clock size={14} color="var(--text-dim)" />
                          <div>
                            <div>{formatIstTime(row.startTime)} – {formatIstTime(row.endTime)}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              {row.durationMinutes ?? '—'} min
                              {(row.channelCount ?? 1) > 1
                                ? ` · ${row.channelCount} angles`
                                : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>{nvrLabel}</td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: tone.bg,
                            color: tone.color,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {tone.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Sparkles size={14} color="var(--accent-purple)" />
                          <div>
                            <div>{row.linkedHighlightCount} linked</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              {row.highlightsInWindow} in window
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                          <span style={{ color: row.hasS3 ? '#00E676' : 'var(--text-dim)' }}>
                            {row.hasS3 ? '✓ S3' : '○ S3'}
                          </span>
                          <span style={{ color: row.hasMux ? '#00E676' : 'var(--text-dim)' }}>
                            {row.hasMux ? '✓ Mux' : '○ Mux'}
                          </span>
                          {row.extractAttempts > 1 && (
                            <span style={{ color: 'var(--accent-amber)' }}>
                              Attempts: {row.extractAttempts}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatIstDateTime(row.updatedAt)}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                        {primaryId.slice(0, 8)}…
                        {(row.recordingIds?.length ?? 0) > 1 && (
                          <div style={{ marginTop: 4, fontSize: 10 }}>
                            +{(row.recordingIds?.length ?? 1) - 1} channel
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={reattachingId === primaryId}
                          onClick={() => handleReattachHighlights(primaryId)}
                          style={{ fontSize: 12, padding: '8px 12px', whiteSpace: 'nowrap' }}
                        >
                          {reattachingId === primaryId ? 'Syncing…' : 'Sync HL'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {audit && audit.recentS3NoMux.length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <CheckCircle2 size={18} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>Recent S3 uploads waiting for Mux</h4>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {audit.recentS3NoMux.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  fontSize: 13,
                }}
              >
                <div>
                  <strong>{item.userName}</strong> · {item.venueName} · {item.courtName}
                  <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>{item.s3Path}</div>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                  <div>{item.status}</div>
                  <div style={{ fontSize: 12 }}>{formatIstDateTime(item.updatedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
