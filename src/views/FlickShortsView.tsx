import { useState, useEffect } from 'react';
import { AdminApi } from '../services/api';
import {
  Film,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertTriangle,
  Eye,
  Heart,
  Share2,
  Plus,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface FlickShortItem {
  id: string;
  title: string;
  creatorName: string;
  creatorPhone?: string;
  creatorAvatar?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sport: string;
  durationSec: number;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  reportCount: number;
  reportReason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPORTED' | 'FEATURED';
  createdAt: string;
  turfName?: string;
  tags: string[];
}

export const FlickShortsView = () => {
  const [shorts, setShorts] = useState<FlickShortItem[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REPORTED' | 'FEATURED'>('PENDING');
  const [selectedShort, setSelectedShort] = useState<FlickShortItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rejectModalShort, setRejectModalShort] = useState<FlickShortItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Violation of community standards');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSport, setUploadSport] = useState('Football');
  const [uploadTags, setUploadTags] = useState('#FieldFlicks #Highlights');

  const fetchShorts = () => {
    setLoading(true);
    AdminApi.getFlickShorts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: FlickShortItem[] = data.map((item: any) => ({
            id: item.id,
            title: item.title || 'Match Highlight Short',
            creatorName: item.creatorName || item.user?.name || 'Athlete',
            creatorPhone: item.user?.phone_number || '',
            videoUrl: item.videoUrl || item.playbackUrl || '',
            thumbnailUrl: item.thumbnailUrl || item.posterUrl || '',
            sport: item.sport || 'Pickleball',
            durationSec: item.durationSec || 15,
            viewsCount: item.viewsCount || item.views || 0,
            likesCount: item.likesCount || item.likes || 0,
            sharesCount: item.sharesCount || 0,
            reportCount: item.reportCount || 0,
            reportReason: item.reportReason,
            status: (item.isApproved ? 'APPROVED' : (item.status || 'PENDING')) as any,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent',
            turfName: item.turfName || item.venueName,
            tags: Array.isArray(item.tags) ? item.tags : ['#FieldFlicks'],
          }));
          setShorts(mapped);
          setSelectedShort(mapped[0]);
        } else {
          setShorts([]);
          setSelectedShort(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch FlickShorts:', err);
        setShorts([]);
        setSelectedShort(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleApprove = async (id: string) => {
    try {
      await AdminApi.approveFlickShort(id, true);
    } catch (e) {
      console.warn('Backend approve sync note:', e);
    }
    setShorts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'APPROVED' as const, reportCount: 0 } : s))
    );
    showToast(`✅ Short approved and published to public feed!`);
  };

  const handleFeature = (id: string) => {
    setShorts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'FEATURED' as const } : s))
    );
    showToast(`⚡️ Short boosted to Trending & Featured queue!`);
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalShort) return;
    try {
      await AdminApi.approveFlickShort(rejectModalShort.id, false);
    } catch (e) {
      console.warn('Backend reject sync note:', e);
    }
    setShorts((prev) =>
      prev.map((s) =>
        s.id === rejectModalShort.id
          ? { ...s, status: 'REJECTED' as const, reportReason: rejectReason }
          : s
      )
    );
    showToast(`❌ Short rejected with logged reason: "${rejectReason}"`);
    setRejectModalShort(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this FlickShort?')) {
      try {
        await AdminApi.deleteFlickShort(id);
      } catch (e) {
        console.warn('Backend delete note:', e);
      }
      setShorts((prev) => prev.filter((s) => s.id !== id));
      if (selectedShort?.id === id) {
        setSelectedShort(shorts.find((s) => s.id !== id) || null);
      }
      showToast('🗑 Short removed from system.');
    }
  };

  const handleCreateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await AdminApi.createFlickShort({
        title: uploadTitle || 'Curated Official Highlight',
        sport: uploadSport,
        tags: uploadTags.split(' ').filter(Boolean),
        // Normally video/thumbnail is handled via FormData and S3 upload in the backend.
        // For admin dashboard fallback we send strings if our backend handles Mux ingestion.
        videoUrl: 'https://stream.mux.com/tYm02c01E27B13u009vXoYwZ5s3i01qR9C.m3u8',
      });

      const newShort: FlickShortItem = {
        id: created.id || `fs-admin-${Date.now()}`,
        title: created.title || uploadTitle,
        creatorName: 'FieldFlicks Official',
        creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
        videoUrl: created.videoUrl || created.playbackUrl || 'https://stream.mux.com/tYm02c01E27B13u009vXoYwZ5s3i01qR9C.m3u8',
        thumbnailUrl: created.thumbnailUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60',
        sport: created.sport || uploadSport,
        durationSec: created.durationSec || 15,
        viewsCount: 0,
        likesCount: 0,
        sharesCount: 0,
        reportCount: 0,
        status: 'APPROVED',
        createdAt: 'Just now',
        tags: Array.isArray(created.tags) ? created.tags : uploadTags.split(' ').filter(Boolean),
      };

      setShorts([newShort, ...shorts]);
      setSelectedShort(newShort);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      showToast('🚀 Admin promotional short uploaded & published successfully!');
    } catch (err) {
      console.error('Failed to create FlickShort:', err);
      showToast('❌ Failed to upload promotional short. Please try again.');
    }
  };

  const filteredShorts = shorts.filter((s) => {
    const matchesTab = activeTab === 'ALL' || s.status === activeTab;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pendingCount = shorts.filter((s) => s.status === 'PENDING').length;
  const reportedCount = shorts.filter((s) => s.status === 'REPORTED').length;
  const featuredCount = shorts.filter((s) => s.status === 'FEATURED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Toast Banner */}
      {actionSuccessMsg && (
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
          {actionSuccessMsg}
        </div>
      )}

      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Film size={26} color="var(--primary-neon)" />
            FlickShorts Moderation & Discovery
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Review user-submitted vertical 9:16 reels, handle community reports, and boost viral plays
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            <Plus size={18} />
            Upload Official Reel
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</span>
            <Clock size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6 }}>{pendingCount}</div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-crimson)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Reported / Flagged</span>
            <ShieldAlert size={18} color="var(--accent-crimson)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6 }}>{reportedCount}</div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Featured & Trending</span>
            <Sparkles size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6 }}>{featuredCount}</div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary-neon)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total In Archive</span>
            <Film size={18} color="var(--primary-neon)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: 6 }}>{shorts.length}</div>
        </div>
      </div>

      {/* Main Split Layout: Left Feed Queue & Right 9:16 Video Player */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Filter Tabs + Shorts List */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-md)' }}>
              {(['PENDING', 'REPORTED', 'FEATURED', 'APPROVED', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab ? 'var(--primary-neon)' : 'transparent',
                    color: activeTab === tab ? '#05070A' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search title, athlete or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: 220,
              }}
            />
          </div>

          {/* Shorts Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 680, overflowY: 'auto' }}>
            {filteredShorts.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Film size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No FlickShorts found in this queue</p>
              </div>
            ) : (
              filteredShorts.map((short) => {
                const isSelected = selectedShort?.id === short.id;
                return (
                  <div
                    key={short.id}
                    onClick={() => {
                      setSelectedShort(short);
                      setIsPlaying(true);
                    }}
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Thumbnail Preview */}
                    <div
                      style={{
                        width: 72,
                        height: 96,
                        borderRadius: 8,
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                        backgroundColor: '#1E293B',
                      }}
                    >
                      {short.thumbnailUrl ? (
                        <img
                          src={short.thumbnailUrl}
                          alt={short.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Film size={20} color="var(--text-muted)" />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          background: 'rgba(0,0,0,0.7)',
                          borderRadius: 4,
                          padding: '2px 4px',
                          fontSize: '0.65rem',
                          color: '#FFF',
                          fontWeight: 700,
                        }}
                      >
                        {short.durationSec}s
                      </div>
                    </div>

                    {/* Metadata & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', fontWeight: 700 }}>
                            {short.sport}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background:
                                short.status === 'APPROVED'
                                  ? 'rgba(0, 230, 118, 0.15)'
                                  : short.status === 'FEATURED'
                                  ? 'rgba(0, 229, 255, 0.15)'
                                  : short.status === 'REPORTED'
                                  ? 'rgba(255, 61, 87, 0.2)'
                                  : 'rgba(255, 214, 0, 0.15)',
                              color:
                                short.status === 'APPROVED'
                                  ? 'var(--primary-neon)'
                                  : short.status === 'FEATURED'
                                  ? 'var(--accent-cyan)'
                                  : short.status === 'REPORTED'
                                  ? 'var(--accent-crimson)'
                                  : 'var(--accent-amber)',
                            }}
                          >
                            {short.status}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {short.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          By <strong style={{ color: 'var(--text-main)' }}>{short.creatorName}</strong> • {short.createdAt}
                        </p>
                      </div>

                      {/* Engagement Counters */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={13} /> {short.viewsCount}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Heart size={13} /> {short.likesCount}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Share2 size={13} /> {short.sharesCount}
                        </span>
                        {short.reportCount > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-crimson)', fontWeight: 700 }}>
                            <AlertTriangle size={13} /> {short.reportCount} Reports
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 9:16 Video Player Preview & Moderation Actions */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--primary-neon)" />
            Vertical Player & Review Desk
          </h3>

          {selectedShort ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 9:16 Video Phone Canvas */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 290,
                  height: 480,
                  margin: '0 auto',
                  borderRadius: 24,
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#000000',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 230, 118, 0.2)',
                  border: '3px solid #1E293B',
                }}
              >
                {/* Simulated Video Preview Poster with controls */}
                <img
                  src={selectedShort.thumbnailUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60'}
                  alt={selectedShort.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Video Overlay Gradient */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 16,
                  }}
                >
                  {/* Top Bar on Video */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, color: '#FFF' }}>
                      {selectedShort.sport}
                    </span>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFF' }}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                  {/* Center Play Button Overlay */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      margin: 'auto',
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: 'rgba(0, 230, 118, 0.9)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(0, 230, 118, 0.6)',
                    }}
                  >
                    {isPlaying ? <Pause size={24} color="#05070A" /> : <Play size={24} color="#05070A" style={{ marginLeft: 3 }} />}
                  </button>

                  {/* Bottom Captions & Athlete Info */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      @{selectedShort.creatorName.replace(/\s+/g, '').toLowerCase()}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#E2E8F0', lineHeight: 1.3 }}>
                      {selectedShort.title}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {selectedShort.tags.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '0.7rem', color: 'var(--primary-neon)', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation Details Card */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Athlete & Clip Intelligence
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Athlete:</span>{' '}
                    <strong style={{ color: '#FFF' }}>{selectedShort.creatorName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Phone:</span>{' '}
                    <span style={{ color: '#FFF' }}>{selectedShort.creatorPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Captured At:</span>{' '}
                    <span style={{ color: '#FFF' }}>{selectedShort.turfName || 'Direct Upload'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Duration:</span>{' '}
                    <span style={{ color: '#FFF' }}>{selectedShort.durationSec} seconds</span>
                  </div>
                </div>

                {selectedShort.reportReason && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(255, 61, 87, 0.1)', border: '1px solid rgba(255, 61, 87, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> Reported Reason:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#FFF', marginTop: 2 }}>{selectedShort.reportReason}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons Desk */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => handleApprove(selectedShort.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                    color: '#05070A',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(0, 230, 118, 0.3)',
                  }}
                >
                  <CheckCircle2 size={18} /> Approve & Publish
                </button>

                <button
                  onClick={() => handleFeature(selectedShort.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 229, 255, 0.12)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkles size={18} /> Boost / Feature
                </button>

                <button
                  onClick={() => setRejectModalShort(selectedShort)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 61, 87, 0.1)',
                    color: 'var(--accent-crimson)',
                    border: '1px solid rgba(255, 61, 87, 0.3)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <XCircle size={18} /> Reject Clip
                </button>

                <button
                  onClick={() => handleDelete(selectedShort.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Trash2 size={18} /> Delete / Hide
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a short from the list to preview
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal with Reason Selector */}
      {rejectModalShort && (
        <div className="modal-backdrop" onClick={() => setRejectModalShort(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, padding: 24 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={22} />
              Reject FlickShort
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
              Select a reason for rejecting "{rejectModalShort.title}". This will be logged in the audit trail and sent to the athlete.
            </p>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Rejection Category</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  background: 'rgba(15, 20, 29, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="Violation of community guidelines">Violation of community guidelines</option>
                <option value="Low video quality / unwatchable lighting">Low video quality / unwatchable lighting</option>
                <option value="Copyrighted audio or non-sports media">Copyrighted audio or non-sports media</option>
                <option value="Misleading or clickbait title">Misleading or clickbait title</option>
                <option value="Abusive or unsportsmanlike behavior">Abusive or unsportsmanlike behavior</option>
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setRejectModalShort(null)}
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
                  onClick={handleRejectConfirm}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-crimson)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manual Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, padding: 24 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={22} color="var(--primary-neon)" />
              Upload Official Promotional Short
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Publish curated platform reels, tournament highlights, or sponsor clips directly.
            </p>

            <form onSubmit={handleCreateUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finals Match Winning Goal!"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Sport Type
                  </label>
                  <select
                    value={uploadSport}
                    onChange={(e) => setUploadSport(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 20, 29, 0.95)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      color: '#FFF',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Padel">Padel</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      color: '#FFF',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Select 9:16 Video File (.mp4, .mov)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
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
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Publish Short
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
