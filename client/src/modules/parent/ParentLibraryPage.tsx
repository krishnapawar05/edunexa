import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Library,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Bookmark,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { libraryApi } from '../../services/api.js';
import { Badge } from '../../components/ui/Badge.js';

export const ParentLibraryPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossier, setDossier] = useState<any | null>(null);

  const loadChildLibrary = async () => {
    if (!selectedChild) return;
    try {
      setLoading(true);
      setError(null);
      const res = await libraryApi.getStudentHistory(selectedChild.id);
      setDossier(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve child library records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildLibrary();
  }, [selectedChild?.id]);

  const activeIssues = dossier?.activeIssues || [];
  const pastIssues = dossier?.pastIssues || [];
  const totalFinesPending = dossier?.totalFinesPending || 0;
  const totalFinesPaid = dossier?.totalFinesPaid || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Ward Switcher Bar */}
      <ParentChildSwitcherBar />

      {/* Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Parent Portal</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Library Records</span>
          </div>
          <h1 className="ed-page-header-title">
            <Library className="w-7 h-7 text-emerald-700" />
            Library Borrowings & Fee Clearance
          </h1>
          <p className="ed-page-header-desc">
            Monitor academic volumes issued to{' '}
            <strong>
              {selectedChild?.firstName} {selectedChild?.lastName}
            </strong>
            , statutory return dates, condition inspection notes, and overdue fine status.
          </p>
        </div>

        <button
          onClick={loadChildLibrary}
          disabled={loading}
          className="ed-btn ed-btn-outline cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="ed-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-700 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading child library borrowing dossier...</p>
        </div>
      ) : !selectedChild ? (
        <div className="ed-card p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">Please select a student from the switcher above</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="ed-metrics-grid">
            <div className="ed-metric-card">
              <span className="ed-metric-title">Active Loans</span>
              <span className="ed-metric-value" style={{ color: '#2563eb' }}>
                {activeIssues.length}
              </span>
              <span className="ed-metric-subtitle">Books in student possession</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Overdue Alerts</span>
              <span
                className="ed-metric-value"
                style={{
                  color:
                    activeIssues.some((i: any) => new Date(i.dueDate).getTime() < Date.now())
                      ? '#dc2626'
                      : '#16a34a',
                }}
              >
                {activeIssues.filter((i: any) => new Date(i.dueDate).getTime() < Date.now()).length}
              </span>
              <span className="ed-metric-subtitle">Requires immediate return</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Pending Fines</span>
              <span className="ed-metric-value" style={{ color: totalFinesPending > 0 ? '#d97706' : '#16a34a' }}>
                ₹{totalFinesPending.toFixed(2)}
              </span>
              <span className="ed-metric-subtitle">Overdue fee clearance</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Returned History</span>
              <span className="ed-metric-value">{pastIssues.length}</span>
              <span className="ed-metric-subtitle">Volumes returned in good order</span>
            </div>
          </div>

          {/* Active Borrowings Table */}
          <div className="ed-card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-700" />
              Currently Borrowed Volumes ({activeIssues.length})
            </h3>

            {activeIssues.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No library books currently issued to {selectedChild.firstName}.
              </p>
            ) : (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Book Title & Subject</th>
                      <th>ISBN / Shelf</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Overdue Fines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeIssues.map((issue: any) => {
                      const isOverdue = new Date(issue.dueDate).getTime() < Date.now();
                      return (
                        <tr key={issue.id}>
                          <td>
                            <p className="font-bold text-slate-900 text-sm">{issue.book?.title}</p>
                            <span className="text-xs text-slate-500">{issue.book?.author} • {issue.book?.category}</span>
                          </td>
                          <td className="text-xs font-mono text-slate-600">
                            {issue.book?.isbn || '—'}
                          </td>
                          <td className="text-xs text-slate-700">
                            {new Date(issue.issueDate).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="text-xs font-semibold block text-slate-900">
                              {new Date(issue.dueDate).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] text-rose-600 font-bold block">
                                OVERDUE — Please return to library
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`ed-badge ${isOverdue ? 'ed-badge-warning' : 'ed-badge-teal'}`}>
                              {isOverdue ? 'OVERDUE' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="text-xs font-semibold">
                            {issue.fineAmount > 0 ? (
                              <span className="text-amber-700">₹{issue.fineAmount.toFixed(2)} ({issue.fineStatus})</span>
                            ) : (
                              <span className="text-slate-400">₹0.00</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Returned Books Table */}
          <div className="ed-card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Past Borrowing History ({pastIssues.length})
            </h3>

            {pastIssues.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No past return transactions on file.</p>
            ) : (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Book Title & Subject</th>
                      <th>Return Date</th>
                      <th>Condition Checked</th>
                      <th>Fine Incurred</th>
                      <th>Clearance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastIssues.map((issue: any) => (
                      <tr key={issue.id}>
                        <td>
                          <p className="font-bold text-slate-900 text-sm">{issue.book?.title}</p>
                          <span className="text-xs text-slate-500">{issue.book?.author} • {issue.book?.category}</span>
                        </td>
                        <td className="text-xs text-slate-700">
                          {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span className="ed-badge ed-badge-neutral text-xs">
                            {issue.returnCondition || 'GOOD'}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-slate-800">
                          ₹{issue.fineAmount?.toFixed(2) || '0.00'}
                        </td>
                        <td>
                          <span
                            className={`ed-badge ${
                              issue.fineStatus === 'PAID' || issue.fineStatus === 'NONE' || issue.fineStatus === 'WAIVED'
                                ? 'ed-badge-teal'
                                : 'ed-badge-warning'
                            }`}
                          >
                            {issue.fineStatus === 'NONE' ? 'CLEARED' : issue.fineStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

