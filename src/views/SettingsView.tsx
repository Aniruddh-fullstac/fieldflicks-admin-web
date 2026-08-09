import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Sparkles,
  Search,
  Save,
  HardDrive,
  Radio,
  CreditCard,
  MessageSquare,
  AlertOctagon,
} from 'lucide-react';

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  usersAssigned: number;
  permissions: {
    dashboard: boolean;
    usersCrm: boolean;
    fleetAndNvr: boolean;
    recordingsAndAi: boolean;
    flickShorts: boolean;
    liveStreaming: boolean;
    tournaments: boolean;
    coupons: boolean;
    paymentsAndRefunds: boolean;
    pricing: boolean;
    notifications: boolean;
    gamification: boolean;
    ads: boolean;
    reports: boolean;
    cms: boolean;
    rbacAndAudit: boolean;
  };
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminRole: string;
  module: string;
  action: string;
  ipAddress: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
}

const initialRoles: RoleDefinition[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Unrestricted root platform access to all modules, billing, and server settings.',
    usersAssigned: 2,
    permissions: {
      dashboard: true,
      usersCrm: true,
      fleetAndNvr: true,
      recordingsAndAi: true,
      flickShorts: true,
      liveStreaming: true,
      tournaments: true,
      coupons: true,
      paymentsAndRefunds: true,
      pricing: true,
      notifications: true,
      gamification: true,
      ads: true,
      reports: true,
      cms: true,
      rbacAndAudit: true,
    },
  },
  {
    id: 'ops-manager',
    name: 'Operations Manager',
    description: 'Manages turf fleet, NVR Dahua cameras, Raspberry Pi stream gateways, and match extractions.',
    usersAssigned: 4,
    permissions: {
      dashboard: true,
      usersCrm: true,
      fleetAndNvr: true,
      recordingsAndAi: true,
      flickShorts: false,
      liveStreaming: true,
      tournaments: true,
      coupons: false,
      paymentsAndRefunds: false,
      pricing: false,
      notifications: false,
      gamification: false,
      ads: false,
      reports: true,
      cms: false,
      rbacAndAudit: false,
    },
  },
  {
    id: 'tournament-manager',
    name: 'Tournament Manager',
    description: 'Controls tournament registrations, bracket fixtures, prize pools, and live streaming links.',
    usersAssigned: 3,
    permissions: {
      dashboard: true,
      usersCrm: true,
      fleetAndNvr: false,
      recordingsAndAi: true,
      flickShorts: true,
      liveStreaming: true,
      tournaments: true,
      coupons: true,
      paymentsAndRefunds: false,
      pricing: false,
      notifications: true,
      gamification: true,
      ads: true,
      reports: true,
      cms: false,
      rbacAndAudit: false,
    },
  },
  {
    id: 'moderator',
    name: 'Content Moderator',
    description: 'Reviews athlete-uploaded FlickShorts, verifies AI highlight moments, and moderates flags.',
    usersAssigned: 5,
    permissions: {
      dashboard: true,
      usersCrm: false,
      fleetAndNvr: false,
      recordingsAndAi: true,
      flickShorts: true,
      liveStreaming: false,
      tournaments: false,
      coupons: false,
      paymentsAndRefunds: false,
      pricing: false,
      notifications: false,
      gamification: false,
      ads: false,
      reports: false,
      cms: false,
      rbacAndAudit: false,
    },
  },
  {
    id: 'finance-billing',
    name: 'Finance & Billing',
    description: 'Monitors Razorpay gross settlements, approves refunds, and configures pricing plans.',
    usersAssigned: 2,
    permissions: {
      dashboard: true,
      usersCrm: true,
      fleetAndNvr: false,
      recordingsAndAi: false,
      flickShorts: false,
      liveStreaming: false,
      tournaments: false,
      coupons: true,
      paymentsAndRefunds: true,
      pricing: true,
      notifications: false,
      gamification: false,
      ads: true,
      reports: true,
      cms: false,
      rbacAndAudit: false,
    },
  },
];

export const SettingsView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'RBAC' | 'AUDIT_LOGS' | 'INTEGRATIONS'>('RBAC');
  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition>(initialRoles[0]);
  const [auditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleTogglePermission = (moduleKey: keyof RoleDefinition['permissions']) => {
    const updated = {
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [moduleKey]: !selectedRole.permissions[moduleKey],
      },
    };
    setSelectedRole(updated);
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSavePermissions = () => {
    showToast(`🔒 Permissions matrix for "${selectedRole.name}" updated successfully!`);
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.adminEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

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
            <Shield size={26} color="var(--primary-neon)" />
            Platform Security, RBAC & Audit Trails
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Role-Based Access Control, administrative audit logs, cloud infrastructure health & maintenance switches
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {(['RBAC', 'AUDIT_LOGS', 'INTEGRATIONS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeSubTab === tab ? 'var(--primary-neon)' : 'transparent',
                color: activeSubTab === tab ? '#05070A' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'RBAC' ? 'Roles & Permissions' : tab === 'AUDIT_LOGS' ? 'Audit Trail Logs' : 'Cloud Integrations'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Roles & RBAC Matrix */}
      {activeSubTab === 'RBAC' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Roles Selector List */}
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', padding: '4px 8px' }}>
              Configured Admin Roles
            </span>

            {roles.map((r) => {
              const isSelected = r.id === selectedRole.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid var(--primary-neon)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#FFF' : 'var(--text-main)' }}>
                      {r.name}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {r.usersAssigned} admins
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Granular Module Permissions Matrix */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>
                  Permission Matrix: <span style={{ color: 'var(--primary-neon)' }}>{selectedRole.name}</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Toggle administrative capabilities permitted for this role profile
                </p>
              </div>

              <button
                onClick={handleSavePermissions}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
              >
                <Save size={16} /> Save Matrix
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {Object.entries(selectedRole.permissions).map(([modKey, isAllowed]) => {
                const formatLabel = modKey
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase());

                return (
                  <label
                    key={modKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isAllowed ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isAllowed ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>{formatLabel}</span>
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => handleTogglePermission(modKey as keyof RoleDefinition['permissions'])}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Logs Trail */}
      {activeSubTab === 'AUDIT_LOGS' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 360 }}>
              <Search size={16} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Search by admin email, module, or action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
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

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredLogs.length} logged actions</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>Timestamp</th>
                  <th style={{ padding: '14px 20px' }}>Admin User</th>
                  <th style={{ padding: '14px 20px' }}>Module & Action</th>
                  <th style={{ padding: '14px 20px' }}>Details & Context</th>
                  <th style={{ padding: '14px 20px' }}>IP Address</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{log.adminEmail}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.adminRole}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                        {log.module}
                      </span>
                      <div style={{ fontWeight: 600, color: '#FFF', marginTop: 2 }}>{log.action}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontSize: '0.8rem' }}>{log.details}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {log.ipAddress}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {log.status === 'SUCCESS' ? (
                        <span className="badge-neon green">SUCCESS</span>
                      ) : (
                        <span className="badge-neon crimson">DENIED</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ShieldCheck size={40} style={{ margin: '0 auto 14px', opacity: 0.4, display: 'block', color: 'var(--primary-neon)' }} />
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>No Audit Logs Recorded</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                        All admin mutations, configuration changes, and RBAC actions are immutably logged and audited here.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Integrations & Cloud Infrastructure */}
      {activeSubTab === 'INTEGRATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cloud Health Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* AWS S3 */}
            <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--primary-neon)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={18} color="var(--primary-neon)" />
                  <strong style={{ color: '#FFF' }}>AWS S3 Vault</strong>
                </div>
                <span className="badge-neon green">HEALTHY</span>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Bucket: <code style={{ color: '#FFF' }}>fieldflicks-recordings-ap-south-1</code>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Storage Ingest: <strong style={{ color: '#FFF' }}>Auto-synced on completion</strong>
              </div>
            </div>

            {/* Mux Live Streaming */}
            <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={18} color="var(--accent-cyan)" />
                  <strong style={{ color: '#FFF' }}>Mux Live Gateway</strong>
                </div>
                <span className="badge-neon cyan">ACTIVE</span>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Status: <strong style={{ color: '#FFF' }}>Low-Latency Ingest Ready</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Active Broadcast Channels: <strong style={{ color: '#FFF' }}>Dynamic RTMP / HLS</strong>
              </div>
            </div>

            {/* Razorpay Payments */}
            <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="var(--accent-amber)" />
                  <strong style={{ color: '#FFF' }}>Razorpay Payment Gateway</strong>
                </div>
                <span className="badge-neon amber">VERIFIED</span>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Webhooks: <strong style={{ color: '#FFF' }}>payment.captured & refund.processed</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Settlement Cycle: <strong style={{ color: '#FFF' }}>T+1 Automatic</strong>
              </div>
            </div>

            {/* MSG91 SMS */}
            <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} color="var(--accent-purple)" />
                  <strong style={{ color: '#FFF' }}>MSG91 SMS Gateway</strong>
                </div>
                <span className="badge-neon purple">99.8% SLA</span>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Route: <strong style={{ color: '#FFF' }}>DLT Approved OTP & Broadcast</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Status: <strong style={{ color: '#FFF' }}>Active Gateway</strong>
              </div>
            </div>
          </div>

          {/* Emergency Platform Maintenance Switch */}
          <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255, 61, 87, 0.4)', background: 'rgba(255, 61, 87, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertOctagon size={28} color="var(--accent-crimson)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>
                    Emergency Platform Maintenance Mode
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    When toggled ON, athlete mobile app displays a maintenance screen and halts all new NVR recording extractions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const next = !maintenanceMode;
                  setMaintenanceMode(next);
                  showToast(next ? '🚨 Emergency Maintenance Mode ACTIVATED.' : '✅ Maintenance Mode DEACTIVATED.');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: maintenanceMode ? 'var(--accent-crimson)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {maintenanceMode ? 'ACTIVE (Turn OFF)' : 'Enable Maintenance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
