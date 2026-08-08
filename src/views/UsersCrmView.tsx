import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Award,
  Video,
  CreditCard,
  Ticket,
  ExternalLink,
  Gift,
  X,
  CheckCircle2,
  Flame,
  AlertTriangle,
  RefreshCw,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  Phone,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import { SkeletonTable, SkeletonUserProfile } from '../components/Skeleton';
import { CompactDateBadge } from '../components/CompactDateBadge';
import type { AthleteUser, UserUtilityProfile } from '../types';

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Legend: { bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.4)', text: '#00E676' },
  Pro: { bg: 'rgba(0, 229, 255, 0.15)', border: 'rgba(0, 229, 255, 0.4)', text: '#00E5FF' },
  Gold: { bg: 'rgba(255, 214, 0, 0.15)', border: 'rgba(255, 214, 0, 0.4)', text: '#FFD600' },
  Silver: { bg: 'rgba(209, 216, 224, 0.15)', border: 'rgba(209, 216, 224, 0.4)', text: '#D1D8E0' },
  Bronze: { bg: 'rgba(229, 142, 38, 0.15)', border: 'rgba(229, 142, 38, 0.4)', text: '#E58E26' },
};

type FilterCategory = 'ALL' | 'VIP' | 'ACTIVE' | 'PAYING';
type SortOption = 'XP_DESC' | 'MATCHES_DESC' | 'SPENT_DESC' | 'ACTIVE_DESC';

export const UsersCrmView = () => {
  const [users, setUsers] = useState<AthleteUser[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('XP_DESC');

  // Loading & Modals
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserUtilityProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = useCallback(
    (query: string, page: number, limit: number) => {
      setLoading(true);
      setError(null);
      AdminApi.listUsers(query || undefined, page, limit)
        .then((res) => {
          setUsers(res.users);
          setTotalCount(res.total);
          setCurrentPage(res.page);
          setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / limit)));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch users:', err);
          setError(
            err.response?.data?.message ||
              err.message ||
              'Could not load athlete records from backend database.'
          );
          setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchUsers(submittedSearch, currentPage, pageSize);
  }, [submittedSearch, currentPage, pageSize, fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setSubmittedSearch('');
    setCurrentPage(1);
  };

  const handleOpenProfile = async (userId: string) => {
    setProfileLoading(true);
    setSelectedUser(null);
    try {
      const profile = await AdminApi.getUserUtility(userId);
      setSelectedUser(profile);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleGrantFreeGame = async (userId: string) => {
    try {
      await AdminApi.assignFreeGame(userId, 'VIPFREE100', 'Admin Granted Free Game');
      setGrantSuccess('100% Free Match Pass granted successfully!');
      // Refresh user profile
      const updated = await AdminApi.getUserUtility(userId);
      setSelectedUser(updated);
      setTimeout(() => setGrantSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to grant free pass');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side category filtering and sorting
  const filteredUsers = users
    .filter((u) => {
      if (filterCategory === 'VIP') {
        return u.levelName === 'Legend' || u.levelName === 'Pro' || (u.xpPoints || 0) >= 1000;
      }
      if (filterCategory === 'ACTIVE') {
        return (u.matchesCount || 0) > 0;
      }
      if (filterCategory === 'PAYING') {
        return (u.totalSpentInr || 0) > 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'MATCHES_DESC') return (b.matchesCount || 0) - (a.matchesCount || 0);
      if (sortBy === 'SPENT_DESC') return (b.totalSpentInr || 0) - (a.totalSpentInr || 0);
      if (sortBy === 'ACTIVE_DESC') {
        const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return timeB - timeA;
      }
      return (b.xpPoints || 0) - (a.xpPoints || 0);
    });

  // Calculate pagination boundaries
  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalCount);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Search and Filters Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* Multi-Field Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              minWidth: 320,
              maxWidth: 580,
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by Name, Phone (+91...), Email, or User ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '11px 36px 11px 40px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-neon)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '11px 20px', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>

          {/* Quick Actions & Total Athlete Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchUsers(submittedSearch, currentPage, pageSize)}
              className="btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Refresh database records"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.2)',
              }}
            >
              <UsersIcon size={15} color="var(--primary-neon)" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Total: <strong style={{ color: 'var(--primary-neon)', fontSize: '0.9rem' }}>{totalCount.toLocaleString()}</strong> Athletes
              </span>
            </div>
          </div>
        </div>

        {/* Filter Chips & Sorting Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={12} /> Filter:
            </span>
            <button
              className={`filter-chip ${filterCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterCategory('ALL')}
            >
              All Athletes
            </button>
            <button
              className={`filter-chip ${filterCategory === 'VIP' ? 'active' : ''}`}
              onClick={() => setFilterCategory('VIP')}
            >
              🏆 VIP (Legend / Pro)
            </button>
            <button
              className={`filter-chip ${filterCategory === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilterCategory('ACTIVE')}
            >
              🎥 Active (Matches &gt; 0)
            </button>
            <button
              className={`filter-chip ${filterCategory === 'PAYING' ? 'active' : ''}`}
              onClick={() => setFilterCategory('PAYING')}
            >
              💳 Paying (Spent &gt; ₹0)
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '6px 12px',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="XP_DESC" style={{ background: '#0C1017' }}>⚡ Highest XP Points</option>
              <option value="MATCHES_DESC" style={{ background: '#0C1017' }}>🎥 Most Matches Recorded</option>
              <option value="SPENT_DESC" style={{ background: '#0C1017' }}>💰 Highest Total Spent</option>
              <option value="ACTIVE_DESC" style={{ background: '#0C1017' }}>🕒 Recently Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: 16,
            backgroundColor: 'rgba(255, 61, 87, 0.1)',
            border: '1px solid var(--accent-crimson)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-crimson)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Athletes Table or Skeleton */}
      {loading ? (
        <SkeletonTable rows={pageSize > 25 ? 12 : 8} cols={7} />
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.06em',
                  }}
                >
                  <th style={{ padding: '16px 20px' }}>Athlete</th>
                  <th style={{ padding: '16px 20px' }}>Sport & Location</th>
                  <th style={{ padding: '16px 20px' }}>Matches</th>
                  <th style={{ padding: '16px 20px' }}>Total Spent</th>
                  <th style={{ padding: '16px 20px' }}>XP Tier</th>
                  <th style={{ padding: '16px 20px' }}>Joined / Active</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>CRM Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <UsersIcon size={32} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>No athletes found</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                        Try clearing search terms or changing filter category
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const tier = u.levelName || 'Bronze';
                    const tierStyle = LEVEL_COLORS[tier] || LEVEL_COLORS.Bronze;

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Athlete Name & Contacts */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 230, 118, 0.12)',
                                border: '1px solid rgba(0, 230, 118, 0.3)',
                                color: 'var(--primary-neon)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                              }}
                            >
                              {(u.name || 'FL').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {u.name || 'Athlete'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                                {u.phoneNumber && u.phoneNumber !== '—' && (
                                  <span
                                    style={{
                                      fontSize: '0.73rem',
                                      color: 'var(--text-muted)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                  >
                                    <Phone size={10} color="var(--primary-neon)" />
                                    {u.phoneNumber.startsWith('+') ? u.phoneNumber : `+91 ${u.phoneNumber}`}
                                  </span>
                                )}
                                {u.email && u.email !== '—' && (
                                  <span
                                    style={{
                                      fontSize: '0.73rem',
                                      color: 'var(--text-dim)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                  >
                                    <Mail size={10} />
                                    {u.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sport & City */}
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge-neon green" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                            {u.preferredSport || 'Pickleball'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                            📍 {u.city || 'Mumbai'}
                          </div>
                        </td>

                        {/* Matches Recorded */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#FFFFFF' }}>
                            <Video size={14} color="var(--primary-neon)" />
                            {u.matchesCount || 0}
                          </div>
                        </td>

                        {/* Total Spent */}
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#00E5FF' }}>
                          ₹ {(u.totalSpentInr || 0).toLocaleString('en-IN')}
                        </td>

                        {/* XP Points & Level */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                padding: '2px 7px',
                                borderRadius: 4,
                                backgroundColor: tierStyle.bg,
                                border: `1px solid ${tierStyle.border}`,
                                color: tierStyle.text,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Award size={11} />
                              {tier}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Flame size={12} color="#FFD600" />
                              <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.78rem' }}>
                                {(u.xpPoints || 0).toLocaleString()} XP
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Compact Tilted Date Badge (Joined / Last Active) */}
                        <td style={{ padding: '14px 20px' }}>
                          <CompactDateBadge date={u.lastActive || u.createdAt} tilt={true} />
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenProfile(u.id)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            View Utility
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Full Pagination Controls */}
          <div className="pagination-container">
            {/* Left: Summary & Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong style={{ color: '#FFFFFF' }}>{startEntry}</strong> to <strong style={{ color: '#FFFFFF' }}>{endEntry}</strong> of <strong style={{ color: 'var(--primary-neon)' }}>{totalCount.toLocaleString()}</strong> athletes
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={25} style={{ background: '#0C1017' }}>25</option>
                  <option value={50} style={{ background: '#0C1017' }}>50</option>
                  <option value={100} style={{ background: '#0C1017' }}>100</option>
                  <option value={250} style={{ background: '#0C1017' }}>250</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Badges */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                let pageNum = currentPage;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }

                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep User CRM Utility Modal / Drawer */}
      {(selectedUser || profileLoading) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0C1017',
              padding: 32,
              position: 'relative',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
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
              <X size={18} />
            </button>

            {profileLoading ? (
              <SkeletonUserProfile />
            ) : selectedUser ? (
              <>
                {grantSuccess && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: '12px 16px',
                      backgroundColor: 'rgba(0, 230, 118, 0.15)',
                      border: '1px solid var(--primary-neon)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--primary-neon)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {grantSuccess}
                  </div>
                )}

                {/* Profile Overview */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 24,
                    borderBottom: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                        color: '#05070A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                      }}
                    >
                      {(selectedUser.user.name || 'FL').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                          {selectedUser.user.name || 'Athlete'}
                        </h3>
                        <button
                          onClick={() => handleCopy(selectedUser.user.id, selectedUser.user.id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            color: 'var(--text-dim)',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Copy User UUID"
                        >
                          {copiedId === selectedUser.user.id ? <Check size={11} color="var(--primary-neon)" /> : <Copy size={11} />}
                          ID: {selectedUser.user.id.slice(0, 8)}...
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 16,
                          marginTop: 6,
                          color: 'var(--text-muted)',
                          fontSize: '0.8rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          📞 {selectedUser.user.phone ? (selectedUser.user.phone.startsWith('+') ? selectedUser.user.phone : `+91 ${selectedUser.user.phone}`) : 'No phone'}
                        </span>
                        <span>✉️ {selectedUser.user.email || 'No email'}</span>
                        <span>📍 {selectedUser.user.city || 'Mumbai'}</span>
                        <span style={{ color: 'var(--primary-neon)', fontWeight: 600 }}>
                          {selectedUser.user.levelName || 'Bronze'} (Level {selectedUser.user.level || 1} • {(selectedUser.user.xpBalance || 0).toLocaleString()} XP)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action: Issue Free Game */}
                  <button
                    onClick={() => handleGrantFreeGame(selectedUser.user.id)}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '9px 16px' }}
                  >
                    <Gift size={15} />
                    Grant 100% Free Game
                  </button>
                </div>

                {/* Match Recordings */}
                <div style={{ marginTop: 24 }}>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Video size={16} color="var(--primary-neon)" /> Match Recordings ({selectedUser.matches?.length || 0})
                  </h4>
                  {!selectedUser.matches || selectedUser.matches.length === 0 ? (
                    <div style={{ padding: 16, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      No match recordings recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedUser.matches.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.88rem' }}>
                              {m.turfName || 'Smart Court'} — Court {m.courtNumber || 1}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <CompactDateBadge date={m.startTime} />
                            </div>
                          </div>
                          {m.playbackUrl ? (
                            <a
                              href={m.playbackUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="badge-neon green"
                              style={{ textDecoration: 'none', gap: 4, cursor: 'pointer' }}
                            >
                              <ExternalLink size={12} /> Play Video
                            </a>
                          ) : (
                            <span className="badge-neon amber">{m.status || 'Processing'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Coupons & Passes */}
                <div style={{ marginTop: 24 }}>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Ticket size={16} color="#00E5FF" /> Active Coupons & Passes ({selectedUser.coupons?.length || 0})
                  </h4>
                  {!selectedUser.coupons || selectedUser.coupons.length === 0 ? (
                    <div style={{ padding: 16, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      No coupons assigned yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {selectedUser.coupons.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: 12,
                            backgroundColor: 'rgba(0, 229, 255, 0.05)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ color: '#00E5FF', fontWeight: 700, fontSize: '0.9rem' }}>{c.code}</code>
                            <span className="badge-neon cyan" style={{ fontSize: '0.65rem' }}>
                              {c.discountPercent}% OFF
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            {c.remainingRecordings} match uses left • {c.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchases & XP History */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                  <div>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CreditCard size={16} color="#FFD600" /> Purchases ({selectedUser.purchases?.length || 0})
                    </h4>
                    {!selectedUser.purchases || selectedUser.purchases.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No purchase transactions.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedUser.purchases.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              borderRadius: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                            }}
                          >
                            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>₹ {p.amountInr}</span>
                            <span className="badge-neon green" style={{ fontSize: '0.65rem' }}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Award size={16} color="#B388FF" /> Gamification XP Ledger ({selectedUser.pointsAudit?.length || 0})
                    </h4>
                    {!selectedUser.pointsAudit || selectedUser.pointsAudit.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No XP events logged yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedUser.pointsAudit.map((pt) => (
                          <div
                            key={pt.id}
                            style={{
                              padding: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              borderRadius: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-muted)' }}>{pt.eventType}</span>
                            <span style={{ color: '#FFD600', fontWeight: 600 }}>+{pt.points} XP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
