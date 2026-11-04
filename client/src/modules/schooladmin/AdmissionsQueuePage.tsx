import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Clock,
  ChevronRight,
  ShieldAlert,
  Download,
  Users,
  MessageSquare,
  Settings,
  ListPlus,
  Trash2,
  Edit,
  Save,
  Check,
  ExternalLink,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
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
import { admissionsApi } from '../../services/api.js';

type TabType = 'telemetry' | 'applications' | 'enquiries' | 'documents' | 'settings';

export const AdmissionsQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('telemetry');

  // Stats Telemetry
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Applications
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appClassFilter, setAppClassFilter] = useState('ALL');

  // Enquiries
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('ALL');
  const [enquirySearchTerm, setEnquirySearchTerm] = useState('');

  // Modals & Details
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewingApp, setReviewingApp] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUIRED' | 'UNDER_REVIEW'>('APPROVED');
  const [assignedClass, setAssignedClass] = useState('Grade 9');
  const [assignedSection, setAssignedSection] = useState('A');
  const [reviewNotes, setReviewNotes] = useState('');
  const [missingDocInput, setMissingDocInput] = useState<Array<{ type: string; notes: string }>>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Enquiry Update Modal
  const [editingEnquiry, setEditingEnquiry] = useState<any | null>(null);
  const [enquiryStatusInput, setEnquiryStatusInput] = useState<string>('NEW');
  const [enquiryNotesInput, setEnquiryNotesInput] = useState<string>('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Required Documents & Settings State
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<any[]>([]);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocType, setNewDocType] = useState('');
  const [newDocRequired, setNewDocRequired] = useState(true);
  const [newDocDesc, setNewDocDesc] = useState('');

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    admissionNoticeOpen: true,
    admissionSession: '2026–2027',
    admissionNoticeTitle: 'Admissions Open 2026–2027',
    admissionNoticeDesc: 'Accepting applications for the upcoming academic session.',
    applicationDeadline: '2026-04-30',
    orientationDate: '2026-05-15',
    popupEnabled: true,
    popupHeading: 'Admissions Open 2026–2027',
    popupDescription: 'Schedule a campus tour or submit an enquiry.',
    popupFrequency: 'ONCE_PER_SESSION',
  });

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Bulk Selection for Applications
  const appSelection = useBulkSelection();
  const [appBulkLoading, setAppBulkLoading] = useState<string | null>(null);
  const [appConfirmDialog, setAppConfirmDialog] = useState<any | null>(null);

  // Load Telemetry Stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await admissionsApi.getAdminStats();
      setStats((res as any).data || res);
    } catch (err: any) {
      console.warn('Failed to load admission stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Applications
  const loadApplications = async () => {
    try {
      setAppsLoading(true);
      setAppsError(null);
      const res = await admissionsApi.listAdminApplications({
        status: appStatusFilter !== 'ALL' ? appStatusFilter : undefined,
        search: appSearchTerm || undefined,
        applyingClass: appClassFilter !== 'ALL' ? appClassFilter : undefined,
      });
      const data = (res as any).data?.items || (res as any).data || (res as any).items || [];
      setApplications(Array.isArray(data) ? data : []);
      appSelection.clearSelection();
    } catch (err: any) {
      setAppsError(err.message || 'Failed to load applications.');
    } finally {
      setAppsLoading(false);
    }
  };

  // Load Enquiries
  const loadEnquiries = async () => {
    try {
      setEnquiriesLoading(true);
      const res = await admissionsApi.listAdminEnquiries({
        status: enquiryStatusFilter !== 'ALL' ? enquiryStatusFilter : undefined,
        search: enquirySearchTerm || undefined,
      });
      const data = (res as any).data?.items || (res as any).data || (res as any).items || [];
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Failed to load enquiries', err);
    } finally {
      setEnquiriesLoading(false);
    }
  };

  // Load Config
  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const res = await admissionsApi.getPublicConfig();
      const cfg = (res as any).data || res;
      setRequiredDocs(cfg.requiredDocuments || []);
      setSettingsForm({
        admissionNoticeOpen: cfg.admissionNoticeOpen ?? true,
        admissionSession: cfg.admissionSession || '2026–2027',
        admissionNoticeTitle: cfg.admissionNoticeTitle || 'Admissions Open 2026–2027',
        admissionNoticeDesc: cfg.admissionNoticeDesc || 'Accepting applications for the upcoming academic session.',
        applicationDeadline: cfg.admissionDates?.applicationDeadline || '2026-04-30',
        orientationDate: cfg.admissionDates?.orientationDate || '2026-05-15',
        popupEnabled: cfg.popup?.enabled ?? true,
        popupHeading: cfg.popup?.heading || 'Admissions Open 2026–2027',
        popupDescription: cfg.popup?.description || 'Schedule a campus tour or submit an enquiry.',
        popupFrequency: cfg.popup?.frequency || 'ONCE_PER_SESSION',
      });
    } catch (err) {
      console.warn('Failed to load admissions config', err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadApplications();
    loadEnquiries();
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'enquiries') {
      loadEnquiries();
    } else if (activeTab === 'telemetry') {
      loadStats();
    }
  }, [activeTab, appStatusFilter, appClassFilter, enquiryStatusFilter]);

  // Review Application
  const handleOpenReview = (app: any) => {
    setReviewingApp(app);
    setDecision(app.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
    setAssignedClass(app.applyingClass || 'Grade 9');
    setAssignedSection('A');
    setReviewNotes(app.reviewNotes || '');
    setMissingDocInput([]);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApp) return;

    try {
      setIsSubmittingReview(true);
      const payload: any = {
        decision,
        reviewNotes: reviewNotes.trim() || undefined,
        assignedClass: decision === 'APPROVED' ? assignedClass : undefined,
        assignedSection: decision === 'APPROVED' ? assignedSection : undefined,
        missingDocuments: decision === 'DOCUMENTS_REQUIRED' && missingDocInput.length > 0 ? missingDocInput : undefined,
      };

      await admissionsApi.reviewApplication(reviewingApp.id, payload);
      showToast(
        decision === 'APPROVED'
          ? `Application ${reviewingApp.applicationNumber} approved and student enrolled successfully!`
          : `Application status updated to ${decision}.`
      );
      setReviewingApp(null);
      loadApplications();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update review decision.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Add missing document requirement during review
  const handleAddMissingDocRow = () => {
    setMissingDocInput((prev) => [...prev, { type: 'BIRTH_CERTIFICATE', notes: '' }]);
  };

  // Handle Enquiry Status Save
  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;
    try {
      setIsSubmittingEnquiry(true);
      await admissionsApi.updateAdminEnquiry(editingEnquiry.id, {
        status: enquiryStatusInput,
        internalNotes: enquiryNotesInput.trim() || undefined,
      });
      showToast(`Enquiry ${editingEnquiry.enquiryNumber} status updated to ${enquiryStatusInput}.`);
      setEditingEnquiry(null);
      loadEnquiries();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update enquiry.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const handleDeleteEnquiry = async (id: string, num: string) => {
    if (!window.confirm(`Are you sure you want to delete enquiry ${num}?`)) return;
    try {
      await admissionsApi.deleteAdminEnquiry(id);
      showToast(`Enquiry ${num} deleted.`);
      loadEnquiries();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete enquiry.');
    }
  };

  // Add Document Checklist Item
  const handleAddDocItem = () => {
    if (!newDocLabel.trim() || !newDocType.trim()) {
      alert('Document type and label are required.');
      return;
    }
    const cleanType = newDocType.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const updated = [
      ...requiredDocs,
      {
        type: cleanType,
        label: newDocLabel.trim(),
        isRequired: newDocRequired,
        description: newDocDesc.trim() || undefined,
      },
    ];
    setRequiredDocs(updated);
    setNewDocLabel('');
    setNewDocType('');
    setNewDocDesc('');
    setNewDocRequired(true);
  };

  const handleRemoveDocItem = (index: number) => {
    setRequiredDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDocConfig = async () => {
    try {
      setSavingConfig(true);
      await admissionsApi.updateAdmissionConfig({
        requiredDocumentsConfig: requiredDocs,
      });
      showToast('Document checklist configuration persisted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save document checklist.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Save General Settings & Popup
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      await admissionsApi.updateAdmissionConfig({
        admissionNoticeOpen: settingsForm.admissionNoticeOpen,
        admissionNoticeTitle: settingsForm.admissionNoticeTitle,
        admissionNoticeDesc: settingsForm.admissionNoticeDesc,
        admissionSession: settingsForm.admissionSession,
        admissionDates: {
          applicationDeadline: settingsForm.applicationDeadline,
          orientationDate: settingsForm.orientationDate,
        },
        admissionPopupEnabled: settingsForm.popupEnabled,
        admissionPopupHeading: settingsForm.popupHeading,
        admissionPopupDescription: settingsForm.popupDescription,
        admissionPopupFrequency: settingsForm.popupFrequency as any,
      });
      showToast('Admission settings and enquiry popup saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Bulk Actions on Applications
  const handleAppBulkAction = async (action: string) => {
    const selectedIds = Array.from(appSelection.selectedIds);
    if (selectedIds.length === 0) return;

    try {
      setAppBulkLoading(action);
      for (const id of selectedIds) {
        if (action === 'UNDER_REVIEW') {
          await admissionsApi.reviewApplication(id, { decision: 'UNDER_REVIEW' });
        } else if (action === 'REJECT') {
          await admissionsApi.reviewApplication(id, { decision: 'REJECTED' });
        }
      }
      showToast(`Bulk action "${action}" completed for ${selectedIds.length} application(s).`);
      appSelection.clearSelection();
      setAppConfirmDialog(null);
      loadApplications();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Error executing bulk action.');
    } finally {
      setAppBulkLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return <Badge variant="success">ENROLLED</Badge>;
      case 'APPROVED':
        return <Badge variant="success">APPROVED</Badge>;
      case 'DOCUMENTS_REQUIRED':
        return <Badge variant="warning">DOCUMENTS REQ</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">UNDER REVIEW</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">SUBMITTED</Badge>;
    }
  };

  const getEnquiryBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="info">NEW</Badge>;
      case 'CONTACTED':
        return <Badge variant="info">CONTACTED</Badge>;
      case 'FOLLOW_UP_REQUIRED':
        return <Badge variant="warning">FOLLOW UP</Badge>;
      case 'CONVERTED':
        return <Badge variant="success">CONVERTED</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">CLOSED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="ed-container" style={{ padding: 'var(--space-6) 0' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#1e40af',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <Check size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontSize: '0.80rem', fontWeight: 600 }}>
            <GraduationCap size={16} />
            <span>INSTITUTIONAL ADMISSION MANAGEMENT</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0' }}>
            Admissions Council & Enquiries Hub
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Manage public website applications, review documents, convert enquiries, and provision enrolled student profiles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              loadStats();
              loadApplications();
              loadEnquiries();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            Refresh Ledger
          </Button>
          <a
            href="/admissions"
            target="_blank"
            rel="noopener noreferrer"
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            View Public Portal
          </a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-default)',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {[
          { tab: 'telemetry', label: 'Telemetry & Statistics', icon: Sparkles },
          { tab: 'applications', label: `Applications (${stats?.applications?.total ?? applications.length})`, icon: FileCheck },
          { tab: 'enquiries', label: `Public Enquiries (${stats?.enquiries?.total ?? enquiries.length})`, icon: MessageSquare },
          { tab: 'documents', label: 'Required Documents', icon: ListPlus },
          { tab: 'settings', label: 'Admission & Popup Settings', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.tab;
          return (
            <button
              key={t.tab}
              onClick={() => setActiveTab(t.tab as TabType)}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #1e40af' : '3px solid transparent',
                color: isActive ? '#1e40af' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TELEMETRY & STATS */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Applications</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>
                {stats?.applications?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats?.applications?.submitted ?? 0} Pending Initial Review
              </div>
            </div>

            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Under Committee Review</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {stats?.applications?.underReview ?? 0}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats?.applications?.documentsRequired ?? 0} Pending Documents
              </div>
            </div>

            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Formally Enrolled</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                {stats?.applications?.enrolled ?? 0}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats?.applications?.approved ?? 0} Approved / Offer Issued
              </div>
            </div>

            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enquiries Desk</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                {stats?.enquiries?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats?.enquiries?.new ?? 0} New • {stats?.enquiries?.converted ?? 0} Converted
              </div>
            </div>
          </div>

          {/* Quick Action Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Application Status Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Submitted (Fresh)', count: stats?.applications?.submitted ?? 0, color: '#64748b' },
                  { label: 'Under Review', count: stats?.applications?.underReview ?? 0, color: '#0284c7' },
                  { label: 'Documents Required', count: stats?.applications?.documentsRequired ?? 0, color: '#d97706' },
                  { label: 'Approved (Pending Formal Enrollment)', count: stats?.applications?.approved ?? 0, color: '#10b981' },
                  { label: 'Enrolled (Student Profile Created)', count: stats?.applications?.enrolled ?? 0, color: '#16a34a' },
                  { label: 'Declined / Rejected', count: stats?.applications?.rejected ?? 0, color: '#dc2626' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color, fontSize: '0.92rem' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Admission Management Shortcuts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    setAppStatusFilter('SUBMITTED');
                    setActiveTab('applications');
                  }}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '12px 16px' }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Review Pending Applications</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Process new candidate submissions</div>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() => {
                    setEnquiryStatusFilter('NEW');
                    setActiveTab('enquiries');
                  }}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '12px 16px' }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Call Back New Website Enquiries</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Follow up with prospective parents</div>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '12px 16px' }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Configure Website Enquiry Modal</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Modify popup frequency and text</div>
                  </div>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLICATIONS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by student, guardian, app no..."
                  className="ed-input"
                  style={{ paddingLeft: '32px' }}
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadApplications();
                  }}
                />
              </div>

              <select
                className="ed-input"
                style={{ width: '180px' }}
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DOCUMENTS_REQUIRED">Documents Required</option>
                <option value="APPROVED">Approved</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <Button variant="secondary" onClick={loadApplications}>
                Apply Filter
              </Button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {applications.length} applications
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <BulkActionToolbar
            selection={appSelection}
            totalMatchingCount={applications.length}
            actions={[
              {
                id: 'UNDER_REVIEW',
                label: 'Mark Under Review',
                variant: 'primary',
                onClick: () =>
                  setAppConfirmDialog({
                    action: 'UNDER_REVIEW',
                    title: 'Mark Applications Under Review',
                    message: 'Move selected applications into committee evaluation status?',
                    variant: 'primary',
                    confirmLabel: 'Confirm Under Review',
                  }),
              },
              {
                id: 'REJECT',
                label: 'Reject Applications',
                variant: 'danger',
                onClick: () =>
                  setAppConfirmDialog({
                    action: 'REJECT',
                    title: 'Reject Selected Applications',
                    message: 'Are you sure you want to decline these applications? This action will notify the applicants.',
                    variant: 'danger',
                    confirmLabel: 'Confirm Rejection',
                  }),
              },
            ]}
          />

          {/* Applications Table */}
          <div className="ed-card" style={{ overflow: 'hidden' }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <SelectAllCheckbox
                      selection={appSelection}
                      pageIds={applications.map((a) => a.id)}
                    />
                  </th>
                  <th>App No.</th>
                  <th>Candidate</th>
                  <th>Class Applied</th>
                  <th>Parent / Guardian</th>
                  <th>Contact</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appsLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                      Loading applications from database...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No applications found matching the current criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => {
                    const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
                    return (
                      <tr key={app.id}>
                        <td>
                          <RowCheckbox
                            id={app.id}
                            checked={appSelection.isSelected(app.id)}
                            onToggle={(id) => appSelection.toggleSelect(id)}
                          />
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.84rem' }}>
                            {app.applicationNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                            {app.studentFirstName} {app.studentLastName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            DOB: {new Date(app.dateOfBirth).toLocaleDateString()} • {app.gender}
                          </div>
                        </td>
                        <td>
                          <span className="ed-badge ed-badge-secondary" style={{ fontSize: '0.76rem' }}>
                            {app.applyingClass}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{app.guardianName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {app.guardianRelationship || 'Parent'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.78rem' }}>{app.guardianPhone}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{app.guardianEmail}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.80rem', color: docCount > 0 ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                            {docCount} file(s)
                          </span>
                        </td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedApp(app)}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenReview(app)}
                              title="Review Decision"
                            >
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENQUIRIES DESK */}
      {/* ========================================================================= */}
      {activeTab === 'enquiries' && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search enquiries by name, phone, enquiry no..."
                  className="ed-input"
                  style={{ paddingLeft: '32px' }}
                  value={enquirySearchTerm}
                  onChange={(e) => setEnquirySearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadEnquiries();
                  }}
                />
              </div>

              <select
                className="ed-input"
                style={{ width: '180px' }}
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
              >
                <option value="ALL">All Enquiries</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP_REQUIRED">Follow Up Required</option>
                <option value="CONVERTED">Converted</option>
                <option value="CLOSED">Closed</option>
              </select>

              <Button variant="secondary" onClick={loadEnquiries}>
                Filter
              </Button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Total: {enquiries.length} Enquiries
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="ed-card" style={{ overflow: 'hidden' }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Enquiry Ref</th>
                  <th>Date</th>
                  <th>Parent / Guardian</th>
                  <th>Candidate</th>
                  <th>Applying Class</th>
                  <th>Contact</th>
                  <th>Message / Query</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiriesLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                      Loading enquiries from database...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No admission enquiries recorded yet.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => (
                    <tr key={enq.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.84rem' }}>
                          {enq.enquiryNumber}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.86rem' }}>{enq.parentName}</td>
                      <td style={{ fontSize: '0.84rem' }}>{enq.studentName}</td>
                      <td>
                        <span className="ed-badge ed-badge-secondary" style={{ fontSize: '0.76rem' }}>
                          {enq.applyingClass}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem' }}>{enq.phone}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{enq.email}</div>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                          }}
                          title={enq.message}
                        >
                          {enq.message || '—'}
                        </div>
                      </td>
                      <td>{getEnquiryBadge(enq.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingEnquiry(enq);
                              setEnquiryStatusInput(enq.status);
                              setEnquiryNotesInput(enq.internalNotes || '');
                            }}
                            title="Update Status & Notes"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteEnquiry(enq.id, enq.enquiryNumber)}
                            title="Delete Enquiry"
                          >
                            <Trash2 size={14} />
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

      {/* ========================================================================= */}
      {/* TAB 4: REQUIRED DOCUMENTS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Public Admission Document Checklist</h3>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Define which certificates parents must upload or submit during admission.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSaveDocConfig}
                disabled={savingConfig}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {savingConfig ? 'Persisting...' : 'Save Checklist Changes'}
              </Button>
            </div>

            {/* Existing Documents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {requiredDocs.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {doc.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Key: <code>{doc.type}</code> • {doc.description || 'No additional note'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={doc.isRequired}
                        onChange={(e) => {
                          const updated = [...requiredDocs];
                          updated[idx].isRequired = e.target.checked;
                          setRequiredDocs(updated);
                        }}
                      />
                      <span>Mandatory</span>
                    </label>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveDocItem(idx)}
                      title="Remove Requirement"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Requirement */}
            <div
              style={{
                border: '1px dashed #3b82f6',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#eff6ff',
              }}
            >
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e40af', marginBottom: '12px' }}>
                Add New Document Requirement
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Document Key / Identifier *</label>
                  <input
                    type="text"
                    className="ed-input"
                    placeholder="e.g. MIGRATION_CERTIFICATE"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Display Label (Parent Facing) *</label>
                  <input
                    type="text"
                    className="ed-input"
                    placeholder="e.g. Inter-State Migration Certificate"
                    value={newDocLabel}
                    onChange={(e) => setNewDocLabel(e.target.value)}
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '12px' }}>
                <label className="ed-label">Guideline / Description (Optional)</label>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="e.g. Mandatory for students transferring from ICSE or state boards."
                  value={newDocDesc}
                  onChange={(e) => setNewDocDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newDocRequired}
                    onChange={(e) => setNewDocRequired(e.target.checked)}
                  />
                  <span>Mark as Mandatory requirement</span>
                </label>
                <Button variant="primary" size="sm" onClick={handleAddDocItem}>
                  Add to Checklist
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ADMISSION SETTINGS & POPUP MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <form onSubmit={handleSaveSettings} className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Admission Settings & Public Website Popup</h3>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Control admission session, deadlines, and the public enquiry modal popup.
                </p>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={savingConfig}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>

            {/* General Admission Controls */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-default)' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                General Admission Portal Settings
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="admissionsOpenToggle"
                  checked={settingsForm.admissionNoticeOpen}
                  onChange={(e) => setSettingsForm({ ...settingsForm, admissionNoticeOpen: e.target.checked })}
                />
                <label htmlFor="admissionsOpenToggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Admissions Status: {settingsForm.admissionNoticeOpen ? 'ACTIVE & OPEN' : 'CLOSED'}
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Current Academic Session *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={settingsForm.admissionSession}
                    onChange={(e) => setSettingsForm({ ...settingsForm, admissionSession: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Portal Heading Title</label>
                  <input
                    type="text"
                    className="ed-input"
                    value={settingsForm.admissionNoticeTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, admissionNoticeTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                <label className="ed-label">Portal Description / Notice</label>
                <textarea
                  rows={2}
                  className="ed-input"
                  value={settingsForm.admissionNoticeDesc}
                  onChange={(e) => setSettingsForm({ ...settingsForm, admissionNoticeDesc: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Application Submission Deadline</label>
                  <input
                    type="date"
                    className="ed-input"
                    value={settingsForm.applicationDeadline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, applicationDeadline: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Orientation Date</label>
                  <input
                    type="date"
                    className="ed-input"
                    value={settingsForm.orientationDate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, orientationDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Website Popup Manager */}
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Public Website Admission Enquiry Popup
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="popupEnabledToggle"
                  checked={settingsForm.popupEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, popupEnabled: e.target.checked })}
                />
                <label htmlFor="popupEnabledToggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Enable automatic enquiry popup on public website
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Popup Heading *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={settingsForm.popupHeading}
                    onChange={(e) => setSettingsForm({ ...settingsForm, popupHeading: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Display Frequency *</label>
                  <select
                    className="ed-input"
                    value={settingsForm.popupFrequency}
                    onChange={(e) => setSettingsForm({ ...settingsForm, popupFrequency: e.target.value })}
                  >
                    <option value="ONCE_PER_SESSION">Once Per Session</option>
                    <option value="ONCE_PER_DAY">Once Per Day</option>
                    <option value="EVERY_VISIT">Every Visit (After 3s)</option>
                  </select>
                </div>
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Popup Introductory Text</label>
                <textarea
                  rows={2}
                  className="ed-input"
                  value={settingsForm.popupDescription}
                  onChange={(e) => setSettingsForm({ ...settingsForm, popupDescription: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW APPLICATION DETAILS */}
      {/* ========================================================================= */}
      {selectedApp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          title={`Application Details — ${selectedApp.applicationNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>CANDIDATE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {selectedApp.studentFirstName} {selectedApp.studentLastName}
                </div>
              </div>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '14px',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '0.84rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date of Birth: </span>
                <strong>{new Date(selectedApp.dateOfBirth).toLocaleDateString()}</strong> ({selectedApp.gender})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group: </span>
                <strong>{selectedApp.bloodGroup || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Applying Class: </span>
                <strong>{selectedApp.applyingClass}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Academic Session: </span>
                <strong>{selectedApp.academicSession}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Guardian: </span>
                <strong>{selectedApp.guardianName}</strong> ({selectedApp.guardianRelationship || 'Parent'})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Guardian Contact: </span>
                <strong>{selectedApp.guardianPhone}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)' }}>Address: </span>
                <span>{selectedApp.residentialAddress}</span>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <h4 style={{ fontSize: '0.90rem', fontWeight: 600, marginBottom: '8px' }}>Attached Documents</h4>
              {Array.isArray(selectedApp.documents) && selectedApp.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedApp.documents.map((doc: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.80rem',
                      }}
                    >
                      <span>
                        <strong>{doc.type}: </strong> {doc.fileName}
                      </span>
                      <a
                        href={doc.fileUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Preview / Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>No digital files attached.</div>
              )}
            </div>

            {selectedApp.reviewNotes && (
              <div style={{ fontSize: '0.82rem', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                <strong>Admissions Committee Notes: </strong>
                {selectedApp.reviewNotes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const appToReview = selectedApp;
                  setSelectedApp(null);
                  handleOpenReview(appToReview);
                }}
              >
                Review Application
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLICATION REVIEW DECISION */}
      {/* ========================================================================= */}
      {reviewingApp && (
        <Modal
          isOpen={true}
          onClose={() => setReviewingApp(null)}
          title={`Review Admission Decision — ${reviewingApp.applicationNumber}`}
        >
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.86rem' }}>
              Candidate: <strong>{reviewingApp.studentFirstName} {reviewingApp.studentLastName}</strong> • Class Applied: <strong>{reviewingApp.applyingClass}</strong>
            </div>

            {/* Decision Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                Review Decision *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'APPROVED', label: 'Approve & Enroll', color: '#16a34a' },
                  { id: 'UNDER_REVIEW', label: 'Under Review', color: '#0284c7' },
                  { id: 'DOCUMENTS_REQUIRED', label: 'Docs Required', color: '#d97706' },
                  { id: 'REJECTED', label: 'Reject', color: '#dc2626' },
                ].map((d) => (
                  <label
                    key={d.id}
                    style={{
                      border: decision === d.id ? `2px solid ${d.color}` : '1px solid var(--border-default)',
                      backgroundColor: decision === d.id ? 'var(--bg-subtle)' : 'transparent',
                      padding: '10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      fontWeight: decision === d.id ? 700 : 500,
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={d.id}
                      checked={decision === d.id}
                      onChange={() => setDecision(d.id as any)}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Approved: Assign Class & Section */}
            {decision === 'APPROVED' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <div className="ed-input-group" style={{ margin: 0 }}>
                  <label className="ed-label">Assigned Class *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                  />
                </div>
                <div className="ed-input-group" style={{ margin: 0 }}>
                  <label className="ed-label">Assigned Section *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    value={assignedSection}
                    onChange={(e) => setAssignedSection(e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: 'span 2', fontSize: '0.74rem', color: '#16a34a' }}>
                  ✓ Approval automatically creates a transaction-safe student profile, user account, guardian link, and admission number in PostgreSQL.
                </div>
              </div>
            )}

            {/* Documents Required: Missing list */}
            {decision === 'DOCUMENTS_REQUIRED' && (
              <div style={{ padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                    Specify Missing Document Requests:
                  </span>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddMissingDocRow}>
                    + Add Missing Item
                  </Button>
                </div>
                {missingDocInput.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '6px' }}>
                    <input
                      className="ed-input"
                      placeholder="e.g. BIRTH_CERTIFICATE"
                      value={row.type}
                      onChange={(e) => {
                        const updated = [...missingDocInput];
                        updated[idx].type = e.target.value;
                        setMissingDocInput(updated);
                      }}
                    />
                    <input
                      className="ed-input"
                      placeholder="Note for parent (e.g. municipal seal missing)"
                      value={row.notes}
                      onChange={(e) => {
                        const updated = [...missingDocInput];
                        updated[idx].notes = e.target.value;
                        setMissingDocInput(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="ed-input-group">
              <label className="ed-label">Reviewer Notes & Justification</label>
              <textarea
                rows={3}
                className="ed-input"
                placeholder="Enter evaluation remarks, document verification outcome, or rejection rationale..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="secondary" onClick={() => setReviewingApp(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingReview}
                style={decision === 'REJECTED' ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } : {}}
              >
                {isSubmittingReview ? 'Committing...' : 'Confirm Decision'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ENQUIRY */}
      {/* ========================================================================= */}
      {editingEnquiry && (
        <Modal
          isOpen={true}
          onClose={() => setEditingEnquiry(null)}
          title={`Update Enquiry — ${editingEnquiry.enquiryNumber}`}
        >
          <form onSubmit={handleSaveEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.84rem' }}>
              Parent: <strong>{editingEnquiry.parentName}</strong> ({editingEnquiry.phone} | {editingEnquiry.email})
              <br />
              Student: <strong>{editingEnquiry.studentName}</strong> (Applying: {editingEnquiry.applyingClass})
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Enquiry Status *</label>
              <select
                className="ed-input"
                value={enquiryStatusInput}
                onChange={(e) => setEnquiryStatusInput(e.target.value)}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP_REQUIRED">Follow Up Required</option>
                <option value="CONVERTED">Converted (Application Submitted)</option>
                <option value="CLOSED">Closed (Not Interested)</option>
              </select>
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Internal Follow-Up Notes</label>
              <textarea
                rows={3}
                className="ed-input"
                placeholder="Called parent on 04/11, discussed fee structure and curriculum..."
                value={enquiryNotesInput}
                onChange={(e) => setEnquiryNotesInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingEnquiry(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingEnquiry}>
                {isSubmittingEnquiry ? 'Saving...' : 'Save Enquiry'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Action Confirmation Dialog */}
      {appConfirmDialog && (
        <BulkActionConfirmationDialog
          isOpen={true}
          title={appConfirmDialog.title}
          message={appConfirmDialog.message}
          confirmLabel={appConfirmDialog.confirmLabel}
          variant={appConfirmDialog.variant}
          count={appSelection.selectedCount}
          entityName="applications"
          isLoading={appBulkLoading !== null}
          onConfirm={() => handleAppBulkAction(appConfirmDialog.action)}
          onClose={() => setAppConfirmDialog(null)}
        />
      )}
    </div>
  );
};
