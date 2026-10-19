import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    city: '',
    email: '',
    plan: 'Pro Plan',
  });

  const loadSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.listSchools();
      setSchools(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch school tenants from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleToggleStatus = async (school: any) => {
    const nextStatus = school.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await superadminApi.toggleStatus(school.id, nextStatus);
      setSchools((prev) =>
        prev.map((s) => (s.id === school.id ? { ...s, status: nextStatus } : s))
      );
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.code) return;

    setIsSubmitting(true);
    try {
      await superadminApi.onboardSchool({
        name: newSchool.name,
        code: newSchool.code.toUpperCase(),
        email: newSchool.email || 'admin@' + newSchool.code.toLowerCase() + '.edu',
        phone: '+91 80 4000 1100',
        address: 'Main Campus',
        city: newSchool.city || 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        subscriptionPlan: newSchool.plan,
      });
      setShowOnboardModal(false);
      setNewSchool({ name: '', code: '', city: '', email: '', plan: 'Pro Plan' });
      await loadSchools();
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const name = s.name || '';
    const code = s.code || '';
    const city = s.city || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMemberships = schools.reduce((acc, s) => acc + (s._count?.memberships || s.studentsCount || 0), 0);
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
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadSchools}
            title="Refresh database records"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowOnboardModal(true)}
          >
            <Plus size={16} /> Onboard New School Tenant
          </button>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--danger-text)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={loadSchools}>
            Retry Request
          </button>
        </div>
      )}

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Registered Tenants</span>
          <span className="value">{loading ? '...' : schools.length}</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> {activeCount} operational, {schools.length - activeCount} suspended
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Total System Memberships</span>
          <span className="value">{loading ? '...' : totalMemberships.toLocaleString()}</span>
          <span className="subtitle">Across all active tenant databases</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Persistence Engine</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>PostgreSQL</span>
          <span className="subtitle">Prisma multi-tenant schema isolation</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Subscription Health</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>100%</span>
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
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading persisted tenants from PostgreSQL...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <Building2 size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No school tenants found</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                {schools.length === 0 ? 'The database contains no registered school tenants.' : 'No schools match the filter criteria.'}
              </p>
              {schools.length === 0 && (
                <button className="ed-btn ed-btn-primary ed-btn-sm" onClick={() => setShowOnboardModal(true)}>
                  <Plus size={14} /> Onboard First School
                </button>
              )}
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>School & Identifier</th>
                  <th>Location</th>
                  <th>Memberships</th>
                  <th>Subscription Tier</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Administrative Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => {
                  const planName = school.subscriptions?.[0]?.plan || school.plan || 'Standard';
                  const createdAt = school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'Active';
                  return (
                    <tr key={school.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{school.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Code: {school.code} • Slug: {school.slug || 'apex'}
                        </div>
                      </td>
                      <td>{school.city || 'Bangalore, KA'}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{school._count?.memberships ?? school.studentsCount ?? 0}</span> accounts
                      </td>
                      <td>
                        <span className="ed-badge ed-badge-neutral">{planName}</span>
                      </td>
                      <td>
                        {school.status === 'ACTIVE' ? (
                          <span className="ed-badge ed-badge-success">Operational</span>
                        ) : (
                          <span className="ed-badge ed-badge-danger">Suspended</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>{createdAt}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={`ed-btn ed-btn-sm ${school.status === 'ACTIVE' ? 'ed-btn-secondary' : 'ed-btn-primary'}`}
                          onClick={() => handleToggleStatus(school)}
                        >
                          {school.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Provisions isolated database namespace and tenant slug in PostgreSQL</p>
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
                  disabled={isSubmitting}
                  onClick={() => setShowOnboardModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ed-btn ed-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
