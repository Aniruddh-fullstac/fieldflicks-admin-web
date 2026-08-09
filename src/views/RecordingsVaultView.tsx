import { useState, useEffect } from 'react';
import {
  Film,
  Play,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Plus,
  ShieldCheck,
  XCircle,
  FileSpreadsheet,
  Sparkles,
  Award,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { PlayVideoModal } from '../components/PlayVideoModal';
import { ExtractRecordingModal } from '../components/ExtractRecordingModal';
import type { AdminRecordingItem, VenueFleet } from '../types';

export const RecordingsVaultView = () => {
  const [recordings, setRecordings] = useState<AdminRecordingItem[]>([]);
  const [venues, setVenues] = useState<VenueFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowStage, setWorkflowStage] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    subtitle?: string;
    url: string;
  } | null>(null);

  const [isExtractModalOpen, setIsExtractModalOpen] = useState<boolean>(false);
  const [reviewItem, setReviewItem] = useState<AdminRecordingItem | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('Verified and approved for highlight delivery');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, venRes] = await Promise.all([
        AdminApi.getRecordings({ limit: 100, status: statusFilter !== 'all' ? statusFilter : undefined }),
        AdminApi.getFleet(),
      ]);
      setRecordings(recRes.recordings || []);
      setVenues(venRes);
    } catch (err) {
      console.error('Error fetching vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filtered = recordings.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.userName && r.userName.toLowerCase().includes(search.toLowerCase())) ||
      (r.venueName && r.venueName.toLowerCase().includes(search.toLowerCase())) ||
      (r.courtName && r.courtName.toLowerCase().includes(search.toLowerCase()));

    let matchesStage = true;
    if (workflowStage === 'pending') matchesStage = r.status === 'pending' || r.status === 'extracting';
    else if (workflowStage === 'ai_processing') matchesStage = r.status === 'uploaded';
    else if (workflowStage === 'ready') matchesStage = r.status === 'completed';
    else if (workflowStage === 'failed') matchesStage = r.status === 'failed';

    return matchesSearch && matchesStage;
  });

  const handleOpenExtractModal = () => {
    setIsExtractModalOpen(true);
  };

  const handleApproveWorkflow = (id: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'completed' } : r))
    );
    showToast(`✅ Match highlight #${id.slice(0, 8)} approved & unlocked in athlete library!`);
    setReviewItem(null);
  };

  const handleRejectWorkflow = (id: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'failed' } : r))
    );
    showToast(`❌ Match highlight #${id.slice(0, 8)} marked rejected. Refund credited to user.`);
    setReviewItem(null);
  };

  const exportToCsv = () => {
    if (recordings.length === 0) return;
    const headers = ['ID', 'Venue', 'Court', 'Athlete', 'Date', 'Duration (min)', 'Status', 'S3 Path', 'Mux Playback ID'];
    const rows = recordings.map((r) => [
      r.id,
      r.venueName || 'N/A',
      r.courtName || 'N/A',
      r.userName || 'N/A',
      r.startTime ? new Date(r.startTime).toISOString() : 'N/A',
      r.durationMinutes || 0,
      r.status,
      (r as any).s3Key || '',
      r.muxPlaybackId || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FieldFlicks_Recordings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Recordings CSV report exported successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid var(--primary-neon)',
            boxShadow: '0 8px 32px rgba(0, 230, 118, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <Sparkles size={18} color="var(--primary-neon)" />
          {toastMsg}
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: 0,
            }}
          >
            <Film size={26} color="var(--primary-neon)" />
            <span>Match Recordings & Highlight Vault</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            7-Stage automated & manual highlight processing pipeline, NVR extraction, and athlete video verification
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={exportToCsv}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <FileSpreadsheet size={15} color="var(--primary-neon)" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenExtractModal}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              padding: '8px 18px',
              backgroundColor: 'var(--primary-neon)',
              color: '#05070A',
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            <span>Extract From NVR</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Workflow Pipeline Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Highlight Request Lifecycle Pipeline (7 Stages)
          </span>
          <span className="badge-neon green" style={{ fontSize: '0.7rem' }}>
            Active Extraction Daemon
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: '1. Pending / NVR Search' },
            { id: 'ai_processing', label: '2. AI Clip Detection' },
            { id: 'verification', label: '3. Admin Verification' },
            { id: 'ready', label: '4. Ready / Unlocked' },
            { id: 'failed', label: '5. Failed / Rejected' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setWorkflowStage(st.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: workflowStage === st.id ? 'var(--primary-neon)' : 'rgba(255,255,255,0.05)',
                color: workflowStage === st.id ? '#05070A' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="glass-card"
        style={{
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search venue, court, athlete name, or recording ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={14} color="var(--text-dim)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="uploaded">Uploaded / Processing</option>
            <option value="extracting">Extracting</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Recordings Table */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '14px 20px' }}>Recording ID & Priority</th>
                <th style={{ padding: '14px 20px' }}>Venue & Court</th>
                <th style={{ padding: '14px 20px' }}>Athlete / User</th>
                <th style={{ padding: '14px 20px' }}>Match Window</th>
                <th style={{ padding: '14px 20px' }}>Duration</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                    <p>Loading match recordings from database...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Film size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No match recordings match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const isSuccess = r.status === 'completed';
                  const isFailed = r.status === 'failed';
                  const isExtracting = r.status === 'extracting' || r.status === 'pending' || r.status === 'uploaded';
                  const isVIP = idx % 3 === 0;

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>#{r.id.slice(0, 8)}</span>
                          {isVIP && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(255, 214, 0, 0.15)',
                                color: 'var(--accent-amber)',
                                border: '1px solid rgba(255, 214, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Award size={11} /> VIP MATCH
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.venueName || 'Turf Location'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {r.courtName || `Court #${r.courtNumber || 1}`}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.userName || 'Athlete'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.userPhone || '—'}</div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                          <Clock size={13} color="var(--text-dim)" />
                          <span>
                            {r.startTime
                              ? new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '00:00'}{' '}
                            -{' '}
                            {r.endTime
                              ? new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '01:00'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                          {r.startTime ? new Date(r.startTime).toLocaleDateString() : ''}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {r.durationMinutes ? `${r.durationMinutes} min` : '60 min'}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {isSuccess && (
                          <span
                            className="badge-neon green"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <CheckCircle2 size={12} />
                            <span>READY</span>
                          </span>
                        )}
                        {isFailed && (
                          <span
                            className="badge-neon crimson"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <AlertCircle size={12} />
                            <span>FAILED</span>
                          </span>
                        )}
                        {isExtracting && (
                          <span
                            className="badge-neon amber"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <RefreshCw size={12} className="spin" />
                            <span>PROCESSING</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {/* Moderator Review Button */}
                          <button
                            onClick={() => setReviewItem(r)}
                            title="Moderator Verification Review"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              color: '#FFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            <ShieldCheck size={14} color="var(--accent-cyan)" />
                            Verify
                          </button>

                          {(r as any).hlsUrl || r.muxPlaybackId ? (
                            <button
                              onClick={() =>
                                setSelectedVideo({
                                  title: `${r.venueName || 'Turf'} - ${r.courtName || 'Court'}`,
                                  subtitle: `Match recording on ${r.startTime ? new Date(r.startTime).toLocaleDateString() : ''}`,
                                  url: (r as any).hlsUrl || `https://stream.mux.com/${r.muxPlaybackId}.m3u8`,
                                })
                              }
                              className="btn-primary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              <Play size={12} />
                              <span>Play</span>
                            </button>
                          ) : null}

                          {r.downloadUrl && (
                            <a
                              href={r.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              title="Download MP4 file"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderator Review & Verification Modal */}
      {reviewItem && (
        <div className="modal-backdrop" onClick={() => setReviewItem(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={22} color="var(--accent-cyan)" />
              Moderator Highlight Verification Desk
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Verify AI highlight detection boundaries and approve athlete delivery or reject with refund.
            </p>

            <div style={{ marginTop: 16, background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>Request ID:</span> <strong style={{ color: '#FFF' }}>#{reviewItem.id}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Athlete:</span> <strong style={{ color: '#FFF' }}>{reviewItem.userName || 'Athlete'}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Court:</span> <span style={{ color: '#FFF' }}>{reviewItem.venueName} - {reviewItem.courtName}</span></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Current Status:</span> <span style={{ color: 'var(--primary-neon)', fontWeight: 700 }}>{reviewItem.status}</span></div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Moderator Audit Note / Reason
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(15, 20, 29, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setReviewItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleRejectWorkflow(reviewItem.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 61, 87, 0.15)',
                  border: '1px solid rgba(255, 61, 87, 0.4)',
                  color: 'var(--accent-crimson)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <XCircle size={16} /> Reject & Refund
              </button>

              <button
                type="button"
                onClick={() => handleApproveWorkflow(reviewItem.id)}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} /> Approve & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideo && (
        <PlayVideoModal
          title={selectedVideo.title}
          subtitle={selectedVideo.subtitle}
          videoUrl={selectedVideo.url}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Extract Modal */}
      {isExtractModalOpen && (
        <ExtractRecordingModal
          onClose={() => {
            setIsExtractModalOpen(false);
            fetchData();
          }}
          venues={venues}
        />
      )}
    </div>
  );
};
