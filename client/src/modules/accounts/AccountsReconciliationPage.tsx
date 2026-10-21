import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  FileText,
  UploadCloud,
  Check,
  X,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { operationsApi } from '../../services/api.js';

interface ReconciliationTransaction {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  studentName: string;
  admissionNo: string;
  className: string;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
  paidAt: string;
  isSimulated: boolean;
  status: 'RECONCILED' | 'PENDING' | 'DISCREPANCY';
  verifiedAt?: string | null;
  notes?: string;
}

interface ReconciliationSummary {
  totalVolume: number;
  totalReconciled: number;
  totalPending: number;
  discrepanciesCount: number;
  reconciliationRate: number;
}

export const AccountsReconciliationPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalVolume: 0,
    totalReconciled: 0,
    totalPending: 0,
    discrepanciesCount: 0,
    reconciliationRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modals state
  const [reconcileModalTx, setReconcileModalTx] = useState<ReconciliationTransaction | null>(null);
  const [statementRef, setStatementRef] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Discrepancy Modal
  const [flagModalTx, setFlagModalTx] = useState<ReconciliationTransaction | null>(null);
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  // Bank Statement Import / Batch Match Modal
  const [isStatementImportOpen, setIsStatementImportOpen] = useState(false);
  const [statementBatchText, setStatementBatchText] = useState('');
  const [importResults, setImportResults] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReconciliationData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await operationsApi.getReconciliationReport();
      if (res) {
        setSummary(res.summary);
        setTransactions(res.transactions || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load reconciliation records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliationData();
  }, []);

  const handleConfirmReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileModalTx) return;

    try {
      setIsSubmittingAction(true);
      await operationsApi.recordReconciliation({
        paymentId: reconcileModalTx.id,
        action: 'RECONCILE',
        statementRef: statementRef || `STMT-${Date.now()}`,
        reason: 'Bank settlement verified against institutional statement',
      });

      setReconcileModalTx(null);
      showToast(`Payment ${reconcileModalTx.receiptNumber} reconciled and audited in PostgreSQL.`);
      await loadReconciliationData();
    } catch (err: any) {
      showToast('Reconciliation failed: ' + err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmFlagDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModalTx) return;

    try {
      setIsSubmittingAction(true);
      await operationsApi.recordReconciliation({
        paymentId: flagModalTx.id,
        action: 'FLAG_DISCREPANCY',
        reason: discrepancyReason,
      });

      setFlagModalTx(null);
      showToast(`Discrepancy flagged for audit review on receipt ${flagModalTx.receiptNumber}.`);
      await loadReconciliationData();
    } catch (err: any) {
      showToast('Action failed: ' + err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleBatchStatementMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementBatchText.trim()) return;

    try {
      setIsSubmittingAction(true);
      const lines = statementBatchText.trim().split('\n');
      let matchedCount = 0;

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const ref = parts[0];
          const matchedTx = transactions.find(
            (t) => t.transactionRef === ref || t.receiptNumber === ref
          );
          if (matchedTx && matchedTx.status !== 'RECONCILED') {
            await operationsApi.recordReconciliation({
              paymentId: matchedTx.id,
              action: 'RECONCILE',
              statementRef: ref,
              reason: 'Matched via bulk institutional bank statement feed',
            });
            matchedCount++;
          }
        }
      }

      setImportResults(`Processed ${lines.length} statement entries. Successfully reconciled ${matchedCount} transaction(s).`);
      showToast(`Statement batch processed: ${matchedCount} transaction(s) reconciled.`);
      await loadReconciliationData();
    } catch (err: any) {
      showToast('Batch reconciliation failed: ' + err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '0.86rem',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Bank Reconciliations & Settlements</h2>
            <Badge variant="teal">Gateway Clearing</Badge>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Audit recorded fee payments against bank clearing accounts and gateway settlement logs for {branding.shortName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadReconciliationData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<UploadCloud size={15} />}
            onClick={() => {
              setImportResults(null);
              setIsStatementImportOpen(true);
            }}
          >
            Import Bank Statement
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Metric Tiles from PostgreSQL */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Total Payment Volume</span>
          <span className="value">₹{loading ? '...' : summary.totalVolume.toLocaleString('en-IN')}</span>
          <span className="subtitle">All Recorded Tuition Receipts</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Settled & Reconciled</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            ₹{loading ? '...' : summary.totalReconciled.toLocaleString('en-IN')}
          </span>
          <span className="subtitle">{summary.reconciliationRate}% Reconciliation Rate</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Pending Bank Clearance</span>
          <span className="value" style={{ color: summary.totalPending > 0 ? 'var(--warning-solid)' : 'var(--text-muted)' }}>
            ₹{loading ? '...' : summary.totalPending.toLocaleString('en-IN')}
          </span>
          <span className="subtitle">Awaiting Statement Verification</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Flagged Discrepancies</span>
          <span className="value" style={{ color: summary.discrepanciesCount > 0 ? 'var(--danger-solid)' : 'var(--text-muted)' }}>
            {loading ? '...' : summary.discrepanciesCount}
          </span>
          <span className="subtitle">Audited Exceptions</span>
        </div>
      </div>

      {/* Transactions Card */}
      <div className="ed-card" style={{ padding: 0 }}>
        {/* Filter Bar */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search receipt #, student, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ed-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="PENDING">Pending Clearance</option>
                <option value="DISCREPANCY">Discrepancy</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Channel:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Channels</option>
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash Counter</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <span>Loading payment reconciliation transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Receipt size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No Reconciliation Records</p>
              <p style={{ fontSize: '0.82rem' }}>No fee payment transactions match the specified filters.</p>
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Student & Class</th>
                  <th>Invoice Ref</th>
                  <th>Channel</th>
                  <th>Bank / Tx Reference</th>
                  <th>Transaction Date</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {tx.receiptNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.studentName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {tx.admissionNo} • {tx.className}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.80rem' }}>{tx.invoiceNumber}</td>
                    <td>
                      <Badge variant="neutral">{tx.paymentMethod}</Badge>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                      {tx.transactionRef}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(tx.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success-solid)' }}>
                      ₹{tx.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {tx.status === 'RECONCILED' && <Badge variant="success">Reconciled</Badge>}
                      {tx.status === 'PENDING' && <Badge variant="warning">Pending Clearance</Badge>}
                      {tx.status === 'DISCREPANCY' && <Badge variant="danger">Discrepancy</Badge>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {tx.status !== 'RECONCILED' ? (
                          <button
                            onClick={() => {
                              setReconcileModalTx(tx);
                              setStatementRef(`STMT-${tx.transactionRef}`);
                            }}
                            className="ed-btn ed-btn-primary"
                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                          >
                            Reconcile
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={13} style={{ color: 'var(--success-solid)' }} /> Settled
                          </span>
                        )}

                        {tx.status !== 'DISCREPANCY' && (
                          <button
                            onClick={() => {
                              setFlagModalTx(tx);
                              setDiscrepancyReason('Amount or reference mismatch on bank statement');
                            }}
                            className="ed-btn ed-btn-secondary"
                            title="Flag Discrepancy"
                            style={{ padding: '3px 6px', fontSize: '0.74rem' }}
                          >
                            <AlertTriangle size={12} style={{ color: 'var(--warning-solid)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Confirm Reconciliation */}
      <Modal
        isOpen={!!reconcileModalTx}
        onClose={() => setReconcileModalTx(null)}
        title="Confirm Bank Settlement Reconciliation"
        subtitle={`Receipt: ${reconcileModalTx?.receiptNumber} • Amount: ₹${reconcileModalTx?.amountPaid.toLocaleString('en-IN')}`}
      >
        <form onSubmit={handleConfirmReconcile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', lineHeight: 1.8 }}>
            <div><strong>Student:</strong> {reconcileModalTx?.studentName}</div>
            <div><strong>Transaction Reference:</strong> {reconcileModalTx?.transactionRef}</div>
            <div><strong>Payment Channel:</strong> {reconcileModalTx?.paymentMethod}</div>
            <div><strong>Amount:</strong> ₹{reconcileModalTx?.amountPaid.toLocaleString('en-IN')}</div>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Bank Statement Reference / UTR</label>
            <input
              type="text"
              className="ed-input"
              value={statementRef}
              onChange={(e) => setStatementRef(e.target.value)}
              placeholder="e.g. STMT-UPI-SIM-98214"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" type="button" onClick={() => setReconcileModalTx(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingAction}>
              {isSubmittingAction ? 'Auditing...' : 'Confirm Reconciled Settlement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Flag Discrepancy */}
      <Modal
        isOpen={!!flagModalTx}
        onClose={() => setFlagModalTx(null)}
        title="Flag Settlement Discrepancy"
        subtitle={`Receipt: ${flagModalTx?.receiptNumber}`}
      >
        <form onSubmit={handleConfirmFlagDiscrepancy} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Mandatory Auditable Reason</label>
            <textarea
              className="ed-input"
              rows={3}
              value={discrepancyReason}
              onChange={(e) => setDiscrepancyReason(e.target.value)}
              placeholder="e.g. Transaction amount differs from gateway settlement report"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" type="button" onClick={() => setFlagModalTx(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingAction}>
              {isSubmittingAction ? 'Flagging...' : 'Flag Discrepancy in Audit Log'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Import Bank Statement / Batch Match */}
      <Modal
        isOpen={isStatementImportOpen}
        onClose={() => setIsStatementImportOpen(false)}
        title="Import Institutional Bank Clearing Statement"
        subtitle="Paste statement entries (UTR/Ref, Amount) to automatically verify and reconcile recorded payments"
      >
        <form onSubmit={handleBatchStatementMatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Format: One entry per line in <code>&lt;Reference/Receipt&gt;, &lt;Amount&gt;</code> format.<br />
            Example:<br />
            <code>UPI-SIM-98214-OKAXIS, 45000</code><br />
            <code>REC-2026-4011, 45000</code>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Bank Clearing Entries</label>
            <textarea
              className="ed-input"
              rows={6}
              value={statementBatchText}
              onChange={(e) => setStatementBatchText(e.target.value)}
              placeholder="Paste comma-separated bank statement lines here..."
              required
            />
          </div>

          {importResults && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: 'var(--success-solid)', fontWeight: 600 }}>
              {importResults}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsStatementImportOpen(false)}>
              Close
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingAction}>
              {isSubmittingAction ? 'Matching in DB...' : 'Process Statement Match'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
