import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { coreApi } from '../../services/api.js';

interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentFirstName: string;
  studentLastName: string;
  applyingClass: string;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
}

export const AdmissionsQueuePage: React.FC = () => {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Actions
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [reviewingApp, setReviewingApp] = useState<AdmissionApplication | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [assignedClass, setAssignedClass] = useState('Grade 10');
  const [assignedSection, setAssignedSection] = useState('A');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coreApi.listAdmissions(statusFilter !== 'ALL' ? statusFilter : undefined);
      const rawApps = Array.isArray(data) ? data : (data as any)?.items || [];
      setApplications(rawApps);
    } catch (err: any) {
      setError(err.message || 'Failed to load admission applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const filteredApplications = applications.filter((app) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${app.studentFirstName} ${app.studentLastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      app.applicationNumber.toLowerCase().includes(q) ||
      app.guardianName.toLowerCase().includes(q) ||
      app.applyingClass.toLowerCase().includes(q)
    );
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApp) return;

    setIsSubmitting(true);
    try {
      const res = await coreApi.reviewAdmission(reviewingApp.id, {
        decision,
        reviewNotes: reviewNotes.trim() || `Processed by Institutional School Administrator as ${decision}.`,
        assignedClass: decision === 'APPROVED' ? assignedClass : undefined,
        assignedSection: decision === 'APPROVED' ? assignedSection : undefined,
      });

      if (decision === 'APPROVED') {
        showToast(
          `Application ${reviewingApp.applicationNumber} approved! Student enrolled with admission no. ${res.enrolledStudent?.admissionNumber || 'generated'}.`
        );
      } else {
        showToast(`Application ${reviewingApp.applicationNumber} rejected.`);
      }

      setReviewingApp(null);
      setReviewNotes('');
      loadApplications();
    } catch (err: any) {
      showToast(err.message || 'Admission review failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'SUBMITTED').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Admissions Review Queue
            </h1>
            <Badge variant="warning">{pendingCount} Pending</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Review incoming online admission applications, verify applicant credentials, and convert approved applicants to active enrolled students.
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="ed-btn ed-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Approved & Enrolled
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {approvedCount}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Rejected
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '4px' }}>
            {rejectedCount}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Applications
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {applications.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by student name or application number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ed-input"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ed-input"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Applications</option>
            <option value="SUBMITTED">Submitted (Pending)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-800)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Applications Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>App Number</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Applicant Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Applying Class</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Guardian Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Submitted Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading admissions queue...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No admission applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background-color 0.1s ease' }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {app.applicationNumber}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.studentFirstName} {app.studentLastName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        DOB: {app.dateOfBirth} • {app.gender}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {app.applyingClass}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{app.guardianName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {app.guardianPhone} • {app.guardianEmail}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge
                        variant={
                          app.status === 'APPROVED'
                            ? 'success'
                            : app.status === 'SUBMITTED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="ed-btn ed-btn-sm ed-btn-secondary"
                          title="View Full Application Dossier"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {app.status === 'SUBMITTED' && (
                          <button
                            onClick={() => {
                              setReviewingApp(app);
                              setDecision('APPROVED');
                              setAssignedClass(app.applyingClass || 'Grade 10');
                            }}
                            className="ed-btn ed-btn-sm ed-btn-primary"
                            title="Review & Enroll Application"
                          >
                            <UserCheck size={13} />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Application Details */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Application Details: ${selectedApp.applicationNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedApp.status}</div>
              </div>
              <Badge variant={selectedApp.status === 'APPROVED' ? 'success' : 'warning'}>
                {selectedApp.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Applicant Full Name</span>
                <div style={{ fontWeight: 600 }}>{selectedApp.studentFirstName} {selectedApp.studentLastName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Applying For Class</span>
                <div style={{ fontWeight: 600 }}>{selectedApp.applyingClass}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Date of Birth</span>
                <div>{selectedApp.dateOfBirth}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Gender</span>
                <div>{selectedApp.gender}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                Guardian / Sponsor Contact Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Guardian Name</span>
                  <div style={{ fontWeight: 500 }}>{selectedApp.guardianName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Contact Phone</span>
                  <div>{selectedApp.guardianPhone}</div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Email Address</span>
                <div>{selectedApp.guardianEmail}</div>
              </div>
            </div>

            {selectedApp.reviewNotes && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '2px' }}>Review Notes</span>
                <span style={{ color: 'var(--text-muted)' }}>{selectedApp.reviewNotes}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Review & Decide Application */}
      {reviewingApp && (
        <Modal
          isOpen={Boolean(reviewingApp)}
          onClose={() => setReviewingApp(null)}
          title={`Review Admission: ${reviewingApp.studentFirstName} ${reviewingApp.studentLastName}`}
        >
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Administrative Decision *
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${decision === 'APPROVED' ? 'var(--primary-600)' : 'var(--border-default)'}`,
                    backgroundColor: decision === 'APPROVED' ? 'var(--primary-50)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={decision === 'APPROVED'}
                    onChange={() => setDecision('APPROVED')}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Approve & Enroll</span>
                </label>

                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${decision === 'REJECTED' ? 'var(--danger-600)' : 'var(--border-default)'}`,
                    backgroundColor: decision === 'REJECTED' ? 'var(--danger-50)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={decision === 'REJECTED'}
                    onChange={() => setDecision('REJECTED')}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--danger-700)' }}>
                    Reject Application
                  </span>
                </label>
              </div>
            </div>

            {decision === 'APPROVED' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Assigned Class *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="ed-input"
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Assigned Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedSection}
                    onChange={(e) => setAssignedSection(e.target.value)}
                    className="ed-input"
                    placeholder="A"
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Reviewer Notes & Justification
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter verification notes, document check records, or rejection reasons..."
                rows={3}
                className="ed-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setReviewingApp(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={decision === 'REJECTED' ? { backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' } : {}}
              >
                {isSubmitting ? 'Processing...' : decision === 'APPROVED' ? 'Confirm Approval & Enroll' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
