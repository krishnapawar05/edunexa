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
  Download,
  UserCheck,
  UserX,
  FileCheck,
  Mail,
  Send,
  RotateCcw,
  Ban,
  UserPlus,
  Clock,
  KeyRound,
  Unlock,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import {
  useBulkSelection,
  SelectAllCheckbox,
  RowCheckbox,
  BulkActionToolbar,
  BulkActionConfirmationDialog,
  BulkActionItem,
} from '../../components/bulk/index.js';
import {
  superadminApi,
  superAdminResetPasswordApi,
  superAdminUnlockAccountApi,
} from '../../services/api.js';

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('SUSPENDED');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Invitation Management State
  const [schoolInvitations, setSchoolInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [newAdminForm, setNewAdminForm] = useState({
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
    sendInvitation: true,
  });

  // Super Admin Password Reset & Account Recovery State
  const [resetTargetUser, setResetTargetUser] = useState<any | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [superAdminTempPassword, setSuperAdminTempPassword] = useState('');
  const [superAdminResetResult, setSuperAdminResetResult] = useState<{ temporaryPassword: string; email: string } | null>(null);
  const [superAdminCopied, setSuperAdminCopied] = useState(false);

  const handleOpenSuperAdminReset = (targetUser: any) => {
    setResetTargetUser(targetUser);
    setSuperAdminTempPassword('');
    setSuperAdminResetResult(null);
    setResetModalOpen(true);
  };

  const handleExecuteSuperAdminReset = async () => {
    if (!resetTargetUser) return;
    try {
      setIsSubmitting(true);
      const res = await superAdminResetPasswordApi(resetTargetUser.id || resetTargetUser.userId, {
        temporaryPassword: superAdminTempPassword ? superAdminTempPassword.trim() : undefined,
        mustChangePassword: true,
        reason: 'Password reset by Platform Super Admin',
      });
      setSuperAdminResetResult({
        temporaryPassword: res.temporaryPassword,
        email: res.user.email,
      });
      setToastMessage(`Password reset successfully for ${res.user.email}.`);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuperAdminUnlock = async (userId: string) => {
    try {
      setIsSubmitting(true);
      await superAdminUnlockAccountApi(userId, 'Unlocked by Platform Super Admin');
      setToastMessage('Account unlocked successfully.');
      if (selectedSchool) {
        handleOpenInvitationsModal(selectedSchool);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to unlock account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Selection & Actions State
  const selection = useBulkSelection();
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
    sendInvitation: true,
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
      adminFullName: '',
      adminEmail: '',
      adminPhone: '',
      sendInvitation: true,
    });
    setShowOnboardModal(true);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.code) return;

    setIsSubmitting(true);
    try {
      const res = await superadminApi.onboardSchool({
        ...newSchool,
        code: newSchool.code.toUpperCase().trim(),
        country: 'India',
      });
      setShowOnboardModal(false);
      showToast(
        res.schoolAdmin
          ? `Tenant '${newSchool.name}' onboarded and invitation issued to ${res.schoolAdmin.email}.`
          : `Tenant '${newSchool.name}' onboarded successfully.`
      );
      await loadSchools();
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invitation Management Handlers
  const fetchSchoolInvitations = async (schoolId: string) => {
    setLoadingInvitations(true);
    try {
      const data = await superadminApi.listSchoolInvitations(schoolId);
      setSchoolInvitations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch invitation status.');
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleOpenInviteModal = (school: any) => {
    setSelectedSchool(school);
    setNewAdminForm({
      adminFullName: '',
      adminEmail: '',
      adminPhone: '',
      sendInvitation: true,
    });
    setShowInviteModal(true);
  };

  const handleSendInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !newAdminForm.adminFullName || !newAdminForm.adminEmail) return;

    setIsSubmitting(true);
    try {
      await superadminApi.sendSchoolAdminInvitation(selectedSchool.id, newAdminForm);
      showToast(`Invitation sent to ${newAdminForm.adminEmail}.`);
      setShowInviteModal(false);
      await loadSchools();
      if (showInvitationsModal) {
        await fetchSchoolInvitations(selectedSchool.id);
      }
    } catch (err: any) {
      alert(`Failed to send invitation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInvitationsModal = async (school: any) => {
    setSelectedSchool(school);
    setShowInvitationsModal(true);
    await fetchSchoolInvitations(school.id);
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!selectedSchool) return;
    setIsSubmitting(true);
    try {
      await superadminApi.resendSchoolAdminInvitation(selectedSchool.id, invitationId);
      showToast('Fresh invitation email sent with new single-use token.');
      await fetchSchoolInvitations(selectedSchool.id);
      await loadSchools();
    } catch (err: any) {
      alert(`Failed to resend invitation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRevokeModal = (invitation: any) => {
    setSelectedInvitation(invitation);
    setRevokeReason('');
    setShowRevokeModal(true);
  };

  const handleConfirmRevokeInvitation = async () => {
    if (!selectedSchool || !selectedInvitation) return;
    setIsSubmitting(true);
    try {
      await superadminApi.revokeSchoolAdminInvitation(selectedSchool.id, selectedInvitation.id, revokeReason);
      showToast('Invitation successfully revoked.');
      setShowRevokeModal(false);
      setSelectedInvitation(null);
      await fetchSchoolInvitations(selectedSchool.id);
      await loadSchools();
    } catch (err: any) {
      alert(`Failed to revoke invitation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInvitationBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              border: '1px solid var(--success-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={11} /> Accepted / Active
          </span>
        );
      case 'SENT':
      case 'PENDING':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#2563eb',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Mail size={11} /> Pending Activation
          </span>
        );
      case 'EXPIRED':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} /> Expired
          </span>
        );
      case 'REVOKED':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Ban size={11} /> Revoked
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-default)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Not Invited
          </span>
        );
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

  const handleBulkAction = async (action: 'ACTIVATE' | 'SUSPEND' | 'REVIEW') => {
    const targetIds = selection.isAllMatching
      ? schools.map((s) => s.id)
      : selection.getSelectedList();

    if (targetIds.length === 0) {
      showToast('Please select at least one school tenant.');
      return;
    }

    setBulkActionLoading(action);
    try {
      const res = await superadminApi.bulkSchoolActions({
        ids: targetIds,
        action,
        params: {
          reason: `Bulk execution from Super Admin Tenants ledger: ${action}`,
        },
      });

      showToast(res.message || `Processed ${res.processedCount} school tenant(s).`);
      selection.clearSelection();
      loadSchools();
    } catch (err: any) {
      showToast(err.message || `Failed to process bulk ${action.toLowerCase()}.`);
    } finally {
      setBulkActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const handleBulkExportCsv = () => {
    const exportTargets = selection.selectedCount > 0
      ? schools.filter((s) => selection.isSelected(s.id))
      : schools;

    if (exportTargets.length === 0) {
      showToast('No school tenants to export.');
      return;
    }

    const headers = ['School Name', 'Code', 'Slug', 'Email', 'City', 'State', 'Status', 'Plan', 'Memberships'];
    const rows = exportTargets.map((s) => [
      `"${s.name}"`,
      s.code,
      s.slug,
      `"${s.email}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      s.status,
      s.subscriptions?.[0]?.planName || s.subscriptionPlan || 'Standard',
      s._count?.memberships || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `school-tenants-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${exportTargets.length} tenant records to CSV.`);
  };

  const bulkActions: BulkActionItem[] = [
    {
      id: 'bulk-activate-schools',
      label: 'Activate Tenants',
      icon: <UserCheck size={14} />,
      onClick: () => handleBulkAction('ACTIVATE'),
      loading: bulkActionLoading === 'ACTIVATE',
      variant: 'primary',
    },
    {
      id: 'bulk-suspend-schools',
      label: 'Suspend Tenants',
      icon: <UserX size={14} />,
      onClick: () =>
        setConfirmDialog({
          isOpen: true,
          action: 'SUSPEND',
          title: 'Suspend School Tenants',
          message:
            'Are you sure you want to suspend access for the selected school tenants? All portal access for users within these schools will be locked.',
          confirmLabel: 'Suspend Tenants',
          variant: 'danger',
        }),
      loading: bulkActionLoading === 'SUSPEND',
      variant: 'danger',
    },
    {
      id: 'bulk-review-schools',
      label: 'Review Compliance',
      icon: <FileCheck size={14} />,
      onClick: () => handleBulkAction('REVIEW'),
      loading: bulkActionLoading === 'REVIEW',
      variant: 'secondary',
    },
    {
      id: 'bulk-export-schools',
      label: 'Export CSV',
      icon: <Download size={14} />,
      onClick: handleBulkExportCsv,
      variant: 'outline',
    },
  ];

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
              <BulkActionToolbar
                selection={selection}
                actions={bulkActions}
                totalMatchingCount={schools.length}
                currentPageIds={schools.map((s) => s.id)}
                entityName="tenants"
              />

              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                      <SelectAllCheckbox pageIds={schools.map((s) => s.id)} selection={selection} />
                    </th>
                    <th style={{ padding: '12px 16px' }}>School Identity</th>
                    <th style={{ padding: '12px 16px' }}>School Admin & Invitation</th>
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
                      <tr
                        key={school.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: selection.isSelected(school.id) ? 'var(--primary-50, rgba(26, 77, 46, 0.05))' : undefined,
                        }}
                      >
                        <td style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                          <RowCheckbox
                            id={school.id}
                            checked={selection.isSelected(school.id)}
                            onToggle={selection.toggleSelect}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{school.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{school.email}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {school.schoolAdmin ? (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                                {school.schoolAdmin.name || 'School Admin'}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {school.schoolAdmin.email}
                              </div>
                              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {renderInvitationBadge(
                                  school.invitationStatus ||
                                    school.schoolAdmin.invitationStatus ||
                                    (school.schoolAdmin.isActive ? 'ACCEPTED' : 'PENDING')
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No Admin
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenInviteModal(school)}
                                className="ed-btn ed-btn-outline"
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '0.72rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <UserPlus size={11} />
                                <span>Invite</span>
                              </button>
                            </div>
                          )}
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
                              onClick={() => handleOpenInvitationsModal(school)}
                              className="ed-btn-icon"
                              title="Manage Administrator Invitations"
                            >
                              <Mail size={15} />
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

              {/* School Administrator Initial Account Provisioning */}
              <div
                style={{
                  marginTop: '6px',
                  borderTop: '1px solid var(--border-default)',
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} style={{ color: 'var(--primary-600)' }} />
                  <span>School Administrator Account (Required for Tenant Access)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="ed-input-group">
                    <label className="ed-label">Admin Full Name *</label>
                    <input
                      required
                      type="text"
                      className="ed-input"
                      placeholder="e.g. Dr. Arthur Pendelton"
                      value={newSchool.adminFullName}
                      onChange={(e) => setNewSchool({ ...newSchool, adminFullName: e.target.value })}
                    />
                  </div>

                  <div className="ed-input-group">
                    <label className="ed-label">Admin Email Address *</label>
                    <input
                      required
                      type="email"
                      className="ed-input"
                      placeholder="principal@school.edu"
                      value={newSchool.adminEmail}
                      onChange={(e) => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div className="ed-input-group">
                    <label className="ed-label">Admin Phone Number</label>
                    <input
                      type="tel"
                      className="ed-input"
                      placeholder="+91 80 4000 1199"
                      value={newSchool.adminPhone}
                      onChange={(e) => setNewSchool({ ...newSchool, adminPhone: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="sendInvitationCheck"
                      checked={newSchool.sendInvitation}
                      onChange={(e) => setNewSchool({ ...newSchool, sendInvitation: e.target.checked })}
                      style={{ cursor: 'pointer', marginTop: '2px' }}
                    />
                    <label htmlFor="sendInvitationCheck" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                      Send invitation email with secure activation link immediately
                    </label>
                  </div>
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

              {/* School Administrator Summary */}
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={16} style={{ color: 'var(--primary-600)' }} />
                    <span>School Administrator Account</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenInvitationsModal(selectedSchool);
                    }}
                    className="ed-btn ed-btn-outline"
                    style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Mail size={12} />
                    <span>Manage Invitations</span>
                  </button>
                </div>

                {selectedSchool.schoolAdmin ? (
                  <div style={{ fontSize: '0.82rem', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div><strong>Name:</strong> {selectedSchool.schoolAdmin.name || 'Admin'}</div>
                    <div style={{ marginTop: '2px' }}><strong>Email:</strong> {selectedSchool.schoolAdmin.email}</div>
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>Status:</strong>
                      {renderInvitationBadge(
                        selectedSchool.invitationStatus ||
                          selectedSchool.schoolAdmin.invitationStatus ||
                          (selectedSchool.schoolAdmin.isActive ? 'ACCEPTED' : 'PENDING')
                      )}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          handleOpenSuperAdminReset(selectedSchool.schoolAdmin);
                        }}
                        className="ed-btn ed-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <KeyRound size={12} />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                    No administrator assigned yet. Click "Manage Invitations" to invite a school administrator.
                  </div>
                )}
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

      {/* Send School Admin Invitation Modal */}
      {showInviteModal && selectedSchool && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '480px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Mail size={16} style={{ color: 'var(--primary-600)' }} />
                <span>Invite School Administrator</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvitationSubmit} className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                Target Institution: <strong style={{ color: 'var(--text-primary)' }}>{selectedSchool.name}</strong> ({selectedSchool.code})
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Administrator Full Name *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={newAdminForm.adminFullName}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, adminFullName: e.target.value })}
                />
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Administrator Official Email *</label>
                <input
                  required
                  type="email"
                  className="ed-input"
                  placeholder="admin@school.edu"
                  value={newAdminForm.adminEmail}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, adminEmail: e.target.value })}
                />
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  className="ed-input"
                  placeholder="+91 80 4000 1199"
                  value={newAdminForm.adminPhone}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, adminPhone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="modalSendCheck"
                  checked={newAdminForm.sendInvitation}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, sendInvitation: e.target.checked })}
                  style={{ cursor: 'pointer', marginTop: '2px' }}
                />
                <label htmlFor="modalSendCheck" style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Send branded EduNexa invitation email with single-use expiring activation link
                </label>
              </div>

              <div className="ed-modal-footer" style={{ marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} className="ed-btn ed-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ed-btn ed-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} />
                  <span>{isSubmitting ? 'Sending...' : 'Send Official Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Manage Invitations Modal / Ledger */}
      {showInvitationsModal && selectedSchool && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '680px', width: '92%' }}>
            <div className="ed-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.05rem' }}>
                  <Mail size={18} style={{ color: 'var(--primary-600)' }} />
                  <span>Administrator Invitations & Access Status</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedSchool.name} • Code: {selectedSchool.code}
                </div>
              </div>
              <button onClick={() => setShowInvitationsModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Active tokens and status history for this tenant
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenInviteModal(selectedSchool)}
                  className="ed-btn ed-btn-primary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus size={13} />
                  <span>Issue New Invitation</span>
                </button>
              </div>

              {loadingInvitations ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="ed-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading invitation ledger...</div>
                </div>
              ) : schoolInvitations.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <Mail size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>No invitations on record</div>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Click "Issue New Invitation" above to onboard an administrator for this school.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {schoolInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                            {inv.recipientName}
                          </span>
                          {renderInvitationBadge(inv.status)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {inv.email} • Role: <strong>{inv.role}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Sent: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : '—'} • Expires:{' '}
                          {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'} • Delivery:{' '}
                          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{inv.deliveryStatus || 'SENT'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {inv.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(inv.id)}
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Resend invitation email with fresh token"
                          >
                            <RotateCcw size={12} />
                            <span>Resend</span>
                          </button>
                        )}

                        {inv.status !== 'ACCEPTED' && inv.status !== 'REVOKED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRevokeModal(inv)}
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.74rem', color: 'var(--danger-text)', borderColor: 'var(--danger-border)', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Revoke invitation link"
                          >
                            <Ban size={12} />
                            <span>Revoke</span>
                          </button>
                        )}

                        {inv.status === 'ACCEPTED' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Active
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowInvitationsModal(false);
                                handleOpenSuperAdminReset({ id: inv.userId, email: inv.email, name: inv.recipientName });
                              }}
                              className="ed-btn ed-btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Reset Password & Issue Temporary Credentials"
                            >
                              <KeyRound size={12} />
                              <span>Reset Password</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ed-modal-footer">
              <button type="button" onClick={() => setShowInvitationsModal(false)} className="ed-btn ed-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Invitation Confirmation Modal */}
      {showRevokeModal && selectedInvitation && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '440px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--danger-text)' }}>
                <Ban size={16} />
                <span>Confirm Invitation Revocation</span>
              </div>
              <button onClick={() => setShowRevokeModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Are you sure you want to revoke the administrator invitation for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedInvitation.email}</strong>?
                <br />
                The single-use activation link will be permanently invalidated and cannot be used to activate an account.
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Administrative Revocation Reason</label>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Email address incorrect / Staff role re-assignment"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
            </div>

            <div className="ed-modal-footer">
              <button type="button" onClick={() => setShowRevokeModal(false)} className="ed-btn ed-btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeInvitation}
                disabled={isSubmitting}
                className="ed-btn ed-btn-danger"
              >
                {isSubmitting ? 'Revoking...' : 'Revoke Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Dialog */}
      {confirmDialog && (
        <BulkActionConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          count={selection.isAllMatching ? schools.length : selection.selectedCount}
          entityName="school tenants"
          isLoading={bulkActionLoading !== null}
          onConfirm={() => handleBulkAction(confirmDialog.action as any)}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* Super Admin Reset Password Modal */}
      {resetModalOpen && resetTargetUser && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '480px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.05rem' }}>
                <KeyRound size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Reset Administrator Password</span>
              </div>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetTargetUser(null);
                  setSuperAdminResetResult(null);
                }}
                className="ed-btn-icon"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {superAdminResetResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-text)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <CheckCircle2 size={16} />
                      <span>Password Reset & Persisted</span>
                    </div>
                    <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                      New temporary credentials generated for <strong>{superAdminResetResult.email}</strong>. The user must update their password upon next sign-in.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {superAdminResetResult.temporaryPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(superAdminResetResult.temporaryPassword);
                          setSuperAdminCopied(true);
                          setTimeout(() => setSuperAdminCopied(false), 2000);
                        }}
                        className="ed-btn ed-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {superAdminCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{superAdminCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalOpen(false);
                        setResetTargetUser(null);
                        setSuperAdminResetResult(null);
                      }}
                      className="ed-btn ed-btn-primary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Reset password for <strong>{resetTargetUser.name || resetTargetUser.email}</strong> ({resetTargetUser.email}).
                    Active sessions will be invalidated and the account will be unlocked.
                  </div>

                  <div className="ed-input-group">
                    <label className="ed-label">Temporary Password (Leave blank to auto-generate)</label>
                    <input
                      type="text"
                      className="ed-input"
                      placeholder="Leave empty for secure random password..."
                      value={superAdminTempPassword}
                      onChange={(e) => setSuperAdminTempPassword(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalOpen(false);
                        setResetTargetUser(null);
                      }}
                      className="ed-btn ed-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleExecuteSuperAdminReset}
                      className="ed-btn ed-btn-primary"
                    >
                      {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid, #10b981)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
