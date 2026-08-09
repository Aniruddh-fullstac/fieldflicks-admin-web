import { useState } from 'react';
import {
  Bell,
  BellRing,
  Send,
  MessageSquare,
  Smartphone,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  channels: ('PUSH' | 'SMS' | 'IN_APP')[];
  targetAudience: string;
  recipientCount: number;
  openRatePercent?: number;
  clickCount?: number;
  status: 'DELIVERED' | 'SCHEDULED' | 'DRAFT' | 'SENDING';
  scheduledTime?: string;
  createdAt: string;
}

export const NotificationsView = () => {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pushSelected, setPushSelected] = useState(true);
  const [smsSelected, setSmsSelected] = useState(false);
  const [inAppSelected, setInAppSelected] = useState(true);
  const [targetAudience, setTargetAudience] = useState('ALL_USERS');
  const [specificNumber, setSpecificNumber] = useState('');
  const [deepLink, setDeepLink] = useState('fieldflicks://tournaments');
  const [deliveryMode, setDeliveryMode] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduleDateTime, setScheduleDateTime] = useState('2026-08-10T18:00');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    if (targetAudience === 'SPECIFIC_NUMBER' && specificNumber.length < 10) {
      showToast('⚠️ Please enter a valid 10-digit number');
      return;
    }

    setSending(true);

    const channels: ('PUSH' | 'SMS' | 'IN_APP')[] = [];
    if (pushSelected) channels.push('PUSH');
    if (smsSelected) channels.push('SMS');
    if (inAppSelected) channels.push('IN_APP');

    try {
      // Import AdminApi at top level if not present, but assuming it is or we'll add it
      const { AdminApi } = await import('../services/api');
      const res = await AdminApi.broadcastNotification({
        title,
        body,
        targetAudience,
        specificNumber: targetAudience === 'SPECIFIC_NUMBER' ? specificNumber : undefined,
      });

      const targetLabel = targetAudience === 'SPECIFIC_NUMBER' ? `Athlete (${specificNumber})` : 'All Athletes';

      const newCampaign: NotificationCampaign = {
        id: `camp-${Date.now().toString().slice(-4)}`,
        title,
        body,
        channels,
        targetAudience: targetLabel,
        recipientCount: res.recipientCount,
        status: deliveryMode === 'NOW' ? 'DELIVERED' : 'SCHEDULED',
        scheduledTime: deliveryMode === 'SCHEDULE' ? scheduleDateTime : undefined,
        openRatePercent: deliveryMode === 'NOW' ? 0 : undefined,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      setCampaigns([newCampaign, ...campaigns]);
      setTitle('');
      setBody('');
      setSpecificNumber('');
      showToast(
        deliveryMode === 'NOW'
          ? `🚀 Notification broadcast dispatched to ${res.recipientCount} athletes!`
          : `⏰ Campaign scheduled for ${scheduleDateTime} to ${targetLabel}!`
      );
    } catch (err: any) {
      console.error('Failed to broadcast:', err);
      showToast(`⚠️ Failed to send: ${err.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
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
            <Bell size={26} color="var(--primary-neon)" />
            Notifications & Broadcast Campaigns
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Compose targeted push notifications, SMS announcements, and automated match highlight alerts
          </p>
        </div>
      </div>

      {/* Main Split Layout: Left Composer & Right Live Mobile Notification Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Notification Composer Form */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Send size={18} color="var(--primary-neon)" />
            Campaign Composer
          </h3>

          <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Delivery Channels */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>
                Broadcast Channels
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: pushSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: pushSelected ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={pushSelected}
                    onChange={(e) => setPushSelected(e.target.checked)}
                  />
                  <Smartphone size={16} color="var(--primary-neon)" />
                  Push (FCM)
                </label>

                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: smsSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: smsSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={smsSelected}
                    onChange={(e) => setSmsSelected(e.target.checked)}
                  />
                  <MessageSquare size={16} color="var(--accent-cyan)" />
                  SMS (MSG91)
                </label>

                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: inAppSelected ? 'rgba(179, 136, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: inAppSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={inAppSelected}
                    onChange={(e) => setInAppSelected(e.target.checked)}
                  />
                  <Bell size={16} color="var(--accent-purple)" />
                  In-App Banner
                </label>
              </div>
            </div>

            {/* Target Audience Segment */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Target Audience Segment
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 20, 29, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  marginBottom: targetAudience === 'SPECIFIC_NUMBER' ? 12 : 0,
                }}
              >
                <option value="ALL_USERS">All Registered Athletes</option>
                <option value="SPECIFIC_NUMBER">Specific Athlete (Phone Number)</option>
              </select>

              {targetAudience === 'SPECIFIC_NUMBER' && (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Enter 10-digit mobile number"
                    value={specificNumber}
                    onChange={(e) => setSpecificNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px 10px 38px',
                      color: '#FFF',
                      fontSize: '0.9rem',
                    }}
                  />
                  <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Notification Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 🏆 Weekend Football League is live!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Message Body
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter compelling message text with emojis and call to action..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Deep Link URL */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Deep Link Action URL
              </label>
              <input
                type="text"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                placeholder="fieldflicks://tournaments or https://..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Dispatch Schedule Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: deliveryMode === 'NOW' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: deliveryMode === 'NOW' ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="deliveryMode"
                  checked={deliveryMode === 'NOW'}
                  onChange={() => setDeliveryMode('NOW')}
                />
                <Zap size={16} color="var(--primary-neon)" />
                Send Immediately
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: deliveryMode === 'SCHEDULE' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: deliveryMode === 'SCHEDULE' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="deliveryMode"
                  checked={deliveryMode === 'SCHEDULE'}
                  onChange={() => setDeliveryMode('SCHEDULE')}
                />
                <Calendar size={16} color="var(--accent-cyan)" />
                Schedule Later
              </label>
            </div>

            {deliveryMode === 'SCHEDULE' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                  Scheduled Delivery Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 20, 29, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: '100%',
                background: sending ? 'rgba(0,230,118,0.5)' : 'var(--primary-neon)',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 800,
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
                border: 'none',
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Dispatching...' : (
                <>
                  <Zap size={18} />
                  {deliveryMode === 'NOW' ? 'Dispatch Broadcast Now' : 'Schedule Campaign'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Mobile Push Lockscreen Preview */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={18} color="var(--accent-cyan)" />
            Mobile Lockscreen Preview
          </h3>

          <div
            style={{
              width: '100%',
              maxWidth: 300,
              height: 480,
              margin: '0 auto',
              borderRadius: 32,
              background: '#0B0F19',
              border: '4px solid #1E293B',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {/* Phone Notch */}
            <div style={{ width: 100, height: 18, background: '#1E293B', borderRadius: 9, margin: '0 auto 16px' }} />

            {/* Time on phone */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 300, color: '#FFF' }}>09:41</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sunday, August 9</div>
            </div>

            {/* The Push Notification Banner */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                animation: 'slideUp 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--primary-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000' }}>FF</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>FIELDFLICKS</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>now</span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                {title || '🏆 Weekend Tournament Registration Open!'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.3 }}>
                {body || 'The Monsoon Premier League kicks off this Saturday. Register your squad now before slots fill up!'}
              </div>
            </div>

            <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ width: 100, height: 4, background: '#475569', borderRadius: 2, margin: '0 auto' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Broadcast Logs Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>Broadcast Campaign History</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{campaigns.length} total campaigns</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Campaign</th>
                <th style={{ padding: '14px 20px' }}>Target Segment</th>
                <th style={{ padding: '14px 20px' }}>Channels</th>
                <th style={{ padding: '14px 20px' }}>Recipients</th>
                <th style={{ padding: '14px 20px' }}>Open Rate</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#FFF' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.createdAt}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}>{c.targetAudience}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {c.channels.map((ch) => (
                        <span key={ch} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#FFF' }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#FFF' }}>{c.recipientCount.toLocaleString()} athletes</td>
                  <td style={{ padding: '14px 20px' }}>
                    {c.openRatePercent !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-neon)' }}>{c.openRatePercent}%</span>
                        {c.clickCount && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({c.clickCount} clicks)</span>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {c.status === 'DELIVERED' && (
                      <span className="badge-neon green">
                        <CheckCircle2 size={12} /> DELIVERED
                      </span>
                    )}
                    {c.status === 'SCHEDULED' && (
                      <span className="badge-neon cyan">
                        <Clock size={12} /> SCHEDULED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <BellRing size={40} style={{ margin: '0 auto 14px', opacity: 0.4, display: 'block', color: 'var(--accent-cyan)' }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>No Broadcast Campaigns Dispatched Yet</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      Create and broadcast push notifications, SMS alerts, or in-app promotions to athlete segments using the composer on the left.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
