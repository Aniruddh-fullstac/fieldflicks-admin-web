import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  title: string;
  category: 'FINANCIAL' | 'OPERATIONAL' | 'ATHLETES' | 'HARDWARE';
  description: string;
  metricsCovered: string[];
  fileFormat: 'CSV' | 'JSON' | 'PDF';
  lastGenerated: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'rep-1',
    title: 'Financial Settlement & GST Tax Audit Report',
    category: 'FINANCIAL',
    description: 'Detailed breakdown of match unlocks, subscription revenue, coupon discounts, Razorpay fees, and 18% GST liability.',
    metricsCovered: ['Gross Revenue', 'Net Settlement', 'GST Liability', 'Refunds & Chargebacks', 'Razorpay Gateway Fees'],
    fileFormat: 'CSV',
    lastGenerated: 'Live On-Demand',
  },
  {
    id: 'rep-2',
    title: 'Athlete Acquisition, Retention & ARPU Cohort',
    category: 'ATHLETES',
    description: 'Monthly active athletes, conversion rate from first match to paid download, repeat unlock frequency, and average revenue per user.',
    metricsCovered: ['DAU / MAU', '30-Day Retention %', 'ARPU (INR)', 'Preferred Sport Breakdown', 'LTV'],
    fileFormat: 'CSV',
    lastGenerated: 'Live On-Demand',
  },
  {
    id: 'rep-3',
    title: 'Turf Venue & Court Utilization Heatmap',
    category: 'OPERATIONAL',
    description: 'Hourly match density per venue court, peak recording extraction hours, and operator utilization rates.',
    metricsCovered: ['Total Match Hours Recorded', 'Peak Extraction Hours', 'Court Utilization %', 'VIP Tournament Bookings'],
    fileFormat: 'CSV',
    lastGenerated: 'Live On-Demand',
  },
  {
    id: 'rep-4',
    title: 'NVR Hardware Health & Streaming SLA Reliability',
    category: 'HARDWARE',
    description: 'Dahua NVR uptime logs, RTSP stream ping latency, Raspberry Pi gateway frame drops, and extraction success rates.',
    metricsCovered: ['NVR Uptime %', 'Streaming SLA (99.8%)', 'Failed Extraction Incidents', 'Latency (ms)'],
    fileFormat: 'CSV',
    lastGenerated: 'Live On-Demand',
  },
];

export const ReportsView = () => {
  const [reports] = useState<ReportTemplate[]>(REPORT_TEMPLATES);
  const [dateRange, setDateRange] = useState<'7D' | '30D' | 'QUARTER' | 'YEAR'>('30D');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDownloadReport = (rep: ReportTemplate) => {
    const headerRow = ['Report Category', 'Metric Name', 'Time Window', 'Generated At Status'];
    const metricRows = rep.metricsCovered.map((metric) => [
      rep.category,
      metric,
      dateRange,
      new Date().toISOString(),
    ]);

    const csvContent = [headerRow, ...metricRows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${rep.title.replace(/\s+/g, '_')}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📊 Exported "${rep.title}" (${dateRange}) successfully!`);
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={26} color="var(--primary-neon)" />
            Reports Center & Business Intelligence
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Download board-ready financial reconciliations, athlete cohort retention matrices, and court utilization audits
          </p>
        </div>

        {/* Date Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {(['7D', '30D', 'QUARTER', 'YEAR'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: dateRange === r ? 'var(--primary-neon)' : 'transparent',
                color: dateRange === r ? '#05070A' : 'var(--text-muted)',
              }}
            >
              {r === '7D' ? 'Last 7 Days' : r === '30D' ? 'Last 30 Days' : r === 'QUARTER' ? 'This Quarter' : 'Year to Date'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="glass-card"
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background:
                      rep.category === 'FINANCIAL'
                        ? 'rgba(0, 230, 118, 0.12)'
                        : rep.category === 'ATHLETES'
                        ? 'rgba(0, 229, 255, 0.12)'
                        : rep.category === 'OPERATIONAL'
                        ? 'rgba(255, 214, 0, 0.12)'
                        : 'rgba(179, 136, 255, 0.12)',
                    color:
                      rep.category === 'FINANCIAL'
                        ? 'var(--primary-neon)'
                        : rep.category === 'ATHLETES'
                        ? 'var(--accent-cyan)'
                        : rep.category === 'OPERATIONAL'
                        ? 'var(--accent-amber)'
                        : 'var(--accent-purple)',
                  }}
                >
                  {rep.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Updated {rep.lastGenerated}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', marginTop: 12 }}>
                {rep.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: 6, lineHeight: 1.4 }}>
                {rep.description}
              </p>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Covered Data Fields:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rep.metricsCovered.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-main)',
                      }}
                    >
                      • {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target Window: <strong style={{ color: '#FFF' }}>{dateRange}</strong>
              </span>

              <button
                onClick={() => handleDownloadReport(rep)}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                <Download size={14} /> Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
