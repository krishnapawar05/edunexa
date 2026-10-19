import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  Edit,
  Building2,
  Users,
  Award,
  Info,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Plan Edit / Upgrade Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    planName: 'Pro Plan',
    billingCycle: 'ANNUAL',
    maxStudents: 1000,
    maxStaff: 100,
    status: 'ACTIVE',
    endDate: '',
  });

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.listSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleOpenEdit = (sub: any) => {
    setSelectedSub(sub);
    const existingDate = sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '';
    setEditForm({
      planName: sub.planName || 'Standard',
      billingCycle: sub.billingCycle || 'ANNUAL',
      maxStudents: sub.maxStudents || 500,
      maxStaff: sub.maxStaff || 50,
      status: sub.status || 'ACTIVE',
      endDate: existingDate,
    });
    setShowEditModal(true);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setIsSubmitting(true);
    try {
      await superadminApi.updateSubscription(selectedSub.id, editForm);
      setShowEditModal(false);
      await loadSubscriptions();
    } catch (err: any) {
      alert(`Subscription update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const schoolName = sub.school?.name || '';
    const schoolCode = sub.school?.code || '';
    const plan = sub.planName || '';

    const matchesSearch =
      schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schoolCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || plan.toLowerCase().includes(planFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const calculateDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Subscriptions & Tenant Plans
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Multi-Tenant Subscription Lifecycle, Capacity Entitlements & Licensing
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button onClick={loadSubscriptions} className="ed-btn ed-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'ed-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notice Banner: Transparent Billing State */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          color: '#1e40af',
        }}
      >
        <Info size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Billing Model Status:</strong> Platform subscriptions operate under simulated sandbox licensing. Entitlements (student capacity, staff limits, and active status) are enforced directly across PostgreSQL queries without simulated merchant charges.
        </div>
      </div>

      {/* Tier Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Standard Tier */}
        <div className="ed-card ed-card-body" style={{ borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#059669' }}>
            Standard Plan
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Basic Academic SIS
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            • Up to <strong>500</strong> Students<br />
            • Up to <strong>50</strong> Faculty & Staff<br />
            • Student Directory, Attendance, Report Cards
          </div>
        </div>

        {/* Pro Plan */}
        <div className="ed-card ed-card-body" style={{ borderTop: '3px solid var(--primary-600)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary-700)' }}>
            Pro Plan (Most Popular)
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Academic + AI Assessments
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            • Up to <strong>1,000</strong> Students<br />
            • Up to <strong>100</strong> Faculty & Staff<br />
            • Online Quizzes + AI Learning Assistant
          </div>
        </div>

        {/* Enterprise */}
        <div className="ed-card ed-card-body" style={{ borderTop: '3px solid #7c3aed' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#6d28d9' }}>
            Enterprise Plan
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Multi-Campus Infrastructure
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            • Up to <strong>2,500+</strong> Students<br />
            • Up to <strong>200</strong> Faculty & Staff<br />
            • Custom Domain Branding + Priority Telemetry
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ed-card ed-card-body" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by school name, code, or plan tier..."
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
              style={{ width: '150px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Licenses</option>
              <option value="SUSPENDED">Suspended Licenses</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="ed-select"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Plan Tiers</option>
              <option value="Standard">Standard</option>
              <option value="Pro">Pro Plan</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setPlanFilter('ALL');
            }}
            className="ed-btn ed-btn-secondary"
          >
            Reset
          </button>
        </div>
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
          <button onClick={loadSubscriptions} className="ed-btn ed-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Active Tenant Subscriptions ({filteredSubs.length})</span>
          </div>
        </div>

        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="ed-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading subscription records...</div>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CreditCard size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No subscription allocations found</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                Try adjusting your search query or status filter.
              </div>
            </div>
          ) : (
            <div className="ed-table-responsive">
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '12px 16px' }}>School Tenant</th>
                    <th style={{ padding: '12px 16px' }}>Allocated Plan</th>
                    <th style={{ padding: '12px 16px' }}>Billing Cycle</th>
                    <th style={{ padding: '12px 16px' }}>Student / Staff Cap</th>
                    <th style={{ padding: '12px 16px' }}>Term Expiration</th>
                    <th style={{ padding: '12px 16px' }}>License Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub) => {
                    const daysRemaining = calculateDaysRemaining(sub.endDate);
                    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
                    const isExpired = daysRemaining <= 0;

                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub.school?.name || 'School Tenant'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Code: {sub.school?.code || '—'} • {sub.school?.city || 'India'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: sub.planName.toLowerCase().includes('enterprise')
                                ? '#f3e8ff'
                                : sub.planName.toLowerCase().includes('pro')
                                ? '#eff6ff'
                                : '#ecfdf5',
                              color: sub.planName.toLowerCase().includes('enterprise')
                                ? '#6b21a8'
                                : sub.planName.toLowerCase().includes('pro')
                                ? '#1d4ed8'
                                : '#047857',
                            }}
                          >
                            {sub.planName}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {sub.billingCycle || 'ANNUAL'}
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                          <div><strong>{sub.maxStudents || 500}</strong> Students</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.maxStaff || 50} Staff</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}</div>
                          <div
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 600,
                              color: isExpired
                                ? 'var(--danger-text)'
                                : isExpiringSoon
                                ? 'var(--warning-solid)'
                                : 'var(--text-muted)',
                            }}
                          >
                            {isExpired
                              ? 'Expired'
                              : isExpiringSoon
                              ? `Expires in ${daysRemaining} days`
                              : `${daysRemaining} days remaining`}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: sub.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--danger-bg)',
                              color: sub.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)',
                              border: `1px solid ${sub.status === 'ACTIVE' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                            }}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            title="Modify plan or extend expiry"
                          >
                            <Edit size={12} style={{ marginRight: '4px' }} />
                            <span>Modify Plan</span>
                          </button>
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

      {/* Modify / Upgrade Subscription Modal */}
      {showEditModal && selectedSub && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '500px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <CreditCard size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Modify Subscription: {selectedSub.school?.name}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="ed-input-group">
                <label className="ed-label">Plan Tier</label>
                <select
                  className="ed-select"
                  value={editForm.planName}
                  onChange={(e) => {
                    const plan = e.target.value;
                    let maxStudents = 500;
                    let maxStaff = 50;
                    if (plan.includes('Enterprise')) {
                      maxStudents = 2500;
                      maxStaff = 200;
                    } else if (plan.includes('Pro')) {
                      maxStudents = 1000;
                      maxStaff = 100;
                    }
                    setEditForm({ ...editForm, planName: plan, maxStudents, maxStaff });
                  }}
                >
                  <option value="Standard">Standard Plan</option>
                  <option value="Pro Plan">Pro Plan</option>
                  <option value="Enterprise">Enterprise Plan</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Max Student Capacity</label>
                  <input
                    type="number"
                    className="ed-input"
                    value={editForm.maxStudents}
                    onChange={(e) => setEditForm({ ...editForm, maxStudents: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Max Staff Capacity</label>
                  <input
                    type="number"
                    className="ed-input"
                    value={editForm.maxStaff}
                    onChange={(e) => setEditForm({ ...editForm, maxStaff: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Billing Cycle</label>
                  <select
                    className="ed-select"
                    value={editForm.billingCycle}
                    onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value })}
                  >
                    <option value="ANNUAL">Annual Renewal</option>
                    <option value="SEMESTER">Semester Renewal</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div className="ed-input-group">
                  <label className="ed-label">Status</label>
                  <select
                    className="ed-select"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Expiration Date</label>
                <input
                  type="date"
                  className="ed-input"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>

              <div className="ed-modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="ed-btn ed-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ed-btn ed-btn-primary">
                  {isSubmitting ? 'Updating...' : 'Save Plan Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
