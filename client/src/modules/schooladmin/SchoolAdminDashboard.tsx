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
  X,
  UserCheck,
  Mail,
  Phone,
} from 'lucide-react';

export const SchoolAdminDashboard: React.FC = () => {
  const [students, setStudents] = useState([
    {
      id: 'stu-01',
      admissionNumber: 'ADM-2026-0042',
      name: 'Aarav Sharma',
      gender: 'Male',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: 1,
      attendanceRate: '96.4%',
      feeStatus: 'PAID',
      guardianName: 'Sunil Sharma',
      guardianPhone: '+91 98450 11223',
      status: 'ACTIVE',
    },
    {
      id: 'stu-02',
      admissionNumber: 'ADM-2026-0043',
      name: 'Diya Patel',
      gender: 'Female',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: 2,
      attendanceRate: '98.1%',
      feeStatus: 'PAID',
      guardianName: 'Meera Patel',
      guardianPhone: '+91 98450 44556',
      status: 'ACTIVE',
    },
    {
      id: 'stu-03',
      admissionNumber: 'ADM-2026-0044',
      name: 'Rohan Verma',
      gender: 'Male',
      grade: 'Grade 11',
      section: 'Science',
      rollNumber: 14,
      attendanceRate: '91.0%',
      feeStatus: 'PARTIAL',
      guardianName: 'Rajesh Verma',
      guardianPhone: '+91 98450 77889',
      status: 'ACTIVE',
    },
    {
      id: 'stu-04',
      admissionNumber: 'ADM-2026-0045',
      name: 'Ananya Iyer',
      gender: 'Female',
      grade: 'Grade 9',
      section: 'B',
      rollNumber: 8,
      attendanceRate: '88.5%',
      feeStatus: 'OVERDUE',
      guardianName: 'K. Iyer',
      guardianPhone: '+91 98450 99001',
      status: 'ACTIVE',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  // New Student State
  const [newStudent, setNewStudent] = useState({
    name: '',
    gender: 'Female',
    grade: 'Grade 10',
    section: 'A',
    guardianName: '',
    guardianPhone: '',
  });

  const handleAdmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.guardianName) return;

    const count = students.length + 43;
    const admissionNumber = `ADM-2026-00${count}`;

    const admitted = {
      id: `stu-${Date.now()}`,
      admissionNumber,
      name: newStudent.name,
      gender: newStudent.gender,
      grade: newStudent.grade,
      section: newStudent.section,
      rollNumber: students.length + 1,
      attendanceRate: '100%',
      feeStatus: 'PAID' as const,
      guardianName: newStudent.guardianName,
      guardianPhone: newStudent.guardianPhone || '+91 98000 00000',
      status: 'ACTIVE' as const,
    };

    setStudents([admitted, ...students]);
    setShowAdmitModal(false);
    setNewStudent({ name: '', gender: 'Female', grade: 'Grade 10', section: 'A', guardianName: '', guardianPhone: '' });
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>School Administrative Command & SIS</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apex Academy of Sciences & Arts • Academic Session 2026–2027
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={() => alert('Exporting student directory as authenticated CSV...')}
          >
            <Download size={15} /> Export SIS (CSV)
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowAdmitModal(true)}
          >
            <Plus size={16} /> Enroll New Student
          </button>
        </div>
      </div>

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Enrolled Students</span>
          <span className="value">1,420</span>
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
          <span className="label">Term Fee Collection</span>
          <span className="value">₹ 84.6 L</span>
          <span className="subtitle">89.2% realized against dues</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Virtual ID Cards</span>
          <span className="value">1,418 Issued</span>
          <span className="subtitle">2 Pending photo approval</span>
        </div>
      </div>

      {/* Representative Student Management Workflow Card */}
      <div className="ed-card">
        <div className="ed-card-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Student Information System (SIS)</span>
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
                <th>Admission No</th>
                <th>Student Full Name</th>
                <th>Class & Sec</th>
                <th>Roll No</th>
                <th>Attendance</th>
                <th>Fee Status</th>
                <th>Primary Guardian</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                    {s.admissionNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.gender}</div>
                  </td>
                  <td>
                    <span className="ed-badge ed-badge-neutral">
                      {s.grade} - {s.section}
                    </span>
                  </td>
                  <td>#{s.rollNumber}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.attendanceRate}</span>
                  </td>
                  <td>
                    {s.feeStatus === 'PAID' && <span className="ed-badge ed-badge-success">Paid</span>}
                    {s.feeStatus === 'PARTIAL' && <span className="ed-badge ed-badge-warning">Partial</span>}
                    {s.feeStatus === 'OVERDUE' && <span className="ed-badge ed-badge-danger">Overdue</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.84rem' }}>{s.guardianName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.guardianPhone}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ed-btn ed-btn-sm ed-btn-secondary"
                      onClick={() => setSelectedStudent(s)}
                    >
                      <Eye size={13} /> View Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {selectedStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div className="ed-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Student Dossier: {selectedStudent.name}</h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedStudent.admissionNumber}
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setSelectedStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Class & Section</div>
                  <div style={{ fontWeight: 600 }}>{selectedStudent.grade} ({selectedStudent.section})</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Attendance YTD</div>
                  <div style={{ fontWeight: 600, color: 'var(--success-solid)' }}>{selectedStudent.attendanceRate}</div>
                </div>
              </div>

              <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Guardian Information</div>
                <div style={{ fontWeight: 600 }}>{selectedStudent.guardianName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Phone: {selectedStudent.guardianPhone}</div>
              </div>

              <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Virtual ID Card Verification Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span className="ed-badge ed-badge-success">Active & Verified</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Revocable Token: Active</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button className="ed-btn ed-btn-primary" onClick={() => setSelectedStudent(null)}>
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showAdmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div className="ed-card" style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Enroll New Student</h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Creates SIS profile and assigns roll number</p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowAdmitModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdmitStudent} className="ed-card-body">
              <div className="ed-input-group">
                <label className="ed-label">Full Name *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Sanjana Reddy"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Class</label>
                  <select
                    className="ed-select"
                    value={newStudent.grade}
                    onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  >
                    <option>Grade 9</option>
                    <option>Grade 10</option>
                    <option>Grade 11</option>
                    <option>Grade 12</option>
                  </select>
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Section</label>
                  <select
                    className="ed-select"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>Science</option>
                    <option>Commerce</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Parent / Guardian Name *</label>
                  <input
                    required
                    className="ed-input"
                    placeholder="e.g. N. Reddy"
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Guardian Phone</label>
                  <input
                    className="ed-input"
                    placeholder="+91 98450 12345"
                    value={newStudent.guardianPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowAdmitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ed-btn ed-btn-primary">
                  Confirm Admission & Issue Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
