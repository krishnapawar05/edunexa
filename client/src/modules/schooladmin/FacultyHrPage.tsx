import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  BookOpen,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Shield,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { coreApi } from '../../services/api.js';

interface StaffRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentName: string;
  designation: string;
  joiningDate: string;
  employmentStatus: string;
  assignments: Array<{
    className: string;
    sectionName: string;
    subjectCode: string;
    isLeadTeacher: boolean;
  }>;
}

export const FacultyHrPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);

  // Modals & Action States
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<StaffRecord | null>(null);
  const [selectedStaffDossier, setSelectedStaffDossier] = useState<StaffRecord | null>(null);
  const [statusEditStaff, setStatusEditStaff] = useState<StaffRecord | null>(null);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Staff Form State
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 98111 22233',
    employeeId: '',
    departmentName: 'Sciences',
    designation: 'Senior Faculty',
    joiningDate: '2026-01-15',
    employmentStatus: 'ACTIVE',
  });

  // Assign Form State
  const [assignForm, setAssignForm] = useState({
    className: 'Grade 10',
    sectionName: 'A',
    subjectCode: 'PHY-10',
    isLead: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await coreApi.listStaff({
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        query: searchTerm.trim() || undefined,
        page,
        limit: 10,
      });

      const rawItems = Array.isArray(res) ? res : (res as any)?.items || [];
      setStaffList(rawItems);
      setTotalPages(Array.isArray(res) ? Math.ceil(res.length / 10) || 1 : (res as any)?.meta?.totalPages || 1);
      setTotalStaff(Array.isArray(res) ? res.length : (res as any)?.meta?.total || rawItems.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty and staff records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [departmentFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStaff();
  };

  // Add Staff Member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const cleanFirst = newStaff.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff';
      const cleanLast = newStaff.lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'apex';

      const empId = newStaff.employeeId.trim()
        ? newStaff.employeeId.trim()
        : `EMP-2026-${rand}`;

      const staffEmail = newStaff.email.trim()
        ? newStaff.email.trim()
        : `${cleanFirst}.${cleanLast}.${rand}@apexacademy.edu`;

      await coreApi.createStaff({
        firstName: newStaff.firstName.trim(),
        lastName: newStaff.lastName.trim(),
        email: staffEmail,
        phone: newStaff.phone || '+91 98111 22233',
        employeeId: empId,
        departmentName: newStaff.departmentName,
        designation: newStaff.designation,
        joiningDate: newStaff.joiningDate,
        employmentStatus: newStaff.employmentStatus,
      });

      showToast(`Staff member ${newStaff.firstName} ${newStaff.lastName} onboarded as ${empId}!`);
      setShowAddStaffModal(false);
      setNewStaff({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+91 98111 22233',
        employeeId: '',
        departmentName: 'Sciences',
        designation: 'Senior Faculty',
        joiningDate: '2026-01-15',
        employmentStatus: 'ACTIVE',
      });
      loadStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to onboard staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign Subject / Class
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    setIsSubmitting(true);
    try {
      await coreApi.assignTeacher({
        staffProfileId: showAssignModal.id,
        className: assignForm.className,
        sectionName: assignForm.sectionName,
        subjectCode: assignForm.subjectCode.toUpperCase(),
        isLeadTeacher: assignForm.isLead,
      });

      showToast(
        `Assigned ${showAssignModal.firstName} ${showAssignModal.lastName} to ${assignForm.className}-${assignForm.sectionName} (${assignForm.subjectCode})`
      );
      setShowAssignModal(null);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign teaching duties.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusEditStaff) return;
    setIsSubmitting(true);
    try {
      await coreApi.updateStaffStatus(statusEditStaff.id, newStatus);
      showToast(`Employment status for ${statusEditStaff.firstName} updated to ${newStatus}.`);
      setStatusEditStaff(null);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to update employment status.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Faculty & Staff Directory
            </h1>
            <Badge variant="success">{totalStaff} Institutional Staff</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Comprehensive institutional human resources, academic faculty profiles, department associations, and teaching workload assignments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={loadStaff}
            disabled={loading}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Plus size={16} />
            <span>Onboard Staff Member</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '260px' }}>
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
              placeholder="Search by staff name, employee ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ed-input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="ed-input"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Departments</option>
            <option value="Sciences">Sciences</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Humanities">Humanities</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Languages">Languages</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
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
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Staff Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Staff Member</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Employee ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Department & Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Class Assignments</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading staff directory from PostgreSQL...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No faculty or staff records found.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background-color 0.1s ease' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {s.firstName} {s.lastName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.employeeId}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.designation}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.departmentName}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge
                        variant={
                          s.employmentStatus === 'ACTIVE'
                            ? 'success'
                            : s.employmentStatus === 'ON_LEAVE'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {s.employmentStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.assignments && s.assignments.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.assignments.map((a, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {a.className} • {a.subjectCode} {a.isLeadTeacher ? '★' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          No active teaching sections
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setShowAssignModal(s)}
                          className="ed-btn ed-btn-sm ed-btn-secondary"
                          title="Assign Classes & Subjects"
                        >
                          <BookOpen size={13} />
                          <span>Assign</span>
                        </button>
                        <button
                          onClick={() => {
                            setStatusEditStaff(s);
                            setNewStatus(s.employmentStatus);
                          }}
                          className="ed-btn ed-btn-sm ed-btn-secondary"
                          title="Change Employment Status"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing page {page} of {totalPages} ({totalStaff} total staff members)
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Onboard New Staff */}
      {showAddStaffModal && (
        <Modal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          title="Onboard Institutional Staff Member"
        >
          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Eleanor"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                  className="ed-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thorne"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  placeholder="e.thorne@apexacademy.edu"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="ed-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Department *
                </label>
                <select
                  value={newStaff.departmentName}
                  onChange={(e) => setNewStaff({ ...newStaff, departmentName: e.target.value })}
                  className="ed-input"
                >
                  <option value="Sciences">Sciences</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Languages">Languages</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.designation}
                  onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                  className="ed-input"
                  placeholder="Senior Physics Teacher"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Joining Date
                </label>
                <input
                  type="date"
                  value={newStaff.joiningDate}
                  onChange={(e) => setNewStaff({ ...newStaff, joiningDate: e.target.value })}
                  className="ed-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Employment Status
                </label>
                <select
                  value={newStaff.employmentStatus}
                  onChange={(e) => setNewStaff({ ...newStaff, employmentStatus: e.target.value })}
                  className="ed-input"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowAddStaffModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Onboarding...' : 'Confirm Staff Onboarding'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Assign Teaching Duties */}
      {showAssignModal && (
        <Modal
          isOpen={Boolean(showAssignModal)}
          onClose={() => setShowAssignModal(null)}
          title={`Assign Academic Responsibilities: ${showAssignModal.firstName} ${showAssignModal.lastName}`}
        >
          <form onSubmit={handleAssignTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Class / Grade *
                </label>
                <select
                  value={assignForm.className}
                  onChange={(e) => setAssignForm({ ...assignForm, className: e.target.value })}
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
                  Section *
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.sectionName}
                  onChange={(e) => setAssignForm({ ...assignForm, sectionName: e.target.value })}
                  className="ed-input"
                  placeholder="A"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Subject Code *
              </label>
              <input
                type="text"
                required
                value={assignForm.subjectCode}
                onChange={(e) => setAssignForm({ ...assignForm, subjectCode: e.target.value })}
                className="ed-input"
                placeholder="e.g. PHY-10 or MAT-10"
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={assignForm.isLead}
                onChange={(e) => setAssignForm({ ...assignForm, isLead: e.target.checked })}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Designate as Lead Course Teacher</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowAssignModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Change Employment Status */}
      {statusEditStaff && (
        <Modal
          isOpen={Boolean(statusEditStaff)}
          onClose={() => setStatusEditStaff(null)}
          title={`Update Employment Status: ${statusEditStaff.firstName} ${statusEditStaff.lastName}`}
        >
          <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Current Employee ID
              </label>
              <input type="text" readOnly disabled value={statusEditStaff.employeeId} className="ed-input" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                New Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="ed-input"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="PROBATION">PROBATION</option>
                <option value="RESIGNED">RESIGNED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setStatusEditStaff(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Status'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
