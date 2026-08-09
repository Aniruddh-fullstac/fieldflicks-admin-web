import { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Video,
  Radio,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AdminApi } from '../services/api';
import { SkeletonStats, SkeletonChart } from '../components/Skeleton';
import type { OverviewData } from '../types';

interface OverviewViewProps {
  onNavigate?: (tab: string) => void;
}

export const OverviewView = ({ onNavigate }: OverviewViewProps) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'matches' | 'signups'>('revenue');

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      AdminApi.getOverview(),
      AdminApi.getRecordings({ limit: 4 }).catch(() => ({ recordings: [] })),
    ])
      .then(([overviewRes, recRes]) => {
        setData(overviewRes);
        setRecentRecordings(recRes.recordings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch overview analytics:', err);
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || '';

        if (status === 502 || status === 503 || msg.includes('ECONNRESET') || msg.includes('Network Error')) {
          setError('Backend is restarting on Render with latest updates. Auto-reconnecting...');
          setTimeout(() => {
            fetchOverview();
          }, 6000);
        } else {
          setError(msg || 'Unable to connect to backend server. Make sure the backend service is running.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <SkeletonStats count={4} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <SkeletonChart height={340} title="Performance & Growth Trends" />
          <SkeletonChart height={340} title="Sport Distribution" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    const isDeploying = error.includes('restarting on Render') || error.includes('Auto-reconnecting');

    return (
      <div style={{ padding: 24 }}>
        <div
          className="glass-card"
          style={{
            padding: 32,
            textAlign: 'center',
            border: `1px solid ${isDeploying ? 'rgba(255, 214, 0, 0.4)' : 'rgba(255, 61, 87, 0.4)'}`,
          }}
        >
          {isDeploying ? (
            <RefreshCw size={36} className="spin" color="#FFD600" style={{ margin: '0 auto 16px' }} />
          ) : (
            <AlertTriangle size={36} color="var(--accent-crimson)" style={{ margin: '0 auto 16px' }} />
          )}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {isDeploying ? 'Backend Service Deploying' : 'Connection Error'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 500, margin: '8px auto 20px' }}>
            {error}
          </p>
          <button onClick={fetchOverview} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    grossRevenueInr: 0,
    arpuInr: '0.00',
    mau: 0,
    dau: 0,
    userGrowthMoM: '0%',
    totalRecordings: 0,
    recordingSuccessRate: '100%',
    completedRecordings: 0,
    totalCourts: 0,
    activeStreams: 0,
    totalVenues: 0,
  };

  const timeSeries = Array.isArray(data?.timeSeries) ? data.timeSeries : [];

  const defaultColors = ['#00E676', '#00E5FF', '#FFD600', '#FF3D57', '#B388FF'];
  const rawSports = Array.isArray(data?.sportDistribution) ? data.sportDistribution : [];

  const sportsData = rawSports.map((item, idx) => ({
    name: item.name || 'Sport',
    value: Number(item.value ?? (item as any).count ?? 0) || 0,
    color: item.color || defaultColors[idx % defaultColors.length],
  }));

  const totalSportsCourts = sportsData.reduce((acc, curr) => acc + curr.value, 0);

  const statCards = [
    {
      label: 'Gross Platform Revenue',
      value: `₹ ${(summary?.grossRevenueInr ?? 0).toLocaleString('en-IN')}`,
      change: summary?.arpuInr ? `ARPU: ₹${summary.arpuInr}` : 'Platform Total',
      trend: 'up',
      icon: DollarSign,
      color: '#00E676',
    },
    {
      label: 'Active Athletes (MAU)',
      value: `${(summary?.mau ?? 0).toLocaleString()}`,
      subvalue: `${summary?.dau ?? 0} Daily Active (DAU)`,
      change: summary?.userGrowthMoM || 'Live Athletes',
      trend: 'up',
      icon: Users,
      color: '#00E5FF',
    },
    {
      label: 'Match Recordings',
      value: `${(summary?.totalRecordings ?? 0).toLocaleString()}`,
      subvalue: `${summary?.recordingSuccessRate || '98.8%'} Success Rate`,
      change: `${summary?.completedRecordings ?? 0} Completed`,
      trend: 'up',
      icon: Video,
      color: '#FFD600',
    },
    {
      label: 'Connected Court Fleet',
      value: `${summary?.totalCourts ?? 0} Courts`,
      subvalue: `${summary?.activeStreams ?? 0} Active Live Streams`,
      change: `${summary?.totalVenues ?? 0} Total Venues`,
      trend: 'up',
      icon: Radio,
      color: '#B388FF',
    },
  ];

  const metricConfig = {
    revenue: {
      key: 'revenue',
      label: 'Revenue',
      stroke: '#00E676',
      fill: 'url(#colorRevenue)',
      formatter: (v: number) => `₹ ${v.toLocaleString('en-IN')}`,
    },
    matches: {
      key: 'matches',
      label: 'Recorded Matches',
      stroke: '#00E5FF',
      fill: 'url(#colorMatches)',
      formatter: (v: number) => `${v.toLocaleString()} Matches`,
    },
    signups: {
      key: 'signups',
      label: 'New Athletes',
      stroke: '#FFD600',
      fill: 'url(#colorSignups)',
      formatter: (v: number) => `${v.toLocaleString()} Players`,
    },
  };

  const currentMetric = metricConfig[chartMetric];

  const formatXAxisDate = (dateVal: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      
      {/* 4 Primary KPI Cards */}
      <div className="stats-kpi-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${card.color}15`,
                    border: `1px solid ${card.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={card.color} />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{card.subvalue}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  color: card.trend === 'up' ? 'var(--primary-neon)' : 'var(--text-dim)',
                  fontWeight: 600,
                }}
              >
                <TrendingUp size={13} />
                <span>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Operations & Moderation Queue Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div
          onClick={() => onNavigate?.('flickshorts')}
          className="glass-card table-row-hover"
          style={{
            padding: 18,
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent-cyan)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>FLICKSHORTS QUEUE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginTop: 2 }}>Content Desk</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: 2 }}>Moderate athlete vertical videos</div>
          </div>
          <ArrowRight size={18} color="var(--accent-cyan)" />
        </div>

        <div
          onClick={() => onNavigate?.('recordings')}
          className="glass-card table-row-hover"
          style={{
            padding: 18,
            cursor: 'pointer',
            borderLeft: '4px solid var(--primary-neon)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>RECORDINGS VAULT</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginTop: 2 }}>{summary.totalRecordings} Total Matches</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-neon)', marginTop: 2 }}>Verify and export recordings</div>
          </div>
          <ArrowRight size={18} color="var(--primary-neon)" />
        </div>

        <div
          onClick={() => onNavigate?.('payments')}
          className="glass-card table-row-hover"
          style={{
            padding: 18,
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent-amber)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>FINANCE & REVENUE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginTop: 2 }}>₹ {(summary.grossRevenueInr ?? 0).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginTop: 2 }}>View Razorpay ledgers & GST</div>
          </div>
          <ArrowRight size={18} color="var(--accent-amber)" />
        </div>

        <div
          onClick={() => onNavigate?.('fleet')}
          className="glass-card table-row-hover"
          style={{
            padding: 18,
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent-purple)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>NVR FLEET STATUS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginTop: 2 }}>{summary.totalCourts} Connected Courts</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', marginTop: 2 }}>{summary.activeStreams} Active Live Streams</div>
          </div>
          <ArrowRight size={18} color="var(--accent-purple)" />
        </div>
      </div>

      {/* Analytics Chart & Sports Breakdown Grid */}
      <div className="overview-charts-grid">
        {/* Interactive 30-Day Growth Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--primary-neon)" /> Performance & Growth Trends
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                30-day continuous platform telemetry
              </p>
            </div>

            {/* Metric Toggle Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: 4,
                borderRadius: 'var(--radius-sm)',
                gap: 4,
              }}
            >
              {(['revenue', 'matches', 'signups'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: chartMetric === m ? 'var(--primary-neon)' : 'transparent',
                    color: chartMetric === m ? '#05070A' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {m === 'revenue' ? 'Gross Revenue' : m === 'matches' ? 'Match Volumes' : 'Signups'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 12, right: 10, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD600" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FFD600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                  tickFormatter={formatXAxisDate}
                  minTickGap={30}
                  dy={6}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                  tickFormatter={(val) => (chartMetric === 'revenue' ? `₹${val}` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0C1017',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                  }}
                  formatter={(value: any) => [currentMetric.formatter(Number(value) || 0), currentMetric.label]}
                />
                <Area
                  type="monotone"
                  dataKey={currentMetric.key}
                  stroke={currentMetric.stroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={currentMetric.fill}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sports Distribution Donut Chart */}
        <div className="glass-card" style={{ padding: 24, position: 'relative' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="#00E5FF" /> Sport Distribution
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
            Connected camera sessions by sport
          </p>

          <div style={{ height: 260, width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportsData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {sportsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0C1017',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} Courts (${((Number(value) / (totalSportsCourts || 1)) * 100).toFixed(0)}%)`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span style={{ color: '#F1F5F9', fontSize: '0.75rem', fontWeight: 500 }}>
                      {val}{' '}
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        ({entry.payload?.value ?? 0})
                      </span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Badge */}
            <div
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                {totalSportsCourts}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 3 }}>
                Courts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Realtime Platform Activity Stream */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--primary-neon)" />
            Realtime Recording & Hardware Activity Stream
          </h4>
          <span className="badge-neon green" style={{ fontSize: '0.65rem' }}>CONNECTED</span>
        </div>

        {recentRecordings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {recentRecordings.slice(0, 3).map((rec, idx) => {
              const statusColor = rec.status === 'READY' || rec.status === 'COMPLETED' ? 'var(--primary-neon)' : rec.status === 'FAILED' ? 'var(--accent-crimson)' : 'var(--accent-amber)';
              return (
                <div key={rec.id || idx} style={{ padding: 12, borderRadius: 8, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                  <div style={{ fontSize: '0.8rem', color: '#E2E8F0' }}>
                    <strong>{rec.venueName || 'Court Session'}</strong> • #{String(rec.id || '').slice(0, 8)} • <span style={{ color: statusColor, fontWeight: 600 }}>{rec.status || 'RECORDING'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recent recordings or stream events yet. Connected cameras will report live telemetry here.
          </div>
        )}
      </div>
    </div>
  );
};
