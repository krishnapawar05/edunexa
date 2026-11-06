import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Shield,
  ShieldCheck,
  Ban,
  Download,
  Printer,
  GraduationCap,
  Layers,
  FileCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Send,
  Calendar,
  Building,
  UserCheck,
  X,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  useBulkSelection,
  SelectAllCheckbox,
  RowCheckbox,
  BulkActionToolbar,
  BulkActionItem,
} from '../../components/bulk/index.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { admitCardsApi, coreApi, academicApi } from '../../services/api.js';
import {
  downloadIndividualAdmitCardPdf,
  downloadBulkAdmitCardsPdf,
  AdmitCardPdfData,
} from '../../utils/admitCardPdf.js';

type TabKey = 'dashboard' | 'directory' | 'bulk_generate' | 'clearance' | 'timetable';

export const AdmitCardManagementPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Cards Directory State
  const [cards, setCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clearanceFilter, setClearanceFilter] = useState('ALL');
  const [classesList, setClassesList] = useState<string[]>([]);
  const [examsList, setExamsList] = useState<string[]>([]);

  // Modals & Selected Card for Preview / Clearance
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [clearanceModalCard, setClearanceModalCard] = useState<any | null>(null);
  const [clearanceAction, setClearanceAction] = useState<'CLEARED' | 'BLOCKED'>('CLEARED');
  const [clearanceReason, setClearanceReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Generator State
  const [bulkExamTitle, setBulkExamTitle] = useState('Annual Examination 2026-2027');
  const [bulkExamType, setBulkExamType] = useState('ANNUAL');
  const [bulkClass, setBulkClass] = useState('');
  const [bulkSection, setBulkSection] = useState('');
  const [bulkCenterName, setBulkCenterName] = useState('Main Campus Examination Hall, Wing A');
  const [bulkRoomNumber, setBulkRoomNumber] = useState('Hall-101');
  const [bulkInstructions, setBulkInstructions] = useState(
    '1. Candidates must arrive at the examination hall 30 minutes before the scheduled time.\n2. Bring your physical printed Admit Card and valid Student Identity Card.\n3. Electronic devices, smartwatches, and programmable calculators are strictly forbidden.\n4. No candidate shall be permitted to leave the examination hall until 1 hour has elapsed.'
  );
  const [enforceFeeCheck, setEnforceFeeCheck] = useState(true);
  const [feeThreshold, setFeeThreshold] = useState(500);
  const [enforceAttendanceCheck, setEnforceAttendanceCheck] = useState(true);
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  // Timetable State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Universal Multi-Select
  const bulk = useBulkSelection();

  // Load Dashboard Stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res: any = await admitCardsApi.getDashboardStats();
      const s = res?.stats || res?.data || res;
      if (s) {
        setStats(s);
      }
    } catch (err: any) {
      console.error('Failed to load admit card telemetry:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Classes and Exam Schedules
  const loadReferenceData = async () => {
    try {
      const [structRes, schedRes] = await Promise.allSettled([
        coreApi.getAcademicStructure(),
        academicApi.listExamSchedules(),
      ]);

      if (structRes.status === 'fulfilled' && structRes.value?.classes) {
        const clsNames = structRes.value.classes.map((c: any) => c.name);
        setClassesList(clsNames);
      } else {
        setClassesList(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
      }

      if (schedRes.status === 'fulfilled' && Array.isArray(schedRes.value)) {
        setSchedules(schedRes.value);
        const titles = Array.from(new Set(schedRes.value.map((s: any) => s.name || s.examType).filter(Boolean)));
        setExamsList(titles as string[]);
        if (titles.length > 0 && !bulkExamTitle) {
          setBulkExamTitle(titles[0] as string);
        }
      }
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  };

  // Load Cards Directory
  const loadCards = async () => {
    try {
      setCardsLoading(true);
      const params: any = {
        limit: 100,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (examFilter) params.examTitle = examFilter;
      if (classFilter) params.className = classFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (clearanceFilter !== 'ALL') params.clearanceStatus = clearanceFilter;

      const res: any = await admitCardsApi.listAdmitCards(params);
      const cardList = res?.cards || res?.items || res?.data?.cards || res?.data?.items || (Array.isArray(res) ? res : []);
      setCards(cardList);
    } catch (err: any) {
      console.error('Failed to load admit cards roster:', err);
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadCards();
  }, [examFilter, classFilter, statusFilter, clearanceFilter]);

  // Bulk Actions
  const handleBulkPublish = async (action: 'PUBLISH' | 'UNPUBLISH' | 'WITHHOLD') => {
    if (bulk.selectedCount === 0) return;
    try {
      setActionLoading(true);
      const res: any = await admitCardsApi.publishCards({
        cardIds: bulk.getSelectedList(),
        action,
        enforceClearance: action === 'PUBLISH',
      });
      const data = res?.data ?? res ?? {};
      const updatedCount = data.updatedCount ?? data.publishedCount ?? data.unpublishedCount ?? bulk.selectedCount;
      const skippedText = data.skippedCount ? ` (${data.skippedCount} skipped due to clearance pending)` : '';
      setFeedbackMsg({
        type: 'success',
        text: `Successfully updated ${updatedCount} admit card(s).${skippedText}`,
      });
      bulk.clearSelection();
      loadCards();
      loadStats();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Bulk publication failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDownload = () => {
    if (bulk.selectedCount === 0) return;
    const selectedCards = cards.filter((c) => bulk.isSelected(c.id));
    if (selectedCards.length === 0) return;

    const pdfDataList: AdmitCardPdfData[] = selectedCards.map((c) => ({
      id: c.id,
      admitCardNumber: c.admitCardNumber,
      examTitle: c.examTitle,
      examType: c.examType,
      sessionName: c.academicSession?.name || 'Academic Session 2026-2027',
      studentName: `${c.studentProfile?.user?.firstName || ''} ${c.studentProfile?.user?.lastName || ''}`.trim() || 'Candidate',
      admissionNumber: c.studentProfile?.admissionNumber || 'ADM-0000',
      rollNumber: c.rollNumber || c.studentProfile?.rollNumber || '00',
      className: c.className || c.studentProfile?.class?.name || 'Grade 10',
      sectionName: c.sectionName || c.studentProfile?.section?.name || 'Section A',
      centerName: c.centerName,
      roomNumber: c.roomNumber,
      candidateInstructions: c.candidateInstructions,
      qrToken: c.qrToken,
      status: c.status,
      clearanceStatus: c.clearanceStatus,
      schoolName: branding.schoolName,
      schoolCode: branding.code || 'EDUNEXA-2026',
      schoolAddress: branding.address,
      schoolPhone: branding.contactPhone,
      schoolEmail: branding.contactEmail,
      timetable: Array.isArray(c.timetable) ? c.timetable : [],
    }));

    downloadBulkAdmitCardsPdf(pdfDataList, `AdmitCards_Batch_${new Date().toISOString().slice(0, 10)}.pdf`);
    setFeedbackMsg({
      type: 'success',
      text: `Generated multi-page printable A4 PDF for ${selectedCards.length} candidates.`,
    });
  };

  const handleSingleDownload = (c: any) => {
    const pdfData: AdmitCardPdfData = {
      id: c.id,
      admitCardNumber: c.admitCardNumber,
      examTitle: c.examTitle,
      examType: c.examType,
      sessionName: c.academicSession?.name || 'Academic Session 2026-2027',
      studentName: `${c.studentProfile?.user?.firstName || ''} ${c.studentProfile?.user?.lastName || ''}`.trim() || 'Candidate',
      admissionNumber: c.studentProfile?.admissionNumber || 'ADM-0000',
      rollNumber: c.rollNumber || c.studentProfile?.rollNumber || '00',
      className: c.className || c.studentProfile?.class?.name || 'Grade 10',
      sectionName: c.sectionName || c.studentProfile?.section?.name || 'Section A',
      centerName: c.centerName,
      roomNumber: c.roomNumber,
      candidateInstructions: c.candidateInstructions,
      qrToken: c.qrToken,
      status: c.status,
      clearanceStatus: c.clearanceStatus,
      schoolName: branding.schoolName,
      schoolCode: branding.code || 'EDUNEXA-2026',
      schoolAddress: branding.address,
      schoolPhone: branding.contactPhone,
      schoolEmail: branding.contactEmail,
      timetable: Array.isArray(c.timetable) ? c.timetable : [],
    };
    downloadIndividualAdmitCardPdf(pdfData, `AdmitCard_${c.admitCardNumber}.pdf`);
  };

  // Launch Bulk Generation
  const handleLaunchBulkGeneration = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (generating) return;
    if (!bulkExamTitle || !bulkExamTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please specify an examination title.' });
      return;
    }

    try {
      setGenerating(true);
      setBulkResult(null);
      setFeedbackMsg(null);
      const payload: any = {
        examTitle: bulkExamTitle.trim(),
        examType: bulkExamType,
        className: bulkClass || undefined,
        sectionName: bulkSection || undefined,
        allEligible: !bulkClass,
        centerName: bulkCenterName || undefined,
        defaultRoomNumber: bulkRoomNumber || undefined,
        candidateInstructions: bulkInstructions || undefined,
        skipUnpaidFees: enforceFeeCheck,
        feeThresholdAmount: feeThreshold,
        skipLowAttendance: enforceAttendanceCheck,
        minAttendancePercent: attendanceThreshold,
      };

      const res: any = await admitCardsApi.bulkGenerate(payload);
      const data = res?.data ?? res ?? {};
      setBulkResult(data);

      const genCount = data.generatedCount ?? (Array.isArray(data.cards) ? data.cards.length : 0);
      const skipCount = data.skippedCount ?? (Array.isArray(data.skipped) ? data.skipped.length : 0);

      setFeedbackMsg({
        type: 'success',
        text: `Batch generation complete! Generated/Updated: ${genCount} hall ticket(s)${skipCount > 0 ? ` (${skipCount} skipped)` : ''}.`,
      });
      await Promise.all([loadStats(), loadCards()]);
    } catch (err: any) {
      console.error('Batch generation failed:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Bulk generation encountered an error. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  // Override Clearance Status
  const handleSaveClearanceOverride = async () => {
    if (!clearanceModalCard) return;
    try {
      setActionLoading(true);
      await admitCardsApi.updateClearance(clearanceModalCard.id, {
        clearanceStatus: clearanceAction,
        reason: clearanceReason.trim() || 'Administrative manual override by Exam Coordinator',
      });
      setFeedbackMsg({
        type: 'success',
        text: `Clearance status for ${clearanceModalCard.studentProfile?.user?.firstName || 'Candidate'} updated to ${clearanceAction}.`,
      });
      setClearanceModalCard(null);
      setClearanceReason('');
      loadCards();
      loadStats();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update clearance.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getClearanceBadge = (status: string) => {
    switch (status) {
      case 'CLEARED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cleared</span>;
      case 'PENDING_FEES':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><CreditCard className="w-3 h-3 text-amber-600" /> Fees Due</span>;
      case 'PENDING_ATTENDANCE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 text-amber-600" /> Low Attendance</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><Ban className="w-3 h-3 text-red-600" /> Blocked</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300"><Send className="w-3 h-3 text-emerald-600" /> Published</span>;
      case 'GENERATED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><FileCheck className="w-3 h-3 text-blue-500" /> Ready</span>;
      case 'WITHHELD':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3 h-3 text-amber-500" /> Withheld</span>;
      case 'REVOKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3 text-rose-500" /> Revoked</span>;
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">
              Examination Council
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 5 Master Module</span>
          </div>
          <h1 className="ed-page-header-title">
            <FileText size={26} style={{ color: 'var(--color-primary)' }} />
            Admit Card Generation & Hall Ticket Management
          </h1>
          <p className="ed-page-header-desc">
            Centralized hub for examination schedules, institutional clearance validation, automated hall ticket issuance, multi-page PDF generation, and student self-service.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={() => {
              loadStats();
              loadCards();
            }}
            disabled={cardsLoading || statsLoading}
          >
            <RefreshCw size={16} className={(cardsLoading || statsLoading) ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => setActiveTab('bulk_generate')}
          >
            <Plus size={16} />
            Bulk Generate Admit Cards
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ed-nav-tabs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`ed-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          Dashboard Telemetry
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`ed-nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
        >
          <FileText className="w-4 h-4" />
          Admit Cards Directory
          {cards.length > 0 && (
            <span className="ed-badge ed-badge-neutral" style={{ marginLeft: '6px' }}>
              {cards.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bulk_generate')}
          className={`ed-nav-tab ${activeTab === 'bulk_generate' ? 'active' : ''}`}
        >
          <GraduationCap className="w-4 h-4" />
          Bulk Generation Studio
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`ed-nav-tab ${activeTab === 'clearance' ? 'active' : ''}`}
        >
          <ShieldCheck className="w-4 h-4" />
          Clearance Gatekeeper
          {stats?.pendingClearance > 0 && (
            <span className="ed-badge ed-badge-warning" style={{ marginLeft: '6px' }}>
              {stats.pendingClearance}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`ed-nav-tab ${activeTab === 'timetable' ? 'active' : ''}`}
        >
          <Calendar className="w-4 h-4" />
          Timetable Reference
        </button>
      </div>

      {/* TAB 1: DASHBOARD TELEMETRY */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Key Metric Cards */}
          <div className="ed-metrics-grid">
            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Scheduled Exams</span>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="ed-metric-value">{stats?.totalExams ?? 0}</div>
              <div className="ed-metric-subtitle">Active examinations</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Enrolled Candidates</span>
                <UserCheck size={18} style={{ color: '#2563eb' }} />
              </div>
              <div className="ed-metric-value">{stats?.totalStudents ?? 0}</div>
              <div className="ed-metric-subtitle">Eligible student cohort</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Cards Generated</span>
                <FileCheck size={18} style={{ color: '#0d9488' }} />
              </div>
              <div className="ed-metric-value">{stats?.totalGeneratedCards ?? 0}</div>
              <div className="ed-metric-subtitle" style={{ color: '#0d9488', fontWeight: 600 }}>
                {stats?.totalStudents ? Math.round(((stats?.totalGeneratedCards ?? 0) / stats.totalStudents) * 100) : 0}% coverage
              </div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Published to Portals</span>
                <Send size={18} style={{ color: '#16a34a' }} />
              </div>
              <div className="ed-metric-value">{stats?.publishedCards ?? 0}</div>
              <div className="ed-metric-subtitle" style={{ color: '#16a34a', fontWeight: 600 }}>Visible to Student/Parent</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Clearance Attention</span>
                <AlertTriangle size={18} style={{ color: '#d97706' }} />
              </div>
              <div className="ed-metric-value" style={{ color: '#d97706' }}>
                {stats?.pendingClearance ?? 0}
              </div>
              <div className="ed-metric-subtitle" style={{ color: '#d97706', fontWeight: 600 }}>Fee dues or low attendance</div>
            </div>
          </div>

          {/* Institutional Clearance Distribution Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #173327 0%, #244c3a 50%, #1d3d2f 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px',
              color: '#ffffff',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Automated Security & Gatekeeper
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 4px 0', color: '#ffffff' }}>
                  Zero-Hall-Ticket Leakage Enforcement
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#cbd5e1', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
                  Students with overdue fee balances or attendance below the statutory 75% threshold are flagged. Unpublished cards remain completely invisible on student & guardian portals until cleared.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setActiveTab('clearance')}
                >
                  Review Clearance Ledger
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('bulk_generate')}
                >
                  Generate Cohort
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Ledger / Recent Issuances */}
          <div className="ed-card">
            <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Admit Card Issuances</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Live ledger of generated examination hall tickets from PostgreSQL</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('directory')}
              >
                View Full Directory &rarr;
              </Button>
            </div>

            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Admit Card #</th>
                    <th>Candidate</th>
                    <th>Class & Roll</th>
                    <th>Examination</th>
                    <th>Clearance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {c.admitCardNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.studentProfile?.user?.firstName} {c.studentProfile?.user?.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Adm: {c.studentProfile?.admissionNumber || 'N/A'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {c.className || c.studentProfile?.class?.name || 'Class 10'} • Roll #{c.rollNumber || '00'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.examTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.centerName}</div>
                      </td>
                      <td>{getClearanceBadge(c.clearanceStatus)}</td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setPreviewCard(c)}
                            title="Preview Admit Card"
                            className="ed-icon-btn"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleSingleDownload(c)}
                            title="Download Official A4 PDF"
                            className="ed-icon-btn"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No admit cards have been generated yet. Launch the Bulk Generation Studio to create hall tickets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIT CARDS DIRECTORY & UNIVERSAL MULTI-SELECT */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar */}
          <div className="ed-toolbar">
            <div className="ed-search-box">
              <Search size={16} className="ed-search-icon" />
              <input
                type="text"
                placeholder="Search candidate, roll, admit #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCards()}
                className="ed-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="ed-select"
              >
                <option value="">All Classes</option>
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="ed-select"
              >
                <option value="">All Examinations</option>
                {examsList.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>

              <select
                value={clearanceFilter}
                onChange={(e) => setClearanceFilter(e.target.value)}
                className="ed-select"
              >
                <option value="ALL">All Clearance States</option>
                <option value="CLEARED">Cleared Only</option>
                <option value="PENDING_FEES">Pending Fees</option>
                <option value="PENDING_ATTENDANCE">Pending Attendance</option>
                <option value="BLOCKED">Blocked</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ed-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="GENERATED">Generated (Unpublished)</option>
                <option value="WITHHELD">Withheld</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <BulkActionToolbar
            selection={bulk}
            totalMatchingCount={cards.length}
            currentPageIds={cards.map((c) => c.id)}
            entityName="Admit Cards"
            actions={[
              {
                id: 'publish-selected',
                label: 'Publish to Portal',
                icon: <Send size={16} />,
                variant: 'primary',
                onClick: () => handleBulkPublish('PUBLISH'),
              },
              {
                id: 'unpublish-selected',
                label: 'Unpublish / Withhold',
                icon: <Ban size={16} />,
                variant: 'outline',
                onClick: () => handleBulkPublish('WITHHOLD'),
              },
              {
                id: 'download-pdf',
                label: 'Download Batch A4 PDF',
                icon: <Download size={16} />,
                variant: 'outline',
                onClick: handleBulkDownload,
              },
            ]}
          />

          {/* Main Table */}
          <div className="ed-card">
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>
                      <SelectAllCheckbox pageIds={cards.map((c) => c.id)} selection={bulk} />
                    </th>
                    <th>Admit Card #</th>
                    <th>Candidate Information</th>
                    <th>Class & Roll</th>
                    <th>Exam & Center</th>
                    <th>Clearance Gate</th>
                    <th>Portal Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: bulk.isSelected(c.id) ? 'rgba(36, 76, 58, 0.06)' : undefined,
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <RowCheckbox id={c.id} checked={bulk.isSelected(c.id)} onToggle={bulk.toggleSelect} />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                        <div>{c.admitCardNumber}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          QR: {c.qrToken ? c.qrToken.slice(0, 10) + '...' : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.studentProfile?.user?.firstName} {c.studentProfile?.user?.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Adm: {c.studentProfile?.admissionNumber || 'N/A'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{c.className || c.studentProfile?.class?.name || 'Class 10'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Roll #{c.rollNumber || '00'}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.examTitle}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.centerName} • Room {c.roomNumber || 'TBA'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          {getClearanceBadge(c.clearanceStatus)}
                          {c.clearanceDetails?.reason && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.clearanceDetails.reason}>
                              {c.clearanceDetails.reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewCard(c)}
                            title="Interactive Preview"
                            className="ed-icon-btn"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleSingleDownload(c)}
                            title="Download A4 PDF"
                            className="ed-icon-btn"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setClearanceModalCard(c);
                              setClearanceAction(c.clearanceStatus === 'CLEARED' ? 'BLOCKED' : 'CLEARED');
                            }}
                            title="Manage Clearance Override"
                            className="ed-icon-btn"
                          >
                            <Shield size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        {cardsLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                            Loading admit card records...
                          </div>
                        ) : (
                          'No examination admit cards match the selected criteria.'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK GENERATION STUDIO */}
      {activeTab === 'bulk_generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="ed-card" style={{ gridColumn: 'span 2' }}>
            <div className="ed-card-header">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <GraduationCap size={20} style={{ color: 'var(--color-primary)' }} />
                Examination Hall Ticket Batch Generator
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Generate official A4 admit cards for an entire class, section, or school cohort. Automatically compiles candidate details, examination papers, subject timetables, and clearance status.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLaunchBulkGeneration(e); }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Examination Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkExamTitle}
                    onChange={(e) => setBulkExamTitle(e.target.value)}
                    placeholder="e.g. Annual Final Examination 2026-2027"
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Examination Category
                  </label>
                  <select
                    value={bulkExamType}
                    onChange={(e) => setBulkExamType(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="ANNUAL">Annual / Final Examination</option>
                    <option value="MID_TERM">Mid-Term Examination</option>
                    <option value="QUARTERLY">Quarterly Assessment</option>
                    <option value="PRE_BOARD">Pre-Board Examination</option>
                    <option value="PRACTICAL">Practical Assessment</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Class (Leave empty for All Classes)
                  </label>
                  <select
                    value={bulkClass}
                    onChange={(e) => setBulkClass(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">All Enrolled Classes</option>
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    value={bulkSection}
                    onChange={(e) => setBulkSection(e.target.value)}
                    placeholder="e.g. Section A"
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Examination Center Name
                  </label>
                  <input
                    type="text"
                    value={bulkCenterName}
                    onChange={(e) => setBulkCenterName(e.target.value)}
                    placeholder="Main Campus Examination Hall"
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Default Room / Hall Number
                  </label>
                  <input
                    type="text"
                    value={bulkRoomNumber}
                    onChange={(e) => setBulkRoomNumber(e.target.value)}
                    placeholder="e.g. Hall-101"
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Candidate Rules & Exam Instructions
                </label>
                <textarea
                  rows={4}
                  value={bulkInstructions}
                  onChange={(e) => setBulkInstructions(e.target.value)}
                  className="ed-textarea"
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>

              {/* Clearance Policy Controls */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                  Institutional Clearance Rule Enforcement
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enforceFeeCheck}
                      onChange={(e) => setEnforceFeeCheck(e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enforce Fee Clearance Check</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Mark PENDING_FEES if unpaid invoice exceeds ₹{feeThreshold}
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enforceAttendanceCheck}
                      onChange={(e) => setEnforceAttendanceCheck(e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enforce Attendance Minimum</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Mark PENDING_ATTENDANCE if attendance is below {attendanceThreshold}%
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Inline Progress & Feedback Alert */}
              {feedbackMsg && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    backgroundColor: feedbackMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: feedbackMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${feedbackMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {feedbackMsg.type === 'success' ? (
                      <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
                    )}
                    <span>{feedbackMsg.text}</span>
                  </div>
                  {feedbackMsg.type === 'success' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('directory')}
                      style={{ flexShrink: 0 }}
                    >
                      View in Directory
                    </Button>
                  )}
                </div>
              )}

              <div style={{ paddingTop: '8px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={generating}
                  disabled={generating}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLaunchBulkGeneration(e);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.95rem',
                    cursor: generating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Generating Cohort Hall Tickets...
                    </>
                  ) : (
                    <>
                      <FileCheck size={16} />
                      Launch Batch Generation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Information & Live Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="ed-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                Batch Generation Rules
              </h3>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '16px' }}>
                <li>
                  <strong>Unique Numbering:</strong> Each student receives a unique institutional serial code (e.g. <span style={{ fontFamily: 'monospace' }}>AC-2026-STU-1001</span>).
                </li>
                <li>
                  <strong>Dynamic Timetable:</strong> Exam papers, start times, durations, and room assignments are resolved per class.
                </li>
                <li>
                  <strong>QR Security Token:</strong> Generates a cryptographically unique token verifiable by invigilators via camera without exposing private PII.
                </li>
                <li>
                  <strong>Initial State:</strong> Cards are generated in <span style={{ fontFamily: 'monospace' }}>GENERATED</span> state and remain unpublished until reviewed.
                </li>
              </ul>
            </div>

            {bulkResult && (
              <div className="ed-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                  Generation Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>{bulkResult.generatedCount}</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Cards Created / Updated</div>
                  </div>
                  <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309' }}>{bulkResult.skippedCount}</div>
                    <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Candidates Skipped</div>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setActiveTab('directory');
                      setExamFilter(bulkExamTitle);
                    }}
                  >
                    View All Generated Cards in Directory &rarr;
                  </Button>
                </div>

                {bulkResult.skipped && bulkResult.skipped.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Skipped Reasons:</div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bulkResult.skipped.map((s: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-default)' }}>
                          <span style={{ fontFamily: 'monospace' }}>{s.admissionNumber || s.studentId}</span>
                          <span style={{ color: '#d97706', fontWeight: 600 }}>{s.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLEARANCE GATEKEEPER */}
      {activeTab === 'clearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-card">
            <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
                  Clearance Gatekeeper & Administrative Overrides
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Candidates with unpaid fee balances, low attendance, or administrative blocks. Cards in withheld status cannot be viewed or downloaded by students.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleBulkPublish('PUBLISH')}
                disabled={cards.filter((c) => c.clearanceStatus === 'CLEARED' && c.status !== 'PUBLISHED').length === 0}
              >
                <Send size={16} />
                Publish All Cleared Cards
              </Button>
            </div>

            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Class & Roll</th>
                    <th>Exam Title</th>
                    <th>Clearance Status</th>
                    <th>Disqualification Reason</th>
                    <th>Portal State</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards
                    .filter((c) => c.clearanceStatus !== 'CLEARED')
                    .map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {c.studentProfile?.user?.firstName} {c.studentProfile?.user?.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Adm: {c.studentProfile?.admissionNumber || 'N/A'}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {c.className || c.studentProfile?.class?.name} • Roll #{c.rollNumber}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.examTitle}</td>
                        <td>{getClearanceBadge(c.clearanceStatus)}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {c.clearanceDetails?.reason ||
                            (c.clearanceStatus === 'PENDING_FEES'
                              ? `Fee dues outstanding (₹${c.clearanceDetails?.unpaidFeeBalance || 0})`
                              : c.clearanceStatus === 'PENDING_ATTENDANCE'
                              ? `Attendance at ${c.clearanceDetails?.attendancePercentage || 0}%`
                              : 'Administrative hold')}
                        </td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setClearanceModalCard(c);
                              setClearanceAction('CLEARED');
                            }}
                          >
                            Grant Clearance Override
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {cards.filter((c) => c.clearanceStatus !== 'CLEARED').length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#15803d' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', color: '#16a34a' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>All candidates are cleared for examinations!</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No students currently require clearance intervention.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIMETABLE REFERENCE */}
      {activeTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-card">
            <div className="ed-card-header">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                Examination Timetable Reference
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Configured subject examination schedules in PostgreSQL. These entries automatically populate candidate admit cards.
              </p>
            </div>

            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Examination</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Start Time & Duration</th>
                    <th>Room Allocation</th>
                    <th>Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{s.name || s.examType}</td>
                      <td style={{ fontSize: '0.85rem' }}>{s.className}</td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>{s.subjectCode}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(s.examDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {s.startTime} ({s.durationMinutes} mins)
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {s.roomNumber || 'Main Hall'}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {s.maxMarks} (Pass: {s.passMarks})
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No subject schedules found in the examination database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INTERACTIVE ADMIT CARD PREVIEW */}
      {previewCard && (
        <Modal
          isOpen={!!previewCard}
          onClose={() => setPreviewCard(null)}
          title="Official Examination Hall Ticket"
          subtitle={`Admit Card #${previewCard.admitCardNumber}`}
          maxWidth="780px"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {getStatusBadge(previewCard.status)}
                {getClearanceBadge(previewCard.clearanceStatus)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPreviewCard(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSingleDownload(previewCard)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download A4 PDF
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-4 border-2 border-slate-900 rounded-lg bg-white text-slate-900 space-y-4 font-sans">
            {/* Header */}
            <div className="text-center border-b-2 border-indigo-900 pb-3">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                {branding.schoolName || 'EduNexa Central Academy'}
              </h2>
              <div className="text-xs text-slate-600 font-medium">
                {branding.address || 'Knowledge Promenade, Institutional City'} • Affiliation #{branding.code || 'EDUNEXA-2026'}
              </div>
              <div className="mt-2 inline-block px-4 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded">
                Official Examination Admit Card • Hall Ticket
              </div>
            </div>

            {/* Candidate & Exam Metadata Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Candidate Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {previewCard.studentProfile?.user?.firstName} {previewCard.studentProfile?.user?.lastName}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Admission Number</span>
                <span className="font-mono font-bold text-slate-800">
                  {previewCard.studentProfile?.admissionNumber || 'ADM-2026'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Roll Number</span>
                <span className="font-bold text-slate-900 text-sm">
                  #{previewCard.rollNumber || '00'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Class & Section</span>
                <span className="font-bold text-slate-800">
                  {previewCard.className || previewCard.studentProfile?.class?.name} - {previewCard.sectionName || previewCard.studentProfile?.section?.name || 'A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Examination</span>
                <span className="font-bold text-indigo-700">{previewCard.examTitle}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Center Name</span>
                <span className="font-medium text-slate-800">{previewCard.centerName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Assigned Room</span>
                <span className="font-bold text-slate-900 font-mono">{previewCard.roomNumber || 'TBA'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">QR Verification</span>
                <span className="font-mono text-[10px] text-slate-500 truncate block">
                  {previewCard.qrToken ? previewCard.qrToken.slice(0, 16) + '...' : 'SECURE'}
                </span>
              </div>
            </div>

            {/* Subject Timetable Table */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Examination Schedule & Papers
              </div>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Timing</th>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-3">Paper Code</th>
                      <th className="py-2 px-3 text-right">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Array.isArray(previewCard.timetable) && previewCard.timetable.length > 0 ? (
                      previewCard.timetable.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.examDate}</td>
                          <td className="py-2 px-3 text-slate-700">{item.startTime} ({item.durationMinutes}m)</td>
                          <td className="py-2 px-3 font-bold text-indigo-900">{item.subjectName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{item.subjectCode}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">{item.roomNumber || previewCard.roomNumber || 'TBA'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-center text-slate-400">
                          Subject papers schedule pending publication by department coordinator.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Candidate Instructions */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Mandatory Examination Rules:</span>
              <p className="whitespace-pre-line leading-relaxed">
                {previewCard.candidateInstructions || 'Present this printed admit card and institutional ID at the center gate. Electronic devices strictly barred.'}
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-4 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 mb-1 h-6"></div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Candidate Signature</span>
              </div>
              <div>
                <div className="border-b border-slate-400 mb-1 h-6"></div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Invigilator Verification</span>
              </div>
              <div>
                <div className="border-b border-slate-400 mb-1 h-6"></div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Controller of Examinations</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CLEARANCE OVERRIDE */}
      {clearanceModalCard && (
        <Modal
          isOpen={!!clearanceModalCard}
          onClose={() => setClearanceModalCard(null)}
          title="Administrative Clearance Override"
          subtitle={`Candidate: ${clearanceModalCard.studentProfile?.user?.firstName} ${clearanceModalCard.studentProfile?.user?.lastName} (Adm: ${clearanceModalCard.studentProfile?.admissionNumber})`}
          maxWidth="520px"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setClearanceModalCard(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={handleSaveClearanceOverride}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {actionLoading ? 'Updating...' : 'Save Clearance State'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 tracking-wider mb-1">
                Target Clearance Status
              </label>
              <select
                value={clearanceAction}
                onChange={(e: any) => setClearanceAction(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CLEARED">CLEARED (Permit Hall Ticket Publication)</option>
                <option value="BLOCKED">BLOCKED (Revoke Hall Ticket & Exam Entry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 tracking-wider mb-1">
                Administrative Justification / Reason *
              </label>
              <textarea
                rows={3}
                required
                value={clearanceReason}
                onChange={(e) => setClearanceReason(e.target.value)}
                placeholder="e.g. Special fee payment plan approved by Director; or Medical leave exemption verified."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                All clearance modifications are logged to the audit trail with coordinator identity.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
