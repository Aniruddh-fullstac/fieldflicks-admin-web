import { useState } from 'react';
import {
  FileText,
  Save,
  Sparkles,
  Eye,
  Edit3,
} from 'lucide-react';

interface CmsDocument {
  id: string;
  slug: string;
  title: string;
  category: 'LEGAL' | 'COMMUNITY' | 'SUPPORT' | 'PRODUCT';
  lastUpdated: string;
  contentMarkdown: string;
}

const initialCmsDocs: CmsDocument[] = [
  {
    id: 'cms-1',
    slug: 'terms-of-service',
    title: 'Terms of Service',
    category: 'LEGAL',
    lastUpdated: '2026-08-01',
    contentMarkdown: `# FieldFlicks Terms of Service\n\n**Last Updated:** August 1, 2026\n\n### 1. Introduction\nWelcome to FieldFlicks. By accessing or using our mobile application, Dahua NVR camera playback services, or live streaming streams, you agree to be bound by these Terms.\n\n### 2. Match Recording & Storage\n- Match recordings are captured via edge camera installations at verified partner turf venues.\n- Raw recordings are retained in AWS S3 for a period of **30 days** following the match date.\n- Users who purchase a Match Unlock pass receive permanent access to their match highlights in their athlete vault.\n\n### 3. Refunds & Cancellations\nIn the event that an NVR hardware failure or network disruption prevents footage capture, FieldFlicks will automatically refund the full purchase price to the original payment source within 24 hours.`,
  },
  {
    id: 'cms-2',
    slug: 'privacy-policy',
    title: 'Privacy Policy & Camera Disclosures',
    category: 'LEGAL',
    lastUpdated: '2026-07-15',
    contentMarkdown: `# FieldFlicks Privacy Policy\n\n### 1. Information We Collect\nWe collect athlete account details (name, phone number, email) and footage captured at participating sports arenas.\n\n### 2. Video Footage Privacy\n- Cameras are strictly positioned facing playing courts and pitch boundaries.\n- Automated AI highlighting models only process player motion, ball trajectories, and court milestones.\n- Videos marked 'Private' in the athlete vault are never shared to public trending feeds.`,
  },
  {
    id: 'cms-3',
    slug: 'faq-help-center',
    title: 'Frequently Asked Questions (FAQ)',
    category: 'SUPPORT',
    lastUpdated: '2026-08-05',
    contentMarkdown: `# FieldFlicks Help Center & FAQs\n\n### Q: How do I find my match footage?\n**A:** Ensure your match was played on a registered FieldFlicks court. Open the mobile app, navigate to **Recordings**, select the turf venue and court number, and choose your match time slot.\n\n### Q: How long does AI Highlight Generation take?\n**A:** Highlight generation typically finishes within **5 to 10 minutes** after match completion.\n\n### Q: Can I download 4K Ultra-HD raw footage?\n**A:** Yes! Athletes on the Pro Membership pass or individual 4K unlock passes can download full-bitrate MP4 files directly to their device gallery.`,
  },
  {
    id: 'cms-4',
    slug: 'release-notes',
    title: 'App Release Notes & Changelog',
    category: 'PRODUCT',
    lastUpdated: '2026-08-08',
    contentMarkdown: `# FieldFlicks App v2.4.0 Release Notes\n\n### 🚀 New Features\n- **FlickShorts Vertical Feed:** Discover top weekly goals and jump smashes in 9:16 portrait video.\n- **Low-Latency Live Streaming:** Watch ongoing tournament games with under 2-second broadcast latency.\n- **XP Progression & Leaderboards:** Climb the city leaderboards and win free monthly match passes.\n\n### 🛠 Performance Improvements\n- 40% faster HLS video player startup time on iOS and Android.\n- Enhanced Dahua NVR clip search precision.`,
  },
];

export const CmsView = () => {
  const [docs, setDocs] = useState<CmsDocument[]>(initialCmsDocs);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialCmsDocs[0].id);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdateContent = (newContent: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedDocId ? { ...d, contentMarkdown: newContent, lastUpdated: 'Just now' } : d))
    );
  };

  const handleSaveDoc = () => {
    showToast(`✨ "${selectedDoc.title}" published live to mobile app and web CMS endpoints!`);
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
            <FileText size={26} color="var(--primary-neon)" />
            CMS, Legal Policies & Help Center Content
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Edit live Terms of Service, Privacy Policies, Help Center FAQs, and Mobile App Release Notes
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
          >
            {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
            {previewMode ? 'Edit Markdown' : 'Live Preview'}
          </button>

          <button
            onClick={handleSaveDoc}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Save size={16} />
            Publish Live Changes
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Doc List & Right Editor/Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Documents Selector */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', padding: '6px 8px' }}>
            Managed CMS Documents
          </span>

          {docs.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid var(--primary-neon)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isSelected ? 'var(--primary-neon)' : 'var(--text-dim)' }}>
                    {doc.category}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{doc.lastUpdated}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#FFF' : 'var(--text-main)' }}>
                  {doc.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Markdown Editor / Live Render */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>{selectedDoc.title}</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Slug: <code style={{ color: 'var(--primary-neon)' }}>/api/cms/{selectedDoc.slug}</code> • Last edited: {selectedDoc.lastUpdated}
              </div>
            </div>

            <span className="badge-neon green">Auto-Sync Enabled</span>
          </div>

          {previewMode ? (
            /* Markdown Preview Renderer */
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 24,
                color: '#E2E8F0',
                lineHeight: 1.6,
                minHeight: 450,
                fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedDoc.contentMarkdown}
            </div>
          ) : (
            /* Markdown Raw Editor */
            <textarea
              value={selectedDoc.contentMarkdown}
              onChange={(e) => handleUpdateContent(e.target.value)}
              rows={18}
              style={{
                width: '100%',
                background: 'rgba(15, 20, 29, 0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                color: '#FFF',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
