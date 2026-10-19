import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  IdCard,
  QrCode,
  BookOpen,
  Briefcase,
  Mail,
  Phone,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs } from '../../components/ui/Tabs.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

interface StudentRecord {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  bloodGroup: string;
  address: string;
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

interface AdmissionApp {
  id: string;
  applicationNumber: string;
  studentFirstName: string;
  studentLastName: string;
  applyingClass: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
}

interface StaffRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  designation: string;
  email: string;
  phone: string;
  employmentStatus: string;
  assignments: Array<{
    className: string;
    sectionName: string;
    subjectCode: string;
    isLeadTeacher: boolean;
  }>;
}

interface SchoolAdminDashboardProps {
  initialTab?: 'students' | 'admissions' | 'staff' | 'id-cards';
}

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ initialTab }) => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<'students' | 'admissions' | 'staff' | 'id-cards'>(initialTab || 'students');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Live Data States
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionApp[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [academicStructure, setAcademicStructure] = useState<{ classes: any[]; departments: any[] }>({ classes: [], departments: [] });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<StudentRecord | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState<any | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('Lost in transit');
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<StaffRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Student Form
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

  // New Assignment Form
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

  // Fetch all live records from PostgreSQL
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, admissionsRes, staffRes, structureRes] = await Promise.all([
        coreApi.listStudents({ className: gradeFilter !== 'ALL' ? gradeFilter : undefined, query: searchTerm }),
        coreApi.listAdmissions(),
        coreApi.listStaff(),
        coreApi.getAcademicStructure().catch(() => ({ classes: [], departments: [] })),
      ]);

      setStudents(studentsRes.items || []);
      setAdmissions(admissionsRes || []);
      setStaffList(staffRes.items || []);
      setAcademicStructure({
        classes: structureRes.classes || [],
        departments: structureRes.departments || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load school administration records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [gradeFilter]);

  // Handle Search on Submit or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAllData();
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
        sectionName: newStudent.sectionName || 'Section A',
        bloodGroup: newStudent.bloodGroup || 'O+',
        address: newStudent.address?.trim() || 'Campus Residence, Apex Academy',
        emergencyPhone: guardianPhone,
        dateOfBirth: newStudent.dateOfBirth || '2010-05-15',
        guardianName: newStudent.guardianName.trim(),
        guardianEmail: guardianEmail,
        guardianPhone: guardianPhone,
        guardianRelationship: newStudent.guardianRelationship || 'Father',
      };

      const result = await coreApi.createStudent(payload);
      showToast(`Student ${result.firstName} ${result.lastName} enrolled successfully with ID #${result.admissionNumber}!`);
      setShowAdmitModal(false);
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
      await loadAllData();
    } catch (err: any) {
      alert(`Enrollment failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Review Admission Application
  const handleReviewApplication = async (app: AdmissionApp, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await coreApi.reviewAdmission(app.id, {
        decision,
        reviewNotes: decision === 'APPROVED' ? 'Approved by Admissions Committee' : 'Application declined',
        assignedClass: app.applyingClass,
        assignedSection: 'A',
      });
      showToast(`Application ${app.applicationNumber} ${decision === 'APPROVED' ? 'approved & enrolled' : 'declined'}.`);
      await loadAllData();
    } catch (err: any) {
      alert(`Review failed: ${err.message}`);
    }
  };

  // 3. Handle Generate Virtual ID Card
  const handleGenerateCard = async (student: StudentRecord) => {
    try {
      const card = await coreApi.generateIdCard({
        holderType: 'STUDENT',
        profileId: student.id,
      });
      showToast(`Virtual ID Card issued for ${student.firstName} (${card.cardNumber}).`);
      setPreviewCard(card);
      await loadAllData();
    } catch (err: any) {
      alert(`ID card generation failed: ${err.message}`);
    }
  };

  // 4. Handle Deactivate / Revoke ID Card
  const handleDeactivateCard = async () => {
    if (!showDeactivateModal) return;
    try {
      await coreApi.deactivateIdCard(showDeactivateModal.id, deactivateReason);
      showToast(`Card ${showDeactivateModal.cardNumber} revoked. Public QR token deactivated.`);
      setShowDeactivateModal(null);
      await loadAllData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  // 5. Handle Teacher Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    try {
      await coreApi.assignTeacher({
        staffProfileId: showAssignModal.id,
        className: assignForm.className,
        sectionName: assignForm.sectionName,
        subjectCode: assignForm.subjectCode,
        isLeadTeacher: assignForm.isLead,
      });
      showToast(`Teaching duty assigned for ${showAssignModal.firstName} ${showAssignModal.lastName}.`);
      setShowAssignModal(null);
      await loadAllData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // Filter students locally for instant typing search
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(q) || adm.includes(q);
    const matchesGrade = gradeFilter === 'ALL' || s.className === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Extract all issued ID cards from students & staff
  const issuedCards = students
    .filter((s) => s.idCard)
    .map((s) => ({
      id: s.idCard!.id,
      holderType: 'STUDENT',
      holderName: `${s.firstName} ${s.lastName}`,
      identifier: s.admissionNumber,
      cardNumber: s.idCard!.cardNumber,
      verificationToken: s.idCard!.verificationToken,
      status: s.idCard!.status,
      issuedAt: s.idCard!.issuedAt ? new Date(s.idCard!.issuedAt).toLocaleDateString() : 'Active',
      expiresAt: s.idCard!.expiresAt,
    }));

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
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>School Administrative Command & SIS</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {branding.schoolName} • Academic Session 2026–2027 • PostgreSQL Persisted
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            onClick={loadAllData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowAdmitModal(true)}
          >
            Enroll New Student
          </Button>
        </div>
      </div>

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Enrolled Students</span>
          <span className="value">{loading ? '...' : students.length}</span>
          <span className="subtitle">Persisted in PostgreSQL database</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Faculty Members</span>
          <span className="value">{loading ? '...' : staffList.length}</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Assigned instructors & leads
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Pending Admissions</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>
            {loading ? '...' : admissions.filter((a) => a.status === 'SUBMITTED').length}
          </span>
          <span className="subtitle">Review applications queue</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Virtual ID Cards</span>
          <span className="value">{loading ? '...' : issuedCards.filter((c) => c.status === 'ACTIVE').length} Active</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> ISO CR80 Encrypted QR
          </span>
        </div>
      </div>

      {/* Main Core Management Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'students', label: 'Student Directory & SIS', icon: <GraduationCap size={15} />, badge: students.length },
          { id: 'admissions', label: 'Online Admissions Review', icon: <FileCheck size={15} />, badge: admissions.filter((a) => a.status === 'SUBMITTED').length },
          { id: 'staff', label: 'Faculty & Teacher Assignments', icon: <Users size={15} />, badge: staffList.length },
          { id: 'id-cards', label: 'Virtual ID Cards & QR', icon: <IdCard size={15} />, badge: issuedCards.length },
        ]}
      />

      {/* TAB 1: Student Information System (SIS) */}
      {activeTab === 'students' && (
        <div className="ed-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Student Information System (SIS)</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '8px' }}>
                Showing {filteredStudents.length} active enrollments
              </span>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search name, admission #..."
                  className="ed-input"
                  style={{ padding: '5px 8px 5px 28px', fontSize: '0.82rem', width: '220px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="ed-select"
                style={{ padding: '5px 8px', fontSize: '0.82rem', width: '140px' }}
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="ALL">All Grades</option>
                {academicStructure.classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </form>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading students from PostgreSQL...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <GraduationCap size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No students found</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                  {students.length === 0 ? 'No students are currently enrolled in the database.' : 'No students match your filter criteria.'}
                </p>
                {students.length === 0 && (
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdmitModal(true)}>
                    Enroll First Student
                  </Button>
                )}
              </div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No</th>
                    <th>Class & Section</th>
                    <th>Roll No</th>
                    <th>Status</th>
                    <th>Primary Guardian</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const primaryGuardian = s.guardians?.[0] || { name: 'Parent/Guardian', phone: '—' };
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link
                            to={`/admin/students/${s.id}`}
                            style={{ fontWeight: 600, color: 'var(--primary-700)', textDecoration: 'none' }}
                          >
                            {s.firstName} {s.lastName}
                          </Link>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.gender} • {s.bloodGroup || 'O+'}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {s.admissionNumber}
                        </td>
                        <td>{s.className}-{s.sectionName || 'A'}</td>
                        <td style={{ fontWeight: 500 }}>#{s.rollNumber || 1}</td>
                        <td>
                          <Badge variant="success">{s.status || 'ACTIVE'}</Badge>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{primaryGuardian.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{primaryGuardian.phone}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedDossier(s)}
                              className="ed-btn ed-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={12} /> Dossier
                            </button>
                            <button
                              onClick={() => handleGenerateCard(s)}
                              className="ed-btn ed-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IdCard size={12} /> ID Card
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Online Admissions Review */}
      {activeTab === 'admissions' && (
        <div className="ed-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Admissions Review Queue</span>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                Applications submitted via public portal requiring document verification and seat assignment.
              </p>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            {admissions.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileCheck size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No admission applications</p>
                <p style={{ fontSize: '0.82rem' }}>Applications submitted through the public website will appear here in real-time.</p>
              </div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Application No</th>
                    <th>Candidate</th>
                    <th>Applying Class</th>
                    <th>Guardian Details</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {app.applicationNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.studentFirstName} {app.studentLastName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>DOB: {app.dateOfBirth}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{app.applyingClass}</td>
                      <td>
                        <div>{app.guardianName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{app.guardianPhone} • {app.guardianEmail}</div>
                      </td>
                      <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}</td>
                      <td>
                        {app.status === 'SUBMITTED' && <Badge variant="warning">Submitted</Badge>}
                        {app.status === 'APPROVED' && <Badge variant="success">Approved & Enrolled</Badge>}
                        {app.status === 'REJECTED' && <Badge variant="danger">Declined</Badge>}
                      </td>
                      <td>
                        {app.status === 'SUBMITTED' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleReviewApplication(app, 'APPROVED')}
                              className="ed-btn ed-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            >
                              Approve & Enroll
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app, 'REJECTED')}
                              className="ed-btn ed-btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Faculty & Teacher Assignments */}
      {activeTab === 'staff' && (
        <div className="ed-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Faculty & Pedagogical Assignments</span>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                Teaching assignments across academic subjects, classroom sections, and lead teacher responsibilities.
              </p>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            {staffList.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No faculty members registered in PostgreSQL.
              </div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Faculty Member</th>
                    <th>EMP ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Current Teaching Allocations</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{st.firstName} {st.lastName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{st.email}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {st.employeeId}
                      </td>
                      <td>{st.departmentName}</td>
                      <td>{st.designation}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(st.assignments || []).map((a, i) => (
                            <Badge key={i} variant="teal" style={{ fontSize: '0.72rem' }}>
                              {a.className}-{a.sectionName} ({a.subjectCode}){a.isLeadTeacher ? ' [Lead]' : ''}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge variant="success">{st.employmentStatus || 'Active'}</Badge>
                      </td>
                      <td>
                        <button
                          onClick={() => setShowAssignModal(st)}
                          className="ed-btn ed-btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Plus size={12} /> Assign Class
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Virtual ID Cards & QR Verification */}
      {activeTab === 'id-cards' && (
        <div className="ed-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Issued Virtual ID Cards & Encrypted QR Codes</span>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                ISO CR80 standard digital cards with revocable verification tokens. Zero plaintext passwords.
              </p>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            {issuedCards.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <IdCard size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No ID cards issued yet</p>
                <p style={{ fontSize: '0.82rem' }}>Generate an ID card for any student from the Student Directory tab.</p>
              </div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Cardholder</th>
                    <th>Type</th>
                    <th>Identifier</th>
                    <th>Card Number</th>
                    <th>Verification Token</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedCards.map((card) => (
                    <tr key={card.id}>
                      <td style={{ fontWeight: 600 }}>{card.holderName}</td>
                      <td>
                        <Badge variant="info">STUDENT</Badge>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{card.identifier}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {card.cardNumber}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {card.verificationToken}
                      </td>
                      <td>
                        {card.status === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                        {card.status === 'REVOKED' && (
                          <Badge variant="danger" icon={<ShieldAlert size={12} />}>
                            Revoked
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewCard(card)}
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={12} /> ISO CR80 View
                          </button>
                          {card.status === 'ACTIVE' && (
                            <button
                              onClick={() => setShowDeactivateModal(card)}
                              className="ed-btn ed-btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            >
                              Deactivate
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
      )}

      {/* MODAL 1: Enroll New Student */}
      <Modal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        title="Enroll New Student (SIS Registration)"
        subtitle="Generates student record, guardian links, and persists to PostgreSQL"
      >
        <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">First Name *</label>
              <input
                required
                type="text"
                className="ed-input"
                placeholder="e.g. Siddharth"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Last Name *</label>
              <input
                required
                type="text"
                className="ed-input"
                placeholder="e.g. Rao"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Admission Number (Auto-assigned if empty)</label>
              <input
                type="text"
                className="ed-input"
                placeholder="ADM-2026-XXXX"
                value={newStudent.admissionNumber}
                onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Gender</label>
              <select
                className="ed-select"
                value={newStudent.gender}
                onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Grade / Class</label>
              <select
                className="ed-select"
                value={newStudent.className}
                onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
              >
                {academicStructure.classes.length > 0 ? (
                  academicStructure.classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                  </>
                )}
              </select>
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Section</label>
              <select
                className="ed-select"
                value={newStudent.sectionName}
                onChange={(e) => setNewStudent({ ...newStudent, sectionName: e.target.value })}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Student Email (Auto-generated if empty)</label>
              <input
                type="email"
                className="ed-input"
                placeholder="e.g. firstname.lastname@student.apex.edu"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Date of Birth</label>
              <input
                type="date"
                className="ed-input"
                value={newStudent.dateOfBirth}
                onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: '8px' }}>Primary Guardian Relationship</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Guardian Full Name *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Venkatesh Rao"
                  value={newStudent.guardianName}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                />
              </div>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Guardian Phone</label>
                <input
                  type="tel"
                  className="ed-input"
                  placeholder="+91 98111 22334"
                  value={newStudent.guardianPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Guardian Email (Auto-generated if empty)</label>
                <input
                  type="email"
                  className="ed-input"
                  placeholder="e.g. parent@example.com"
                  value={newStudent.guardianEmail}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
                />
              </div>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Relationship</label>
                <select
                  className="ed-select"
                  value={newStudent.guardianRelationship}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianRelationship: e.target.value })}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Legal Guardian</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" disabled={isSubmitting} onClick={() => setShowAdmitModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enrolling...' : 'Complete Admission'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Student Dossier & Guardian Inspection */}
      <Modal
        isOpen={!!selectedDossier}
        onClose={() => setSelectedDossier(null)}
        title="Student Permanent Dossier"
        subtitle={`Official Institutional SIS Record #${selectedDossier?.admissionNumber}`}
      >
        {selectedDossier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-700)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                {selectedDossier.firstName[0]}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedDossier.firstName} {selectedDossier.lastName}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                  {selectedDossier.className}-{selectedDossier.sectionName || 'A'} • Roll #{selectedDossier.rollNumber || 1} • Blood: {selectedDossier.bloodGroup || 'O+'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Admission Number:</span>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDossier.admissionNumber}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Enrollment Status:</span>
                <div><Badge variant="success">{selectedDossier.status || 'ACTIVE'}</Badge></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Residential Address:</span>
                <div>{selectedDossier.address || 'Campus Residence'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>ID Card Status:</span>
                <div>{selectedDossier.idCard ? <Badge variant="success">Issued ({selectedDossier.idCard.cardNumber})</Badge> : <Badge variant="neutral">Not Issued</Badge>}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.90rem' }}>Authorized Guardian Information</h4>
              {(selectedDossier.guardians || []).length > 0 ? (
                selectedDossier.guardians.map((g, i) => (
                  <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600 }}>{g.name} ({g.relationship})</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {g.phone}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Email: {g.email}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No guardian linked.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setSelectedDossier(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: ISO CR80 Virtual ID Card Preview */}
      <Modal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        title="Virtual ID Card (ISO CR80 Institutional Specification)"
        subtitle="Equipped with privacy-preserving verification QR token"
      >
        {previewCard && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Physical Card Mockup */}
            <div
              style={{
                width: '340px',
                height: '210px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#ffffff',
                padding: '16px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: branding.primaryAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    {branding.monogram}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{branding.shortName}</div>
                    <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>OFFICIAL CREDENTIAL</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: previewCard.status === 'ACTIVE' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: previewCard.status === 'ACTIVE' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                  {previewCard.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '6px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  {previewCard.holderName ? previewCard.holderName[0] : 'S'}
                </div>
                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{previewCard.holderName}</div>
                  <div style={{ fontSize: '0.70rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{previewCard.identifierNumber || previewCard.identifier}</div>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '2px' }}>{previewCard.holderType || 'STUDENT'} BADGE</div>
                </div>
              </div>

              {/* Card Footer with QR Verification Token */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.60rem', color: '#94a3b8' }}>CARD NO: {previewCard.cardNumber}</div>
                  <div style={{ fontSize: '0.58rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{previewCard.verificationToken?.slice(0, 16)}...</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', color: '#0F172A' }}>
                  <QrCode size={26} />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              QR Verification Token: <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>{previewCard.verificationToken}</code>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                icon={<ExternalLink size={14} />}
                onClick={() => {
                  window.open(`/api/v1/core/id-cards/verify/${previewCard.verificationToken}`, '_blank');
                }}
              >
                Inspect Public QR Endpoint
              </Button>
              <Button variant="primary" onClick={() => setPreviewCard(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: Deactivate / Revoke Card */}
      <Modal
        isOpen={!!showDeactivateModal}
        onClose={() => setShowDeactivateModal(null)}
        title="Revoke Virtual ID Card"
        subtitle={`Cardholder: ${showDeactivateModal?.holderName} (${showDeactivateModal?.cardNumber})`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)', fontSize: '0.84rem' }}>
            <strong>Warning:</strong> Deactivating this card immediately revokes the public verification QR token in PostgreSQL. Any scan will return invalid status.
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Reason for Revocation</label>
            <select
              className="ed-select"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            >
              <option value="Lost physical badge in transit">Lost physical badge in transit</option>
              <option value="Student transferred to another institution">Student transferred to another institution</option>
              <option value="Compromised or damaged credential">Compromised or damaged credential</option>
              <option value="Disciplinary suspension">Disciplinary suspension</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setShowDeactivateModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeactivateCard}>
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 5: Assign Class & Subject */}
      <Modal
        isOpen={!!showAssignModal}
        onClose={() => setShowAssignModal(null)}
        title="Assign Teaching Duties"
        subtitle={`Faculty: ${showAssignModal?.firstName} ${showAssignModal?.lastName} (${showAssignModal?.employeeId})`}
      >
        <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Class</label>
              <select
                className="ed-select"
                value={assignForm.className}
                onChange={(e) => setAssignForm({ ...assignForm, className: e.target.value })}
              >
                {academicStructure.classes.length > 0 ? (
                  academicStructure.classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                  </>
                )}
              </select>
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Section</label>
              <select
                className="ed-select"
                value={assignForm.sectionName}
                onChange={(e) => setAssignForm({ ...assignForm, sectionName: e.target.value })}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Subject Code</label>
            <input
              required
              className="ed-input"
              placeholder="e.g. PHY-10 or MATH-10"
              value={assignForm.subjectCode}
              onChange={(e) => setAssignForm({ ...assignForm, subjectCode: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowAssignModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
