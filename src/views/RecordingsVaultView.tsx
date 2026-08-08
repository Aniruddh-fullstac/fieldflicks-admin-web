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
  ExternalLink,
  Copy,
  Plus,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { PlayVideoModal } from '../components/PlayVideoModal';
import { ExtractRecordingModal } from '../components/ExtractRecordingModal';
import type { AdminRecordingItem, CourtCamera, VenueFleet } from '../types';

export const RecordingsVaultView = () => {
  const [recordings, setRecordings] = useState<AdminRecordingItem[]>([]);
  const [venues, setVenues] = useState<VenueFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    subtitle?: string;
    url: string;
  } | null>(null);

  const [extractModalData, setExtractModalData] = useState<{
    court: CourtCamera;
    venueName: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, fleetRes] = await Promise.all([
        AdminApi.getRecordings({ limit: 100, status: statusFilter !== 'all' ? statusFilter : undefined }),
        AdminApi.getFleet(),
      ]);
      setRecordings(recRes.recordings || []);
      setVenues(fleetRes || []);
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filtered = recordings.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.venueName || '').toLowerCase().includes(q) ||
      (r.courtName || '').toLowerCase().includes(q) ||
      (r.userName || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    );
  });

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find first configured court for quick test extraction
  const handleOpenQuickExtract = () => {
    for (const v of venues) {
      const court = v.courts.find((c) => c.isConfigured || c.raspberryPiBaseUrl);
      if (court) {
        setExtractModalData({ court, venueName: v.turfName });
        return;
      }
    }
    // Fallback to first court
    if (venues.length > 0 && venues[0].courts.length > 0) {
      setExtractModalData({ court: venues[0].courts[0], venueName: venues[0].turfName });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            <span>Match Recordings Vault</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Browse, test extraction from Dahua NVR, and play recorded match videos
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={fetchData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenQuickExtract}
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
            <span>Test NVR Video Extraction</span>
          </button>
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
            placeholder="Search venue, court, user name, or recording ID..."
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
            <option value="uploaded">Uploaded</option>
            <option value="extracting">Extracting</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Recordings Table / Grid */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '14px 20px' }}>Venue & Court</th>
              <th style={{ padding: '14px 16px' }}>Date & Time Window</th>
              <th style={{ padding: '14px 16px' }}>Athlete / User</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Duration</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--primary-neon)' }} />
                  Loading match recordings...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Film size={32} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.4 }} />
                  No recordings found. Click <strong>"Test NVR Video Extraction"</strong> to extract a clip from Dahua NVR.
                </td>
              </tr>
            ) : (
              filtered.map((rec) => {
                const isSuccess = rec.status === 'completed' || rec.status === 'uploaded';
                const isExtracting = rec.status === 'extracting' || rec.status === 'in_progress';

                return (
                  <tr
                    key={rec.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="table-row-hover"
                  >
                    {/* Venue & Court */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{rec.venueName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: 2 }}>
                        {rec.courtName} (Court {rec.courtNumber})
                      </div>
                    </td>

                    {/* Time Window */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color="var(--text-dim)" />
                        <span>{new Date(rec.startTime).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                        {new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {rec.endTime && ` - ${new Date(rec.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </td>

                    {/* Athlete */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#FFFFFF' }}>{rec.userName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{rec.userPhone}</div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: isSuccess
                            ? 'rgba(0, 230, 118, 0.12)'
                            : isExtracting
                            ? 'rgba(255, 214, 0, 0.12)'
                            : 'rgba(255, 61, 87, 0.12)',
                          color: isSuccess
                            ? '#00E676'
                            : isExtracting
                            ? '#FFD600'
                            : '#FF3D57',
                          border: `1px solid ${
                            isSuccess
                              ? 'rgba(0, 230, 118, 0.3)'
                              : isExtracting
                              ? 'rgba(255, 214, 0, 0.3)'
                              : 'rgba(255, 61, 87, 0.3)'
                          }`,
                        }}
                      >
                        {isSuccess ? (
                          <CheckCircle2 size={11} />
                        ) : isExtracting ? (
                          <RefreshCw size={11} className="spin" />
                        ) : (
                          <AlertCircle size={11} />
                        )}
                        {rec.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>
                      {rec.durationMinutes ? `${rec.durationMinutes} mins` : '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {rec.playableUrl ? (
                          <>
                            <button
                              onClick={() =>
                                setSelectedVideo({
                                  title: `${rec.venueName} — ${rec.courtName}`,
                                  subtitle: `Recorded on ${new Date(rec.startTime).toLocaleString()}`,
                                  url: rec.playableUrl!,
                                })
                              }
                              className="btn-primary"
                              style={{
                                padding: '5px 12px',
                                fontSize: '0.72rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: 'var(--primary-neon)',
                                color: '#05070A',
                                fontWeight: 700,
                              }}
                            >
                              <Play size={12} fill="#05070A" /> Play
                            </button>

                            <button
                              onClick={() => handleCopyLink(rec.id, rec.playableUrl!)}
                              className="btn-secondary"
                              title="Copy Playable Video URL"
                              style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                            >
                              {copiedId === rec.id ? (
                                <CheckCircle2 size={13} color="var(--primary-neon)" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>

                            <a
                              href={rec.playableUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              title="Open Stream in New Tab"
                              style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                            >
                              <ExternalLink size={13} />
                            </a>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            No playable media
                          </span>
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <PlayVideoModal
          title={selectedVideo.title}
          subtitle={selectedVideo.subtitle}
          videoUrl={selectedVideo.url}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Test Extract Modal */}
      {extractModalData && (
        <ExtractRecordingModal
          court={extractModalData.court}
          venueName={extractModalData.venueName}
          onClose={() => setExtractModalData(null)}
          onExtractionSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};
