import React, { useState } from 'react';
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
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs } from '../../components/ui/Tabs.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

interface StudentRecord {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  grade: string;
  section: string;
  rollNumber: number;
  bloodGroup: string;
  address: string;
  attendanceRate: string;
  feeStatus: 'PAID' | 'PARTIAL' | 'OVERDUE';
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED';
}

interface AdmissionApp {
  id: string;
  applicationNumber: string;
  studentName: string;
  applyingClass: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
}

interface StaffRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'PROBATION';
  assignments: Array<{
    className: string;
    sectionName: string;
    subjectCode: string;
    isLead: boolean;
  }>;
}

interface CardRecord {
  id: string;
  holderType: 'STUDENT' | 'STAFF';
  holderName: string;
  identifier: string;
  cardNumber: string;
  verificationToken: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
  expiresAt: string;
  revocationReason?: string;
}

export const SchoolAdminDashboard: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<'students' | 'admissions' | 'staff' | 'id-cards'>('students');

  // SIS Students State
  const [students, setStudents] = useState<StudentRecord[]>([
    {
      id: 'stu-aarav-01',
      admissionNumber: 'ADM-2026-0042',
      firstName: 'Aarav',
      lastName: 'Sharma',
      gender: 'Male',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: 1,
      bloodGroup: 'O+',
      address: 'Sector 14, Institutional Area, New Delhi',
      attendanceRate: '96.4%',
      feeStatus: 'PAID',
      guardianName: 'Sunil Sharma',
      guardianPhone: '+91 98450 11223',
      guardianEmail: 'sunil.sharma@parent.apex.edu',
      guardianRelationship: 'Father',
      status: 'ACTIVE',
    },
    {
      id: 'stu-ananya-02',
      admissionNumber: 'ADM-2026-0043',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      gender: 'Female',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: 2,
      bloodGroup: 'B+',
      address: 'Vasant Vihar, New Delhi',
      attendanceRate: '98.1%',
      feeStatus: 'PAID',
      guardianName: 'Priya Deshmukh',
      guardianPhone: '+91 98450 44556',
      guardianEmail: 'priya.d@parent.apex.edu',
      guardianRelationship: 'Mother',
      status: 'ACTIVE',
    },
    {
      id: 'stu-rohan-03',
      admissionNumber: 'ADM-2026-0044',
      firstName: 'Rohan',
      lastName: 'Verma',
      gender: 'Male',
      grade: 'Grade 9',
      section: 'B',
      rollNumber: 14,
      bloodGroup: 'A+',
      address: 'Green Park Extension, New Delhi',
      attendanceRate: '91.0%',
      feeStatus: 'PARTIAL',
      guardianName: 'Rajesh Verma',
      guardianPhone: '+91 98450 77889',
      guardianEmail: 'rajesh.v@example.com',
      guardianRelationship: 'Father',
      status: 'ACTIVE',
    },
    {
      id: 'stu-maya-04',
      admissionNumber: 'ADM-2026-0045',
      firstName: 'Maya',
      lastName: 'Sharma',
      gender: 'Female',
      grade: 'Grade 7',
      section: 'B',
      rollNumber: 5,
      bloodGroup: 'O+',
      address: 'Sector 14, Institutional Area, New Delhi',
      attendanceRate: '97.2%',
      feeStatus: 'PAID',
      guardianName: 'Sunil Sharma',
      guardianPhone: '+91 98450 11223',
      guardianEmail: 'sunil.sharma@parent.apex.edu',
      guardianRelationship: 'Father',
      status: 'ACTIVE',
    },
  ]);

  // Admissions Applications State
  const [admissions, setAdmissions] = useState<AdmissionApp[]>([
    {
      id: 'adm-app-01',
      applicationNumber: 'APP-2026-0091',
      studentName: 'Meera Nambiar',
      applyingClass: 'Grade 9',
      dateOfBirth: '2011-05-18',
      guardianName: 'Ramesh Nambiar',
      guardianPhone: '+91 98450 12345',
      guardianEmail: 'r.nambiar@example.com',
      status: 'SUBMITTED',
      createdAt: '2026-10-15',
    },
    {
      id: 'adm-app-02',
      applicationNumber: 'APP-2026-0092',
      studentName: 'Kabir Singhania',
      applyingClass: 'Grade 11',
      dateOfBirth: '2009-11-04',
      guardianName: 'Deepak Singhania',
      guardianPhone: '+91 98110 56789',
      guardianEmail: 'deepak.s@example.com',
      status: 'SUBMITTED',
      createdAt: '2026-10-16',
    },
  ]);

  // Staff & Faculty State
  const [staffList, setStaffList] = useState<StaffRecord[]>([
    {
      id: 'staff-thorne-01',
      employeeId: 'EMP-2026-0012',
      name: 'Dr. Julian Thorne',
      department: 'Science & Physics',
      designation: 'Senior Faculty & Dept Head',
      email: 'dr.thorne@apexacademy.edu',
      phone: '+91 (11) 2840-9112',
      status: 'ACTIVE',
      assignments: [
        { className: 'Grade 10', sectionName: 'A', subjectCode: 'PHY-10', isLead: true },
        { className: 'Grade 10', sectionName: 'B', subjectCode: 'PHY-10', isLead: false },
      ],
    },
    {
      id: 'staff-vance-02',
      employeeId: 'EMP-2026-0015',
      name: 'Mrs. Rebecca Vance',
      department: 'Mathematics',
      designation: 'Secondary Mathematics Lead',
      email: 'r.vance@apexacademy.edu',
      phone: '+91 (11) 2840-9115',
      status: 'ACTIVE',
      assignments: [
        { className: 'Grade 10', sectionName: 'A', subjectCode: 'MATH-10', isLead: true },
      ],
    },
  ]);

  // Virtual ID Cards State
  const [idCards, setIdCards] = useState<CardRecord[]>([
    {
      id: 'card-aarav-01',
      holderType: 'STUDENT',
      holderName: 'Aarav Sharma',
      identifier: 'ADM-2026-0042',
      cardNumber: 'CR80-2026-0042',
      verificationToken: 'v-tok-8f2c-49a1-9b7e-e214',
      status: 'ACTIVE',
      issuedAt: '2026-02-01',
      expiresAt: '2027-03-31',
    },
    {
      id: 'card-thorne-01',
      holderType: 'STAFF',
      holderName: 'Dr. Julian Thorne',
      identifier: 'EMP-2026-0012',
      cardNumber: 'CR80-2026-0012',
      verificationToken: 'v-tok-7a1b-3c4d-5e6f-9912',
      status: 'ACTIVE',
      issuedAt: '2026-01-15',
      expiresAt: '2028-06-30',
    },
  ]);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<StudentRecord | null>(null);
  const [showCardGenerateModal, setShowCardGenerateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState<CardRecord | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('Lost in transit');
  const [previewCard, setPreviewCard] = useState<CardRecord | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<StaffRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    gender: 'Male',
    grade: 'Grade 10',
    section: 'A',
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

  // 1. Handle Enroll Student with Duplicate Admission Number Check
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();

    const admNum = newStudent.admissionNumber.trim() || `ADM-2026-00${students.length + 46}`;

    // Duplicate check
    const isDup = students.some((s) => s.admissionNumber.toLowerCase() === admNum.toLowerCase());
    if (isDup) {
      showToast(`Conflict: Admission number '${admNum}' already exists in this school.`);
      return;
    }

    const created: StudentRecord = {
      id: `stu-${Date.now()}`,
      admissionNumber: admNum,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      gender: newStudent.gender,
      grade: newStudent.grade,
      section: newStudent.section,
      rollNumber: students.length + 1,
      bloodGroup: newStudent.bloodGroup,
      address: newStudent.address || 'Local School Area',
      attendanceRate: '100%',
      feeStatus: 'PAID',
      guardianName: newStudent.guardianName,
      guardianPhone: newStudent.guardianPhone || '+91 98000 00000',
      guardianEmail: newStudent.guardianEmail || 'parent@example.com',
      guardianRelationship: newStudent.guardianRelationship,
      status: 'ACTIVE',
    };

    setStudents([created, ...students]);
    setShowAdmitModal(false);
    setNewStudent({
      firstName: '',
      lastName: '',
      admissionNumber: '',
      gender: 'Male',
      grade: 'Grade 10',
      section: 'A',
      bloodGroup: 'O+',
      address: '',
      emergencyPhone: '',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      guardianRelationship: 'Father',
    });
    showToast(`Student ${created.firstName} ${created.lastName} enrolled (${admNum}).`);
  };

  // 2. Handle Approve Admission Application
  const handleApproveApplication = (app: AdmissionApp) => {
    const randomAdm = `ADM-2026-00${students.length + 50}`;
    const nameParts = app.studentName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Candidate';

    const enrolled: StudentRecord = {
      id: `stu-${Date.now()}`,
      admissionNumber: randomAdm,
      firstName,
      lastName,
      gender: 'Female',
      grade: app.applyingClass,
      section: 'A',
      rollNumber: students.length + 1,
      bloodGroup: 'B+',
      address: 'Residential Campus',
      attendanceRate: '100%',
      feeStatus: 'PAID',
      guardianName: app.guardianName,
      guardianPhone: app.guardianPhone,
      guardianEmail: app.guardianEmail,
      guardianRelationship: 'Parent',
      status: 'ACTIVE',
    };

    setStudents([enrolled, ...students]);
    setAdmissions((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: 'APPROVED' } : a))
    );
    showToast(`Application ${app.applicationNumber} approved. Enrolled as ${randomAdm}.`);
  };

  // 3. Handle Generate Virtual ID Card
  const handleGenerateCard = (student: StudentRecord) => {
    const token = `v-tok-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`;
    const cardNum = `CR80-2026-00${idCards.length + 51}`;

    const newCard: CardRecord = {
      id: `card-${Date.now()}`,
      holderType: 'STUDENT',
      holderName: `${student.firstName} ${student.lastName}`,
      identifier: student.admissionNumber,
      cardNumber: cardNum,
      verificationToken: token,
      status: 'ACTIVE',
      issuedAt: new Date().toISOString().split('T')[0],
      expiresAt: '2027-03-31',
    };

    setIdCards([newCard, ...idCards]);
    setShowCardGenerateModal(false);
    setPreviewCard(newCard);
    showToast(`Virtual ID Card issued for ${student.firstName} (${cardNum}).`);
  };

  // 4. Handle Deactivate / Revoke ID Card
  const handleDeactivateCard = () => {
    if (!showDeactivateModal) return;

    setIdCards((prev) =>
      prev.map((c) =>
        c.id === showDeactivateModal.id
          ? {
              ...c,
              status: 'REVOKED',
              revocationReason: deactivateReason,
            }
          : c
      )
    );

    const revokedToken = showDeactivateModal.verificationToken;
    setShowDeactivateModal(null);
    showToast(`Card ${showDeactivateModal.cardNumber} deactivated. QR token now invalid.`);
  };

  // 5. Handle Teacher Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === showAssignModal.id) {
          return {
            ...s,
            assignments: [
              ...s.assignments,
              {
                className: assignForm.className,
                sectionName: assignForm.sectionName,
                subjectCode: assignForm.subjectCode,
                isLead: assignForm.isLead,
              },
            ],
          };
        }
        return s;
      })
    );

    setShowAssignModal(null);
    showToast(`Assignment added for ${showAssignModal.name}.`);
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
    return matchesSearch && matchesGrade;
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
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>School Administrative Command & SIS</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {branding.schoolName} • Academic Session 2026–2027
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={() => showToast('Exporting student directory as authenticated CSV...')}
          >
            Export SIS (CSV)
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
          <span className="value">{students.length + 1416}</span>
          <span className="subtitle">Across Grades 1 through 12</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Faculty Present Today</span>
          <span className="value">108 / 114</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> 94.7% Attendance
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Pending Admissions</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>
            {admissions.filter((a) => a.status === 'SUBMITTED').length}
          </span>
          <span className="subtitle">Review applications queue</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Virtual ID Cards</span>
          <span className="value">{idCards.filter((c) => c.status === 'ACTIVE').length + 1416} Active</span>
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
          { id: 'id-cards', label: 'Virtual ID Cards & QR', icon: <IdCard size={15} />, badge: idCards.length },
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
                style={{ padding: '5px 8px', fontSize: '0.82rem', width: '130px' }}
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="ALL">All Grades</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
              </select>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  <th>Attendance</th>
                  <th>Fee Status</th>
                  <th>Primary Guardian</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.gender} • {s.bloodGroup}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {s.admissionNumber}
                    </td>
                    <td>{s.grade}-{s.section}</td>
                    <td style={{ fontWeight: 500 }}>#{s.rollNumber}</td>
                    <td>
                      <Badge variant="success">{s.attendanceRate}</Badge>
                    </td>
                    <td>
                      {s.feeStatus === 'PAID' && <Badge variant="success">Paid</Badge>}
                      {s.feeStatus === 'PARTIAL' && <Badge variant="warning">Partial</Badge>}
                      {s.feeStatus === 'OVERDUE' && <Badge variant="danger">Overdue</Badge>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{s.guardianName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.guardianPhone}</div>
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
                ))}
              </tbody>
            </table>
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
                      <div style={{ fontWeight: 600 }}>{app.studentName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>DOB: {app.dateOfBirth}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{app.applyingClass}</td>
                    <td>
                      <div>{app.guardianName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{app.guardianPhone} • {app.guardianEmail}</div>
                    </td>
                    <td>{app.createdAt}</td>
                    <td>
                      {app.status === 'SUBMITTED' && <Badge variant="warning">Submitted</Badge>}
                      {app.status === 'APPROVED' && <Badge variant="success">Approved & Enrolled</Badge>}
                      {app.status === 'REJECTED' && <Badge variant="danger">Declined</Badge>}
                    </td>
                    <td>
                      {app.status === 'SUBMITTED' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleApproveApplication(app)}
                            className="ed-btn ed-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                          >
                            Approve & Enroll
                          </button>
                          <button
                            onClick={() => {
                              setAdmissions((prev) =>
                                prev.map((a) => (a.id === app.id ? { ...a, status: 'REJECTED' } : a))
                              );
                              showToast(`Application ${app.applicationNumber} declined.`);
                            }}
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
                      <div style={{ fontWeight: 600 }}>{st.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{st.email}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {st.employeeId}
                    </td>
                    <td>{st.department}</td>
                    <td>{st.designation}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {st.assignments.map((a, i) => (
                          <Badge key={i} variant="teal" style={{ fontSize: '0.72rem' }}>
                            {a.className}-{a.sectionName} ({a.subjectCode}){a.isLead ? ' [Lead]' : ''}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Badge variant="success">Active</Badge>
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
                {idCards.map((card) => (
                  <tr key={card.id}>
                    <td style={{ fontWeight: 600 }}>{card.holderName}</td>
                    <td>
                      <Badge variant={card.holderType === 'STUDENT' ? 'info' : 'teal'}>
                        {card.holderType}
                      </Badge>
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
          </div>
        </div>
      )}

      {/* MODAL 1: Enroll New Student */}
      <Modal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        title="Enroll New Student (SIS Registration)"
        subtitle="Generates student record, guardian links, and unique admission number"
      >
        <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">First Name</label>
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
              <label className="ed-label">Last Name</label>
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
              <label className="ed-label">Admission Number (Unique Scope)</label>
              <input
                type="text"
                className="ed-input"
                placeholder="ADM-2026-XXXX (Leave blank to auto-generate)"
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
                value={newStudent.grade}
                onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
              >
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
              </select>
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Section</label>
              <select
                className="ed-select"
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="Science">Section Science</option>
              </select>
            </div>
          </div>

          {/* Guardian Information */}
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: '8px' }}>Primary Guardian Relationship</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Guardian Full Name</label>
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowAdmitModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Complete Admission
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
                  {selectedDossier.grade}-{selectedDossier.section} • Roll #{selectedDossier.rollNumber} • Blood: {selectedDossier.bloodGroup}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Admission Number:</span>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedDossier.admissionNumber}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Attendance Rate:</span>
                <div style={{ fontWeight: 600, color: 'var(--success-solid)' }}>{selectedDossier.attendanceRate}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Residential Address:</span>
                <div>{selectedDossier.address}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Enrollment Status:</span>
                <div><Badge variant="success">{selectedDossier.status}</Badge></div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.90rem' }}>Authorized Guardian Information</h4>
              <div style={{ padding: 'var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 600 }}>{selectedDossier.guardianName} ({selectedDossier.guardianRelationship})</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {selectedDossier.guardianPhone}</div>
                <div style={{ color: 'var(--text-muted)' }}>Email: {selectedDossier.guardianEmail}</div>
              </div>
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
            {/* Physical Card Mockup (CR80 standard 85.6 x 53.98 ratio) */}
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
                  {previewCard.holderName[0]}
                </div>
                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{previewCard.holderName}</div>
                  <div style={{ fontSize: '0.70rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{previewCard.identifier}</div>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '2px' }}>{previewCard.holderType} BADGE</div>
                </div>
              </div>

              {/* Card Footer with QR Verification Token */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.60rem', color: '#94a3b8' }}>CARD NO: {previewCard.cardNumber}</div>
                  <div style={{ fontSize: '0.58rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{previewCard.verificationToken.slice(0, 16)}...</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', color: '#0F172A' }}>
                  <QrCode size={26} />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              QR Token: <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>{previewCard.verificationToken}</code>
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
            <strong>Warning:</strong> Deactivating this card immediately revokes the public verification QR token. The public verification page will reflect invalid status.
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
        subtitle={`Faculty: ${showAssignModal?.name} (${showAssignModal?.employeeId})`}
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
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
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
            <label className="ed-label">Subject</label>
            <select
              className="ed-select"
              value={assignForm.subjectCode}
              onChange={(e) => setAssignForm({ ...assignForm, subjectCode: e.target.value })}
            >
              <option value="PHY-10">Physics (PHY-10)</option>
              <option value="MATH-10">Mathematics (MATH-10)</option>
              <option value="CHEM-10">Chemistry (CHEM-10)</option>
              <option value="CS-10">Computer Science & AI (CS-10)</option>
            </select>
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
