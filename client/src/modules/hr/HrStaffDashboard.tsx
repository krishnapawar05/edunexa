import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  FileQuestion,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs } from '../../components/ui/Tabs.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

interface StaffMember {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  type: 'FULL_TIME' | 'CONTRACT';
  email: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'PROBATION';
  trainingStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

interface LeaveRequest {
  id: string;
  staffName: string;
  employeeId: string;
  type: string;
  duration: string;
  startDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st-01',
    name: 'Dr. Alistair Thorne',
    employeeId: 'EMP-2026-0012',
    department: 'Science & Physics',
    designation: 'Senior Faculty & Dept Head',
    type: 'FULL_TIME',
    email: 'a.thorne@apexacademy.edu',
    phone: '+91 (11) 2840-9112',
    status: 'ACTIVE',
    trainingStatus: 'COMPLETED',
  },
  {
    id: 'st-02',
    name: 'Mrs. Rebecca Vance',
    employeeId: 'EMP-2026-0015',
    department: 'Mathematics',
    designation: 'Secondary Mathematics Lead',
    type: 'FULL_TIME',
    email: 'r.vance@apexacademy.edu',
    phone: '+91 (11) 2840-9115',
    status: 'ACTIVE',
    trainingStatus: 'COMPLETED',
  },
  {
    id: 'st-03',
    name: 'Mr. Devendra Joshi',
    employeeId: 'EMP-2026-0024',
    department: 'Humanities & History',
    designation: 'History & Civics Lecturer',
    type: 'FULL_TIME',
    email: 'd.joshi@apexacademy.edu',
    phone: '+91 (11) 2840-9124',
    status: 'ON_LEAVE',
    trainingStatus: 'COMPLETED',
  },
  {
    id: 'st-04',
    name: 'Ms. Sunita Rao',
    employeeId: 'EMP-2026-0031',
    department: 'Computer Science & AI',
    designation: 'ICT Lab Coordinator',
    type: 'CONTRACT',
    email: 's.rao@apexacademy.edu',
    phone: '+91 (11) 2840-9131',
    status: 'ACTIVE',
    trainingStatus: 'IN_PROGRESS',
  },
  {
    id: 'st-05',
    name: 'Rajesh Malhotra',
    employeeId: 'EMP-2026-0045',
    department: 'Administration',
    designation: 'Facility Manager',
    type: 'FULL_TIME',
    email: 'r.malhotra@apexacademy.edu',
    phone: '+91 (11) 2840-9145',
    status: 'ACTIVE',
    trainingStatus: 'PENDING',
  },
];

const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'lr-01',
    staffName: 'Mr. Devendra Joshi',
    employeeId: 'EMP-2026-0024',
    type: 'Medical Leave',
    duration: '2 Days',
    startDate: '2026-10-18',
    reason: 'Undergoing routine clinical outpatient review and rest',
    status: 'APPROVED',
  },
  {
    id: 'lr-02',
    staffName: 'Ms. Sunita Rao',
    employeeId: 'EMP-2026-0031',
    type: 'Casual Leave',
    duration: '1 Day',
    startDate: '2026-10-22',
    reason: 'Attending regional STEM robotics symposium',
    status: 'PENDING',
  },
];

export const HrStaffDashboard: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<'directory' | 'leaves' | 'training'>('directory');
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    department: 'Science & Physics',
    designation: '',
    type: 'FULL_TIME' as 'FULL_TIME' | 'CONTRACT',
    email: '',
    phone: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApproveLeave = (id: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'APPROVED' } : l))
    );
    showToast('Leave request approved. Academic schedule substitution alert sent.');
  };

  const handleRejectLeave = (id: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'REJECTED' } : l))
    );
    showToast('Leave request declined.');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;

    const empId = `EMP-2026-00${staffList.length + 15}`;
    const created: StaffMember = {
      id: `st-${Date.now()}`,
      name: newStaff.name,
      employeeId: empId,
      department: newStaff.department,
      designation: newStaff.designation || 'Faculty Member',
      type: newStaff.type,
      email: newStaff.email,
      phone: newStaff.phone || '+91 (11) 2840-0000',
      status: 'ACTIVE',
      trainingStatus: 'PENDING',
    };

    setStaffList([created, ...staffList]);
    setShowAddModal(false);
    setNewStaff({
      name: '',
      department: 'Science & Physics',
      designation: '',
      type: 'FULL_TIME',
      email: '',
      phone: '',
    });
    showToast(`Staff record registered successfully (${empId}).`);
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.department.includes(deptFilter);
    return matchesSearch && matchesDept;
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

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Human Resources & Faculty Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Staff directory, leave approvals, institutional contracts, and policy compliance for {branding.shortName}.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => setShowAddModal(true)}
        >
          Register Faculty / Staff
        </Button>
      </div>

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Total Workforce</span>
          <span className="value">{staffList.length + 59}</span>
          <span className="subtitle">
            <Users size={13} /> 52 Teaching • 12 Administrative
          </span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">On Duty Today</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            95.3%
          </span>
          <span className="subtitle">61 Present • 3 Approved Leaves</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Pending Leaves</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>
            {leaves.filter((l) => l.status === 'PENDING').length}
          </span>
          <span className="subtitle">
            <Clock size={13} /> Requires Principal / HR signoff
          </span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Policy Compliance</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            94.2%
          </span>
          <span className="subtitle">
            <ShieldCheck size={13} /> Child Protection & Safety module
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'directory', label: 'Faculty & Staff Directory', icon: <Users size={15} />, badge: staffList.length },
          { id: 'leaves', label: 'Leave Requests & Coverage', icon: <CalendarCheck size={15} />, badge: leaves.filter((l) => l.status === 'PENDING').length },
          { id: 'training', label: 'Mandatory Policy & AI Training', icon: <FileQuestion size={15} /> },
        ]}
      />

      {/* Tab 1: Staff Directory */}
      {activeTab === 'directory' && (
        <div className="ed-card" style={{ padding: 0 }}>
          {/* Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search staff by name, EMP ID, or designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ed-input"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Department:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="ed-select"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Departments</option>
                  <option value="Science">Science & Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID & Type</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Training</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-50)',
                            color: 'var(--primary-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {staff.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{staff.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {staff.employeeId}
                      </div>
                      <Badge variant="neutral" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                        {staff.type === 'FULL_TIME' ? 'Permanent' : 'Contract'}
                      </Badge>
                    </td>
                    <td>{staff.department}</td>
                    <td style={{ fontWeight: 500 }}>{staff.designation}</td>
                    <td style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>{staff.phone}</td>
                    <td>
                      {staff.status === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                      {staff.status === 'ON_LEAVE' && <Badge variant="warning">On Leave</Badge>}
                      {staff.status === 'PROBATION' && <Badge variant="info">Probation</Badge>}
                    </td>
                    <td>
                      {staff.trainingStatus === 'COMPLETED' && (
                        <Badge variant="teal" icon={<CheckCircle2 size={12} />}>
                          Compliant
                        </Badge>
                      )}
                      {staff.trainingStatus === 'IN_PROGRESS' && (
                        <Badge variant="warning" icon={<Clock size={12} />}>
                          In Progress
                        </Badge>
                      )}
                      {staff.trainingStatus === 'PENDING' && (
                        <Badge variant="danger" icon={<XCircle size={12} />}>
                          Pending
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Leave Requests */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
              <h4 style={{ margin: 0, fontSize: '0.98rem' }}>Leave Applications Queue</h4>
              <Badge variant="info">CBSE Service Code Regulations Enforced</Badge>
            </div>
            <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Start Date</th>
                    <th>Justification</th>
                    <th>Decision</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600 }}>
                        {leave.staffName}
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{leave.employeeId}</div>
                      </td>
                      <td>{leave.type}</td>
                      <td style={{ fontWeight: 500 }}>{leave.duration}</td>
                      <td>{leave.startDate}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
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
                              onClick={() => handleApproveLeave(leave.id)}
                              className="ed-btn ed-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              className="ed-btn ed-btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            >
                              Reject
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
        </div>
      )}

      {/* Tab 3: Staff Training Compliance */}
      {activeTab === 'training' && (
        <div className="ed-grid-2">
          <div className="ed-card">
            <h4 style={{ margin: '0 0 var(--space-3)' }}>Child Protection & Workplace Safeguarding 2026</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Mandatory legal annual accreditation for all instructional and pastoral personnel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span>Certified Faculty</span>
                <span style={{ fontWeight: 600 }}>58 / 64 Staff (90.6%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div style={{ width: '90.6%', height: '100%', backgroundColor: 'var(--teal-accent)' }} />
              </div>
            </div>
          </div>

          <div className="ed-card">
            <h4 style={{ margin: '0 0 var(--space-3)' }}>AI-Assisted Lesson Planning & Ethical Data Use</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Guidelines on student PII privacy, anti-plagiarism verification, and prompt crafting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span>Certified Faculty</span>
                <span style={{ fontWeight: 600 }}>46 / 64 Staff (71.8%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div style={{ width: '71.8%', height: '100%', backgroundColor: 'var(--brand-blue)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Staff */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Faculty or Staff Member"
        subtitle="Generates employee credentials, security role, and department assignment"
      >
        <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Full Legal Name</label>
            <input
              type="text"
              className="ed-input"
              placeholder="e.g. Dr. Meera Kulkarni"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Department</label>
              <select
                className="ed-select"
                value={newStaff.department}
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
              >
                <option value="Science & Physics">Science & Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Humanities & History">Humanities & History</option>
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Administration">Administration & HR</option>
              </select>
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Designation</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. Assistant Professor"
                value={newStaff.designation}
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Official Work Email</label>
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
              <label className="ed-label">Phone Number</label>
              <input
                type="tel"
                className="ed-input"
                placeholder="+91 (11) 2840-XXXX"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Contract Type</label>
            <select
              className="ed-select"
              value={newStaff.type}
              onChange={(e) => setNewStaff({ ...newStaff, type: e.target.value as any })}
            >
              <option value="FULL_TIME">Permanent Full-Time</option>
              <option value="CONTRACT">Contractual / Adjunct</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Complete Registration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
