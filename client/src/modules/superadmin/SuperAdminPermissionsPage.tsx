import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  Building,
} from 'lucide-react';
import { governanceApi, superadminApi } from '../../services/api.js';

const ALL_ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'SCHOOL_ADMIN', label: 'School Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'PRINCIPAL', label: 'Principal', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { key: 'TEACHER', label: 'Teacher', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'STUDENT', label: 'Student', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { key: 'PARENT', label: 'Parent / Guardian', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { key: 'EXAM_COORDINATOR', label: 'Exam Coordinator', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { key: 'ACCOUNTANT', label: 'Accountant', color: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'LIBRARIAN', label: 'Librarian', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { key: 'TRANSPORT_MANAGER', label: 'Transport Manager', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const PERMISSION_ACTIONS = [
  { key: 'canView', label: 'View', desc: 'Read-only access' },
  { key: 'canCreate', label: 'Create', desc: 'Add new entities' },
  { key: 'canEdit', label: 'Edit', desc: 'Update existing records' },
  { key: 'canDelete', label: 'Delete', desc: 'Remove records' },
  { key: 'canApprove', label: 'Approve', desc: 'Workflow approvals' },
  { key: 'canPublish', label: 'Publish', desc: 'Make public or visible to users' },
  { key: 'canExport', label: 'Export', desc: 'Download CSV / PDF reports' },
  { key: 'canManage', label: 'Manage', desc: 'Full administration' },
] as const;

export const SuperAdminPermissionsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('SCHOOL_ADMIN');
  const [targetSchoolId, setTargetSchoolId] = useState<string>('');
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    superadminApi.listSchools({ query: '' }).then((data) => {
      setSchools(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await governanceApi.listPermissions({
        role: selectedRole,
        schoolId: targetSchoolId || undefined,
      });
      setPermissions(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load permissions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [selectedRole, targetSchoolId]);

  const handleTogglePermission = async (moduleKey: string, field: string, currentValue: boolean) => {
    const permRecord = permissions.find((p) => p.moduleKey === moduleKey);
    const updatedValues = {
      schoolId: targetSchoolId || undefined,
      role: selectedRole,
      moduleKey,
      canView: permRecord?.canView ?? false,
      canCreate: permRecord?.canCreate ?? false,
      canEdit: permRecord?.canEdit ?? false,
      canDelete: permRecord?.canDelete ?? false,
      canApprove: permRecord?.canApprove ?? false,
      canPublish: permRecord?.canPublish ?? false,
      canExport: permRecord?.canExport ?? false,
      canManage: permRecord?.canManage ?? false,
      [field]: !currentValue,
    };

    setSavingKey(`${moduleKey}-${field}`);
    try {
      const res = await governanceApi.updatePermission(updatedValues);
      setPermissions((prev) =>
        prev.map((p) => (p.moduleKey === moduleKey ? { ...p, ...res } : p))
      );
      setFeedback({ type: 'success', text: `Updated ${field} for ${moduleKey.replace(/_/g, ' ')}` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update permission' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleAllForModule = async (moduleKey: string, enableAll: boolean) => {
    const updatedValues = {
      schoolId: targetSchoolId || undefined,
      role: selectedRole,
      moduleKey,
      canView: enableAll,
      canCreate: enableAll,
      canEdit: enableAll,
      canDelete: enableAll,
      canApprove: enableAll,
      canPublish: enableAll,
      canExport: enableAll,
      canManage: enableAll,
    };

    setSavingKey(`${moduleKey}-all`);
    try {
      const res = await governanceApi.updatePermission(updatedValues);
      setPermissions((prev) =>
        prev.map((p) => (p.moduleKey === moduleKey ? { ...p, ...res } : p))
      );
      setFeedback({
        type: 'success',
        text: `${enableAll ? 'Granted all' : 'Revoked all'} permissions for ${moduleKey.replace(/_/g, ' ')}`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update permissions' });
    } finally {
      setSavingKey(null);
    }
  };

  const filteredPermissions = permissions.filter((p) =>
    p.moduleKey.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Role & Module Access Matrix (RBAC)</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Configure granular permissions (View, Create, Edit, Delete, Approve, Publish, Export, Manage) across all 22 ERP modules.
          </p>
        </div>
        <button
          onClick={loadPermissions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Permissions
        </button>
      </div>

      {/* Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase hover:underline opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>Select System Role:</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              <span>Scope:</span>
            </div>
            <select
              value={targetSchoolId}
              onChange={(e) => setTargetSchoolId(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Global Platform Baseline (All Tenants)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedRole === role.key
                  ? `${role.color} ring-2 ring-purple-500/20 shadow-sm font-bold`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">
              Access Matrix for <span className="text-purple-600">{selectedRole}</span>
            </h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {filteredPermissions.length} Modules
            </span>
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm">Loading module permissions...</p>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm">No modules found matching your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[200px]">ERP Module</th>
                  {PERMISSION_ACTIONS.map((action) => (
                    <th key={action.key} className="py-3 px-3 text-center min-w-[80px]">
                      <div>{action.label}</div>
                      <div className="text-[10px] text-gray-400 font-normal lowercase">{action.desc}</div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center min-w-[100px]">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPermissions.map((perm) => {
                  const allActive = PERMISSION_ACTIONS.every((a) => Boolean(perm[a.key]));
                  const noneActive = PERMISSION_ACTIONS.every((a) => !perm[a.key]);

                  return (
                    <tr key={perm.moduleKey} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">
                          {perm.moduleKey.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-gray-400">{perm.moduleKey}</div>
                      </td>

                      {PERMISSION_ACTIONS.map((action) => {
                        const isGranted = Boolean(perm[action.key]);
                        const isBusy = savingKey === `${perm.moduleKey}-${action.key}`;

                        return (
                          <td key={action.key} className="py-3 px-3 text-center">
                            <button
                              disabled={isBusy}
                              onClick={() =>
                                handleTogglePermission(perm.moduleKey, action.key, isGranted)
                              }
                              className={`p-1.5 rounded-lg border transition-all ${
                                isGranted
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-gray-50 border-gray-200 text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                              } ${isBusy ? 'opacity-50 animate-pulse' : ''}`}
                              title={`${isGranted ? 'Revoke' : 'Grant'} ${action.label}`}
                            >
                              {isGranted ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            disabled={savingKey === `${perm.moduleKey}-all`}
                            onClick={() => handleToggleAllForModule(perm.moduleKey, true)}
                            className="px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            All
                          </button>
                          <button
                            disabled={savingKey === `${perm.moduleKey}-all`}
                            onClick={() => handleToggleAllForModule(perm.moduleKey, false)}
                            className="px-2 py-1 text-[10px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                          >
                            None
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
      </div>
    </div>
  );
};
export default SuperAdminPermissionsPage;
