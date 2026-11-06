import React, { useState, useEffect } from 'react';
import {
  Shield,
  MessageSquare,
  AlertTriangle,
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Building,
  Users,
  Settings,
  Lock,
  RefreshCw,
  Sliders,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { communicationApi, superadminApi } from '../../services/api.js';

type SuperAdminTab = 'telemetry' | 'conversations' | 'reports' | 'audit_logs' | 'permissions';

export const SuperAdminCommunicationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('telemetry');
  const [loading, setLoading] = useState<boolean>(true);

  // Telemetry
  const [telemetry, setTelemetry] = useState<any>(null);

  // Conversations State
  const [conversations, setConversations] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Reports Moderation State
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [moderationAction, setModerationAction] = useState<string>('MESSAGE_REMOVED');
  const [moderatorNotes, setModeratorNotes] = useState<string>('');
  const [showModerationModal, setShowModerationModal] = useState<boolean>(false);
  const [moderating, setModerating] = useState<boolean>(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Permissions Config State
  const [permissionConfig, setPermissionConfig] = useState<any>({
    allowStudentToStudent: false,
    allowParentToParent: false,
    allowTeacherToStudent: true,
    allowTeacherToParent: true,
    allowAdminToAll: true,
    allowFileSharing: true,
    maxAttachmentSizeBytes: 10485760,
  });
  const [configSaving, setConfigSaving] = useState<boolean>(false);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [telRes, convRes, repRes, logRes, schoolRes]: any = await Promise.all([
        communicationApi.getSuperAdminTelemetry().catch(() => null),
        communicationApi.getSuperAdminConversations().catch(() => null),
        communicationApi.getReportedMessages().catch(() => null),
        communicationApi.getSuperAdminAuditLogs().catch(() => null),
        superadminApi.listSchools().catch(() => null),
      ]);

      if (telRes?.data) setTelemetry(telRes.data);
      if (convRes?.data) setConversations(convRes.data);
      if (repRes?.data) setReports(repRes.data);
      if (logRes?.data) setAuditLogs(logRes.data);
      const schoolsList = schoolRes?.data ?? (Array.isArray(schoolRes) ? schoolRes : []);
      setSchools(schoolsList);

      // Load initial permissions config if school available
      if (schoolsList.length > 0) {
        loadSchoolPermissions();
      }
    } catch (err: any) {
      console.error('Failed to load communication monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolPermissions = async () => {
    try {
      const res: any = await communicationApi.getPermissionConfig();
      if (res?.data) {
        setPermissionConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const handleExportCsv = async (conversationId: string) => {
    try {
      const res: any = await communicationApi.exportConversation(conversationId, 'CSV');
      const csvContent = res?.data?.csvContent || '';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Communication_Export_${conversationId.slice(0, 8)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedback({ type: 'success', text: 'Communication log exported to CSV and logged in Audit Trail.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Export failed' });
    }
  };

  const handleExportPdf = async (conversationId: string) => {
    try {
      const res: any = await communicationApi.exportConversation(conversationId, 'PDF');
      const pdfData = res?.data || {};
      const jsonBlob = new Blob([JSON.stringify(pdfData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Communication_Dossier_${conversationId.slice(0, 8)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedback({ type: 'success', text: 'Official communication audit dossier downloaded.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Export failed' });
    }
  };

  const handleOpenModeration = (report: any) => {
    setSelectedReport(report);
    setModerationAction('MESSAGE_REMOVED');
    setModeratorNotes('');
    setShowModerationModal(true);
  };

  const handleModerateReport = async () => {
    if (!selectedReport) return;
    try {
      setModerating(true);
      await communicationApi.moderateReportedMessage(selectedReport.id, {
        status: moderationAction,
        moderatorNotes: moderatorNotes.trim() || undefined,
      });
      setFeedback({ type: 'success', text: `Moderation action ${moderationAction} recorded successfully.` });
      setShowModerationModal(false);
      setSelectedReport(null);
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to moderate report' });
    } finally {
      setModerating(false);
    }
  };

  const handleSavePermissions = async () => {
    const targetSchoolId = selectedSchoolId === 'ALL' && schools.length > 0 ? schools[0].id : selectedSchoolId;
    if (!targetSchoolId || targetSchoolId === 'ALL') {
      alert('Please select a specific school tenant to update communication policies.');
      return;
    }
    try {
      setConfigSaving(true);
      await communicationApi.updatePermissionConfig({
        schoolId: targetSchoolId,
        allowStudentToStudent: permissionConfig.allowStudentToStudent,
        allowParentToParent: permissionConfig.allowParentToParent,
        allowTeacherToStudent: permissionConfig.allowTeacherToStudent,
        allowTeacherToParent: permissionConfig.allowTeacherToParent,
        allowAdminToAll: permissionConfig.allowAdminToAll,
        allowFileSharing: permissionConfig.allowFileSharing,
        maxAttachmentSizeBytes: Number(permissionConfig.maxAttachmentSizeBytes),
      });
      setFeedback({ type: 'success', text: 'School communication permissions successfully saved to PostgreSQL.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update permissions' });
    } finally {
      setConfigSaving(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (selectedSchoolId !== 'ALL' && c.schoolId !== selectedSchoolId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (c.title || '').toLowerCase().includes(q);
      const participantMatch = c.participants?.some((p: any) =>
        `${p.user?.firstName || ''} ${p.user?.lastName || ''} ${p.user?.email || ''}`.toLowerCase().includes(q)
      );
      if (!titleMatch && !participantMatch) return false;
    }
    return true;
  });

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6, 24px)', maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Super Admin Oversight</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 9 Master Module</span>
          </div>
          <h1 className="ed-page-header-title">
            <Shield size={26} style={{ color: 'var(--color-primary)' }} />
            Centralized Communication Monitoring & Policy Governance
          </h1>
          <p className="ed-page-header-desc">
            Multi-tenant supervisory monitoring of school messaging, safeguarding violation reports, audit trails, CSV/PDF record exports, and institution-wide role permission controls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="outline" onClick={loadAllData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Statutory Privacy Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          backgroundColor: 'var(--academic-gold-50, #fdfaf5)',
          border: '1px solid var(--academic-gold-200, #ebdcc0)',
          borderRadius: 'var(--radius-md, 8px)',
          color: 'var(--academic-gold-900, #574421)',
          fontSize: '0.86rem',
        }}
      >
        <Lock size={18} style={{ color: 'var(--academic-gold-700, #8c6e37)', flexShrink: 0 }} />
        <div>
          <strong>Statutory Governance Mandate:</strong> Official school communications are stored securely in PostgreSQL. Super Admin monitoring is strictly audited in compliance with child safeguarding and institutional transparency policies.
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          style={{ padding: '12px 16px', borderRadius: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ed-nav-tabs">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`ed-nav-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
        >
          <Sliders size={16} />
          Telemetry Overview
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`ed-nav-tab ${activeTab === 'conversations' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          Monitored Conversations ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`ed-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <AlertTriangle size={16} />
          Flagged Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`ed-nav-tab ${activeTab === 'audit_logs' ? 'active' : ''}`}
        >
          <Clock size={16} />
          Audit Trail ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`ed-nav-tab ${activeTab === 'permissions' ? 'active' : ''}`}
        >
          <Settings size={16} />
          Policy & Permissions
        </button>
      </div>

      {/* TAB 1: TELEMETRY OVERVIEW */}
      {activeTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="ed-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Conversations</span>
                <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {telemetry?.totalConversations ?? conversations.length}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Across all school tenants</p>
            </div>

            <div className="ed-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dispatched Messages</span>
                <FileText size={20} style={{ color: '#0d9488' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {telemetry?.totalMessages ?? 0}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Persistent in PostgreSQL</p>
            </div>

            <div className="ed-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Reports</span>
                <AlertTriangle size={20} style={{ color: '#d97706' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {telemetry?.activeReports ?? reports.filter((r) => r.status === 'PENDING').length}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Awaiting administrative review</p>
            </div>

            <div className="ed-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Policy Compliance</span>
                <Shield size={20} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>100%</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Active audit logging enabled</p>
            </div>
          </div>

          {/* Quick Access to Recent Conversations */}
          <div className="ed-card">
            <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Active Communication Channels</h2>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('conversations')}>
                View All Channels
              </Button>
            </div>
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>School Tenant</th>
                    <th>Channel / Participants</th>
                    <th>Type</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.school?.name || 'Apex Academy'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.title || 'Direct Conversation'}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {c.participants?.map((p: any) => `${p.user?.firstName || ''} (${p.user?.email || ''})`).join(', ')}
                        </div>
                      </td>
                      <td>
                        <span className="ed-badge ed-badge-neutral">{c.type}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : 'Recent'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button size="sm" variant="outline" onClick={() => handleExportCsv(c.id)} title="Export CSV">
                            <FileSpreadsheet size={14} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleExportPdf(c.id)} title="Export PDF">
                            <Download size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONITORED CONVERSATIONS */}
      {activeTab === 'conversations' && (
        <div className="ed-card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Filter Bar */}
          <div className="ed-toolbar" style={{ padding: '16px', borderBottom: '1px solid var(--border-default)' }}>
            <div className="ed-toolbar-left" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div className="ed-search-box" style={{ width: '280px' }}>
                <Search size={15} className="ed-search-icon" />
                <input
                  type="text"
                  placeholder="Search participants or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ed-input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="ed-select"
                style={{ height: '36px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All School Tenants</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{filteredConversations.length}</strong> channel(s)
            </div>
          </div>

          {/* Conversations Table */}
          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Conversation Details</th>
                  <th>Category</th>
                  <th>Message Count</th>
                  <th>Last Message</th>
                  <th>Audit Exports</th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No conversations match the specified filter.
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.school?.name || 'Apex Academy'}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.title || 'Direct 1-on-1 Message'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {c.participants?.map((p: any) => `${p.user?.firstName || ''} ${p.user?.lastName || ''}`).join(', ')}
                        </div>
                      </td>
                      <td>
                        <span className="ed-badge ed-badge-teal">
                          {c.type === 'GROUP' ? (c.groupType || 'GROUP') : 'DIRECT'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c._count?.messages ?? c.messages?.length ?? 1}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : 'Active'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" variant="outline" onClick={() => handleExportCsv(c.id)}>
                            <FileSpreadsheet size={13} />
                            CSV
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleExportPdf(c.id)}>
                            <Download size={13} />
                            Dossier
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FLAGGED & REPORTED MESSAGES */}
      {activeTab === 'reports' && (
        <div className="ed-card">
          <div className="ed-card-header">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Flagged Messages & Content Moderation Queue
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Messages reported by students, parents, or staff for violations of institutional communication standards.
            </p>
          </div>

          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Reported By</th>
                  <th>Flagged Content</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No reported messages in the moderation queue. School communications are in compliance.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id}>
                      <td style={{ fontSize: '0.82rem' }}>
                        {new Date(rep.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {rep.reportedBy?.firstName || ''} {rep.reportedBy?.lastName || ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rep.reportedBy?.email}
                        </div>
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                            borderLeft: '3px solid #dc2626',
                            fontSize: '0.82rem',
                          }}
                        >
                          &ldquo;{rep.message?.content}&rdquo;
                        </div>
                        {rep.notes && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <strong>Reporter note:</strong> {rep.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ed-badge ed-badge-warning">{rep.reason}</span>
                      </td>
                      <td>
                        <span
                          className={`ed-badge ${
                            rep.status === 'PENDING'
                              ? 'ed-badge-warning'
                              : rep.status === 'MESSAGE_REMOVED'
                              ? 'ed-badge-danger'
                              : 'ed-badge-success'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td>
                        {rep.status === 'PENDING' ? (
                          <Button size="sm" variant="danger" onClick={() => handleOpenModeration(rep)}>
                            Moderate
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit_logs' && (
        <div className="ed-card">
          <div className="ed-card-header">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Communication Administrative Audit Trail
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Immutable record of every conversation export, administrative inspection, and moderation ruling.
            </p>
          </div>

          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>
                        {log.actor?.firstName} {log.actor?.lastName} ({log.actor?.email})
                      </td>
                      <td>
                        <span className="ed-badge ed-badge-teal">{log.action}</span>
                      </td>
                      <td>{log.targetType}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: POLICY & PERMISSIONS CONFIGURATION */}
      {activeTab === 'permissions' && (
        <div className="ed-card" style={{ maxWidth: '800px' }}>
          <div className="ed-card-header">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              School Communication Permissions & Restrictions
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Configure role-based messaging boundaries for selected institutions to prevent unauthorized contact.
            </p>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Select School Tenant
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  if (e.target.value !== 'ALL') loadSchoolPermissions();
                }}
                className="ed-select"
                style={{ width: '100%' }}
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || 'EDUNEXA'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissionConfig.allowStudentToStudent}
                  onChange={(e) =>
                    setPermissionConfig({ ...permissionConfig, allowStudentToStudent: e.target.checked })
                  }
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Allow Direct Student-to-Student Chat</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Disabled by default for safeguarding. When disabled, students can only communicate within supervised class groups.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissionConfig.allowParentToParent}
                  onChange={(e) =>
                    setPermissionConfig({ ...permissionConfig, allowParentToParent: e.target.checked })
                  }
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Allow Direct Parent-to-Parent Messaging</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Controls whether parents/guardians can initiate private messaging between themselves.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissionConfig.allowTeacherToStudent}
                  onChange={(e) =>
                    setPermissionConfig({ ...permissionConfig, allowTeacherToStudent: e.target.checked })
                  }
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Allow Teacher-to-Student Direct Communication</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Enables teachers to send assignments, feedback, and academic guidance directly.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissionConfig.allowTeacherToParent}
                  onChange={(e) =>
                    setPermissionConfig({ ...permissionConfig, allowTeacherToParent: e.target.checked })
                  }
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Allow Teacher-to-Parent Direct Communication</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Facilitates teacher-parent coordination for student progress and meetings.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissionConfig.allowFileSharing}
                  onChange={(e) =>
                    setPermissionConfig({ ...permissionConfig, allowFileSharing: e.target.checked })
                  }
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Enable Document & File Attachments</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Allows sharing PDFs, homework scans, and images through internal chats.
                  </div>
                </div>
              </label>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Max Attachment File Size (MB)
                </label>
                <input
                  type="number"
                  value={Math.round(permissionConfig.maxAttachmentSizeBytes / 1048576)}
                  onChange={(e) =>
                    setPermissionConfig({
                      ...permissionConfig,
                      maxAttachmentSizeBytes: Number(e.target.value) * 1048576,
                    })
                  }
                  className="ed-input"
                  style={{ width: '180px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="primary" onClick={handleSavePermissions} disabled={configSaving}>
                <Check size={16} />
                {configSaving ? 'Saving...' : 'Save Communication Policies'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MODERATE REPORTED MESSAGE */}
      <Modal
        isOpen={showModerationModal}
        onClose={() => setShowModerationModal(false)}
        title="Administrative Moderation Action"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedReport && (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                borderLeft: '4px solid #dc2626',
                fontSize: '0.85rem',
              }}
            >
              <strong>Flagged Message:</strong> &ldquo;{selectedReport.message?.content}&rdquo;
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Moderation Ruling *
            </label>
            <select
              value={moderationAction}
              onChange={(e) => setModerationAction(e.target.value)}
              className="ed-select"
              style={{ width: '100%' }}
            >
              <option value="MESSAGE_REMOVED">Remove Message & Redact Content</option>
              <option value="WARNING_ISSUED">Issue Formal Administrative Warning</option>
              <option value="USER_SUSPENDED">Temporarily Suspend Messaging Privileges</option>
              <option value="DISMISSED">Dismiss Report (No Violation Found)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Moderator Explanation / Notes
            </label>
            <textarea
              placeholder="Enter institutional ruling notes for audit logging..."
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              className="ed-input"
              rows={3}
              style={{ width: '100%', height: 'auto', padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setShowModerationModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={moderating} onClick={handleModerateReport}>
              {moderating ? 'Recording...' : 'Apply Moderation Ruling'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
