import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState([
    {
      id: 'sch-01',
      name: 'Apex Academy of Sciences & Arts',
      code: 'APX-01',
      city: 'Bangalore, KA',
      studentsCount: 1420,
      staffCount: 114,
      status: 'ACTIVE',
      plan: 'Enterprise',
      renewalDate: '2027-04-30',
    },
    {
      id: 'sch-02',
      name: 'Greenwood International School',
      code: 'GWH-02',
      city: 'Pune, MH',
      studentsCount: 890,
      staffCount: 68,
      status: 'ACTIVE',
      plan: 'Pro Plan',
      renewalDate: '2027-01-15',
    },
    {
      id: 'sch-03',
      name: 'St. Augustine Collegiate',
      code: 'SAC-03',
      city: 'Kolkata, WB',
      studentsCount: 620,
      staffCount: 42,
      status: 'SUSPENDED',
      plan: 'Standard',
      renewalDate: '2026-09-30',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    city: '',
    email: '',
    plan: 'Pro Plan',
  });

  const handleToggleStatus = (id: string) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : s
      )
    );
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.code) return;

    const created = {
      id: `sch-0${schools.length + 1}`,
      name: newSchool.name,
      code: newSchool.code.toUpperCase(),
      city: newSchool.city || 'Bangalore, KA',
      studentsCount: 0,
      staffCount: 1,
      status: 'ACTIVE',
      plan: newSchool.plan,
      renewalDate: '2027-10-18',
    };

    setSchools([created, ...schools]);
    setShowOnboardModal(false);
    setNewSchool({ name: '', code: '', city: '', email: '', plan: 'Pro Plan' });
  };

  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStudents = schools.reduce((acc, s) => acc + s.studentsCount, 0);
  const totalStaff = schools.reduce((acc, s) => acc + s.staffCount, 0);
  const activeCount = schools.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Platform Super Admin Telemetry</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            System-wide multi-tenant governance, subscription enforcement, and institutional onboarding.
          </p>
        </div>
        <button
          className="ed-btn ed-btn-primary"
          onClick={() => setShowOnboardModal(true)}
        >
          <Plus size={16} /> Onboard New School Tenant
        </button>
      </div>

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Registered Tenants</span>
          <span className="value">{schools.length}</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> {activeCount} operational, {schools.length - activeCount} suspended
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Total Students Enrolled</span>
          <span className="value">{totalStudents.toLocaleString()}</span>
          <span className="subtitle">Across all active tenant databases</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Platform Staff Accounts</span>
          <span className="value">{totalStaff.toLocaleString()}</span>
          <span className="subtitle">Teachers, admins, and personnel</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Subscription Health</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>98.2%</span>
          <span className="subtitle">Zero critical tenant isolation leaks</span>
        </div>
      </div>

      {/* School Directory Card */}
      <div className="ed-card">
        <div className="ed-card-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Registered School Tenants</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '8px' }}>
              ({filteredSchools.length} listed)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search schools..."
                className="ed-input"
                style={{ padding: '5px 8px 5px 28px', fontSize: '0.82rem', width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="ed-select"
              style={{ padding: '5px 8px', fontSize: '0.82rem', width: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>
        </div>

        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="ed-table">
            <thead>
              <tr>
                <th>School & Identifier</th>
                <th>Location</th>
                <th>Students / Staff</th>
                <th>Subscription Tier</th>
                <th>Status</th>
                <th>Renewal Due</th>
                <th style={{ textAlign: 'right' }}>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{school.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Code: {school.code} • ID: {school.id}
                    </div>
                  </td>
                  <td>{school.city}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{school.studentsCount}</span> students / {school.staffCount} staff
                  </td>
                  <td>
                    <span className="ed-badge ed-badge-neutral">{school.plan}</span>
                  </td>
                  <td>
                    {school.status === 'ACTIVE' ? (
                      <span className="ed-badge ed-badge-success">Operational</span>
                    ) : (
                      <span className="ed-badge ed-badge-danger">Suspended</span>
                    )}
                  </td>
                  <td>{school.renewalDate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`ed-btn ed-btn-sm ${school.status === 'ACTIVE' ? 'ed-btn-secondary' : 'ed-btn-primary'}`}
                      onClick={() => handleToggleStatus(school.id)}
                    >
                      {school.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard New School Modal */}
      {showOnboardModal && (
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
                <h3 style={{ fontSize: '1.1rem' }}>Onboard New School Tenant</h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Provisions isolated database namespace and tenant slug</p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowOnboardModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="ed-card-body">
              <div className="ed-input-group">
                <label className="ed-label">Official Institution Name *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Cambridge Heritage School"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Tenant Code *</label>
                  <input
                    required
                    className="ed-input"
                    placeholder="e.g. CHS-04"
                    value={newSchool.code}
                    onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">City & State</label>
                  <input
                    className="ed-input"
                    placeholder="e.g. Chennai, TN"
                    value={newSchool.city}
                    onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Administrator Email *</label>
                  <input
                    required
                    type="email"
                    className="ed-input"
                    placeholder="admin@school.org"
                    value={newSchool.email}
                    onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Subscription Tier</label>
                  <select
                    className="ed-select"
                    value={newSchool.plan}
                    onChange={(e) => setNewSchool({ ...newSchool, plan: e.target.value })}
                  >
                    <option>Standard</option>
                    <option>Pro Plan</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowOnboardModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ed-btn ed-btn-primary">
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
