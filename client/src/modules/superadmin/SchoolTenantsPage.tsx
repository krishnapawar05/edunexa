import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const SchoolTenantsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('SUSPENDED');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New School Form State
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    planName: 'Pro' as 'Standard' | 'Pro' | 'Enterprise',
  });

  // Edit School Form State
  const [editSchool, setEditSchool] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    websiteUrl: '',
  });

  const loadSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.listSchools({
        query: searchTerm,
        status: statusFilter,
      });
      setSchools(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch school tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchools();
  };

  const handleOpenOnboard = () => {
    setNewSchool({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      planName: 'Pro',
    });
    setShowOnboardModal(true);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.code) return;

    setIsSubmitting(true);
    try {
      await superadminApi.onboardSchool({
        ...newSchool,
        code: newSchool.code.toUpperCase().trim(),
        country: 'India',
      });
      setShowOnboardModal(false);
      await loadSchools();
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (school: any) => {
    setSelectedSchool(school);
    setEditSchool({
      name: school.name || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      postalCode: school.postalCode || '',
      websiteUrl: school.websiteUrl || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setIsSubmitting(true);
    try {
      await superadminApi.updateSchool(selectedSchool.id, editSchool);
      setShowEditModal(false);
      await loadSchools();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusConfirm = (school: any, nextStatus: string) => {
    setSelectedSchool(school);
    setTargetStatus(nextStatus);
    setStatusReason('');
    setShowStatusConfirmModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedSchool) return;

    setIsSubmitting(true);
    try {
      await superadminApi.toggleStatus(selectedSchool.id, targetStatus);
      setShowStatusConfirmModal(false);
      await loadSchools();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            School Tenant Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Registered educational institutions, multi-tenant isolation namespaces, and provisioning
          </p>
        </div>

        <button
          onClick={handleOpenOnboard}
          className="ed-btn ed-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Onboard New School</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="ed-card ed-card-body" style={{ padding: 'var(--space-4)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by school name, code, or city..."
              className="ed-input"
              style={{ paddingLeft: '32px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="ed-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Tenants</option>
              <option value="SUSPENDED">Suspended Tenants</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>

          <button type="submit" className="ed-btn ed-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              loadSchools();
            }}
            className="ed-btn ed-btn-secondary"
            title="Reset filters"
          >
            Reset
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button onClick={loadSchools} className="ed-btn ed-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Tenants Table */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Institutional Tenants ({schools.length})</span>
          </div>
          <button onClick={loadSchools} className="ed-btn-icon" title="Refresh tenant list">
            <RefreshCw size={14} className={loading ? 'ed-spin' : ''} />
          </button>
        </div>

        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="ed-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading school tenants from database...</div>
            </div>
          ) : schools.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No school tenants found</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No institutions match your search criteria. Try resetting filters.'
                  : 'Get started by onboarding your first school tenant into the platform.'}
              </div>
            </div>
          ) : (
            <div className="ed-table-responsive">
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '12px 16px' }}>School Identity</th>
                    <th style={{ padding: '12px 16px' }}>Code / Slug</th>
                    <th style={{ padding: '12px 16px' }}>Location</th>
                    <th style={{ padding: '12px 16px' }}>Subscription Plan</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Memberships</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => {
                    const activeSub = school.subscriptions?.[0];
                    const isSuspended = school.status === 'SUSPENDED';

                    return (
                      <tr key={school.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{school.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{school.email}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              backgroundColor: 'var(--bg-subtle)',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '0.78rem',
                            }}
                          >
                            {school.code}
                          </span>
                          <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px' }}>/{school.slug}</div>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {school.city ? `${school.city}, ${school.state || school.country}` : '—'}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                            }}
                          >
                            {activeSub?.planName || school.subscriptionPlan || 'Standard'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: isSuspended ? 'var(--danger-bg)' : 'var(--success-bg)',
                              color: isSuspended ? 'var(--danger-text)' : 'var(--success-text)',
                              border: `1px solid ${isSuspended ? 'var(--danger-border)' : 'var(--success-border)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isSuspended ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                            {school.status}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {school._count?.memberships ?? school.membershipsCount ?? '—'}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedSchool(school);
                                setShowDetailModal(true);
                              }}
                              className="ed-btn-icon"
                              title="View full tenant details"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(school)}
                              className="ed-btn-icon"
                              title="Edit school details"
                            >
                              <Edit2 size={15} />
                            </button>

                            {isSuspended ? (
                              <button
                                onClick={() => handleOpenStatusConfirm(school, 'ACTIVE')}
                                className="ed-btn ed-btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#059669', borderColor: '#a7f3d0' }}
                                title="Reactivate school tenant"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenStatusConfirm(school, 'SUSPENDED')}
                                className="ed-btn ed-btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#dc2626', borderColor: '#fecaca' }}
                                title="Suspend school tenant"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Onboard School Modal */}
      {showOnboardModal && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '540px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.05rem' }}>
                <Building2 size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Onboard New School Tenant</span>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="ed-input-group">
                <label className="ed-label">School Name *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Cambridge International Academy"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Unique Code *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="e.g. CIA-01"
                    value={newSchool.code}
                    onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Subscription Plan</label>
                  <select
                    className="ed-select"
                    value={newSchool.planName}
                    onChange={(e) => setNewSchool({ ...newSchool, planName: e.target.value as any })}
                  >
                    <option value="Standard">Standard (Up to 500 Students)</option>
                    <option value="Pro">Pro Plan (Up to 1,000 Students)</option>
                    <option value="Enterprise">Enterprise (Up to 2,500 Students)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Official Email *</label>
                  <input
                    required
                    type="email"
                    className="ed-input"
                    placeholder="admin@school.edu"
                    value={newSchool.email}
                    onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Contact Phone *</label>
                  <input
                    required
                    type="tel"
                    className="ed-input"
                    placeholder="+91 80 4000 1100"
                    value={newSchool.phone}
                    onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Physical Campus Address *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="Street / Sector / Knowledge Corridor"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">City *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="Bangalore"
                    value={newSchool.city}
                    onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">State *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="Karnataka"
                    value={newSchool.state}
                    onChange={(e) => setNewSchool({ ...newSchool, state: e.target.value })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Postal Code *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="560100"
                    value={newSchool.postalCode}
                    onChange={(e) => setNewSchool({ ...newSchool, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-modal-footer" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" onClick={() => setShowOnboardModal(false)} className="ed-btn ed-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ed-btn ed-btn-primary">
                  {isSubmitting ? 'Provisioning...' : 'Provision Tenant Namespace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {showEditModal && selectedSchool && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '520px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Edit2 size={16} style={{ color: 'var(--primary-600)' }} />
                <span>Edit Tenant Details: {selectedSchool.name}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSchool} className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="ed-input-group">
                <label className="ed-label">School Name</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  value={editSchool.name}
                  onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Email Address</label>
                  <input
                    required
                    type="email"
                    className="ed-input"
                    value={editSchool.email}
                    onChange={(e) => setEditSchool({ ...editSchool, email: e.target.value })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Phone Number</label>
                  <input
                    required
                    type="tel"
                    className="ed-input"
                    value={editSchool.phone}
                    onChange={(e) => setEditSchool({ ...editSchool, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Address</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  value={editSchool.address}
                  onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">City</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={editSchool.city}
                    onChange={(e) => setEditSchool({ ...editSchool, city: e.target.value })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">State</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={editSchool.state}
                    onChange={(e) => setEditSchool({ ...editSchool, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Official Website URL</label>
                <input
                  type="url"
                  className="ed-input"
                  placeholder="https://apexacademy.edu"
                  value={editSchool.websiteUrl}
                  onChange={(e) => setEditSchool({ ...editSchool, websiteUrl: e.target.value })}
                />
              </div>

              <div className="ed-modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="ed-btn ed-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ed-btn ed-btn-primary">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Detail Drawer/Modal */}
      {showDetailModal && selectedSchool && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '560px' }}>
            <div className="ed-modal-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {selectedSchool.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tenant ID: {selectedSchool.id} • Code: {selectedSchool.code}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                  <div style={{ fontWeight: 600, color: selectedSchool.status === 'ACTIVE' ? 'var(--success-solid)' : 'var(--danger-text)' }}>
                    {selectedSchool.status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Slug Namespace</div>
                  <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>/{selectedSchool.slug}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Memberships</div>
                  <div style={{ fontWeight: 600 }}>{selectedSchool._count?.memberships ?? selectedSchool.membershipsCount ?? 0} Accounts</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Plan</div>
                  <div style={{ fontWeight: 600 }}>{selectedSchool.subscriptions?.[0]?.planName || 'Standard Plan'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: '8px' }}>Institutional Contact & Location</div>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-muted)' }}>
                  <div><strong>Email:</strong> {selectedSchool.email}</div>
                  <div><strong>Phone:</strong> {selectedSchool.phone}</div>
                  <div><strong>Address:</strong> {selectedSchool.address}, {selectedSchool.city}, {selectedSchool.state} {selectedSchool.postalCode}</div>
                  {selectedSchool.websiteUrl && (
                    <div>
                      <strong>Website:</strong>{' '}
                      <a href={selectedSchool.websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)' }}>
                        {selectedSchool.websiteUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedSchool.subscriptions && selectedSchool.subscriptions.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: '8px' }}>Subscription Allocation</div>
                  <div style={{ fontSize: '0.82rem', padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div>Plan: <strong>{selectedSchool.subscriptions[0].planName}</strong> ({selectedSchool.subscriptions[0].billingCycle || 'ANNUAL'})</div>
                    <div>Student Capacity: <strong>{selectedSchool.subscriptions[0].maxStudents || 500}</strong> students</div>
                    <div>Staff Capacity: <strong>{selectedSchool.subscriptions[0].maxStaff || 50}</strong> staff</div>
                    <div>Valid Until: <strong>{new Date(selectedSchool.subscriptions[0].endDate).toLocaleDateString()}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div className="ed-modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="ed-btn ed-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {showStatusConfirmModal && selectedSchool && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '460px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                {targetStatus === 'SUSPENDED' ? (
                  <ShieldAlert size={18} style={{ color: 'var(--danger-solid)' }} />
                ) : (
                  <ShieldCheck size={18} style={{ color: 'var(--success-solid)' }} />
                )}
                <span>
                  {targetStatus === 'SUSPENDED' ? 'Confirm Tenant Suspension' : 'Confirm Tenant Reactivation'}
                </span>
              </div>
              <button onClick={() => setShowStatusConfirmModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {targetStatus === 'SUSPENDED' ? (
                  <>
                    Are you sure you want to suspend <strong>{selectedSchool.name}</strong>?
                    <br />
                    All users belonging to this school will be blocked from logging into the ERP until reactivation. School data remains securely preserved and intact.
                  </>
                ) : (
                  <>
                    Reactivate <strong>{selectedSchool.name}</strong>?
                    <br />
                    Authorized teachers, students, and administrators will immediately regain access to their dashboards.
                  </>
                )}
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Administrative Reason (Required for Audit Log)</label>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Annual renewal completed / Terms violation review"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
            </div>

            <div className="ed-modal-footer">
              <button onClick={() => setShowStatusConfirmModal(false)} className="ed-btn ed-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={isSubmitting}
                className={`ed-btn ${targetStatus === 'SUSPENDED' ? 'ed-btn-danger' : 'ed-btn-primary'}`}
              >
                {isSubmitting
                  ? 'Updating...'
                  : targetStatus === 'SUSPENDED'
                  ? 'Suspend Tenant'
                  : 'Reactivate Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
