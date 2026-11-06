import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  Award,
  CreditCard,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Building,
  Calendar,
  Clock,
  Layers,
  Settings,
  HardDrive,
  Check,
  Eye,
  Sliders,
} from 'lucide-react';
import { governanceApi } from '../../services/api';

type HubTab = 'admissions' | 'marksheets' | 'templates' | 'backups' | 'settings';

export const SuperAdminGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('admissions');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 1: Admissions
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [admissionFilter, setAdmissionFilter] = useState({
    status: '',
    search: '',
  });

  // Tab 2: Marksheets
  const [marksheets, setMarksheets] = useState<any[]>([]);
  const [marksheetFilter, setMarksheetFilter] = useState({ status: '' });
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'PUBLISHED' | 'REJECTED'>('APPROVED');
  const [isReviewing, setIsReviewing] = useState(false);

  // Tab 3: Templates
  const [templates, setTemplates] = useState<{ idCards: any[]; certificates: any[] }>({
    idCards: [],
    certificates: [],
  });

  // Tab 4: Backups
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupType, setBackupType] = useState<string>('FULL_DATABASE');
  const [initiatingBackup, setInitiatingBackup] = useState(false);

  // Tab 5: System Settings
  const [systemConfig, setSystemConfig] = useState<any>({
    platformName: 'EduNexa Platform Governance',
    supportEmail: 'admin@edunexa.com',
    maintenanceMode: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    enforcePasswordChangeDays: 90,
    allowSelfRegistration: false,
    globalAnnouncements: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Loaders
  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.listAdmissionEnquiries({
        status: admissionFilter.status || undefined,
        search: admissionFilter.search || undefined,
      });
      setAdmissions(res?.enquiries || res || []);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load admission enquiries' });
    } finally {
      setLoading(false);
    }
  };

  const loadMarksheets = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.listMarksheetRequests({
        status: marksheetFilter.status || undefined,
      });
      setMarksheets(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load marksheet requests' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.listTemplates();
      if (res) setTemplates(res);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load institutional templates' });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.listBackups();
      setBackups(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load backup records' });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await governanceApi.getSystemConfig();
      if (res) setSystemConfig(res);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load platform settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admissions') loadAdmissions();
    else if (activeTab === 'marksheets') loadMarksheets();
    else if (activeTab === 'templates') loadTemplates();
    else if (activeTab === 'backups') loadBackups();
    else if (activeTab === 'settings') loadSettings();
  }, [activeTab, admissionFilter.status, marksheetFilter.status]);

  const handleReviewMarksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsReviewing(true);
    try {
      await governanceApi.reviewMarksheetRequest(selectedRequest.id, {
        status: reviewAction,
        reviewNotes,
      });
      setFeedback({ type: 'success', text: `Marksheet publication status updated to ${reviewAction}` });
      setSelectedRequest(null);
      setReviewNotes('');
      loadMarksheets();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update marksheet request' });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreateBackup = async () => {
    setInitiatingBackup(true);
    try {
      const res = await governanceApi.initiateBackup({
        backupType: backupType as any,
        metadata: { trigger: 'MANUAL_SUPERADMIN', label: `${backupType} Snapshot` },
      });
      setFeedback({
        type: 'success',
        text: `Backup initiated successfully: ${res?.fileName || 'Snapshot'} (SHA-256: ${(res?.checksum || '').slice(0, 12)}...)`,
      });
      setIsBackupModalOpen(false);
      loadBackups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to initiate backup' });
    } finally {
      setInitiatingBackup(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await governanceApi.updateSystemConfig({
        platformName: systemConfig.platformName,
        supportEmail: systemConfig.supportEmail,
        maintenanceMode: systemConfig.maintenanceMode,
        sessionTimeoutMinutes: Number(systemConfig.sessionTimeoutMinutes),
        maxLoginAttempts: Number(systemConfig.maxLoginAttempts),
        lockoutDurationMinutes: Number(systemConfig.lockoutDurationMinutes),
        enforcePasswordChangeDays: Number(systemConfig.enforcePasswordChangeDays),
        allowSelfRegistration: systemConfig.allowSelfRegistration,
        globalAnnouncements: systemConfig.globalAnnouncements,
      });
      setFeedback({ type: 'success', text: 'Platform system settings successfully saved in database.' });
      if (res) setSystemConfig(res);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save system settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Platform Governance & Centralized Hub</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Institutional oversight across Admission Enquiries, Marksheet Publication Approvals, ID/Certificate Templates, Platform Backups, and System Settings.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'admissions') loadAdmissions();
            else if (activeTab === 'marksheets') loadMarksheets();
            else if (activeTab === 'templates') loadTemplates();
            else if (activeTab === 'backups') loadBackups();
            else if (activeTab === 'settings') loadSettings();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh View
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'admissions'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Admission Enquiries</span>
        </button>

        <button
          onClick={() => setActiveTab('marksheets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'marksheets'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Marksheet Publication</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>ID Cards & Certificates</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'backups'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backups & Snapshots</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Platform System Settings</span>
        </button>
      </div>

      {/* TAB 1: ADMISSION ENQUIRIES */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, parent, email..."
                  value={admissionFilter.search}
                  onChange={(e) => setAdmissionFilter({ ...admissionFilter, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadAdmissions()}
                  className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={admissionFilter.status}
                onChange={(e) => setAdmissionFilter({ ...admissionFilter, status: e.target.value })}
                className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="CONVERTED">Converted</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <button
                onClick={loadAdmissions}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>

            <span className="text-xs text-gray-500 font-medium">
              Showing {admissions.length} Enquiries Across All School Tenants
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-sm">Loading enquiries...</p>
              </div>
            ) : admissions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-sm">No admission enquiries recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                      <th className="py-3 px-4">Student & Parent</th>
                      <th className="py-3 px-4">School Tenant</th>
                      <th className="py-3 px-4">Applying Class</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Lead Source</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {admissions.map((enq) => (
                      <tr key={enq.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{enq.studentName}</div>
                          <div className="text-gray-500 text-[11px]">Parent: {enq.parentName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {enq.school?.name || 'Primary'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {enq.applyingClass || 'Not Specified'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-800">{enq.phone}</div>
                          {enq.email && <div className="text-gray-400 text-[11px]">{enq.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {enq.leadSource || 'WEBSITE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              enq.status === 'NEW'
                                ? 'bg-blue-100 text-blue-800'
                                : enq.status === 'CONVERTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : enq.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARKSHEET PUBLICATION APPROVALS */}
      {activeTab === 'marksheets' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={marksheetFilter.status}
                onChange={(e) => setMarksheetFilter({ status: e.target.value })}
                className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium text-gray-700"
              >
                <option value="">All Verification Statuses</option>
                <option value="PENDING">Pending Super Admin Review</option>
                <option value="APPROVED">Approved for Publication</option>
                <option value="PUBLISHED">Published (Live to Students)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Centralized Academic Integrity & Marksheet Publication Control
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-sm">Loading publication requests...</p>
              </div>
            ) : marksheets.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-sm">No marksheet publication requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                      <th className="py-3 px-4">Exam Term & Year</th>
                      <th className="py-3 px-4">School Tenant</th>
                      <th className="py-3 px-4">Target Class</th>
                      <th className="py-3 px-4">Total Students</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Publication Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {marksheets.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{req.termName}</div>
                          <div className="text-gray-400 text-[11px]">{req.academicYear}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-700">
                          {req.school?.name || 'Primary School'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-purple-700">{req.className}</td>
                        <td className="py-3 px-4 font-medium">{req.totalStudents}</td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setReviewAction(req.status === 'PENDING' ? 'APPROVED' : req.status);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                          >
                            Review & Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Review Marksheet Publication</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <div>
                <span className="font-semibold">Term:</span> {selectedRequest.termName} (
                {selectedRequest.academicYear})
              </div>
              <div>
                <span className="font-semibold">Class:</span> {selectedRequest.className} |{' '}
                <span className="font-semibold">Students:</span> {selectedRequest.totalStudents}
              </div>
              <div>
                <span className="font-semibold">School:</span> {selectedRequest.school?.name}
              </div>
            </div>

            <form onSubmit={handleReviewMarksheet} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Decision / Target Status</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium text-gray-800"
                >
                  <option value="APPROVED">APPROVE (Allow coordinator to publish)</option>
                  <option value="PUBLISHED">PUBLISH IMMEDIATELY (Live to parents/students)</option>
                  <option value="REJECTED">REJECT (Send back with corrective feedback)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Administrative Review Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Marks verified with moderation committee. Approved for formal release."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
                >
                  {isReviewing ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES OVERSIGHT */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID Card Templates */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">Virtual ID Card Templates</h3>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                {templates.idCards.length} Templates
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : templates.idCards.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No ID Card templates registered.</p>
            ) : (
              <div className="space-y-2">
                {templates.idCards.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {t.school?.name} • Orientation: {t.orientation || 'VERTICAL'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificate Templates */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Certificate Templates</h3>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {templates.certificates.length} Templates
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : templates.certificates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No Certificate templates registered.</p>
            ) : (
              <div className="space-y-2">
                {templates.certificates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{c.title || c.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {c.school?.name} • Type: {c.type || 'MERIT'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BACKUPS */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Platform Disaster Recovery & Backups</h2>
              <p className="text-xs text-gray-500">
                Generate tamper-evident snapshots verified with cryptographic SHA-256 checksums.
              </p>
            </div>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm"
            >
              <HardDrive className="w-4 h-4" />
              Initiate New Backup
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-sm">Loading backup records...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-sm">No backups generated yet. Click "Initiate New Backup" to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                      <th className="py-3 px-4">File Name & Scope</th>
                      <th className="py-3 px-4">Backup Type</th>
                      <th className="py-3 px-4">File Size</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">SHA-256 Checksum</th>
                      <th className="py-3 px-4">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {backups.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{b.fileName}</div>
                          <div className="text-[11px] text-gray-400">{b.storagePath}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-purple-700">{b.backupType}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {(b.fileSizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {b.checksum ? `${b.checksum.slice(0, 16)}...` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {b.completedAt ? new Date(b.completedAt).toLocaleString() : 'In Progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Initiate Platform Backup</h3>
            <p className="text-xs text-gray-500">
              Select backup scope. The backup process will extract tenant records, calculate a cryptographic hash, and save metadata.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Backup Type</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="FULL_DATABASE">Full Database Snapshot (All Entities)</option>
                  <option value="SCHOOL_TENANT">School Tenant Data</option>
                  <option value="SYSTEM_LOGS">System Audit Logs & Telemetry</option>
                  <option value="DOCUMENTS_CONFIG">Documents & Certificate Templates</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={initiatingBackup}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
              >
                {initiatingBackup ? 'Creating Snapshot...' : 'Run Backup Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900">Platform System Configuration</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Saved in PostgreSQL PlatformSystemConfig model with immediate global effect.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={systemConfig.platformName || ''}
                  onChange={(e) => setSystemConfig({ ...systemConfig, platformName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Global Support Email</label>
                <input
                  type="email"
                  value={systemConfig.supportEmail || ''}
                  onChange={(e) => setSystemConfig({ ...systemConfig, supportEmail: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={systemConfig.sessionTimeoutMinutes || 60}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, sessionTimeoutMinutes: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Max Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={systemConfig.maxLoginAttempts || 5}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, maxLoginAttempts: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Lockout Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={systemConfig.lockoutDurationMinutes || 15}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, lockoutDurationMinutes: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Enforce Password Change (Days)
                </label>
                <input
                  type="number"
                  value={systemConfig.enforcePasswordChangeDays || 90}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, enforcePasswordChangeDays: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.maintenanceMode || false}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="font-semibold text-rose-600">
                  Enable Maintenance Mode (Restricts access to Super Admins only)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.allowSelfRegistration || false}
                  onChange={(e) =>
                    setSystemConfig({ ...systemConfig, allowSelfRegistration: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-gray-700">Allow Public Self-Registration for Parent Accounts</span>
              </label>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Global Platform Announcement Banner
              </label>
              <textarea
                rows={2}
                value={systemConfig.globalAnnouncements || ''}
                onChange={(e) =>
                  setSystemConfig({ ...systemConfig, globalAnnouncements: e.target.value })
                }
                placeholder="Message displayed across all portals (leave empty if none)..."
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
              />
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                {savingSettings ? 'Saving...' : 'Save System Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default SuperAdminGovernanceHubPage;
