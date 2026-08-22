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
  AdminMuxCycleProgress,
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

function highlightMuxLabel(row: AdminExtractionRequestItem): string {
  const hl = row.highlightMux;
  if (!hl || hl.status === 'none') return 'No HL linked';
  if (hl.status === 'ready') return `${hl.ready}/${hl.total} ready`;
  if (hl.status === 'partial') return `${hl.ready}/${hl.total} ready · ${hl.withoutAssetId} need clip`;
  if (hl.status === 'processing') return `${hl.processing} processing`;
  if (hl.status === 'failed') return `${hl.failed} failed`;
  return `${hl.pending} pending clip`;
}

/** Hover text for Mux cycle summary / result action keys (admin pipeline). */
const MUX_CYCLE_ACTION_HELP: Record<string, string> = {
  no_source_video:
    'Full match: no MP4 found in S3 for this recording — nothing to send to Mux yet.',
  mux_upload_pending:
    'Full match: file was sent to Mux but the direct upload is still waiting or processing.',
  mux_upload_started: 'Full match: S3 MP4 upload to Mux was just started.',
  mux_still_processing: 'Full match: Mux asset exists but encoding is not finished yet.',
  polled_mux_asset: 'Full match: polled Mux — asset is ready and playback ID was saved.',
  already_ready: 'Full match: already had Mux playback — skipped.',
  failed: 'Full match: Mux ingest step failed for this recording.',
  hl_no_highlights:
    'Highlights: no button-press moments linked to this recording.',
  hl_highlight_clips_enqueued:
    'Highlights: clip jobs were queued on Mux (cut from the full-match asset).',
  hl_highlights_ready:
    'Highlights: all linked clips have Mux playback IDs and are ready in the app.',
  hl_highlights_processing:
    'Highlights: clips exist but Mux is still encoding at least one.',
  hl_highlights_pending:
    'Highlights: clips waiting for Mux clip creation to start.',
};

function muxActionLabel(key: string): string {
  return MUX_CYCLE_ACTION_HELP[key] ?? key.replace(/_/g, ' ');
}

export const ExtractionPipelineView = () => {
  const [selectedDate, setSelectedDate] = useState(todayIstDateInput());
  const [requests, setRequests] = useState<AdminExtractionRequestItem[]>([]);
  const [audit, setAudit] = useState<AdminPipelineStorageAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reattachingId, setReattachingId] = useState<string | null>(null);
  const [muxCycleRunning, setMuxCycleRunning] = useState(false);
  const [highlightCycleRunning, setHighlightCycleRunning] = useState(false);
  const [muxCycleProgress, setMuxCycleProgress] = useState<AdminMuxCycleProgress | null>(null);
  const [muxStatusCheckedAt, setMuxStatusCheckedAt] = useState<Date | null>(null);
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

  const refreshMuxCycleStatus = useCallback(async () => {
    try {
      const status = await AdminApi.getMuxCycleStatus();
      setMuxCycleProgress(status);
      setMuxStatusCheckedAt(new Date());
      return status;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMuxCycleStatus();
    const timer = window.setInterval(() => {
      refreshMuxCycleStatus();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refreshMuxCycleStatus]);

  useEffect(() => {
    if (!muxCycleRunning && !highlightCycleRunning && !muxCycleProgress?.running) {
      return;
    }
    const timer = window.setInterval(() => {
      refreshMuxCycleStatus();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [
    muxCycleRunning,
    highlightCycleRunning,
    muxCycleProgress?.running,
    refreshMuxCycleStatus,
  ]);

  const pollWhileCycleRuns = async <T,>(task: Promise<T>): Promise<T> => {
    const timer = window.setInterval(() => {
      refreshMuxCycleStatus();
    }, 2000);
    try {
      return await task;
    } finally {
      window.clearInterval(timer);
      await refreshMuxCycleStatus();
    }
  };

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
      const result = await pollWhileCycleRuns(
        AdminApi.runMuxIngestionCycle(selectedDate),
      );
      if ((result as { alreadyRunning?: boolean }).alreadyRunning) {
        showToast(
          (result as { message?: string }).message ||
            'Mux cycle already running — new videos for this date are added automatically.',
        );
        return;
      }
      const started = result.summary.mux_upload_started ?? 0;
      const polled = result.summary.polled_mux_asset ?? 0;
      const stillProcessing =
        (result.summary.mux_still_processing ?? 0) +
        (result.summary.mux_upload_pending ?? 0);
      const skipped =
        (result.summary.already_ready ?? 0) +
        (result.summary.no_source_video ?? 0);
      const failed = result.summary.failed ?? 0;
      const hl = result.highlightPhase;
      const hlEnqueued = hl?.summary.highlight_clips_enqueued ?? 0;
      const hlReady = hl?.summary.highlights_ready ?? 0;
      showToast(
        `Mux cycle ${selectedDate}: ${result.processed}/${result.totalCandidates} processed — ${started} uploads, ${polled} polled, ${stillProcessing} processing, ${skipped} skipped, ${failed} failed. Highlights: ${hlEnqueued} enqueued, ${hlReady} ready.`,
      );
      await fetchAll(true);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('already running')) {
        showToast('Mux cycle already running on the server — progress is shown below.');
      } else {
        showToast(msg || 'Mux ingestion cycle failed');
      }
      await refreshMuxCycleStatus();
    } finally {
      setMuxCycleRunning(false);
    }
  };

  const handleStartHighlightMuxCycle = async () => {
    setHighlightCycleRunning(true);
    try {
      const result = await pollWhileCycleRuns(
        AdminApi.runHighlightMuxCycle(selectedDate),
      );
      const enqueued = result.summary.highlight_clips_enqueued ?? 0;
      const ready = result.summary.highlights_ready ?? 0;
      const processing = result.summary.highlights_processing ?? 0;
      const pending = result.summary.highlights_pending ?? 0;
      showToast(
        `HL Mux cycle ${selectedDate}: ${enqueued} enqueued, ${ready} ready, ${processing} processing, ${pending} pending (${result.processed}/${result.totalCandidates})`,
      );
      await fetchAll(true);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('already running')) {
        showToast('A Mux cycle is already running — see progress below.');
      } else {
        showToast(msg || 'Highlight Mux cycle failed');
      }
      await refreshMuxCycleStatus();
    } finally {
      setHighlightCycleRunning(false);
    }
  };

  const isMuxCycleActive =
    Boolean(muxCycleProgress?.running) || muxCycleRunning || highlightCycleRunning;

  const muxLiveBanner = useMemo(() => {
    if (!muxCycleProgress) {
      return {
        label: 'UNKNOWN',
        color: '#94A3B8',
        bg: 'rgba(148,163,184,0.12)',
        message: 'Could not load Mux cycle status from the server.',
      };
    }

    if (isMuxCycleActive) {
      const phaseLabel =
        muxCycleProgress.phase === 'highlights'
          ? 'Highlight clips'
          : muxCycleProgress.phase === 'video'
            ? 'Full-video ingest'
            : 'Processing';
      const progress =
        muxCycleProgress.totalCandidates > 0
          ? ` · ${muxCycleProgress.processed}/${muxCycleProgress.totalCandidates} recordings`
          : '';
      return {
        label: 'RUNNING NOW',
        color: '#FFD600',
        bg: 'rgba(255,214,0,0.12)',
        message: `${phaseLabel}${progress}. Updates every 2–4s — keep this tab open.`,
      };
    }

    if (muxCycleProgress.status === 'complete') {
      return {
        label: 'FINISHED',
        color: '#00E676',
        bg: 'rgba(0,230,118,0.12)',
        message: muxCycleProgress.completedAt
          ? `Last cycle completed ${formatIstDateTime(muxCycleProgress.completedAt)}. Safe to start again for new uploads on the same date.`
          : 'Last cycle completed. Safe to start again for new uploads on the same date.',
      };
    }

    if (muxCycleProgress.status === 'failed') {
      return {
        label: 'FAILED',
        color: '#FF3D57',
        bg: 'rgba(255,61,87,0.12)',
        message:
          muxCycleProgress.error ||
          'The last Mux cycle failed. Check results below or retry Start Mux Cycle.',
      };
    }

    return {
      label: 'IDLE',
      color: '#94A3B8',
      bg: 'rgba(148,163,184,0.10)',
      message:
        'No Mux backfill job is running on the server right now. Click Start Mux Cycle to process recordings for the selected date.',
    };
  }, [isMuxCycleActive, muxCycleProgress]);

  const cycleProgressVisible =
    muxCycleProgress &&
    (muxCycleProgress.running ||
      muxCycleProgress.status !== 'idle' ||
      muxCycleRunning ||
      highlightCycleRunning);

  const videoProgressPct =
    muxCycleProgress && muxCycleProgress.totalCandidates > 0
      ? Math.round((muxCycleProgress.processed / muxCycleProgress.totalCandidates) * 100)
      : muxCycleProgress?.status === 'complete'
        ? 100
        : 0;

  const pendingMuxForDay = useMemo(
    () =>
      requests.filter((row) => row.hasS3 && !row.hasMux && !row.muxProcessing)
        .length,
    [requests],
  );

  const highlightSummary = useMemo(() => {
    let totalHighlights = 0;
    let readyHighlights = 0;
    let pendingClips = 0;
    let processingClips = 0;
    for (const row of requests) {
      const hl = row.highlightMux;
      if (!hl || hl.status === 'none') continue;
      totalHighlights += hl.total;
      readyHighlights += hl.ready;
      pendingClips += hl.withoutAssetId + hl.pending;
      processingClips += hl.processing;
    }
    return { totalHighlights, readyHighlights, pendingClips, processingClips };
  }, [requests]);

  const summary = useMemo(() => {
    const isReady = (r: AdminExtractionRequestItem) =>
      r.hasMux ||
      ['completed', 'ready'].includes(String(r.status).toLowerCase());
    const inFlight = requests.filter(
      (r) => !isReady(r) && !['failed', 'cancelled'].includes(String(r.status).toLowerCase()),
    ).length;
    const ready = requests.filter(isReady).length;
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
            One row per match session (dual NVR channels grouped).{' '}
            <strong style={{ color: 'var(--primary-neon)' }}>Start Mux Cycle</strong> ingests
            full-match videos in parallel (backfill). Phase 2 auto-cuts highlight clips from those
            Mux assets. Use <strong style={{ color: 'var(--primary-neon)' }}>HL Mux Cycle</strong>{' '}
            for existing videos that already have playback but highlights lack Mux clip IDs.
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
                ? `Backfill: ${pendingMuxForDay} session(s) with video but no Mux. Safe to click while running — new uploads for this date are added without interrupting the current run.`
                : 'Backfill Mux for all recordings on this IST date. New user requests encode individually via Pi callback, not through this button.'
            }
          >
            <PlayCircle size={16} className={muxCycleRunning ? 'spin' : undefined} />
            {muxCycleRunning ? 'Mux cycle running…' : 'Start Mux Cycle'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleStartHighlightMuxCycle}
            disabled={highlightCycleRunning || refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            title="Queue Mux clip cuts for highlights on playable recordings"
          >
            <Sparkles size={16} className={highlightCycleRunning ? 'spin' : undefined} />
            {highlightCycleRunning ? 'HL Mux running…' : 'HL Mux Cycle'}
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

      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          borderColor: muxLiveBanner.color,
          boxShadow: isMuxCycleActive ? `0 0 0 1px ${muxLiveBanner.color}33` : undefined,
        }}
      >
        {isMuxCycleActive ? (
          <Loader2 size={18} className="spin" color={muxLiveBanner.color} />
        ) : muxCycleProgress?.status === 'complete' ? (
          <CheckCircle2 size={18} color={muxLiveBanner.color} />
        ) : muxCycleProgress?.status === 'failed' ? (
          <AlertTriangle size={18} color={muxLiveBanner.color} />
        ) : (
          <Clock size={18} color={muxLiveBanner.color} />
        )}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
                padding: '3px 8px',
                borderRadius: 999,
                background: muxLiveBanner.bg,
                color: muxLiveBanner.color,
              }}
            >
              {muxLiveBanner.label}
            </span>
            {muxCycleProgress?.date ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                cycle date {muxCycleProgress.date}
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.45 }}>
            {muxLiveBanner.message}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
          Status checked
          <br />
          {muxStatusCheckedAt ? formatIstDateTime(muxStatusCheckedAt.toISOString()) : '—'}
        </div>
      </div>

      {cycleProgressVisible && muxCycleProgress ? (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {(muxCycleProgress.running || muxCycleRunning || highlightCycleRunning) ? (
              <Loader2 size={18} className="spin" color="var(--primary-neon)" />
            ) : (
              <CheckCircle2
                size={18}
                color={muxCycleProgress.status === 'failed' ? '#FF3D57' : '#00E676'}
              />
            )}
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Mux cycle progress
              {muxCycleProgress.date ? ` · ${muxCycleProgress.date}` : ''}
            </h4>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                color:
                  muxCycleProgress.status === 'running'
                    ? '#FFD600'
                    : muxCycleProgress.status === 'failed'
                      ? '#FF3D57'
                      : '#00E676',
              }}
            >
              {muxCycleProgress.running ? 'running' : muxCycleProgress.status}
            </span>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Phase:{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {muxCycleProgress.phase === 'highlights'
                ? 'Highlight Mux clips (cut from ready videos)'
                : muxCycleProgress.phase === 'video'
                  ? 'Full-video Mux ingest (S3 → Mux)'
                  : '—'}
            </strong>
            {muxCycleProgress.startedAt ? (
              <span>
                {' '}
                · started{' '}
                {formatIstDateTime(muxCycleProgress.startedAt)}
              </span>
            ) : null}
            {muxCycleProgress.completedAt ? (
              <span>
                {' '}
                · finished {formatIstDateTime(muxCycleProgress.completedAt)}
              </span>
            ) : null}
          </div>

          {muxCycleProgress.phase === 'video' && muxCycleProgress.totalCandidates > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Video ingest</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {muxCycleProgress.processed}/{muxCycleProgress.totalCandidates} ({videoProgressPct}%)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${videoProgressPct}%`,
                    background: 'linear-gradient(90deg,#22c55e,#16a34a)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ) : null}

          {Object.keys(muxCycleProgress.summary).length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: muxCycleProgress.results.length > 0 ? 14 : 0,
              }}
            >
              {Object.entries(muxCycleProgress.summary).map(([key, count]) => (
                <span
                  key={key}
                  title={muxActionLabel(key)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-muted)',
                    cursor: 'help',
                  }}
                >
                  {key}: {count}
                </span>
              ))}
            </div>
          ) : null}

          {muxCycleProgress.error ? (
            <div style={{ color: '#FF3D57', fontSize: 13, marginBottom: 12 }}>
              {muxCycleProgress.error}
            </div>
          ) : null}

          {muxCycleProgress.results.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--text-dim)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Recording</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {muxCycleProgress.results.map((row) => (
                    <tr key={row.recordingId} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>
                        {row.recordingId.slice(0, 8)}…
                      </td>
                      <td
                        title={muxActionLabel(row.action)}
                        style={{
                          padding: '6px 8px',
                          color: row.ok ? '#00E676' : '#FF3D57',
                          cursor: 'help',
                        }}
                      >
                        {row.action}
                        {row.error ? ` — ${row.error}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : muxCycleProgress.running ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Processing… this can take several minutes when many videos upload to Mux in parallel.
              Keep this page open — progress updates every 2s.
            </div>
          ) : null}
        </div>
      ) : null}

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
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>HL Mux ready</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00E676' }}>
              {highlightSummary.readyHighlights}
              {highlightSummary.totalHighlights > 0
                ? ` / ${highlightSummary.totalHighlights}`
                : ''}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>HL need Mux clip</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-purple)' }}>
              {highlightSummary.pendingClips}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>HL Mux processing</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FFD600' }}>
              {highlightSummary.processingClips}
            </div>
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
                          <span
                            style={{
                              color: row.hasMux
                                ? '#00E676'
                                : row.muxProcessing
                                  ? '#FFD600'
                                  : 'var(--text-dim)',
                            }}
                          >
                            {row.hasMux ? '✓ Video Mux' : row.muxProcessing ? '◐ Video Mux' : '○ Video Mux'}
                          </span>
                          <span
                            style={{
                              color:
                                row.highlightMux?.status === 'ready' || row.highlightMux?.status === 'none'
                                  ? '#00E676'
                                  : row.highlightMux?.status === 'processing' ||
                                      row.highlightMux?.status === 'partial'
                                    ? '#FFD600'
                                    : row.highlightMux?.status === 'failed'
                                      ? '#FF3D57'
                                      : 'var(--text-dim)',
                            }}
                          >
                            {row.highlightMux?.status === 'ready'
                              ? `✓ HL Mux (${row.highlightMux.ready}/${row.highlightMux.total})`
                              : row.highlightMux?.status === 'partial'
                                ? `◐ HL Mux (${highlightMuxLabel(row)})`
                                : row.highlightMux?.status === 'processing'
                                  ? `◐ HL Mux (${highlightMuxLabel(row)})`
                                  : row.highlightMux?.status === 'none'
                                    ? '○ HL Mux'
                                    : `○ HL Mux (${highlightMuxLabel(row)})`}
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
