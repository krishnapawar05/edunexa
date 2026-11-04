import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge, BadgeVariant } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  useBulkSelection,
  SelectAllCheckbox,
  RowCheckbox,
  BulkActionToolbar,
  BulkActionConfirmationDialog,
  BulkActionItem,
} from '../../components/bulk/index.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import {
  listTenantAccountsApi,
  adminResetPasswordApi,
  adminUnlockAccountApi,
  updateUserAccountStatusApi,
  bulkUserAccountActionsApi,
  TenantAccountUser,
} from '../../services/api.js';

export const UserManagementPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [users, setUsers] = useState<TenantAccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reset Password Modal State
  const [resetCandidate, setResetCandidate] = useState<TenantAccountUser | null>(null);
  const [resetMode, setResetMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualPassword, setManualPassword] = useState('');
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [resetReason, setResetReason] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string;
    email: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Unlock Modal State
  const [unlockCandidate, setUnlockCandidate] = useState<TenantAccountUser | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Status Toggle Modal State
  const [statusCandidate, setStatusCandidate] = useState<TenantAccountUser | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Select Hook
  const selection = useBulkSelection();
  const currentPageIds = useMemo(() => users.map((u) => u.id), [users]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listTenantAccountsApi({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Bulk Actions Handlers
  const [bulkActionCandidate, setBulkActionCandidate] = useState<{
    action: 'ACTIVATE' | 'DEACTIVATE' | 'UNLOCK' | 'RESET_PASSWORD';
    actionName: string;
    message: string;
    isDestructive: boolean;
  } | null>(null);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  const handleBulkExecute = async () => {
    if (!bulkActionCandidate) return;
    try {
      setIsBulkExecuting(true);
      const selectedIdsList = selection.getSelectedList();
      const res = await bulkUserAccountActionsApi(
        selectedIdsList,
        bulkActionCandidate.action,
        `Bulk operation by school admin`
      );
      showToast(
        `Successfully processed ${res.processedCount} account(s).${res.failedCount > 0 ? ` (${res.failedCount} failed)` : ''}`
      );
      selection.clearSelection();
      setBulkActionCandidate(null);
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Bulk operation failed.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Single Reset Password Execution
  const handleExecuteResetPassword = async () => {
    if (!resetCandidate) return;
    try {
      setIsResetting(true);
      const res = await adminResetPasswordApi(resetCandidate.id, {
        temporaryPassword: resetMode === 'MANUAL' ? manualPassword : undefined,
        mustChangePassword,
        reason: resetReason || 'Password reset by school administrator',
      });

      setResetResult({
        temporaryPassword: res.temporaryPassword,
        email: resetCandidate.email,
        name: resetCandidate.name,
      });
      showToast(`Password successfully reset for ${resetCandidate.name}.`);
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  // Single Unlock Execution
  const handleExecuteUnlock = async () => {
    if (!unlockCandidate) return;
    try {
      setIsUnlocking(true);
      await adminUnlockAccountApi(unlockCandidate.id, 'Unlocked by school administrator');
      showToast(`Account unlocked for ${unlockCandidate.name}.`);
      setUnlockCandidate(null);
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlock account.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Single Status Toggle Execution
  const handleExecuteStatusToggle = async () => {
    if (!statusCandidate) return;
    try {
      setIsTogglingStatus(true);
      const newStatus = !statusCandidate.isActive;
      await updateUserAccountStatusApi(
        statusCandidate.id,
        newStatus,
        newStatus ? 'Reactivated by school administrator' : 'Suspended by school administrator'
      );
      showToast(`Account for ${statusCandidate.name} has been ${newStatus ? 'activated' : 'deactivated'}.`);
      setStatusCandidate(null);
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update account status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadgeVariant = (role: string): BadgeVariant => {
    switch (role) {
      case 'PRINCIPAL':
        return 'warning';
      case 'TEACHER':
        return 'info';
      case 'STUDENT':
        return 'success';
      case 'PARENT':
        return 'warning';
      case 'HR_STAFF':
        return 'teal';
      case 'ACCOUNTS':
        return 'info';
      case 'EXAM_COORDINATOR':
        return 'warning';
      case 'SCHOOL_ADMIN':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'SCHOOL_ADMIN':
        return 'School Admin';
      case 'PRINCIPAL':
        return 'Principal';
      case 'TEACHER':
        return 'Teacher';
      case 'STUDENT':
        return 'Student';
      case 'PARENT':
        return 'Parent / Guardian';
      case 'HR_STAFF':
        return 'HR Admin';
      case 'ACCOUNTS':
        return 'Accounts Staff';
      case 'EXAM_COORDINATOR':
        return 'Exam Coordinator';
      default:
        return role;
    }
  };

  const bulkActionItems: BulkActionItem[] = [
    {
      id: 'bulk-activate',
      label: 'Activate Accounts',
      icon: <UserCheck size={16} />,
      onClick: () =>
        setBulkActionCandidate({
          action: 'ACTIVATE',
          actionName: 'Activate Selected Accounts',
          message: 'Are you sure you want to activate all selected accounts? Users will regain system access.',
          isDestructive: false,
        }),
    },
    {
      id: 'bulk-deactivate',
      label: 'Deactivate Accounts',
      icon: <UserX size={16} />,
      isDestructive: true,
      onClick: () =>
        setBulkActionCandidate({
          action: 'DEACTIVATE',
          actionName: 'Deactivate Selected Accounts',
          message: 'Are you sure you want to suspend all selected accounts? Users will immediately lose system access.',
          isDestructive: true,
        }),
    },
    {
      id: 'bulk-unlock',
      label: 'Unlock Accounts',
      icon: <Unlock size={16} />,
      onClick: () =>
        setBulkActionCandidate({
          action: 'UNLOCK',
          actionName: 'Unlock Selected Accounts',
          message: 'Are you sure you want to unlock all selected accounts? Failed attempt counters will be cleared.',
          isDestructive: false,
        }),
    },
    {
      id: 'bulk-reset-pass',
      label: 'Reset Passwords',
      icon: <KeyRound size={16} />,
      isDestructive: true,
      onClick: () =>
        setBulkActionCandidate({
          action: 'RESET_PASSWORD',
          actionName: 'Reset Passwords & Generate Temporary Credentials',
          message: 'Are you sure you want to reset passwords for all selected accounts? Prior active sessions will be invalidated and temporary credentials generated.',
          isDestructive: true,
        }),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--text-primary, #0f172a)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.2))',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-50, #f0fdf4)',
                color: 'var(--primary-700, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--primary-200, #bbf7d0)',
              }}
            >
              <Users size={22} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
              User & Access Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
            {branding?.schoolName || 'School ERP'} • Manage student, teacher, staff, and guardian accounts, credentials, and account recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '260px', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #94a3b8)',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid var(--border-default, #cbd5e1)',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-secondary, #64748b)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default, #cbd5e1)',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
              <option value="PRINCIPAL">Principal</option>
              <option value="HR_STAFF">HR Staff</option>
              <option value="EXAM_COORDINATOR">Exam Coordinator</option>
              <option value="ACCOUNTS">Accounts Staff</option>
              <option value="PARENT">Parents / Guardians</option>
              <option value="SCHOOL_ADMIN">School Admin</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default, #cbd5e1)',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive / Suspended</option>
              <option value="LOCKED">Locked</option>
              <option value="MUST_CHANGE_PASSWORD">Must Change Password</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Select Bulk Actions Toolbar */}
      <BulkActionToolbar
        selection={selection}
        actions={bulkActionItems}
        totalMatchingCount={totalCount}
        currentPageIds={currentPageIds}
        entityName="user accounts"
      />

      {/* Data Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}
      >
        {loading && users.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Loading institutional accounts...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#dc2626' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Failed to retrieve account records</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px' }}>{error}</p>
            <Button variant="outline" size="sm" onClick={loadUsers}>
              Retry Query
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <Users size={36} color="var(--text-secondary, #94a3b8)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', margin: '0 0 6px' }}>
              No Accounts Found
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              No institutional user accounts match the current filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                    borderBottom: '1px solid var(--border-default, #e2e8f0)',
                    color: 'var(--text-secondary, #64748b)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '40px' }}>
                    <SelectAllCheckbox
                      pageIds={currentPageIds}
                      selection={selection}
                      title="Select all accounts on current page"
                    />
                  </th>
                  <th style={{ padding: '12px 16px' }}>User / Identity</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Account Status</th>
                  <th style={{ padding: '12px 16px' }}>Security & Credentials</th>
                  <th style={{ padding: '12px 16px' }}>Timestamps</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => {
                  const isSelected = selection.isSelected(account.id);
                  const isLocked = account.accountLocked;
                  return (
                    <tr
                      key={account.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                        backgroundColor: isSelected ? 'var(--primary-50, #f0fdf4)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '12px 16px' }}>
                        <RowCheckbox
                          id={account.id}
                          checked={isSelected}
                          onToggle={selection.toggleSelect}
                          title={`Select account for ${account.name}`}
                        />
                      </td>

                      {/* User Info */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-100, #dcfce7)',
                              color: 'var(--primary-800, #166534)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '13px',
                              flexShrink: 0,
                            }}
                          >
                            {account.firstName?.[0] || 'U'}
                            {account.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                              {account.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                              {account.email}
                            </div>
                            {account.username && account.username !== account.email && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)' }}>
                                @{account.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={getRoleBadgeVariant(account.role)}>
                          {formatRoleLabel(account.role)}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {isLocked ? (
                            <Badge variant="warning">
                              <Lock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Locked
                            </Badge>
                          ) : account.isActive ? (
                            <Badge variant="success">
                              <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Active
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              <UserX size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Suspended
                            </Badge>
                          )}
                          {account.failedLoginAttempts > 0 && (
                            <span style={{ fontSize: '11px', color: '#b45309' }}>
                              {account.failedLoginAttempts} failed attempt{account.failedLoginAttempts > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Security & Credentials */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {account.mustChangePassword ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#b45309',
                                backgroundColor: '#fef3c7',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                width: 'fit-content',
                              }}
                            >
                              Must Change Password
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={14} /> Password Configured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamps */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {account.passwordResetAt && (
                            <div>Reset: {new Date(account.passwordResetAt).toLocaleDateString()}</div>
                          )}
                          {account.passwordChangedAt && (
                            <div>Changed: {new Date(account.passwordChangedAt).toLocaleDateString()}</div>
                          )}
                          {!account.passwordResetAt && !account.passwordChangedAt && (
                            <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>No recent reset</div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {/* Reset Password */}
                          <button
                            title="Reset Password"
                            onClick={() => {
                              setResetCandidate(account);
                              setResetMode('AUTO');
                              setManualPassword('');
                              setMustChangePassword(true);
                              setResetReason('');
                              setResetResult(null);
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--primary-50, #f0fdf4)',
                              border: '1px solid var(--primary-200, #bbf7d0)',
                              color: 'var(--primary-800, #166534)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            <KeyRound size={14} /> Reset
                          </button>

                          {/* Unlock if locked */}
                          {isLocked && (
                            <button
                              title="Unlock Account"
                              onClick={() => setUnlockCandidate(account)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <Unlock size={14} /> Unlock
                            </button>
                          )}

                          {/* Activate / Deactivate Toggle */}
                          <button
                            title={account.isActive ? 'Suspend Account' : 'Reactivate Account'}
                            onClick={() => setStatusCandidate(account)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: account.isActive ? '#fef2f2' : '#f0fdf4',
                              border: `1px solid ${account.isActive ? '#fecaca' : '#bbf7d0'}`,
                              color: account.isActive ? '#991b1b' : '#166534',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {account.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            {account.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--border-default, #e2e8f0)',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary, #64748b)',
            }}
          >
            <div>
              Showing {users.length} of {totalCount} total account{totalCount !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetCandidate && (
        <Modal
          isOpen={Boolean(resetCandidate)}
          onClose={() => {
            setResetCandidate(null);
            setResetResult(null);
          }}
          title={resetResult ? 'Temporary Credentials Generated' : `Reset Password: ${resetCandidate.name}`}
        >
          {resetResult ? (
            <div style={{ padding: '8px 0' }}>
              <div
                style={{
                  backgroundColor: 'var(--primary-50, #f0fdf4)',
                  border: '1px solid var(--primary-200, #bbf7d0)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <span style={{ fontWeight: 600, color: 'var(--primary-900, #14532d)' }}>
                    Password Reset & Persisted to Database
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--primary-800, #166534)', margin: '0 0 12px' }}>
                  The password has been securely updated. Hand these temporary credentials to the user. The user will be required to choose a new private password immediately upon their next login.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Temporary Password
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary, #0f172a)' }}>
                      {resetResult.temporaryPassword}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCredentials(resetResult.temporaryPassword)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: copied ? '#22c55e' : 'var(--primary-800, #166534)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    setResetCandidate(null);
                    setResetResult(null);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Target Account: </span>
                  <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{resetCandidate.name}</strong> ({resetCandidate.email})
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Role: </span>
                  <Badge variant={getRoleBadgeVariant(resetCandidate.role)}>
                    {formatRoleLabel(resetCandidate.role)}
                  </Badge>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '8px' }}>
                  Temporary Password Strategy
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setResetMode('AUTO')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: resetMode === 'AUTO' ? '2px solid var(--primary-700, #15803d)' : '1px solid var(--border-default, #cbd5e1)',
                      backgroundColor: resetMode === 'AUTO' ? 'var(--primary-50, #f0fdf4)' : 'var(--bg-primary, #ffffff)',
                      color: resetMode === 'AUTO' ? 'var(--primary-900, #14532d)' : 'var(--text-primary, #0f172a)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={16} /> Auto-Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetMode('MANUAL')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: resetMode === 'MANUAL' ? '2px solid var(--primary-700, #15803d)' : '1px solid var(--border-default, #cbd5e1)',
                      backgroundColor: resetMode === 'MANUAL' ? 'var(--primary-50, #f0fdf4)' : 'var(--bg-primary, #ffffff)',
                      color: resetMode === 'MANUAL' ? 'var(--primary-900, #14532d)' : 'var(--text-primary, #0f172a)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <KeyRound size={16} /> Enter Manually
                  </button>
                </div>
              </div>

              {resetMode === 'MANUAL' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                    Enter Temporary Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showManualPassword ? 'text' : 'password'}
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default, #cbd5e1)',
                        backgroundColor: 'var(--bg-primary, #ffffff)',
                        color: 'var(--text-primary, #0f172a)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowManualPassword(!showManualPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary, #64748b)',
                        cursor: 'pointer',
                      }}
                    >
                      {showManualPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Force Password Change Option */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <input
                  type="checkbox"
                  id="mustChangePasswordCheckbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="mustChangePasswordCheckbox" style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary, #0f172a)' }}>
                  <strong>Require password change on next login</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                    Ensures institutional policy compliance by forcing the user to create a private secret upon logging in with the temporary credentials.
                  </div>
                </label>
              </div>

              {/* Optional Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                  Administrative Reason (Audit Trail)
                </label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="e.g., User requested recovery, forgot credentials, onboarding"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    backgroundColor: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setResetCandidate(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteResetPassword}
                  disabled={isResetting || (resetMode === 'MANUAL' && !manualPassword)}
                >
                  {isResetting ? 'Resetting Password...' : 'Reset & Save Password'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Unlock Confirmation Modal */}
      {unlockCandidate && (
        <Modal
          isOpen={Boolean(unlockCandidate)}
          onClose={() => setUnlockCandidate(null)}
          title={`Unlock Account: ${unlockCandidate.name}`}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px' }}>
              Are you sure you want to unlock the account for <strong>{unlockCandidate.name}</strong> ({unlockCandidate.email})?
              This will clear the lockout timer and reset failed authentication attempts to zero.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setUnlockCandidate(null)}>
                Cancel
              </Button>
              <Button onClick={handleExecuteUnlock} disabled={isUnlocking}>
                {isUnlocking ? 'Unlocking...' : 'Unlock Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Toggle Modal */}
      {statusCandidate && (
        <Modal
          isOpen={Boolean(statusCandidate)}
          onClose={() => setStatusCandidate(null)}
          title={`${statusCandidate.isActive ? 'Suspend' : 'Reactivate'} Account: ${statusCandidate.name}`}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px' }}>
              Are you sure you want to {statusCandidate.isActive ? 'suspend' : 'reactivate'} the account for <strong>{statusCandidate.name}</strong> ({statusCandidate.email})?
              {statusCandidate.isActive
                ? ' The user will immediately be blocked from logging into the portal.'
                : ' The user will regain access to their institutional dashboard.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setStatusCandidate(null)}>
                Cancel
              </Button>
              <Button
                variant={statusCandidate.isActive ? 'danger' : 'primary'}
                onClick={handleExecuteStatusToggle}
                disabled={isTogglingStatus}
              >
                {isTogglingStatus ? 'Processing...' : statusCandidate.isActive ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Action Confirmation Dialog */}
      {bulkActionCandidate && (
        <BulkActionConfirmationDialog
          isOpen={Boolean(bulkActionCandidate)}
          title={bulkActionCandidate.actionName}
          message={bulkActionCandidate.message}
          count={selection.selectedCount}
          entityName="accounts"
          variant={bulkActionCandidate.isDestructive ? 'danger' : 'primary'}
          isLoading={isBulkExecuting}
          onConfirm={handleBulkExecute}
          onClose={() => setBulkActionCandidate(null)}
        />
      )}
    </div>
  );
};
