import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  Building,
  CreditCard,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  X,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

interface StaffMember {
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
  assignments?: Array<{
    className: string;
    sectionName: string;
    subjectCode: string;
    isLeadTeacher: boolean;
  }>;
}

export const HrStaffRecordsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<StaffMember | null>(null);
  const [showDossierModal, setShowDossierModal] = useState<StaffMember | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Staff State
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 11 2659 1000',
    employeeId: '',
    departmentName: 'Science & Physics',
    designation: 'Senior Faculty',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'ACTIVE',
  });

  // Edit Staff State
  const [editForm, setEditForm] = useState({
    designation: '',
    departmentName: '',
    phone: '',
    employmentStatus: 'ACTIVE',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await coreApi.listStaff({
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        query: searchTerm.trim() || undefined,
        page,
        limit: 10,
      });

      const rawItems = Array.isArray(res) ? res : (res as any)?.items || [];
      const meta = (res as any)?.meta;

      setStaffList(
        rawItems.map((s: any) => ({
          id: s.id,
          employeeId: s.employeeId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone || '+91 11 2659 1000',
          departmentName: s.departmentName || 'General Faculty',
          designation: s.designation || 'Faculty Member',
          joiningDate: s.joiningDate || '2026-01-01',
          employmentStatus: s.employmentStatus || 'ACTIVE',
          assignments: s.assignments || [],
        }))
      );

      setTotalStaff(meta?.total || (Array.isArray(res) ? res.length : rawItems.length));
      setTotalPages(meta?.totalPages || (Array.isArray(res) ? Math.ceil(res.length / 10) || 1 : 1));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve staff records from PostgreSQL database.');
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

  // Add Staff Handler
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.firstName.trim() || !newStaff.email.trim()) return;

    try {
      setIsSubmitting(true);
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const empId = newStaff.employeeId.trim()
        ? newStaff.employeeId.trim()
        : `EMP-2026-${randNum}`;

      await coreApi.createStaff({
        firstName: newStaff.firstName.trim(),
        lastName: newStaff.lastName.trim() || 'Staff',
        email: newStaff.email.trim().toLowerCase(),
        phone: newStaff.phone.trim() || '+91 11 2659 1000',
        employeeId: empId,
        departmentName: newStaff.departmentName,
        designation: newStaff.designation.trim() || 'Faculty Member',
        joiningDate: newStaff.joiningDate,
        employmentStatus: newStaff.employmentStatus,
      });

      showToast(`Staff member registered with Employee ID ${empId}.`);
      setShowAddModal(false);
      setNewStaff({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+91 11 2659 1000',
        employeeId: '',
        departmentName: 'Science & Physics',
        designation: 'Senior Faculty',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentStatus: 'ACTIVE',
      });
      await loadStaff();
    } catch (err: any) {
      showToast('Error registering staff: ' + (err.message || 'Validation error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: StaffMember) => {
    setShowEditModal(staff);
    setEditForm({
      designation: staff.designation,
      departmentName: staff.departmentName,
      phone: staff.phone,
      employmentStatus: staff.employmentStatus,
    });
  };

  // Submit Edit Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      setIsSubmitting(true);
      await coreApi.updateStaff(showEditModal.id, {
        designation: editForm.designation.trim(),
        departmentName: editForm.departmentName.trim(),
        phone: editForm.phone.trim(),
        employmentStatus: editForm.employmentStatus,
      });

      showToast(`Staff record updated for ${showEditModal.firstName} ${showEditModal.lastName}.`);
      setShowEditModal(null);
      await loadStaff();
    } catch (err: any) {
      showToast('Failed to update staff record: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Deactivation / Archival Handler
  const handleDeactivate = async () => {
    if (!showDeactivateModal) return;

    try {
      setIsSubmitting(true);
      await coreApi.updateStaffStatus(showDeactivateModal.id, 'RESIGNED');
      showToast(`Staff member ${showDeactivateModal.firstName} ${showDeactivateModal.lastName} marked as RESIGNED.`);
      setShowDeactivateModal(null);
      await loadStaff();
    } catch (err: any) {
      showToast('Error updating status: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate ID Card Handler
  const handleIssueIdCard = async (staff: StaffMember) => {
    try {
      await coreApi.generateIdCard({
        holderType: 'STAFF',
        profileId: staff.id,
      });
      showToast(`ISO CR80 Virtual ID Card issued for ${staff.firstName} ${staff.lastName}.`);
    } catch (err: any) {
      showToast('ID Card issuance note: ' + (err.message || 'Failed to issue card'));
    }
  };

  // Client-side status filter
  const displayedStaff = staffList.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.employmentStatus === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast */}
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
          <h2 style={{ margin: 0 }}>Staff & Faculty Personnel Records</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Complete employment registry, job designations, departmental affiliations, and credentials for {branding.shortName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadStaff}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setShowAddModal(true)}
          >
            Register Staff Member
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-bg, #fef2f2)', border: '1px solid var(--danger-border, #fecaca)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text, #dc2626)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="ed-card" style={{ padding: 0 }}>
        {/* Search & Filter Toolbar */}
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
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search staff by name, employee ID, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ed-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
            <Button type="submit" variant="secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              Search
            </Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Departments</option>
                <option value="Science">Science & Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Humanities">Humanities & Social Sciences</option>
                <option value="Computer">Computer Science & AI</option>
                <option value="Administration">Administration & HR</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PROBATION">Probation</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <span>Retrieving faculty and staff roster from PostgreSQL...</span>
            </div>
          ) : displayedStaff.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 6px 0' }}>No Staff Records Found</p>
              <p style={{ fontSize: '0.84rem', marginBottom: '16px' }}>No personnel records match the specified search or filter criteria.</p>
              <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>
                Register New Staff Member
              </Button>
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID Number</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-50, #eef2ff)',
                            color: 'var(--primary-700, #4338ca)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {staff.firstName[0]}
                        </div>
                        <div>
                          <div
                            style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--primary-700)' }}
                            onClick={() => setShowDossierModal(staff)}
                          >
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {staff.employeeId}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{staff.departmentName}</span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '0.84rem' }}>{staff.designation}</td>
                    <td style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>{staff.phone}</td>
                    <td>
                      {staff.employmentStatus === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                      {staff.employmentStatus === 'ON_LEAVE' && <Badge variant="warning">On Leave</Badge>}
                      {staff.employmentStatus === 'PROBATION' && <Badge variant="info">Probation</Badge>}
                      {staff.employmentStatus === 'RESIGNED' && <Badge variant="neutral">Resigned</Badge>}
                      {staff.employmentStatus === 'TERMINATED' && <Badge variant="danger">Terminated</Badge>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setShowDossierModal(staff)}
                          className="ed-btn ed-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          title="View Dossier"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="ed-btn ed-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          title="Edit Details"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleIssueIdCard(staff)}
                          className="ed-btn ed-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          title="Issue Virtual ID Card"
                        >
                          <CreditCard size={12} />
                        </button>
                        {staff.employmentStatus === 'ACTIVE' && (
                          <button
                            onClick={() => setShowDeactivateModal(staff)}
                            className="ed-btn ed-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            title="Deactivate / Resign"
                          >
                            <Trash2 size={12} />
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

        {/* Pagination Bar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Showing {displayedStaff.length} of {totalStaff} Staff Records (Page {page} of {totalPages})
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Register New Staff Member */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Staff / Faculty Member"
        subtitle="Creates institutional user account, employee ID, and departmental assignment"
      >
        <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">First Name *</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. Ramesh"
                value={newStaff.firstName}
                onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Last Name *</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. Kulkarni"
                value={newStaff.lastName}
                onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Institutional Email *</label>
              <input
                type="email"
                className="ed-input"
                placeholder="name@apexacademy.edu"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Phone Number *</label>
              <input
                type="tel"
                className="ed-input"
                placeholder="+91 11 2659 1000"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Employee ID (Optional Auto-Gen)</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. EMP-2026-9042"
                value={newStaff.employeeId}
                onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Joining Date *</label>
              <input
                type="date"
                className="ed-input"
                value={newStaff.joiningDate}
                onChange={(e) => setNewStaff({ ...newStaff, joiningDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Department *</label>
              <select
                className="ed-select"
                value={newStaff.departmentName}
                onChange={(e) => setNewStaff({ ...newStaff, departmentName: e.target.value })}
              >
                <option value="Science & Physics">Science & Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Administration & HR">Administration & HR</option>
              </select>
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Designation *</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. Senior Faculty & Head"
                value={newStaff.designation}
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register in PostgreSQL'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Staff Details */}
      <Modal
        isOpen={!!showEditModal}
        onClose={() => setShowEditModal(null)}
        title={`Edit Staff Details: ${showEditModal?.firstName} ${showEditModal?.lastName}`}
        subtitle={`Employee ID: ${showEditModal?.employeeId}`}
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Designation</label>
            <input
              type="text"
              className="ed-input"
              value={editForm.designation}
              onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Department</label>
            <select
              className="ed-select"
              value={editForm.departmentName}
              onChange={(e) => setEditForm({ ...editForm, departmentName: e.target.value })}
            >
              <option value="Science & Physics">Science & Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
              <option value="Computer Science & AI">Computer Science & AI</option>
              <option value="Administration & HR">Administration & HR</option>
            </select>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Contact Phone</label>
            <input
              type="tel"
              className="ed-input"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Employment Status</label>
            <select
              className="ed-select"
              value={editForm.employmentStatus}
              onChange={(e) => setEditForm({ ...editForm, employmentStatus: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="PROBATION">PROBATION</option>
              <option value="RESIGNED">RESIGNED</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Staff Member Dossier */}
      {showDossierModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDossierModal(null)}
          title="Staff Personnel Dossier"
          subtitle={`Institutional Dossier for ${showDossierModal.firstName} ${showDossierModal.lastName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-surface-elevated, #f8fafc)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-100, #e0e7ff)',
                  color: 'var(--primary-700, #4338ca)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {showDossierModal.firstName[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {showDossierModal.firstName} {showDossierModal.lastName}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {showDossierModal.designation} • {showDossierModal.departmentName}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <Badge variant={showDossierModal.employmentStatus === 'ACTIVE' ? 'success' : 'warning'}>
                    {showDossierModal.employmentStatus}
                  </Badge>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {showDossierModal.employeeId}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.84rem' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Official Email</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{showDossierModal.email}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Contact Phone</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{showDossierModal.phone}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Joining Date</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{showDossierModal.joiningDate}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Institutional Affiliation</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{branding.shortName}</div>
              </div>
            </div>

            {showDossierModal.assignments && showDossierModal.assignments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.88rem', margin: '8px 0' }}>Academic & Subject Assignments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {showDossierModal.assignments.map((a, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle, #f1f5f9)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 500 }}>{a.className} - Section {a.sectionName}</span>
                      <Badge variant="info">{a.subjectCode} {a.isLeadTeacher ? '• Lead' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                icon={<CreditCard size={14} />}
                onClick={() => handleIssueIdCard(showDossierModal)}
              >
                Issue / Reissue Virtual ID Card
              </Button>
              <Button variant="primary" onClick={() => setShowDossierModal(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirm Deactivation */}
      {showDeactivateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeactivateModal(null)}
          title="Deactivate Staff Member"
          subtitle="Non-destructive transition to RESIGNED status"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--warning-bg, #fef3c7)', borderRadius: 'var(--radius-md)', color: 'var(--warning-text, #92400e)', fontSize: '0.84rem' }}>
              <strong>Notice:</strong> This action will mark{' '}
              <strong>{showDeactivateModal.firstName} {showDeactivateModal.lastName}</strong> ({showDeactivateModal.employeeId}) as <strong>RESIGNED</strong>.
              Historical payroll, leave, attendance, and exam marks records will be preserved.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setShowDeactivateModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeactivate} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Confirm Deactivation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
