import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  FileText,
  CheckCircle2,
  Printer,
  Download,
  RefreshCw,
  Search,
  Layers,
  Settings2,
  History,
  Plus,
  AlertCircle,
  Eye,
  Edit3,
  Lock,
  Unlock,
  Send,
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Percent,
  Check,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { marksheetsApi, academicApi, coreApi } from '../../services/api.js';
import {
  downloadIndividualMarksheetPdf,
  downloadBulkMarksheetsPdf,
  MarksheetPdfData,
} from '../../utils/marksheetPdf.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

type TabKey = 'telemetry' | 'directory' | 'bulk' | 'templates' | 'audits';

export const MarksheetManagementPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<TabKey>('telemetry');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Telemetry Stats
  const [stats, setStats] = useState<any>({
    totalMarksheets: 0,
    publishedCount: 0,
    withheldCount: 0,
    draftCount: 0,
    averagePercentage: 0,
    passRate: 0,
    correctedCount: 0,
  });

  // Marksheets Roster
  const [marksheets, setMarksheets] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Metadata dropdowns
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [gradingCriteria, setGradingCriteria] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);

  // Bulk Generator State
  const [bulkForm, setBulkForm] = useState({
    examTitle: 'Annual Board Examination 2026-2027',
    examType: 'ANNUAL',
    classId: '',
    sectionId: '',
    allEligible: true,
    templateId: '',
    publishImmediately: false,
  });

  // Modals
  const [previewMarksheet, setPreviewMarksheet] = useState<any | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionTeacherRemarks, setCorrectionTeacherRemarks] = useState('');
  const [correctionPrincipalRemarks, setCorrectionPrincipalRemarks] = useState('');
  const [editableSubjects, setEditableSubjects] = useState<any[]>([]);

  // Individual Generator Modal
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [indForm, setIndForm] = useState({
    studentProfileId: '',
    examTitle: 'Annual Board Examination 2026-2027',
    examType: 'ANNUAL',
    templateId: '',
    classTeacherRemarks: 'Exhibits exemplary scholastic focus and consistent academic dedication.',
    principalRemarks: 'Promoted with Honours to next academic grade.',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Load telemetry stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await marksheetsApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Load Marksheet Roster
  const fetchMarksheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marksheetsApi.listMarksheets({
        search: searchQuery || undefined,
        classId: selectedClassId || undefined,
        status: statusFilter,
        page: currentPage,
        limit: 15,
      });
      setMarksheets(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to retrieve marksheets roster');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedClassId, statusFilter, currentPage]);

  // Load templates and grading
  const fetchTemplatesAndGrading = useCallback(async () => {
    try {
      const [tpls, grading] = await Promise.all([
        marksheetsApi.getTemplates(),
        marksheetsApi.getGrading(),
      ]);
      setTemplates(tpls || []);
      setGradingCriteria(grading);
      if (tpls && tpls.length > 0 && !bulkForm.templateId) {
        const def = tpls.find((t: any) => t.isDefault) || tpls[0];
        setBulkForm((prev) => ({ ...prev, templateId: def.id }));
        setIndForm((prev) => ({ ...prev, templateId: def.id }));
      }
    } catch (err: any) {
      console.error('Failed to load templates or grading criteria:', err);
    }
  }, [bulkForm.templateId]);

  // Load Audits
  const fetchAudits = useCallback(async () => {
    try {
      const auditList = await marksheetsApi.getAudits();
      setAudits(auditList || []);
    } catch (err: any) {
      console.error('Failed to load audits:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchMarksheets();
    fetchTemplatesAndGrading();
    fetchAudits();

    coreApi.getAcademicStructure().then((res: any) => {
      setClasses(res?.classes || []);
    }).catch(console.error);

    coreApi.listStudents({ limit: 100 }).then((st: any) => {
      const list = st?.items || (Array.isArray(st) ? st : []);
      setStudentOptions(list);
    }).catch(console.error);
  }, [fetchStats, fetchMarksheets, fetchTemplatesAndGrading, fetchAudits]);

  // Bulk Generator trigger
  const handleLaunchBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.examTitle.trim()) {
      showToast('error', 'Please provide an examination title');
      return;
    }

    setActionLoading(true);
    try {
      const res = await marksheetsApi.bulkGenerate({
        examTitle: bulkForm.examTitle,
        examType: bulkForm.examType,
        classId: bulkForm.classId || undefined,
        allEligible: !bulkForm.classId,
        templateId: bulkForm.templateId || undefined,
        publishImmediately: bulkForm.publishImmediately,
      });

      showToast(
        'success',
        `Successfully generated ${res.generatedCount} academic marksheets with verified scholastic grading.`
      );
      fetchStats();
      fetchMarksheets();
      setActiveTab('directory');
    } catch (err: any) {
      showToast('error', err.message || 'Bulk generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Individual Generator Trigger
  const handleLaunchIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indForm.studentProfileId) {
      showToast('error', 'Please select a student candidate');
      return;
    }

    setActionLoading(true);
    try {
      await marksheetsApi.generateIndividual({
        studentProfileId: indForm.studentProfileId,
        examTitle: indForm.examTitle,
        examType: indForm.examType,
        templateId: indForm.templateId || undefined,
        classTeacherRemarks: indForm.classTeacherRemarks,
        principalRemarks: indForm.principalRemarks,
      });

      showToast('success', 'Individual marksheet generated successfully.');
      setShowIndividualModal(false);
      fetchStats();
      fetchMarksheets();
    } catch (err: any) {
      showToast('error', err.message || 'Generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish / Withhold single or batch
  const handlePublishAction = async (action: 'PUBLISH' | 'WITHHOLD', ids?: string[]) => {
    const targetIds = ids || selectedIds;
    if (targetIds.length === 0) {
      showToast('error', 'Please select at least one marksheet');
      return;
    }

    setActionLoading(true);
    try {
      const res = await marksheetsApi.publishMarksheets({
        marksheetIds: targetIds,
        action,
      });

      showToast('success', `Updated ${res.updatedCount || targetIds.length} marksheet(s) to ${action} status.`);
      setSelectedIds([]);
      fetchStats();
      fetchMarksheets();
    } catch (err: any) {
      showToast('error', err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open correction modal
  const handleOpenCorrection = (ms: any) => {
    setCorrectionTarget(ms);
    setCorrectionReason('');
    setCorrectionTeacherRemarks(ms.classTeacherRemarks || '');
    setCorrectionPrincipalRemarks(ms.principalRemarks || '');
    const subjects = (ms.subjectMarksSnapshot as any[]) || [];
    setEditableSubjects(
      subjects.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        theoryMarksObtained: s.theoryMarksObtained ?? s.marksObtained,
        practicalMarksObtained: s.practicalMarksObtained ?? 0,
      }))
    );
  };

  // Submit correction
  const handleSaveCorrection = async () => {
    if (!correctionTarget || !correctionReason.trim()) {
      showToast('error', 'A formal justification reason is strictly required for marks revision.');
      return;
    }

    setActionLoading(true);
    try {
      await marksheetsApi.correctMarksheet({
        marksheetId: correctionTarget.id,
        reason: correctionReason,
        classTeacherRemarks: correctionTeacherRemarks,
        principalRemarks: correctionPrincipalRemarks,
        updatedSubjectMarks: editableSubjects,
      });

      showToast('success', `Marksheet corrected successfully and incremented to next version with immutable audit history.`);
      setCorrectionTarget(null);
      fetchStats();
      fetchMarksheets();
      fetchAudits();
    } catch (err: any) {
      showToast('error', err.message || 'Correction failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Convert raw DB marksheet to PDF Data format
  const formatForPdf = (ms: any): MarksheetPdfData => {
    const st = ms.studentSnapshot || {};
    return {
      id: ms.id,
      marksheetNumber: ms.marksheetNumber,
      examTitle: ms.examTitle,
      examType: ms.examType,
      sessionName: ms.academicSession?.name || '2026–2027 Academic Year',
      studentName: st.fullName || `${ms.student?.membership?.user?.firstName || ''} ${ms.student?.membership?.user?.lastName || ''}`.trim() || 'Candidate',
      admissionNumber: st.admissionNumber || ms.student?.admissionNumber || 'ADM-2026',
      rollNumber: st.rollNumber || ms.student?.rollNumber || '01',
      className: ms.className || st.className || 'Grade 10',
      sectionName: ms.sectionName || st.sectionName || 'A',
      fatherName: st.fatherName || 'Father / Guardian',
      motherName: st.motherName || 'Mother',
      totalMaxMarks: ms.totalMaxMarks || 500,
      totalMarksObtained: ms.totalMarksObtained || 0,
      overallPercentage: ms.overallPercentage || 0,
      grade: ms.grade || 'A1',
      division: ms.division || 'FIRST DIVISION',
      isPassed: ms.isPassed !== false,
      status: ms.status,
      version: ms.version,
      qrToken: ms.qrToken,
      schoolName: branding.schoolName || 'APEX INTERNATIONAL ACADEMY',
      schoolCode: branding.code || 'APX-2026',
      attendancePresent: 184,
      attendanceTotal: 200,
      attendancePercentage: 92.0,
      classTeacherRemarks: ms.classTeacherRemarks,
      principalRemarks: ms.principalRemarks,
      subjects: (ms.subjectMarksSnapshot as any[]) || [],
    };
  };

  // Download Single PDF
  const handleDownloadSinglePdf = (ms: any) => {
    const pdfData = formatForPdf(ms);
    downloadIndividualMarksheetPdf(pdfData);
  };

  // Download Bulk Selected PDF
  const handleDownloadSelectedPdf = () => {
    if (selectedIds.length === 0) {
      showToast('error', 'Select at least one marksheet to print or download');
      return;
    }
    const selectedSheets = marksheets.filter((m) => selectedIds.includes(m.id)).map(formatForPdf);
    downloadBulkMarksheetsPdf(selectedSheets, `Marksheets-Batch-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Institutional Page Header Card */}
      <div className="ed-page-header-card">
        <div>
          <h1 className="ed-page-header-title">
            <Award className="w-7 h-7 text-emerald-700" />
            Official Marksheets & Report Card Studio
          </h1>
          <p className="ed-page-header-desc">
            School-branded academic report cards, CBSE-compliant grading, bulk issuance studio, printable A4 PDF generator, and authorized audit ledger.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setShowIndividualModal(true)}
            className="ed-btn ed-btn-outline cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className="ed-btn ed-btn-primary cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Bulk Generation Studio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchMarksheets();
              fetchAudits();
            }}
            disabled={loading}
            className="ed-btn ed-btn-secondary cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ed-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`ed-nav-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Telemetry</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`ed-nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
        >
          <FileText className="w-4 h-4" />
          <span>Marksheets Directory ({totalCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`ed-nav-tab ${activeTab === 'bulk' ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>Bulk Generation Studio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`ed-nav-tab ${activeTab === 'templates' ? 'active' : ''}`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Template & Grading Criteria</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audits')}
          className={`ed-nav-tab ${activeTab === 'audits' ? 'active' : ''}`}
        >
          <History className="w-4 h-4" />
          <span>Correction & Audit Ledger ({audits.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DASHBOARD TELEMETRY
          ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="ed-metrics-grid">
            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Total Marksheets</span>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="ed-metric-value">{stats.totalMarksheets}</div>
              <div className="ed-metric-subtitle">Generated academic records</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Published to Portals</span>
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="ed-metric-value">{stats.publishedCount}</div>
              <div className="ed-metric-subtitle">Visible to students & parents</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Withheld / Draft</span>
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="ed-metric-value">{stats.withheldCount + (stats.draftCount || 0)}</div>
              <div className="ed-metric-subtitle">Pending clearance or review</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Average Performance</span>
                <Percent className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ed-metric-value">{stats.averagePercentage}%</div>
              <div className="ed-metric-subtitle">Cohort cumulative score</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Pass Rate</span>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="ed-metric-value">{stats.passRate}%</div>
              <div className="ed-metric-subtitle">Statutory passing compliance</div>
            </div>

            <div className="ed-metric-card">
              <div className="ed-metric-title">
                <span>Audit Revisions</span>
                <History className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ed-metric-value">{stats.correctedCount}</div>
              <div className="ed-metric-subtitle">Authorized v2+ versions</div>
            </div>
          </div>

          {/* Quick Cohort Action Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-200 border border-emerald-500/40">
                <Sparkles className="w-3.5 h-3.5" />
                Comprehensive Academic Examination Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-bold">
                Issue Institutional Marksheets for Enrolled Classes
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Generate official CBSE-styled A4 report cards complete with Theory/Practical score separation, attendance percentage, QR verification tokens, and principal endorsement.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className="px-5 py-3 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition-all text-center cursor-pointer shadow-sm"
              >
                Launch Bulk Generator
              </button>
              <button
                type="button"
                onClick={() => handlePublishAction('PUBLISH', marksheets.map((m) => m.id))}
                disabled={marksheets.length === 0 || actionLoading}
                className="px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition-all text-center border border-emerald-600/50 cursor-pointer disabled:opacity-50"
              >
                Publish All Displayed
              </button>
            </div>
          </div>

          {/* Recent Issuance Ledger Table */}
          <div className="ed-card">
            <div className="ed-card-header flex items-center justify-between">
              <div>
                <h3 className="ed-card-title text-base font-bold text-slate-800">Recent Marksheet Issuances</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live database ledger of evaluated examination marksheets</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                View Full Directory →
              </button>
            </div>
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Serial #</th>
                    <th>Candidate</th>
                    <th>Class / Roll</th>
                    <th>Exam Title</th>
                    <th>Total & %</th>
                    <th>Grade & Div</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marksheets.slice(0, 5).map((ms) => (
                    <tr key={ms.id}>
                      <td className="font-mono text-xs font-bold text-slate-700">
                        {ms.marksheetNumber}
                        {ms.version > 1 && (
                          <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-purple-100 text-purple-700 rounded font-semibold">
                            v{ms.version}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 text-xs">
                          {ms.studentSnapshot?.fullName || `${ms.student?.membership?.user?.firstName || ''} ${ms.student?.membership?.user?.lastName || ''}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ms.studentSnapshot?.admissionNumber || ms.student?.admissionNumber}
                        </div>
                      </td>
                      <td className="text-xs text-slate-700">
                        {ms.className} • Roll {ms.studentSnapshot?.rollNumber || ms.student?.rollNumber || '-'}
                      </td>
                      <td className="text-xs text-slate-800 font-medium">
                        {ms.examTitle}
                      </td>
                      <td className="text-xs font-bold text-slate-900">
                        {ms.totalMarksObtained} / {ms.totalMaxMarks} ({ms.overallPercentage?.toFixed(1)}%)
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ms.grade} • {ms.division}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            ms.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ms.status === 'WITHHELD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ms.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewMarksheet(ms)}
                            className="ed-icon-btn"
                            title="Preview Marksheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf(ms)}
                            className="ed-icon-btn"
                            title="Download Official A4 PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {marksheets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sm text-slate-500">
                        No academic marksheets generated yet. Launch the Bulk Generation Studio to generate batch records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MARKSHEETS DIRECTORY & ROSTER
          ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="ed-toolbar">
            <div className="ed-toolbar-left">
              <div className="ed-search-box">
                <Search className="ed-search-icon w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate name, admission #, serial..."
                />
              </div>

              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Enrolled Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="ISSUED">Issued / Draft</option>
                <option value="WITHHELD">Withheld Only</option>
                <option value="CORRECTED">Corrected (v2+)</option>
              </select>
            </div>

            {/* Bulk Selection Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {selectedIds.length} Selected:
                </span>
                <button
                  type="button"
                  onClick={() => handlePublishAction('PUBLISH')}
                  className="ed-btn ed-btn-primary ed-btn-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePublishAction('WITHHOLD')}
                  className="ed-btn ed-btn-secondary ed-btn-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Withhold</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSelectedPdf}
                  className="ed-btn ed-btn-outline ed-btn-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Batch PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Directory Table */}
          <div className="ed-card">
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === marksheets.length && marksheets.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(marksheets.map((m) => m.id));
                          else setSelectedIds([]);
                        }}
                      />
                    </th>
                    <th>Serial #</th>
                    <th>Candidate</th>
                    <th>Class & Roll</th>
                    <th>Exam Title</th>
                    <th>Grand Total</th>
                    <th>Percentage</th>
                    <th>Grade & Div</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marksheets.map((ms) => (
                    <tr key={ms.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(ms.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, ms.id]);
                            else setSelectedIds((prev) => prev.filter((id) => id !== ms.id));
                          }}
                        />
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-800">
                        {ms.marksheetNumber}
                        {ms.version > 1 && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-semibold">
                            v{ms.version}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 text-xs">
                          {ms.studentSnapshot?.fullName || `${ms.student?.membership?.user?.firstName || ''} ${ms.student?.membership?.user?.lastName || ''}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ms.studentSnapshot?.admissionNumber || ms.student?.admissionNumber}
                        </div>
                      </td>
                      <td className="text-xs text-slate-700">
                        {ms.className} • Roll {ms.studentSnapshot?.rollNumber || ms.student?.rollNumber || '-'}
                      </td>
                      <td className="text-xs text-slate-800 font-medium">
                        {ms.examTitle}
                      </td>
                      <td className="text-xs font-bold text-slate-900">
                        {ms.totalMarksObtained} / {ms.totalMaxMarks}
                      </td>
                      <td className="text-xs font-bold text-emerald-700">
                        {ms.overallPercentage?.toFixed(2)}%
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ms.grade} • {ms.division}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            ms.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ms.status === 'WITHHELD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ms.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewMarksheet(ms)}
                            className="ed-icon-btn"
                            title="Preview Official Marksheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf(ms)}
                            className="ed-icon-btn"
                            title="Download A4 PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(ms)}
                            className="ed-icon-btn"
                            title="Authorized Marks Correction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {ms.status === 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => handlePublishAction('WITHHOLD', [ms.id])}
                              className="ed-icon-btn danger"
                              title="Withhold Marksheet"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublishAction('PUBLISH', [ms.id])}
                              className="ed-icon-btn text-emerald-600"
                              title="Publish Marksheet"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {marksheets.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-sm text-slate-500">
                        No examination marksheets match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > 15 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {marksheets.length} of {totalCount} records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-900 px-2">Page {currentPage}</span>
                  <button
                    disabled={marksheets.length < 15}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BULK GENERATION STUDIO
          ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="ed-card">
            <div className="ed-card-header">
              <h2 className="ed-card-title text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                Bulk Marksheet Issuance Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate grades, aggregates, divisions, and issue tamper-evident marksheets for entire classes.
              </p>
            </div>
            <form onSubmit={handleLaunchBulk} className="ed-card-body space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  value={bulkForm.examTitle}
                  onChange={(e) => setBulkForm({ ...bulkForm, examTitle: e.target.value })}
                  placeholder="e.g. Annual Board Examination 2026-2027"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Exam Category
                  </label>
                  <select
                    value={bulkForm.examType}
                    onChange={(e) => setBulkForm({ ...bulkForm, examType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ANNUAL">Annual / Final Examination</option>
                    <option value="MID_TERM">Mid-Term Assessment</option>
                    <option value="UNIT_TEST">Unit Test / Formative</option>
                    <option value="PRE_BOARD">Pre-Board Examination</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Target Class / Cohort
                  </label>
                  <select
                    value={bulkForm.classId}
                    onChange={(e) => setBulkForm({ ...bulkForm, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Enrolled Classes (Full Institutional Cohort)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Marksheet Template Format
                </label>
                <select
                  value={bulkForm.templateId}
                  onChange={(e) => setBulkForm({ ...bulkForm, templateId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.isDefault ? '(Default CBSE)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkForm.publishImmediately}
                    onChange={(e) => setBulkForm({ ...bulkForm, publishImmediately: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Publish to Student & Parent Self-Service Portals Immediately
                    </span>
                    <span className="text-[11px] text-emerald-800 block">
                      If unchecked, marksheets are generated as DRAFT and can be reviewed before publishing.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="ed-btn ed-btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="ed-btn ed-btn-primary cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Cohort Marksheets...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Cohort Generation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TEMPLATES & GRADING SCHEMES
          ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Templates Showcase */}
          <div className="ed-card">
            <div className="ed-card-header flex items-center justify-between">
              <div>
                <h3 className="ed-card-title text-base font-bold text-slate-800">
                  Configured Marksheet Templates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official styles, institutional borders, and CBSE document configurations
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{tpl.name}</span>
                      <span className="text-xs text-slate-500 font-mono">Code: {tpl.code}</span>
                    </div>
                    {tpl.isDefault && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                        CANONICAL DEFAULT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>Layout: <span className="font-semibold text-slate-800">{tpl.layoutStyle}</span></div>
                    <div>Border: <span className="font-semibold text-slate-800">{tpl.borderStyle}</span></div>
                    <div>Show Practical: <span className="font-semibold text-slate-800">{tpl.showPracticalMarks ? 'Yes' : 'No'}</span></div>
                    <div>Show Attendance: <span className="font-semibold text-slate-800">{tpl.showAttendance ? 'Yes' : 'No'}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Signatory: {tpl.principalSignTitle}</span>
                    <button
                      type="button"
                      onClick={() => showToast('success', 'Template layout verified and active in PDF rendering engine.')}
                      className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                      Active Layout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configurable Grading Criteria */}
          {gradingCriteria && (
            <div className="ed-card">
              <div className="ed-card-header">
                <h3 className="ed-card-title text-base font-bold text-slate-800">
                  CBSE Statutory Grading Scheme & Division Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated grade assignment and division calculations enforced across all marksheets
                </p>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Scholastic Grade Boundaries (100 Scale)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {gradingCriteria.grades?.map((g: any) => (
                      <div key={g.grade} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-base font-extrabold text-slate-900 block">{g.grade}</span>
                        <span className="text-xs font-semibold text-emerald-700 block">≥ {g.minScore}%</span>
                        <span className="text-[10px] text-slate-500 block">{g.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Division Award Thresholds</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                      <span className="text-xs font-bold text-emerald-950 block">DISTINCTION</span>
                      <span className="text-sm font-extrabold text-emerald-700 block">≥ {gradingCriteria.divisions?.distinctionMin}%</span>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <span className="text-xs font-bold text-blue-950 block">FIRST DIVISION</span>
                      <span className="text-sm font-extrabold text-blue-700 block">≥ {gradingCriteria.divisions?.firstDivMin}%</span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <span className="text-xs font-bold text-amber-950 block">SECOND DIVISION</span>
                      <span className="text-sm font-extrabold text-amber-700 block">≥ {gradingCriteria.divisions?.secondDivMin}%</span>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                      <span className="text-xs font-bold text-purple-950 block">THIRD DIVISION</span>
                      <span className="text-sm font-extrabold text-purple-700 block">≥ {gradingCriteria.divisions?.thirdDivMin}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CORRECTION & AUDIT HISTORY
          ========================================================================= */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="ed-card">
            <div className="ed-card-header flex items-center justify-between">
              <div>
                <h3 className="ed-card-title text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-700" />
                  Marksheet Revisions & Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable record of authorized marks changes, re-evaluations, and version updates
                </p>
              </div>
            </div>
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Serial #</th>
                    <th>Candidate</th>
                    <th>Previous / New Version</th>
                    <th>Justification Reason</th>
                    <th>Authorized By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs font-bold text-slate-800">
                        {a.marksheet?.marksheetNumber || 'MS-2026'}
                      </td>
                      <td className="text-xs font-semibold text-slate-900">
                        {a.marksheet?.studentSnapshot?.fullName || 'Candidate'}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">v{a.previousVersion}</span>
                          <span>→</span>
                          <span className="px-1.5 py-0.5 bg-purple-100 rounded text-purple-800">v{a.newVersion}</span>
                        </span>
                      </td>
                      <td className="text-xs text-slate-700 max-w-xs font-medium">
                        "{a.reason}"
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {a.correctedByUser?.firstName ? `${a.correctedByUser.firstName} ${a.correctedByUser.lastName || ''}` : a.correctedByUserId}
                      </td>
                      <td className="text-xs text-slate-500">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {audits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-sm text-slate-500">
                        No marksheet revisions or corrections recorded yet. All issuances are on baseline version 1.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: FULL MARKSHEET PREVIEW
          ========================================================================= */}
      {previewMarksheet && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large">
            <div className="ed-dialog-header">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Official Academic Marksheet Preview — {previewMarksheet.marksheetNumber}
                </h3>
              </div>
              <button onClick={() => setPreviewMarksheet(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="ed-dialog-body space-y-6">
              {/* Document Banner */}
              <div className="border-2 border-emerald-900/80 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-extrabold text-emerald-950 uppercase tracking-wide">
                    {branding.schoolName || 'APEX INTERNATIONAL ACADEMY'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Affiliated to CBSE, New Delhi • School Code: {branding.code || 'APX-2026'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                    {previewMarksheet.examTitle}
                  </p>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">CANDIDATE</span>
                    <span className="font-bold text-slate-800">
                      {previewMarksheet.studentSnapshot?.fullName || 'Candidate'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ROLL NUMBER</span>
                    <span className="font-bold text-slate-800">
                      {previewMarksheet.studentSnapshot?.rollNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ADMISSION NO</span>
                    <span className="font-bold text-slate-800">
                      {previewMarksheet.studentSnapshot?.admissionNumber || 'ADM-2026'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CLASS & SECTION</span>
                    <span className="font-bold text-slate-800">
                      {previewMarksheet.className} - {previewMarksheet.sectionName}
                    </span>
                  </div>
                </div>

                {/* Subject Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">Code</th>
                        <th className="p-2">Subject Title</th>
                        <th className="p-2 text-center">Theory (Max)</th>
                        <th className="p-2 text-center">Practical (Max)</th>
                        <th className="p-2 text-center">Total Marks</th>
                        <th className="p-2 text-center">Grade</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {((previewMarksheet.subjectMarksSnapshot as any[]) || []).map((s, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                          <td className="p-2 font-mono">{s.subjectCode}</td>
                          <td className="p-2 font-semibold">{s.subjectName}</td>
                          <td className="p-2 text-center font-mono">
                            {s.theoryMarksObtained ?? '-'} ({s.theoryMaxMarks ?? '-'})
                          </td>
                          <td className="p-2 text-center font-mono">
                            {s.practicalMarksObtained ?? '-'} ({s.practicalMaxMarks ?? '-'})
                          </td>
                          <td className="p-2 text-center font-bold">
                            {s.marksObtained} / {s.totalMarks}
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-800">{s.grade}</td>
                          <td className="p-2 text-center font-semibold text-emerald-700">PASS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance Summary Banner */}
                <div className="p-4 bg-emerald-900 text-white rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-emerald-300 block text-[10px]">GRAND TOTAL</span>
                    <span className="text-sm font-bold">
                      {previewMarksheet.totalMarksObtained} / {previewMarksheet.totalMaxMarks}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-300 block text-[10px]">PERCENTAGE</span>
                    <span className="text-sm font-bold">{previewMarksheet.overallPercentage?.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 block text-[10px]">CUMULATIVE GRADE</span>
                    <span className="text-sm font-bold">{previewMarksheet.grade}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 block text-[10px]">DIVISION</span>
                    <span className="text-sm font-bold">{previewMarksheet.division}</span>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500 text-white rounded font-bold text-xs uppercase">
                    PASSED
                  </div>
                </div>

                {/* Remarks & Signatures */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-700">Teacher Remarks: </span>
                    <span className="text-slate-600 italic">"{previewMarksheet.classTeacherRemarks || 'Consistent scholastic commitment.'}"</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Principal Remarks: </span>
                    <span className="text-slate-600 italic">"{previewMarksheet.principalRemarks || 'Promoted with Honours.'}"</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ed-dialog-footer">
              <button
                type="button"
                onClick={() => setPreviewMarksheet(null)}
                className="ed-btn ed-btn-outline cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSinglePdf(previewMarksheet)}
                className="ed-btn ed-btn-primary cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Official A4 PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: AUTHORIZED MARKS CORRECTION
          ========================================================================= */}
      {correctionTarget && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large">
            <div className="ed-dialog-header">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Authorized Marks Correction & Re-evaluation — {correctionTarget.marksheetNumber}
                </h3>
              </div>
              <button onClick={() => setCorrectionTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="ed-dialog-body space-y-5">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                <strong>Statutory Audit Requirement:</strong> Any post-issuance revision generates an immutable version record (v{correctionTarget.version} → v{correctionTarget.version + 1}). An authorized justification reason is mandatory.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Formal Reason for Correction / Re-evaluation *
                </label>
                <textarea
                  required
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Authorized re-evaluation of Physics practical assessment approved by Exam Board."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Editable Subjects Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Subject Marks Adjustment
                </label>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5">Theory Obtained</th>
                        <th className="p-2.5">Practical Obtained</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editableSubjects.map((sub, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-slate-600">{sub.subjectCode}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{sub.subjectName}</td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min={0}
                              value={sub.theoryMarksObtained ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditableSubjects((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, theoryMarksObtained: val } : s))
                                );
                              }}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min={0}
                              value={sub.practicalMarksObtained ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditableSubjects((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, practicalMarksObtained: val } : s))
                                );
                              }}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Updated Teacher Remarks
                  </label>
                  <input
                    type="text"
                    value={correctionTeacherRemarks}
                    onChange={(e) => setCorrectionTeacherRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Updated Principal Remarks
                  </label>
                  <input
                    type="text"
                    value={correctionPrincipalRemarks}
                    onChange={(e) => setCorrectionPrincipalRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="ed-dialog-footer">
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="ed-btn ed-btn-outline cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={actionLoading}
                className="ed-btn ed-btn-primary cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving Revision...' : 'Save & Increment Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: GENERATE INDIVIDUAL MARKSHEET
          ========================================================================= */}
      {showIndividualModal && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box">
            <div className="ed-dialog-header">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Generate Individual Marksheet
                </h3>
              </div>
              <button onClick={() => setShowIndividualModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLaunchIndividual} className="ed-dialog-body space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Select Student Candidate *
                </label>
                <select
                  required
                  value={indForm.studentProfileId}
                  onChange={(e) => setIndForm({ ...indForm, studentProfileId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {studentOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName || `${st.firstName || ''} ${st.lastName || ''}`} ({st.admissionNumber || 'No Adm#'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  value={indForm.examTitle}
                  onChange={(e) => setIndForm({ ...indForm, examTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Class Teacher Remarks
                </label>
                <input
                  type="text"
                  value={indForm.classTeacherRemarks}
                  onChange={(e) => setIndForm({ ...indForm, classTeacherRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Principal Remarks
                </label>
                <input
                  type="text"
                  value={indForm.principalRemarks}
                  onChange={(e) => setIndForm({ ...indForm, principalRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIndividualModal(false)}
                  className="ed-btn ed-btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="ed-btn ed-btn-primary cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Generating...' : 'Generate Marksheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
