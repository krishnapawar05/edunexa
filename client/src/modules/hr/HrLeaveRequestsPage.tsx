import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { academicApi } from '../../services/api.js';

interface LeaveRequest {
  id: string;
  staffName: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export const HrLeaveRequestsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewLeaveItem, setReviewLeaveItem] = useState<{ item: LeaveRequest; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply Leave Form
  const [newLeave, setNewLeave] = useState({
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await academicApi.listStaffLeaves(statusFilter !== 'ALL' ? statusFilter : undefined);
      const raw = Array.isArray(res) ? res : [];

      setLeaves(
        raw.map((l: any) => ({
          id: l.id,
          staffName: l.staffName || 'Staff Member',
          employeeId: l.employeeId || 'EMP-2026',
          type: l.type || 'Casual Leave',
          startDate: l.startDate || '2026-10-20',
          endDate: l.endDate || '2026-10-21',
          duration: l.duration || '1 Day',
          reason: l.reason || 'Medical / Personal Leave',
          status: l.status || 'PENDING',
          approvedBy: l.approvedBy,
          approvedAt: l.approvedAt,
          createdAt: l.createdAt || l.startDate,
        }))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve staff leave ledger from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  // Handle Review (Approve / Reject)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewLeaveItem) return;

    const { item, action } = reviewLeaveItem;
    const targetStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const notes = reviewNotes.trim() || (action === 'APPROVE' ? 'Approved by HR Administrator' : 'Declined per institutional policy');

    try {
      setIsSubmitting(true);
      await academicApi.reviewStaffLeave(item.id, targetStatus, notes);

      setLeaves((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, status: targetStatus, approvedBy: 'HR Administrator' } : l))
      );

      showToast(`Leave request ${targetStatus.toLowerCase()} successfully.`);
      setReviewLeaveItem(null);
      setReviewNotes('');
    } catch (err: any) {
      showToast('Error reviewing leave: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit New Leave
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.reason.trim()) return;

    try {
      setIsSubmitting(true);
      await academicApi.submitStaffLeave({
        leaveType: newLeave.leaveType,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason.trim(),
      });

      showToast('Leave request recorded in PostgreSQL ledger.');
      setShowApplyModal(false);
      setNewLeave({
        leaveType: 'CASUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
      });
      await loadLeaves();
    } catch (err: any) {
      showToast('Failed to record leave: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side search
  const filteredLeaves = leaves.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      l.staffName.toLowerCase().includes(q) ||
      l.employeeId.toLowerCase().includes(q) ||
      l.reason.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q);
    return matchesSearch;
  });

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900, #0f172a)',
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
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid, #10b981)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ margin: 0 }}>Staff Leave Ledger & Approvals</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Faculty absence review, CBSE statutory leave compliance, and coverage management for {branding.shortName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadLeaves}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setShowApplyModal(true)}
          >
            Record Leave Application
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-bg, #fef2f2)', border: '1px solid var(--danger-border, #fecaca)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text, #dc2626)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="ed-grid-4">
        <div
          className="ed-metric-tile"
          style={{ cursor: 'pointer', border: statusFilter === 'ALL' ? '2px solid var(--primary-600)' : undefined }}
          onClick={() => setStatusFilter('ALL')}
        >
          <span className="label">Total Leave Requests</span>
          <span className="value">{loading ? '...' : leaves.length}</span>
          <span className="subtitle">
            <CalendarCheck size={13} /> Recorded in PostgreSQL
          </span>
        </div>
        <div
          className="ed-metric-tile"
          style={{ cursor: 'pointer', border: statusFilter === 'PENDING' ? '2px solid var(--warning-solid)' : undefined }}
          onClick={() => setStatusFilter('PENDING')}
        >
          <span className="label">Pending Adjudication</span>
          <span className="value" style={{ color: 'var(--warning-solid, #d97706)' }}>
            {loading ? '...' : pendingCount}
          </span>
          <span className="subtitle">
            <Clock size={13} /> Awaiting HR Action
          </span>
        </div>
        <div
          className="ed-metric-tile"
          style={{ cursor: 'pointer', border: statusFilter === 'APPROVED' ? '2px solid var(--success-solid)' : undefined }}
          onClick={() => setStatusFilter('APPROVED')}
        >
          <span className="label">Approved Absences</span>
          <span className="value" style={{ color: 'var(--success-solid, #10b981)' }}>
            {loading ? '...' : approvedCount}
          </span>
          <span className="subtitle">
            <CheckCircle2 size={13} /> Coverage Confirmed
          </span>
        </div>
        <div
          className="ed-metric-tile"
          style={{ cursor: 'pointer', border: statusFilter === 'REJECTED' ? '2px solid var(--danger-solid, #ef4444)' : undefined }}
          onClick={() => setStatusFilter('REJECTED')}
        >
          <span className="label">Declined Requests</span>
          <span className="value" style={{ color: 'var(--danger-solid, #ef4444)' }}>
            {loading ? '...' : rejectedCount}
          </span>
          <span className="subtitle">
            <XCircle size={13} /> Policy Incompatible
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ed-card" style={{ padding: 0 }}>
        {/* Search & Status Filter Toolbar */}
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
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by staff name, employee ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ed-input"
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Status View:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`ed-btn ${statusFilter === st ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <span>Querying staff leave ledger from database...</span>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CalendarCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 6px 0' }}>No Leave Applications Found</p>
              <p style={{ fontSize: '0.84rem', marginBottom: '16px' }}>No leave requests match the selected view criteria.</p>
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowApplyModal(true)}>
                Record Leave Application
              </Button>
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Justification</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{leave.staffName}</div>
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {leave.employeeId}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.84rem' }}>{leave.type}</span>
                    </td>
                    <td>
                      <Badge variant="neutral" style={{ fontSize: '0.74rem' }}>{leave.duration}</Badge>
                    </td>
                    <td style={{ fontSize: '0.80rem' }}>
                      <div>{leave.startDate}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>to {leave.endDate}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '260px' }}>
                      {leave.reason}
                    </td>
                    <td>
                      {leave.status === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                      {leave.status === 'PENDING' && <Badge variant="warning">Under Review</Badge>}
                      {leave.status === 'REJECTED' && <Badge variant="danger">Declined</Badge>}
                    </td>
                    <td>
                      {leave.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setReviewLeaveItem({ item: leave, action: 'APPROVE' })}
                            className="ed-btn ed-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setReviewLeaveItem({ item: leave, action: 'REJECT' })}
                            className="ed-btn ed-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {leave.approvedBy ? `Reviewed (${leave.approvedBy})` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Review Leave Request (Approve or Reject) */}
      {reviewLeaveItem && (
        <Modal
          isOpen={true}
          onClose={() => setReviewLeaveItem(null)}
          title={reviewLeaveItem.action === 'APPROVE' ? 'Approve Leave Application' : 'Decline Leave Application'}
          subtitle={`Employee: ${reviewLeaveItem.item.staffName} (${reviewLeaveItem.item.employeeId})`}
        >
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-elevated, #f8fafc)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.84rem' }}>
              <div><strong>Type:</strong> {reviewLeaveItem.item.type} ({reviewLeaveItem.item.duration})</div>
              <div><strong>Dates:</strong> {reviewLeaveItem.item.startDate} to {reviewLeaveItem.item.endDate}</div>
              <div style={{ marginTop: '4px' }}><strong>Staff Reason:</strong> {reviewLeaveItem.item.reason}</div>
            </div>

            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Administrative Notes / Reason</label>
              <textarea
                className="ed-input"
                rows={3}
                placeholder={reviewLeaveItem.action === 'APPROVE' ? 'e.g. Approved. Substitute teacher assigned.' : 'e.g. Incompatible with upcoming CBSE board exam duties.'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" type="button" onClick={() => setReviewLeaveItem(null)}>
                Cancel
              </Button>
              <Button
                variant={reviewLeaveItem.action === 'APPROVE' ? 'primary' : 'danger'}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : reviewLeaveItem.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Record Leave Application */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Record Staff Leave Application"
        subtitle="Registers absence in institutional HR ledger"
      >
        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Leave Type *</label>
            <select
              className="ed-select"
              value={newLeave.leaveType}
              onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
            >
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="SICK">Sick / Medical Leave (SL)</option>
              <option value="EARNED">Earned / Privilege Leave (EL)</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="BEREAVEMENT">Bereavement Leave</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Start Date *</label>
              <input
                type="date"
                className="ed-input"
                value={newLeave.startDate}
                onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">End Date *</label>
              <input
                type="date"
                className="ed-input"
                value={newLeave.endDate}
                onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Reason / Clinical Justification *</label>
            <textarea
              className="ed-input"
              rows={3}
              placeholder="State clear purpose of leave..."
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record in Ledger'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
