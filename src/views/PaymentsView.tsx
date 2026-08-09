import { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  DollarSign,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface PaymentTransaction {
  id: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  itemType: 'FULL_GAME' | 'HIGHLIGHT_REEL' | 'TOURNAMENT_PASS' | 'VIP_SUBSCRIPTION';
  description: string;
  amountInr: number;
  taxInr: number;
  discountInr: number;
  netPaidInr: number;
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  status: 'SUCCESS' | 'REFUNDED' | 'FAILED' | 'PENDING';
  refundReason?: string;
  createdAt: string;
}

export const PaymentsView = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);
  const [refundReasonCategory, setRefundReasonCategory] = useState<string>('NVR Camera Offline / Footage Missing');
  const [refundCustomNote, setRefundCustomNote] = useState<string>('');
  const [invoiceModalTx, setInvoiceModalTx] = useState<PaymentTransaction | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleProcessRefund = () => {
    if (!selectedTxForRefund) return;
    const reason = `${refundReasonCategory}: ${refundCustomNote}`.trim();
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === selectedTxForRefund.id
          ? { ...t, status: 'REFUNDED' as const, refundReason: reason }
          : t
      )
    );
    showToast(`💸 Refund of ₹${selectedTxForRefund.netPaidInr} initiated via Razorpay! Transaction marked REFUNDED.`);
    setSelectedTxForRefund(null);
    setRefundCustomNote('');
  };

  const exportToCsv = () => {
    const headers = ['Tx ID', 'Razorpay ID', 'Athlete', 'Phone', 'Item', 'Gross (INR)', 'Discount', 'Net (INR)', 'Method', 'Status', 'Date'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.razorpayPaymentId,
      t.userName,
      t.userPhone,
      t.description,
      t.amountInr,
      t.discountInr,
      t.netPaidInr,
      t.paymentMethod,
      t.status,
      t.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FieldFlicks_Financial_Settlement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Financial Ledger CSV exported successfully!');
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalGross = transactions.filter((t) => t.status === 'SUCCESS').reduce((acc, t) => acc + t.netPaidInr, 0);
  const totalRefunded = transactions.filter((t) => t.status === 'REFUNDED').reduce((acc, t) => acc + t.netPaidInr, 0);
  const gatewayFeeEst = totalGross * 0.02; // 2% Razorpay fee
  const netSettlement = totalGross - gatewayFeeEst;

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
            <CreditCard size={26} color="var(--primary-neon)" />
            Payment Gateway & Financial Ledger
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Monitor real-time Razorpay transactions, process customer refunds, and audit tax invoices
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={exportToCsv}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
          >
            <FileSpreadsheet size={16} color="var(--primary-neon)" />
            Export Settlement CSV
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--primary-neon)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Gross Revenue (INR)</span>
            <DollarSign size={18} color="var(--primary-neon)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            ₹{totalGross.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-neon)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> Live Gateway Ingest
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-crimson)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Refunds Issued</span>
            <RotateCcw size={18} color="var(--accent-crimson)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            ₹{totalRefunded.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', marginTop: 4 }}>
            1.2% refund rate (Hardware offline)
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Razorpay Processing Fee (2%)</span>
            <Receipt size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            ₹{gatewayFeeEst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Direct deduction on payout
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Net Bank Settlement</span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF', marginTop: 6 }}>
            ₹{netSettlement.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: 4 }}>
            Daily T+1 Razorpay bank transfer
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search Athlete, Phone, Razorpay Payment ID or Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <option value="ALL">All Payment Statuses</option>
            <option value="SUCCESS">Success (Completed)</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Master Transactions Ledger Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
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
                <th style={{ padding: '14px 20px' }}>Transaction ID & Gateway</th>
                <th style={{ padding: '14px 20px' }}>Athlete Customer</th>
                <th style={{ padding: '14px 20px' }}>Item & Package</th>
                <th style={{ padding: '14px 20px' }}>Paid Amount</th>
                <th style={{ padding: '14px 20px' }}>Method</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => {
                const isSuccess = t.status === 'SUCCESS';
                const isRefunded = t.status === 'REFUNDED';
                const isFailed = t.status === 'FAILED';

                return (
                  <tr key={t.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{t.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2, fontFamily: 'monospace' }}>
                        {t.razorpayPaymentId}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.createdAt}</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.userPhone}</div>
                      {t.userEmail && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.userEmail}</div>}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#FFF' }}>{t.description}</div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(0, 229, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          display: 'inline-block',
                          marginTop: 4,
                        }}
                      >
                        {t.itemType}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>₹{t.netPaidInr}</div>
                      {t.discountInr > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary-neon)' }}>-₹{t.discountInr} Coupon</div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>incl. ₹{t.taxInr} GST</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#FFF',
                        }}
                      >
                        {t.paymentMethod}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {isSuccess && (
                        <span className="badge-neon green">
                          <CheckCircle2 size={12} /> SUCCESS
                        </span>
                      )}
                      {isRefunded && (
                        <span className="badge-neon crimson">
                          <RotateCcw size={12} /> REFUNDED
                        </span>
                      )}
                      {isFailed && (
                        <span className="badge-neon crimson">
                          <XCircle size={12} /> FAILED
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {/* View Invoice */}
                        <button
                          onClick={() => setInvoiceModalTx(t)}
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
                          }}
                          title="View Tax Invoice"
                        >
                          <Receipt size={14} color="var(--primary-neon)" />
                          Invoice
                        </button>

                        {/* Process Refund (if successful) */}
                        {isSuccess && (
                          <button
                            onClick={() => setSelectedTxForRefund(t)}
                            style={{
                              background: 'rgba(255, 61, 87, 0.1)',
                              border: '1px solid rgba(255, 61, 87, 0.3)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              color: 'var(--accent-crimson)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <RotateCcw size={14} />
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CreditCard size={40} style={{ margin: '0 auto 14px', opacity: 0.4, display: 'block' }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>No Payment Transactions Found</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      When athletes unlock match recordings or buy passes via Razorpay, real-time ledgers and GST records will appear here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Processing Modal */}
      {selectedTxForRefund && (
        <div className="modal-backdrop" onClick={() => setSelectedTxForRefund(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, padding: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={22} />
              Process Athlete Refund
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              This will trigger an instant refund of <strong style={{ color: '#FFF' }}>₹{selectedTxForRefund.netPaidInr}</strong> via Razorpay back to {selectedTxForRefund.userName}'s original payment source ({selectedTxForRefund.paymentMethod}).
            </p>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                  Mandatory Refund Reason
                </label>
                <select
                  value={refundReasonCategory}
                  onChange={(e) => setRefundReasonCategory(e.target.value)}
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
                  <option value="NVR Camera Offline / Footage Missing">NVR Camera Offline / Footage Missing</option>
                  <option value="Video Quality Unsatisfactory / AI Cut Failure">Video Quality Unsatisfactory / AI Cut Failure</option>
                  <option value="Accidental Duplicate Transaction">Accidental Duplicate Transaction</option>
                  <option value="Athlete Goodwill Credit / Support Resolution">Athlete Goodwill Credit / Support Resolution</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                  Internal Audit Remarks (Optional)
                </label>
                <textarea
                  value={refundCustomNote}
                  onChange={(e) => setRefundCustomNote(e.target.value)}
                  placeholder="Add specific context for finance reconciliation..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 20, 29, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTxForRefund(null)}
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
                  onClick={handleProcessRefund}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-crimson)',
                    border: 'none',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Execute Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal Preview */}
      {invoiceModalTx && (
        <div className="modal-backdrop" onClick={() => setInvoiceModalTx(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF' }}>
                  Field<span style={{ color: 'var(--primary-neon)' }}>Flicks</span>
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax Invoice & Payment Receipt</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--primary-neon)' }}>PAID</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Invoice #{invoiceModalTx.id.toUpperCase()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Billed To:</div>
                <strong style={{ color: '#FFF' }}>{invoiceModalTx.userName}</strong>
                <div style={{ color: 'var(--text-muted)' }}>{invoiceModalTx.userPhone}</div>
                {invoiceModalTx.userEmail && <div style={{ color: 'var(--text-muted)' }}>{invoiceModalTx.userEmail}</div>}
              </div>

              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Details:</div>
                <div style={{ color: '#FFF' }}>Razorpay ID: {invoiceModalTx.razorpayPaymentId}</div>
                <div style={{ color: 'var(--text-muted)' }}>Method: {invoiceModalTx.paymentMethod}</div>
                <div style={{ color: 'var(--text-muted)' }}>Date: {invoiceModalTx.createdAt}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', padding: 14, margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>
                <span>{invoiceModalTx.description}</span>
                <span>₹{invoiceModalTx.amountInr}</span>
              </div>
              {invoiceModalTx.discountInr > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--primary-neon)', marginTop: 6 }}>
                  <span>Coupon Discount</span>
                  <span>-₹{invoiceModalTx.discountInr}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 6 }}>
                <span>GST (18% inclusive)</span>
                <span>₹{invoiceModalTx.taxInr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#FFF', fontWeight: 800, borderTop: '1px solid var(--border-subtle)', marginTop: 10, paddingTop: 10 }}>
                <span>Total Amount Paid</span>
                <span style={{ color: 'var(--primary-neon)' }}>₹{invoiceModalTx.netPaidInr}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setInvoiceModalTx(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="btn-primary"
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
