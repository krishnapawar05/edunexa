import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

interface StudentRecord {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  gender: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  bloodGroup: string;
  address: string;
  emergencyPhone?: string;
  status: string;
  guardians: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }>;
  idCard?: {
    id: string;
    cardNumber: string;
    verificationToken: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
  } | null;
}

export const StudentDirectoryPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Actions
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StudentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '2010-05-15',
    admissionNumber: '',
    gender: 'Male',
    className: 'Grade 10',
    sectionName: 'A',
    bloodGroup: 'O+',
    address: '',
    emergencyPhone: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelationship: 'Father',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await coreApi.listStudents({
        className: gradeFilter !== 'ALL' ? gradeFilter : undefined,
        query: searchTerm.trim() || undefined,
        page,
        limit: 10,
      });

      let rawItems = Array.isArray(res) ? res : (res as any)?.items || [];
      if (statusFilter !== 'ALL') {
        rawItems = rawItems.filter((s: StudentRecord) => s.status === statusFilter);
      }

      setStudents(rawItems);
      setTotalPages(Array.isArray(res) ? Math.ceil(res.length / 10) || 1 : (res as any)?.meta?.totalPages || 1);
      setTotalCount(Array.isArray(res) ? res.length : (res as any)?.meta?.total || rawItems.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [gradeFilter, statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  // 1. Handle Enroll Student with PostgreSQL Persistence
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cleanFirst = newStudent.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
      const cleanLast = newStudent.lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'apex';
      const rand = Math.floor(1000 + Math.random() * 9000);

      const admissionNum = newStudent.admissionNumber.trim()
        ? newStudent.admissionNumber.trim()
        : `ADM-2026-${rand}`;

      const studentEmail = newStudent.email?.trim()
        ? newStudent.email.trim()
        : `${cleanFirst}.${cleanLast}.${rand}@student.apex.edu`;

      const guardianPhone = newStudent.guardianPhone?.trim() || '+91 98000 00000';
      const guardianEmail = newStudent.guardianEmail?.trim()
        ? newStudent.guardianEmail.trim()
        : `${cleanFirst}.parent.${rand}@parent.apex.edu`;

      const payload = {
        firstName: newStudent.firstName.trim(),
        lastName: newStudent.lastName.trim(),
        email: studentEmail,
        admissionNumber: admissionNum,
        gender: newStudent.gender || 'Male',
        className: newStudent.className || 'Grade 10',
        sectionName: newStudent.sectionName || 'A',
        bloodGroup: newStudent.bloodGroup || 'O+',
        address: newStudent.address?.trim() || 'Campus Residence, Apex Academy',
        emergencyPhone: guardianPhone,
        dateOfBirth: newStudent.dateOfBirth || '2010-05-15',
        guardianName: newStudent.guardianName.trim(),
        guardianEmail: guardianEmail,
        guardianPhone: guardianPhone,
        guardianRelationship: newStudent.guardianRelationship || 'Father',
      };

      await coreApi.createStudent(payload);
      showToast(`Student ${payload.firstName} ${payload.lastName} successfully enrolled with ${admissionNum}!`);
      setShowEnrollModal(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '2010-05-15',
        admissionNumber: '',
        gender: 'Male',
        className: 'Grade 10',
        sectionName: 'A',
        bloodGroup: 'O+',
        address: '',
        emergencyPhone: '',
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        guardianRelationship: 'Father',
      });
      loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Enrollment transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Update Student
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setIsSubmitting(true);
    try {
      await coreApi.updateStudent(editStudent.id, {
        firstName: editStudent.firstName,
        lastName: editStudent.lastName,
        gender: editStudent.gender,
        bloodGroup: editStudent.bloodGroup,
        address: editStudent.address,
        status: editStudent.status,
      });
      showToast(`Student record for ${editStudent.firstName} updated.`);
      setEditStudent(null);
      loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Delete Student
  const handleDeleteStudent = async () => {
    if (!deleteCandidate) return;
    setIsSubmitting(true);
    try {
      await coreApi.deleteStudent(deleteCandidate.id);
      showToast(`Student ${deleteCandidate.firstName} ${deleteCandidate.lastName} removed.`);
      setDeleteCandidate(null);
      loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete student.');
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
              Student Directory & SIS
            </h1>
            <Badge variant="info">{totalCount} Enrolled</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Official student roster, academic dossiers, guardian linkages, and enrollment statuses.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={loadStudents}
            disabled={loading}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Plus size={16} />
            <span>Enroll New Student</span>
          </button>
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
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
              placeholder="Search by student name, admission number, or email..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class:</span>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setPage(1);
              }}
              className="ed-input"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Classes</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="ed-input"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="GRADUATED">Graduated</option>
            </select>
          </div>
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
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Student List Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Student</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Admission No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Class & Section</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Roll No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Primary Guardian</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading student directory from PostgreSQL...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const guardian = s.guardians?.[0];
                  return (
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
                              backgroundColor: 'var(--primary-100)',
                              color: 'var(--primary-800)',
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
                              {s.email || `${s.gender} • ${s.bloodGroup || 'O+'}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.admissionNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 500 }}>{s.className}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>— Sec {s.sectionName}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        #{s.rollNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {guardian ? (
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{guardian.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {guardian.relationship} • {guardian.phone}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None listed</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : s.status === 'GRADUATED' ? 'info' : 'neutral'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            to={`/admin/students/${s.id}`}
                            className="ed-btn ed-btn-sm ed-btn-secondary"
                            title="View Student Dossier"
                          >
                            <Eye size={14} />
                            <span>Dossier</span>
                          </Link>
                          <button
                            onClick={() => setEditStudent(s)}
                            className="ed-btn ed-btn-sm ed-btn-secondary"
                            title="Edit Student Info"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(s)}
                            className="ed-btn ed-btn-sm"
                            style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-200)', background: 'transparent' }}
                            title="Deactivate / Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            Showing page {page} of {totalPages} ({totalCount} total students)
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

      {/* Modal: Enroll New Student */}
      {showEnrollModal && (
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title="Enroll New Student to Institutional SIS"
        >
          <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
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
                  placeholder="e.g. Sharma"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Class / Grade *
                </label>
                <select
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
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
                  placeholder="A"
                  value={newStudent.sectionName}
                  onChange={(e) => setNewStudent({ ...newStudent, sectionName: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Gender
                </label>
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  className="ed-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: '0.88rem', fontWeight: 700 }}>
                Guardian Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunil Sharma"
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                    className="ed-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Relationship
                  </label>
                  <select
                    value={newStudent.guardianRelationship}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianRelationship: e.target.value })}
                    className="ed-input"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Guardian Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98100 00000"
                    value={newStudent.guardianPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                    className="ed-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Guardian Email
                  </label>
                  <input
                    type="email"
                    placeholder="guardian@example.com"
                    value={newStudent.guardianEmail}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
                    className="ed-input"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowEnrollModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Student Record */}
      {editStudent && (
        <Modal
          isOpen={Boolean(editStudent)}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.firstName} ${editStudent.lastName}`}
        >
          <form onSubmit={handleUpdateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={editStudent.firstName}
                  onChange={(e) => setEditStudent({ ...editStudent, firstName: e.target.value })}
                  className="ed-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={editStudent.lastName}
                  onChange={(e) => setEditStudent({ ...editStudent, lastName: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Enrollment Status
                </label>
                <select
                  value={editStudent.status}
                  onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value })}
                  className="ed-input"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TRANSFERRED">TRANSFERRED</option>
                  <option value="GRADUATED">GRADUATED</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Blood Group
                </label>
                <input
                  type="text"
                  value={editStudent.bloodGroup || 'O+'}
                  onChange={(e) => setEditStudent({ ...editStudent, bloodGroup: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Address
              </label>
              <textarea
                value={editStudent.address || ''}
                onChange={(e) => setEditStudent({ ...editStudent, address: e.target.value })}
                className="ed-input"
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" onClick={() => setEditStudent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete Confirmation Dialog */}
      {deleteCandidate && (
        <Modal
          isOpen={Boolean(deleteCandidate)}
          onClose={() => setDeleteCandidate(null)}
          title="Confirm Student Deletion"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--danger-700)' }}>
              <ShieldAlert size={28} />
              <div>
                <div style={{ fontWeight: 700 }}>Destructive Action Warning</div>
                <div style={{ fontSize: '0.84rem' }}>
                  Are you sure you want to permanently delete the student profile for{' '}
                  <strong>{deleteCandidate.firstName} {deleteCandidate.lastName}</strong> ({deleteCandidate.admissionNumber})?
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This operation will remove the student record, associated virtual ID card, enrollment history, and linkings from PostgreSQL.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' }}
                disabled={isSubmitting}
                onClick={handleDeleteStudent}
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
