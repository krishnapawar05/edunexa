import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  KeyRound,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Shield,
  Copy,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { governanceApi, superadminApi } from '../../services/api.js';

const SYSTEM_ROLES = [
  { value: 'ALL', label: 'All Platform Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'SCHOOL_ADMIN', label: 'School Administrator' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'TEACHER', label: 'Faculty / Teacher' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent / Guardian' },
  { value: 'HR_STAFF', label: 'HR / Staff Admin' },
  { value: 'ACCOUNTS', label: 'Accounts Staff' },
  { value: 'EXAM_COORDINATOR', label: 'Exam Coordinator' },
  { value: 'LIBRARIAN', label: 'Librarian' },
];

export const SuperAdminUsersPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals & Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [targetAccount, setTargetAccount] = useState<any | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    role: 'SCHOOL_ADMIN',
    schoolId: '',
    temporaryPassword: '',
    mustChangePassword: true,
  });
  const [creating, setCreating] = useState(false);

  // Reset Form State
  const [resetForm, setResetForm] = useState({
    temporaryPassword: '',
    mustChangePassword: true,
    reason: '',
  });
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSchools = async () => {
    try {
      const data = await superadminApi.listSchools({ query: '' });
      setSchools(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Failed to load schools:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await governanceApi.listAccounts({
        search,
        schoolId: selectedSchool,
        role: selectedRole,
        status: selectedStatus,
        page,
        limit: 25,
      });

      setAccounts(Array.isArray(res?.items) ? res.items : []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to retrieve accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [selectedSchool, selectedRole, selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAccounts();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.email) {
      showFeedback('error', 'First name, last name, and email are mandatory.');
      return;
    }

    try {
      setCreating(true);
      await governanceApi.createUser({
        ...createForm,
        schoolId: createForm.role === 'SUPER_ADMIN' ? undefined : createForm.schoolId || schools[0]?.id,
      });
      showFeedback('success', `Account created successfully for ${createForm.email}`);
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        role: 'SCHOOL_ADMIN',
        schoolId: '',
        temporaryPassword: '',
        mustChangePassword: true,
      });
      loadAccounts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create user account.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenResetModal = (account: any) => {
    setTargetAccount(account);
    const generated = 'EduNexa@' + Math.floor(100000 + Math.random() * 900000);
    setResetForm({
      temporaryPassword: generated,
      mustChangePassword: true,
      reason: 'Administrative recovery initiated by Super Admin',
    });
    setCopied(false);
    setShowResetModal(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!targetAccount) return;
    try {
      setResetting(true);
      await governanceApi.resetPassword(targetAccount.id, resetForm);
      showFeedback('success', `Password reset successful for ${targetAccount.email}`);
      setShowResetModal(false);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const handleUnlock = async (account: any) => {
    try {
      await governanceApi.unlockAccount(account.id);
      showFeedback('success', `Account unlocked for ${account.fullName || account.email}`);
      loadAccounts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to unlock account.');
    }
  };

  const handleToggleStatus = async (account: any, action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND') => {
    const confirmText = `Are you sure you want to ${action.toLowerCase()} account for ${account.fullName || account.email}?`;
    if (!window.confirm(confirmText)) return;

    try {
      await governanceApi.updateAccountStatus(account.id, action);
      showFeedback('success', `Account ${action.toLowerCase()}d successfully.`);
      loadAccounts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update account status.');
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(resetForm.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Platform Governance
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '0.80rem', color: '#64748b' }}>Section 16 RBAC & Account Management</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} style={{ color: 'var(--brand-primary, #1e3a8a)' }} />
            Centralized User & Administrator Accounts
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Govern all platform users, create School Admin credentials, enforce status locks, and execute secure credential resets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-primary, #1e3a8a)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <UserPlus size={16} />
            <span>Create User Account</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: toast.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* School Filter */}
          <select
            value={selectedSchool}
            onChange={(e) => { setSelectedSchool(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            <option value="ALL">All School Tenants ({schools.length})</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            {SYSTEM_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated</option>
            <option value="LOCKED">Locked</option>
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedSchool('ALL'); setSelectedRole('ALL'); setSelectedStatus('ALL'); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer', fontSize: '0.84rem' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.92rem' }}>
            User Accounts ({total} registered records)
          </span>
          {loading && <RefreshCw size={16} className="animate-spin" style={{ color: '#1e3a8a' }} />}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>User Identity</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tenant Scope</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Last Login</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#1e3a8a' }} />
                    <div>Loading accounts from PostgreSQL...</div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No matching accounts found for the current query filters.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{acc.fullName || 'Unnamed User'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{acc.email}</div>
                      {acc.phone && <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{acc.phone}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: acc.primaryRole === 'SUPER_ADMIN' ? '#f3e8ff' : '#eff6ff',
                          color: acc.primaryRole === 'SUPER_ADMIN' ? '#6b21a8' : '#1d4ed8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        {acc.primaryRole}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} style={{ color: '#94a3b8' }} />
                        <span>{acc.schoolName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {acc.accountLocked ? (
                        <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                          Locked
                        </span>
                      ) : acc.isActive ? (
                        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {acc.accountLocked && (
                          <button
                            onClick={() => handleUnlock(acc)}
                            title="Unlock Account"
                            style={{ padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', cursor: 'pointer', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Unlock size={13} />
                            <span>Unlock</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenResetModal(acc)}
                          title="Reset Password"
                          style={{ padding: '6px 10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', cursor: 'pointer', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <KeyRound size={13} />
                          <span>Reset Password</span>
                        </button>
                        {acc.isActive ? (
                          <button
                            onClick={() => handleToggleStatus(acc, 'DEACTIVATE')}
                            title="Deactivate Account"
                            style={{ padding: '6px 10px', backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '6px', color: '#be123c', cursor: 'pointer', fontSize: '0.76rem' }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(acc, 'ACTIVATE')}
                            title="Activate Account"
                            style={{ padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', cursor: 'pointer', fontSize: '0.76rem' }}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE USER ACCOUNT */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: '#1e3a8a' }} />
                Provision User or Administrator Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Platform Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                  >
                    {SYSTEM_ROLES.filter((r) => r.value !== 'ALL').map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>School Tenant *</label>
                  <select
                    disabled={createForm.role === 'SUPER_ADMIN'}
                    value={createForm.schoolId}
                    onChange={(e) => setCreateForm({ ...createForm, schoolId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Select Tenant School</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Temporary Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate a secure random password"
                  value={createForm.temporaryPassword}
                  onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="mustChangePwd"
                  checked={createForm.mustChangePassword}
                  onChange={(e) => setCreateForm({ ...createForm, mustChangePassword: e.target.checked })}
                />
                <label htmlFor="mustChangePwd" style={{ fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                  Force user to change password on first login
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.84rem' }}
                >
                  {creating ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {showResetModal && targetAccount && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: '#dc2626' }} />
                Administrative Password Reset
              </h3>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '16px' }}>
              Resetting credentials for <strong style={{ color: '#0f172a' }}>{targetAccount.email}</strong>. This action will invalidate all existing sessions.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Generated Temporary Password</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={resetForm.temporaryPassword}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.90rem', fontFamily: 'monospace', backgroundColor: '#f8fafc', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.80rem', fontWeight: 600 }}
                >
                  {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Audit Reason</label>
              <input
                type="text"
                value={resetForm.reason}
                onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleExecuteResetPassword}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', cursor: resetting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.84rem' }}
              >
                {resetting ? 'Resetting...' : 'Confirm Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

