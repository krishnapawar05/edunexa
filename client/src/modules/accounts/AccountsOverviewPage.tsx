import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Download,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  PieChart,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { operationsApi } from '../../services/api.js';

interface FinancialSummaryData {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalConcessions: number;
  collectionRatePercentage: number;
  invoicesCount: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  overdueInvoicesCount: number;
  recentTransactions: Array<{
    receiptNo: string;
    studentName: string;
    amount: number;
    method: string;
    date: string;
    isSimulated: boolean;
  }>;
  breakdownByClass?: Array<{
    className: string;
    invoiced: number;
    collected: number;
    outstanding: number;
  }>;
  breakdownByFeeHead?: Array<{
    feeHead: string;
    invoiced: number;
    collected: number;
    outstanding: number;
  }>;
}

export const AccountsOverviewPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await operationsApi.getFeeSummary();
      setSummary(data as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch financial summary from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleExportCsv = async () => {
    try {
      showToast('Generating official fee ledger CSV export from PostgreSQL...');
      const csvData = await operationsApi.exportFeeCsv();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `edunexa_fee_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Fee ledger exported successfully.');
    } catch (err: any) {
      showToast('Export failed: ' + err.message);
    }
  };

  const totalInvoiced = summary?.totalInvoiced ?? 0;
  const totalCollected = summary?.totalCollected ?? 0;
  const totalOutstanding = summary?.totalOutstanding ?? 0;
  const collectionRate = summary?.collectionRatePercentage ?? 0;
  const totalConcessions = summary?.totalConcessions ?? 0;

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
            <h2>Institutional Accounts & Financial Overview</h2>
            <Badge variant="teal">Accounts Bureau</Badge>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Real-time fee collections, outstanding receivables, and banking ledger for {branding.schoolName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadFinancialData}
            disabled={loading}
          >
            Refresh Ledger
          </Button>
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleExportCsv}
          >
            Export Ledger CSV
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Primary Financial Metric Tiles from PostgreSQL */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Total Invoiced</span>
          <span className="value">₹{loading ? '...' : totalInvoiced.toLocaleString('en-IN')}</span>
          <span className="subtitle">Official Tuition & Lab Billings</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Realized Revenue</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            ₹{loading ? '...' : totalCollected.toLocaleString('en-IN')}
          </span>
          <span className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} style={{ color: 'var(--success-solid)' }} />
            {collectionRate}% Realization Rate
          </span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Outstanding Receivables</span>
          <span className="value" style={{ color: totalOutstanding > 0 ? 'var(--danger-solid)' : 'var(--text-muted)' }}>
            ₹{loading ? '...' : totalOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="subtitle">Pending Collection in Ledger</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Scholarships & Waivers</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            ₹{loading ? '...' : totalConcessions.toLocaleString('en-IN')}
          </span>
          <span className="subtitle">Audited Concessions Applied</span>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="ed-card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Institutional Fee Ledger Health</div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.82rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success-solid)' }}></span>
              Paid in Full: <strong>{summary?.paidInvoicesCount ?? 0}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning-solid)' }}></span>
              Partially Paid: <strong>{summary?.partialInvoicesCount ?? 0}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger-solid)' }}></span>
              Overdue / In Arrears: <strong>{summary?.overdueInvoicesCount ?? 0}</strong>
            </span>
          </div>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${summary?.invoicesCount ? ((summary.paidInvoicesCount / summary.invoicesCount) * 100) : 0}%`,
              backgroundColor: 'var(--success-solid)',
            }}
          />
          <div
            style={{
              width: `${summary?.invoicesCount ? ((summary.partialInvoicesCount / summary.invoicesCount) * 100) : 0}%`,
              backgroundColor: 'var(--warning-solid)',
            }}
          />
          <div
            style={{
              width: `${summary?.invoicesCount ? ((summary.overdueInvoicesCount / summary.invoicesCount) * 100) : 0}%`,
              backgroundColor: 'var(--danger-solid)',
            }}
          />
        </div>
      </div>

      {/* Two Column Layout: Navigation Modules & Collections by Class */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Quick Workflow Navigation */}
        <div className="ed-card">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Accounts Workflows & Ledgers</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              onClick={() => navigate('/accounts/invoices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <CreditCard size={18} style={{ color: 'var(--primary-600)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Student Invoices & Fee Ledger</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {summary?.invoicesCount ?? 0} active billings • Record offline/online payments
                  </div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div
              onClick={() => navigate('/accounts/structures')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--primary-600)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Approved Fee Structures</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Grade-wise tuition rules, laboratory heads, and annual slabs
                  </div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div
              onClick={() => navigate('/accounts/reconciliation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Receipt size={18} style={{ color: 'var(--primary-600)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Bank Reconciliations & Settlements</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Verify payment gateway clearing against institutional accounts
                  </div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Collections Breakdown by Class */}
        <div className="ed-card">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Revenue Distribution by Academic Class</h4>
          {(!summary?.breakdownByClass || summary.breakdownByClass.length === 0) ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p>No class revenue data available in the current financial session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {summary.breakdownByClass.map((c) => {
                const classTotal = c.invoiced;
                const classPaid = c.collected;
                const pct = classTotal > 0 ? Math.round((classPaid / classTotal) * 100) : 0;
                return (
                  <div key={c.className} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ fontWeight: 600 }}>{c.className}</span>
                      <span>
                        ₹{c.collected.toLocaleString('en-IN')} / ₹{c.invoiced.toLocaleString('en-IN')}{' '}
                        <strong style={{ color: pct >= 80 ? 'var(--success-solid)' : 'var(--warning-solid)' }}>
                          ({pct}%)
                        </strong>
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: pct >= 80 ? 'var(--success-solid)' : 'var(--primary-600)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transaction Feed from PostgreSQL */}
      <div className="ed-card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>Recent Payment Transactions & Receipts</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: 'var(--text-muted)' }}>
              Atomic payment records stored with sequential receipts in PostgreSQL
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/accounts/invoices')}>
            View All Invoices
          </Button>
        </div>

        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <span>Loading transaction records...</span>
            </div>
          ) : (!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No Transactions Recorded</p>
              <p style={{ fontSize: '0.80rem' }}>No fee payment transactions have been logged for this school.</p>
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Student Name</th>
                  <th>Payment Method</th>
                  <th>Transaction Date</th>
                  <th>Amount (₹)</th>
                  <th>Processing Mode</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((tx, idx) => (
                  <tr key={tx.receiptNo || idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {tx.receiptNo}
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.studentName}</td>
                    <td>
                      <Badge variant="neutral">{tx.method}</Badge>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success-solid)' }}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Badge variant={tx.isSimulated ? 'warning' : 'success'}>
                        {tx.isSimulated ? 'Simulated Clear' : 'Live Gateway'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
