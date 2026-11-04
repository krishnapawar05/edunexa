import React, { useState, useEffect, useMemo } from 'react';
import {
  IdCard,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Shield,
  Ban,
  ExternalLink,
  Sparkles,
  Download,
  Printer,
  Users,
  GraduationCap,
  Layers,
  Palette,
  FileCheck,
  CheckSquare,
  Square,
  MinusSquare,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { idCardsApi } from '../../services/api.js';
import {
  downloadIndividualIdCardPdf,
  downloadBulkIdCardsPdf,
  IdCardRenderData,
  IdCardTemplateSettings,
} from '../../utils/idCardPdf.js';

type TabKey = 'dashboard' | 'students' | 'teachers' | 'staff' | 'bulk' | 'templates' | 'verify';

export const VirtualIdCardsPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Student Roster
  const [students, setStudents] = useState<any[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [studentSelectedIds, setStudentSelectedIds] = useState<string[]>([]);

  // Teacher Roster
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('ALL');
  const [teacherSelectedIds, setTeacherSelectedIds] = useState<string[]>([]);

  // Staff Roster
  const [staff, setStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');
  const [staffSelectedIds, setStaffSelectedIds] = useState<string[]>([]);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: 'Standard Institution Card',
    targetRole: 'ALL',
    isDefault: false,
    primaryColor: '#0f291e',
    secondaryColor: '#d4af37',
    headerTextColor: '#ffffff',
    cardOrientation: 'LANDSCAPE',
    showBloodGroup: true,
    showParentContact: true,
    showEmergencyPhone: true,
    showPrincipalSign: true,
    showSchoolSeal: true,
    showBarcode: true,
    customTermsText: 'Property of EduNexa Institution. If found, please return to campus administration.',
  });

  // Modals & Action Targets
  const [previewCard, setPreviewCard] = useState<any>(null);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState('Reported lost or institutional separation.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Generation Wizard state
  const [bulkWizard, setBulkWizard] = useState({
    targetType: 'STUDENT_CLASS',
    selectedClass: 'Grade 10',
    selectedSection: 'A',
    selectedDepartment: '',
    selectedTemplateId: '',
    isProcessing: false,
  });

  // Verification Testing
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // 1. Load Stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await idCardsApi.getDashboardStats();
      if (res) setStats(res.stats ? res : res.data || res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Load Students
  const loadStudents = async () => {
    try {
      setStudentLoading(true);
      const params: any = { limit: 100 };
      if (studentSearch) params.search = studentSearch;
      if (studentStatusFilter !== 'ALL') params.status = studentStatusFilter;
      const res = await idCardsApi.listStudents(params);
      setStudents(res?.students || res?.data?.students || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStudentLoading(false);
    }
  };

  // 3. Load Teachers
  const loadTeachers = async () => {
    try {
      setTeacherLoading(true);
      const params: any = { category: 'TEACHER', limit: 100 };
      if (teacherSearch) params.search = teacherSearch;
      if (teacherStatusFilter !== 'ALL') params.status = teacherStatusFilter;
      const res = await idCardsApi.listEmployees(params);
      setTeachers(res?.employees || res?.data?.employees || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setTeacherLoading(false);
    }
  };

  // 4. Load Staff
  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      const params: any = { category: 'STAFF', limit: 100 };
      if (staffSearch) params.search = staffSearch;
      if (staffStatusFilter !== 'ALL') params.status = staffStatusFilter;
      const res = await idCardsApi.listEmployees(params);
      setStaff(res?.employees || res?.data?.employees || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStaffLoading(false);
    }
  };

  // 5. Load Templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await idCardsApi.listTemplates();
      setTemplates(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadStats();
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'teachers') loadTeachers();
    if (activeTab === 'staff') loadStaff();
    if (activeTab === 'templates') loadTemplates();
  }, [activeTab]);

  // Handle Single Issue / Regenerate
  const handleGenerateIndividual = async (holderType: 'STUDENT' | 'TEACHER' | 'STAFF', profileId: string) => {
    try {
      setIsSubmitting(true);
      const res = await idCardsApi.generateIndividual({ holderType, profileId });
      const cardNum = res?.card?.cardNumber || res?.data?.card?.cardNumber || 'Success';
      showToast(`ID card successfully generated (${cardNum})`);
      if (holderType === 'STUDENT') loadStudents();
      else if (holderType === 'TEACHER') loadTeachers();
      else loadStaff();
      loadStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate ID card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update (Revoke / Activate)
  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTarget || !revokeTarget.card?.id) return;
    try {
      setIsSubmitting(true);
      await idCardsApi.updateStatus(revokeTarget.card.id, {
        status: 'REVOKED',
        reason: revokeReason,
      });
      showToast(`Card ${revokeTarget.card.cardNumber} has been revoked.`);
      setRevokeTarget(null);
      if (revokeTarget.holderType === 'STUDENT') loadStudents();
      else if (revokeTarget.holderType === 'TEACHER') loadTeachers();
      else loadStaff();
      loadStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke ID card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Operations
  const handleBulkGenerateSelected = async (targetType: 'STUDENT' | 'TEACHER' | 'STAFF') => {
    const ids =
      targetType === 'STUDENT'
        ? studentSelectedIds
        : targetType === 'TEACHER'
        ? teacherSelectedIds
        : staffSelectedIds;

    if (ids.length === 0) {
      showToast('Please select at least one record first.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        targetType:
          targetType === 'STUDENT'
            ? 'SELECTED_STUDENTS'
            : targetType === 'TEACHER'
            ? 'SELECTED_TEACHERS'
            : 'SELECTED_STAFF',
        selectedIds: ids,
      };
      const res = await idCardsApi.bulkGenerate(payload);
      showToast(res?.message || `Successfully generated ID cards!`);
      if (targetType === 'STUDENT') {
        setStudentSelectedIds([]);
        loadStudents();
      } else if (targetType === 'TEACHER') {
        setTeacherSelectedIds([]);
        loadTeachers();
      } else {
        setStaffSelectedIds([]);
        loadStaff();
      }
      loadStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to run bulk generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Print A4 PDF
  const handleBulkPrintA4 = (targetType: 'STUDENT' | 'TEACHER' | 'STAFF') => {
    const list =
      targetType === 'STUDENT'
        ? students.filter((s) => studentSelectedIds.includes(s.id) && s.card)
        : targetType === 'TEACHER'
        ? teachers.filter((t) => teacherSelectedIds.includes(t.id) && t.card)
        : staff.filter((st) => staffSelectedIds.includes(st.id) && st.card);

    if (list.length === 0) {
      showToast('Selected records must have an issued card to generate print sheets.');
      return;
    }

    const cardsToPrint: IdCardRenderData[] = list.map((item) => {
      const isStudent = targetType === 'STUDENT';
      const name = isStudent
        ? `${item.firstName} ${item.lastName}`
        : `${item.membership?.user?.firstName || ''} ${item.membership?.user?.lastName || ''}`.trim() || item.name;
      const identifier = isStudent ? item.admissionNumber : item.employeeId;
      const subDetail = isStudent
        ? `${item.currentEnrollment?.class?.name || 'Class'} - ${item.currentEnrollment?.section?.name || 'Sec'}`
        : `${item.department?.name || 'Faculty'} • ${item.designation || 'Staff'}`;

      return {
        holderType: targetType,
        fullName: name,
        identifier: identifier,
        subDetail: subDetail,
        bloodGroup: item.bloodGroup || '—',
        cardNumber: item.card.cardNumber,
        verificationToken: item.card.verificationToken,
        status: item.card.status,
        schoolName: branding.schoolName || 'EduNexa Central School',
        schoolCode: 'EDUNEXA',
        schoolAddress: 'Campus Administration',
        schoolPhone: '+91 98765 43210',
      };
    });

    const defaultTpl = templates.find((t) => t.isDefault) || {};
    downloadBulkIdCardsPdf(
      cardsToPrint,
      defaultTpl,
      `EduNexa-ID-Cards-Batch-${targetType}-${new Date().toISOString().split('T')[0]}.pdf`
    );
    showToast(`Generating duplex print sheet for ${cardsToPrint.length} cards...`);
  };

  // Download Individual CR80 PDF
  const handleDownloadSinglePdf = (item: any, holderType: 'STUDENT' | 'TEACHER' | 'STAFF') => {
    if (!item.card) return;
    const isStudent = holderType === 'STUDENT';
    const name = isStudent
      ? `${item.firstName} ${item.lastName}`
      : `${item.membership?.user?.firstName || ''} ${item.membership?.user?.lastName || ''}`.trim() || item.name;
    const identifier = isStudent ? item.admissionNumber : item.employeeId;
    const subDetail = isStudent
      ? `${item.currentEnrollment?.class?.name || 'Class'} - ${item.currentEnrollment?.section?.name || 'Sec'} • Roll: ${item.currentEnrollment?.rollNumber || '—'}`
      : `${item.department?.name || 'Department'} • ${item.designation || 'Faculty'}`;

    const defaultTpl = templates.find((t) => t.isDefault) || {};
    downloadIndividualIdCardPdf(
      {
        holderType: holderType,
        fullName: name,
        identifier: identifier,
        subDetail: subDetail,
        bloodGroup: item.bloodGroup || '—',
        cardNumber: item.card.cardNumber,
        verificationToken: item.card.verificationToken,
        status: item.card.status,
        schoolName: branding.schoolName || 'EduNexa Central School',
        schoolCode: 'EDUNEXA',
        schoolAddress: 'Campus Administration',
        schoolPhone: '+91 98765 43210',
      },
      defaultTpl,
      `ID-Card-${identifier}.pdf`
    );
  };

  // Template Save / Create
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingTemplate) {
        await idCardsApi.updateTemplate(editingTemplate.id, templateForm);
        showToast('Template updated successfully!');
      } else {
        await idCardsApi.createTemplate(templateForm);
        showToast('New card template created!');
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (err: any) {
      showToast(err.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Universal Checkbox toggling helper
  const toggleSelectAll = (allIds: string[], selectedIds: string[], setFn: (ids: string[]) => void) => {
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      setFn([]);
    } else {
      setFn([...allIds]);
    }
  };

  const toggleSelectOne = (id: string, selectedIds: string[], setFn: (ids: string[]) => void) => {
    if (selectedIds.includes(id)) {
      setFn(selectedIds.filter((item) => item !== id));
    } else {
      setFn([...selectedIds, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900, #0f172a)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <IdCard size={26} style={{ color: 'var(--primary-600)' }} />
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Institutional ID Card Management & QR Verification Hub
            </h1>
            <Badge variant="info">Section 4 Production Standard</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Universal physical ISO CR80 and virtual card issuance, SHA-256 data hash tracking, duplex bulk print sheets, and tamper-proof QR verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => {
              if (activeTab === 'dashboard') loadStats();
              if (activeTab === 'students') loadStudents();
              if (activeTab === 'teachers') loadTeachers();
              if (activeTab === 'staff') loadStaff();
              if (activeTab === 'templates') loadTemplates();
            }}
            disabled={statsLoading || studentLoading || teacherLoading || staffLoading}
            className="ed-btn ed-btn-secondary"
          >
            <RefreshCw size={14} className={statsLoading || studentLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'dashboard', label: 'Telemetry & Ledger', icon: Layers },
          { key: 'students', label: 'Student ID Cards', icon: GraduationCap },
          { key: 'teachers', label: 'Teacher ID Cards', icon: Users },
          { key: 'staff', label: 'Staff ID Cards', icon: Users },
          { key: 'bulk', label: 'Bulk Generation Studio', icon: FileCheck },
          { key: 'templates', label: 'Card Templates', icon: Palette },
          { key: 'verify', label: 'QR Verification Portal', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--primary-600)' : '3px solid transparent',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--primary-700)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD TELEMETRY & RECENT LEDGER                                */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* KPI Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div className="ed-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Eligible Holders
                </span>
                <Users size={18} style={{ color: 'var(--primary-600)' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                {stats?.stats?.totalEligible ?? '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Students: {stats?.stats?.totalStudents ?? 0} • Teachers: {stats?.stats?.totalTeachers ?? 0} • Staff: {stats?.stats?.totalStaff ?? 0}
              </div>
            </div>

            <div className="ed-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cards Issued
                </span>
                <CheckCircle2 size={18} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                {stats?.stats?.totalCardsGenerated ?? '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Active: {stats?.stats?.activeCards ?? 0} • Revoked: {stats?.stats?.revokedCards ?? 0}
              </div>
            </div>

            <div className="ed-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Pending Issuance
                </span>
                <Clock size={18} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>
                {stats?.stats?.pendingCards ?? '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Holders currently without active credential
              </div>
            </div>

            <div className="ed-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Design Templates
                </span>
                <Palette size={18} style={{ color: 'var(--academic-gold-500)' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                {templates.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default: {templates.find((t) => t.isDefault)?.name || 'Default Classic'}
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Issuance Ledger */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
            <div className="ed-card">
              <div className="ed-card-header">
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent ID Card Issuance Ledger</span>
                <Badge variant="neutral">Live Database Sync</Badge>
              </div>
              <div className="ed-card-body" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Card Number</th>
                        <th style={{ padding: '10px 14px' }}>Holder</th>
                        <th style={{ padding: '10px 14px' }}>Role</th>
                        <th style={{ padding: '10px 14px' }}>Issued Date</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No ID cards issued yet. Head to Student or Teacher tabs to generate cards.
                          </td>
                        </tr>
                      ) : (
                        stats.recentActivity.map((act: any) => (
                          <tr key={act.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                              {act.cardNumber}
                            </td>
                            <td style={{ padding: '10px 14px' }}>{act.holderName}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <Badge variant={act.holderType === 'STUDENT' ? 'info' : 'success'}>
                                {act.holderType}
                              </Badge>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                              {new Date(act.issuedAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <Badge variant={act.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {act.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="ed-card">
              <div className="ed-card-header">
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Administrative Quick Start</span>
              </div>
              <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  onClick={() => setActiveTab('students')}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
                >
                  <GraduationCap size={18} style={{ color: 'var(--primary-600)', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Issue Student Cards</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Class-wise filtering & multi-select</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('teachers')}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
                >
                  <Users size={18} style={{ color: 'var(--primary-600)', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Issue Teacher Cards</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Faculty credentials & verification</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('bulk')}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
                >
                  <FileCheck size={18} style={{ color: 'var(--primary-600)', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Bulk Generation Studio</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Batch generate & duplex print sheets</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className="ed-btn ed-btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
                >
                  <Palette size={18} style={{ color: 'var(--primary-600)', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Manage Card Templates</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Custom colors, seals & signatures</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENT ID CARDS (UNIVERSAL MULTI-SELECT & CR80 PREVIEW)          */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search student by name, admission no, or card..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadStudents()}
                className="ed-input"
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => {
                    setStudentStatusFilter(e.target.value);
                  }}
                  className="ed-input"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Card</option>
                  <option value="UNISSUED">Unissued</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>

              <button onClick={loadStudents} className="ed-btn ed-btn-secondary" style={{ padding: '6px 14px' }}>
                Filter
              </button>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: studentSelectedIds.length > 0 ? 'var(--primary-50, #f0fdf4)' : 'var(--bg-surface)',
              border: `1px solid ${studentSelectedIds.length > 0 ? 'var(--primary-300, #86efac)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() =>
                  toggleSelectAll(
                    students.map((s) => s.id),
                    studentSelectedIds,
                    setStudentSelectedIds
                  )
                }
                className="ed-btn ed-btn-sm ed-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {studentSelectedIds.length === 0 ? (
                  <Square size={14} />
                ) : studentSelectedIds.length === students.length ? (
                  <CheckSquare size={14} style={{ color: 'var(--primary-600)' }} />
                ) : (
                  <MinusSquare size={14} style={{ color: 'var(--primary-600)' }} />
                )}
                <span>
                  {studentSelectedIds.length === 0
                    ? 'Select All'
                    : studentSelectedIds.length === students.length
                    ? 'Deselect All'
                    : `Selected (${studentSelectedIds.length})`}
                </span>
              </button>

              {studentSelectedIds.length > 0 && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {studentSelectedIds.length} students selected
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={studentSelectedIds.length === 0 || isSubmitting}
                onClick={() => handleBulkGenerateSelected('STUDENT')}
                className="ed-btn ed-btn-sm ed-btn-primary"
              >
                <Sparkles size={13} />
                <span>Bulk Generate ({studentSelectedIds.length})</span>
              </button>

              <button
                disabled={studentSelectedIds.length === 0}
                onClick={() => handleBulkPrintA4('STUDENT')}
                className="ed-btn ed-btn-sm ed-btn-secondary"
              >
                <Printer size={13} />
                <span>Bulk Print A4 Sheet</span>
              </button>

              {studentSelectedIds.length > 0 && (
                <button
                  onClick={() => setStudentSelectedIds([])}
                  className="ed-btn ed-btn-sm ed-btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Student Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                    <th style={{ width: '40px', padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={students.length > 0 && studentSelectedIds.length === students.length}
                        onChange={() =>
                          toggleSelectAll(
                            students.map((s) => s.id),
                            studentSelectedIds,
                            setStudentSelectedIds
                          )
                        }
                      />
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Admission No</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Class & Section</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data Sync</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentLoading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading student records from PostgreSQL...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    students.map((st) => {
                      const isSelected = studentSelectedIds.includes(st.id);
                      const isUpToDate = st.card?.isUpToDate ?? true;
                      return (
                        <tr
                          key={st.id}
                          style={{
                            borderBottom: '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--primary-50, #f0fdf4)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(st.id, studentSelectedIds, setStudentSelectedIds)}
                            />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {st.firstName} {st.lastName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Roll: {st.currentEnrollment?.rollNumber || '—'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{st.admissionNumber}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {st.currentEnrollment?.class?.name || 'Class'} - {st.currentEnrollment?.section?.name || 'Sec'}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {st.card ? st.card.cardNumber : <span style={{ color: 'var(--text-muted)' }}>Unissued</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {st.card ? (
                              <Badge variant={st.card.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {st.card.status}
                              </Badge>
                            ) : (
                              <Badge variant="warning">UNISSUED</Badge>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {st.card ? (
                              isUpToDate ? (
                                <span style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={12} /> Synchronized
                                </span>
                              ) : (
                                <Badge variant="warning">Update Required</Badge>
                              )
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {st.card ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setPreviewCard({ ...st, holderType: 'STUDENT', name: `${st.firstName} ${st.lastName}`, identifier: st.admissionNumber, subDetail: `${st.currentEnrollment?.class?.name || 'Class'} - ${st.currentEnrollment?.section?.name || 'Sec'}` });
                                      setCardSide('FRONT');
                                    }}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                    title="Preview Digital Card"
                                  >
                                    <Eye size={13} />
                                    <span>Card</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSinglePdf(st, 'STUDENT')}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                    title="Download CR80 PDF"
                                  >
                                    <Download size={13} />
                                  </button>
                                  {!isUpToDate && (
                                    <button
                                      onClick={() => handleGenerateIndividual('STUDENT', st.id)}
                                      disabled={isSubmitting}
                                      className="ed-btn ed-btn-sm ed-btn-secondary"
                                      style={{ color: '#d97706' }}
                                      title="Sync profile changes"
                                    >
                                      <RefreshCw size={13} />
                                    </button>
                                  )}
                                  {st.card.status === 'ACTIVE' && (
                                    <button
                                      onClick={() => setRevokeTarget({ ...st, holderType: 'STUDENT', name: `${st.firstName} ${st.lastName}`, identifier: st.admissionNumber })}
                                      className="ed-btn ed-btn-sm"
                                      style={{ color: 'var(--danger-600)', background: 'transparent' }}
                                      title="Revoke Card"
                                    >
                                      <Ban size={13} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleGenerateIndividual('STUDENT', st.id)}
                                  disabled={isSubmitting}
                                  className="ed-btn ed-btn-sm ed-btn-primary"
                                >
                                  <Sparkles size={13} />
                                  <span>Issue</span>
                                </button>
                              )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEACHER ID CARDS (FACULTY DIRECTORY & CR80 PDF GENERATOR)         */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search teacher by name or employee ID..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTeachers()}
                className="ed-input"
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={teacherStatusFilter}
                  onChange={(e) => setTeacherStatusFilter(e.target.value)}
                  className="ed-input"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Card</option>
                  <option value="UNISSUED">Unissued</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>

              <button onClick={loadTeachers} className="ed-btn ed-btn-secondary" style={{ padding: '6px 14px' }}>
                Filter
              </button>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: teacherSelectedIds.length > 0 ? 'var(--primary-50, #f0fdf4)' : 'var(--bg-surface)',
              border: `1px solid ${teacherSelectedIds.length > 0 ? 'var(--primary-300, #86efac)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() =>
                  toggleSelectAll(
                    teachers.map((t) => t.id),
                    teacherSelectedIds,
                    setTeacherSelectedIds
                  )
                }
                className="ed-btn ed-btn-sm ed-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {teacherSelectedIds.length === 0 ? (
                  <Square size={14} />
                ) : teacherSelectedIds.length === teachers.length ? (
                  <CheckSquare size={14} style={{ color: 'var(--primary-600)' }} />
                ) : (
                  <MinusSquare size={14} style={{ color: 'var(--primary-600)' }} />
                )}
                <span>
                  {teacherSelectedIds.length === 0
                    ? 'Select All'
                    : teacherSelectedIds.length === teachers.length
                    ? 'Deselect All'
                    : `Selected (${teacherSelectedIds.length})`}
                </span>
              </button>

              {teacherSelectedIds.length > 0 && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {teacherSelectedIds.length} teachers selected
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={teacherSelectedIds.length === 0 || isSubmitting}
                onClick={() => handleBulkGenerateSelected('TEACHER')}
                className="ed-btn ed-btn-sm ed-btn-primary"
              >
                <Sparkles size={13} />
                <span>Bulk Generate ({teacherSelectedIds.length})</span>
              </button>

              <button
                disabled={teacherSelectedIds.length === 0}
                onClick={() => handleBulkPrintA4('TEACHER')}
                className="ed-btn ed-btn-sm ed-btn-secondary"
              >
                <Printer size={13} />
                <span>Bulk Print A4 Sheet</span>
              </button>
            </div>
          </div>

          {/* Teacher Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                    <th style={{ width: '40px', padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={teachers.length > 0 && teacherSelectedIds.length === teachers.length}
                        onChange={() =>
                          toggleSelectAll(
                            teachers.map((t) => t.id),
                            teacherSelectedIds,
                            setTeacherSelectedIds
                          )
                        }
                      />
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Teacher Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Employee ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data Sync</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherLoading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading teacher records from PostgreSQL...
                      </td>
                    </tr>
                  ) : teachers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No teacher records found.
                      </td>
                    </tr>
                  ) : (
                    teachers.map((tc) => {
                      const isSelected = teacherSelectedIds.includes(tc.id);
                      const isUpToDate = tc.card?.isUpToDate ?? true;
                      const teacherName = `${tc.membership?.user?.firstName || ''} ${tc.membership?.user?.lastName || ''}`.trim() || 'Faculty Member';
                      return (
                        <tr
                          key={tc.id}
                          style={{
                            borderBottom: '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--primary-50, #f0fdf4)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(tc.id, teacherSelectedIds, setTeacherSelectedIds)}
                            />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{teacherName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {tc.designation || 'Faculty Member'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{tc.employeeId}</td>
                          <td style={{ padding: '12px 16px' }}>{tc.department?.name || 'Academic'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {tc.card ? tc.card.cardNumber : <span style={{ color: 'var(--text-muted)' }}>Unissued</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {tc.card ? (
                              <Badge variant={tc.card.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {tc.card.status}
                              </Badge>
                            ) : (
                              <Badge variant="warning">UNISSUED</Badge>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {tc.card ? (
                              isUpToDate ? (
                                <span style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={12} /> Synchronized
                                </span>
                              ) : (
                                <Badge variant="warning">Update Required</Badge>
                              )
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {tc.card ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setPreviewCard({
                                        ...tc,
                                        holderType: 'TEACHER',
                                        name: teacherName,
                                        identifier: tc.employeeId,
                                        subDetail: `${tc.department?.name || 'Department'} • ${tc.designation || 'Teacher'}`,
                                      });
                                      setCardSide('FRONT');
                                    }}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                    title="Preview Digital Card"
                                  >
                                    <Eye size={13} />
                                    <span>Card</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSinglePdf(tc, 'TEACHER')}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                    title="Download CR80 PDF"
                                  >
                                    <Download size={13} />
                                  </button>
                                  {!isUpToDate && (
                                    <button
                                      onClick={() => handleGenerateIndividual('TEACHER', tc.id)}
                                      disabled={isSubmitting}
                                      className="ed-btn ed-btn-sm ed-btn-secondary"
                                      style={{ color: '#d97706' }}
                                      title="Sync profile changes"
                                    >
                                      <RefreshCw size={13} />
                                    </button>
                                  )}
                                  {tc.card.status === 'ACTIVE' && (
                                    <button
                                      onClick={() => setRevokeTarget({ ...tc, holderType: 'TEACHER', name: teacherName, identifier: tc.employeeId })}
                                      className="ed-btn ed-btn-sm"
                                      style={{ color: 'var(--danger-600)', background: 'transparent' }}
                                      title="Revoke Card"
                                    >
                                      <Ban size={13} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleGenerateIndividual('TEACHER', tc.id)}
                                  disabled={isSubmitting}
                                  className="ed-btn ed-btn-sm ed-btn-primary"
                                >
                                  <Sparkles size={13} />
                                  <span>Issue</span>
                                </button>
                              )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STAFF ID CARDS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search staff by name or employee ID..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadStaff()}
                className="ed-input"
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button onClick={loadStaff} className="ed-btn ed-btn-secondary" style={{ padding: '6px 14px' }}>
                Filter
              </button>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: staffSelectedIds.length > 0 ? 'var(--primary-50, #f0fdf4)' : 'var(--bg-surface)',
              border: `1px solid ${staffSelectedIds.length > 0 ? 'var(--primary-300, #86efac)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() =>
                  toggleSelectAll(
                    staff.map((st) => st.id),
                    staffSelectedIds,
                    setStaffSelectedIds
                  )
                }
                className="ed-btn ed-btn-sm ed-btn-secondary"
              >
                <span>{staffSelectedIds.length > 0 ? `Selected (${staffSelectedIds.length})` : 'Select All'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={staffSelectedIds.length === 0 || isSubmitting}
                onClick={() => handleBulkGenerateSelected('STAFF')}
                className="ed-btn ed-btn-sm ed-btn-primary"
              >
                <Sparkles size={13} />
                <span>Bulk Generate ({staffSelectedIds.length})</span>
              </button>
              <button
                disabled={staffSelectedIds.length === 0}
                onClick={() => handleBulkPrintA4('STAFF')}
                className="ed-btn ed-btn-sm ed-btn-secondary"
              >
                <Printer size={13} />
                <span>Bulk Print A4 Sheet</span>
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                    <th style={{ width: '40px', padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={staff.length > 0 && staffSelectedIds.length === staff.length}
                        onChange={() =>
                          toggleSelectAll(
                            staff.map((st) => st.id),
                            staffSelectedIds,
                            setStaffSelectedIds
                          )
                        }
                      />
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Staff Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Employee ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department / Role</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Card Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading staff records from PostgreSQL...
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No staff records found.
                      </td>
                    </tr>
                  ) : (
                    staff.map((stf) => {
                      const isSelected = staffSelectedIds.includes(stf.id);
                      const staffName = `${stf.membership?.user?.firstName || ''} ${stf.membership?.user?.lastName || ''}`.trim() || 'Staff Member';
                      return (
                        <tr
                          key={stf.id}
                          style={{
                            borderBottom: '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--primary-50, #f0fdf4)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(stf.id, staffSelectedIds, setStaffSelectedIds)}
                            />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staffName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {stf.membership?.role || 'Staff'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{stf.employeeId}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {stf.department?.name || 'Operations'} — {stf.designation || 'Staff'}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {stf.card ? stf.card.cardNumber : <span style={{ color: 'var(--text-muted)' }}>Unissued</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {stf.card ? (
                              <Badge variant={stf.card.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {stf.card.status}
                              </Badge>
                            ) : (
                              <Badge variant="warning">UNISSUED</Badge>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {stf.card ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setPreviewCard({
                                        ...stf,
                                        holderType: 'STAFF',
                                        name: staffName,
                                        identifier: stf.employeeId,
                                        subDetail: `${stf.department?.name || 'Operations'} • ${stf.designation || 'Staff'}`,
                                      });
                                      setCardSide('FRONT');
                                    }}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                  >
                                    <Eye size={13} />
                                    <span>Card</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSinglePdf(stf, 'STAFF')}
                                    className="ed-btn ed-btn-sm ed-btn-secondary"
                                  >
                                    <Download size={13} />
                                  </button>
                                  {stf.card.status === 'ACTIVE' && (
                                    <button
                                      onClick={() => setRevokeTarget({ ...stf, holderType: 'STAFF', name: staffName, identifier: stf.employeeId })}
                                      className="ed-btn ed-btn-sm"
                                      style={{ color: 'var(--danger-600)', background: 'transparent' }}
                                    >
                                      <Ban size={13} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleGenerateIndividual('STAFF', stf.id)}
                                  disabled={isSubmitting}
                                  className="ed-btn ed-btn-sm ed-btn-primary"
                                >
                                  <Sparkles size={13} />
                                  <span>Issue</span>
                                </button>
                              )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BULK GENERATION STUDIO WIZARD                                      */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="ed-card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--academic-gold-500)' }} />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Automated Batch ID Card Generation Wizard</span>
              </div>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Generate official cryptographic ID cards for entire classes, academic sections, all teaching faculty, or departmental staff in one operation.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Batch Target Mode *
                  </label>
                  <select
                    className="ed-input"
                    style={{ width: '100%' }}
                    value={bulkWizard.targetType}
                    onChange={(e) => setBulkWizard({ ...bulkWizard, targetType: e.target.value })}
                  >
                    <option value="STUDENT_CLASS">All Students in Class & Section</option>
                    <option value="ALL_TEACHERS">All Teaching Faculty</option>
                    <option value="DEPARTMENT_STAFF">Department Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Select Card Template *
                  </label>
                  <select
                    className="ed-input"
                    style={{ width: '100%' }}
                    value={bulkWizard.selectedTemplateId}
                    onChange={(e) => setBulkWizard({ ...bulkWizard, selectedTemplateId: e.target.value })}
                  >
                    <option value="">Default School Template</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.targetRole})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {bulkWizard.targetType === 'STUDENT_CLASS' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Class / Grade *
                    </label>
                    <input
                      type="text"
                      className="ed-input"
                      style={{ width: '100%' }}
                      placeholder="e.g. Grade 10"
                      value={bulkWizard.selectedClass}
                      onChange={(e) => setBulkWizard({ ...bulkWizard, selectedClass: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Section (Optional)
                    </label>
                    <input
                      type="text"
                      className="ed-input"
                      style={{ width: '100%' }}
                      placeholder="e.g. A"
                      value={bulkWizard.selectedSection}
                      onChange={(e) => setBulkWizard({ ...bulkWizard, selectedSection: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {bulkWizard.targetType === 'DEPARTMENT_STAFF' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Department Name
                  </label>
                  <input
                    type="text"
                    className="ed-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Science or Administration"
                    value={bulkWizard.selectedDepartment}
                    onChange={(e) => setBulkWizard({ ...bulkWizard, selectedDepartment: e.target.value })}
                  />
                </div>
              )}

              {/* Execution Summary Box */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Batch Generation Specification:</div>
                <div>• Automatic ISO CR80 unique sequential card numbers.</div>
                <div>• Cryptographic SHA-256 data hash computed and stored for change detection.</div>
                <div>• Generates high-entropy HMAC verification tokens with zero sensitive PII exposure.</div>
                <div>• Duplex print-ready format aligned for standard 8 cards per A4 page.</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button
                  variant="primary"
                  disabled={bulkWizard.isProcessing}
                  onClick={async () => {
                    try {
                      setBulkWizard((prev) => ({ ...prev, isProcessing: true }));
                      const payload: any = {
                        targetType: bulkWizard.targetType,
                        className: bulkWizard.selectedClass,
                        sectionName: bulkWizard.selectedSection || undefined,
                        templateId: bulkWizard.selectedTemplateId || undefined,
                      };
                      const res = await idCardsApi.bulkGenerate(payload);
                      showToast(res.message || `Successfully generated batch cards!`);
                      loadStats();
                    } catch (err: any) {
                      showToast(err.message || 'Batch generation failed.');
                    } finally {
                      setBulkWizard((prev) => ({ ...prev, isProcessing: false }));
                    }
                  }}
                >
                  <Sparkles size={15} />
                  <span>{bulkWizard.isProcessing ? 'Generating Batch...' : 'Execute Batch Generation'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CARD TEMPLATES & LAYOUT DESIGNER                                  */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Institution ID Card Templates</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Configure primary branding colors, field visibility, principal signatures, and custom terms of use.
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({
                  name: 'New Custom Template',
                  targetRole: 'ALL',
                  isDefault: false,
                  primaryColor: '#0f291e',
                  secondaryColor: '#d4af37',
                  headerTextColor: '#ffffff',
                  cardOrientation: 'LANDSCAPE',
                  showBloodGroup: true,
                  showParentContact: true,
                  showEmergencyPhone: true,
                  showPrincipalSign: true,
                  showSchoolSeal: true,
                  showBarcode: true,
                  customTermsText: 'Property of EduNexa Institution. If found, please return to campus administration.',
                });
                setIsTemplateModalOpen(true);
              }}
            >
              Create New Template
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {templatesLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                No templates configured yet. Click 'Create New Template' to design one.
              </div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="ed-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {tpl.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Role: <strong>{tpl.targetRole}</strong> • {tpl.cardOrientation}
                        </div>
                      </div>
                      {tpl.isDefault && <Badge variant="success">DEFAULT</Badge>}
                    </div>

                    {/* Color Swatch Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: tpl.primaryColor,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                        title={`Primary Color: ${tpl.primaryColor}`}
                      />
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: tpl.secondaryColor,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                        title={`Secondary Color: ${tpl.secondaryColor}`}
                      />
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {tpl.primaryColor} / {tpl.secondaryColor}
                      </span>
                    </div>

                    {/* Features checklist */}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <div>• Blood Group: {tpl.showBloodGroup ? 'Visible' : 'Hidden'}</div>
                      <div>• Principal Signature: {tpl.showPrincipalSign ? 'Included' : 'None'}</div>
                      <div>• School Seal / Watermark: {tpl.showSchoolSeal ? 'Active' : 'Off'}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid var(--border-default)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingTemplate(tpl);
                        setTemplateForm({
                          name: tpl.name,
                          targetRole: tpl.targetRole,
                          isDefault: tpl.isDefault,
                          primaryColor: tpl.primaryColor || '#0f291e',
                          secondaryColor: tpl.secondaryColor || '#d4af37',
                          headerTextColor: tpl.headerTextColor || '#ffffff',
                          cardOrientation: tpl.cardOrientation || 'LANDSCAPE',
                          showBloodGroup: tpl.showBloodGroup ?? true,
                          showParentContact: tpl.showParentContact ?? true,
                          showEmergencyPhone: tpl.showEmergencyPhone ?? true,
                          showPrincipalSign: tpl.showPrincipalSign ?? true,
                          showSchoolSeal: tpl.showSchoolSeal ?? true,
                          showBarcode: tpl.showBarcode ?? true,
                          customTermsText: tpl.customTermsText || '',
                        });
                        setIsTemplateModalOpen(true);
                      }}
                      className="ed-btn ed-btn-sm ed-btn-secondary"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                    {!tpl.isDefault && (
                      <button
                        onClick={async () => {
                          if (confirm(`Delete template "${tpl.name}"?`)) {
                            try {
                              await idCardsApi.deleteTemplate(tpl.id);
                              showToast('Template deleted');
                              loadTemplates();
                            } catch (e: any) {
                              showToast(e.message || 'Cannot delete template');
                            }
                          }
                        }}
                        className="ed-btn ed-btn-sm"
                        style={{ color: 'var(--danger-600)', background: 'transparent' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: QR VERIFICATION PORTAL & VERIFIER TESTER                           */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Public QR Verification Simulator & Endpoint Tester</span>
              </div>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Test any institutional verification token. This validates token existence and status in PostgreSQL while enforcing Section 4 Zero-PII privacy standards.
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  type="text"
                  placeholder="Paste verification token (e.g. v-tok-xxxxxxxx)..."
                  className="ed-input"
                  style={{ flex: 1 }}
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value)}
                />
                <Button
                  variant="primary"
                  disabled={!verifyTokenInput.trim() || verifyLoading}
                  onClick={async () => {
                    try {
                      setVerifyLoading(true);
                      setVerifyResult(null);
                      const res = await fetch(`/api/v1/core/id-cards/verify/${encodeURIComponent(verifyTokenInput.trim())}`);
                      const json = await res.json();
                      setVerifyResult(json);
                    } catch (err: any) {
                      setVerifyResult({ valid: false, message: err.message || 'Failed to verify token' });
                    } finally {
                      setVerifyLoading(false);
                    }
                  }}
                >
                  Verify Token
                </Button>
              </div>

              {verifyResult && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: verifyResult.valid ? 'var(--success-50, #f0fdf4)' : 'var(--danger-50, #fef2f2)',
                    border: `1px solid ${verifyResult.valid ? '#86efac' : '#fecaca'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    {verifyResult.valid ? (
                      <>
                        <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                        <span style={{ color: '#166534' }}>Officially Verified Institution Credential</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} style={{ color: '#dc2626' }} />
                        <span style={{ color: '#991b1b' }}>Verification Failed or Inactive Token</span>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {verifyResult.valid ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Holder Name:</strong> {verifyResult.data?.fullName}</div>
                        <div><strong>Institution:</strong> {verifyResult.data?.institution}</div>
                        <div><strong>Role:</strong> {verifyResult.data?.roleCategory} ({verifyResult.data?.subDetail})</div>
                        <div><strong>Card Number:</strong> {verifyResult.data?.cardNumber}</div>
                        <div><strong>Status:</strong> {verifyResult.data?.status}</div>
                        <div><strong>Academic Session:</strong> {verifyResult.data?.academicSession}</div>
                      </div>
                    ) : (
                      <div>{verifyResult.message || 'The specified token was not found or has been revoked.'}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTERACTIVE FRONT & BACK CARD PREVIEW                               */}
      {/* ========================================================================= */}
      {previewCard && previewCard.card && (
        <Modal
          isOpen={Boolean(previewCard)}
          onClose={() => setPreviewCard(null)}
          title="Virtual Institutional ID Card (ISO CR80)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
            {/* Front / Back Switch */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`ed-btn ed-btn-sm ${cardSide === 'FRONT' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                onClick={() => setCardSide('FRONT')}
              >
                Front Side
              </button>
              <button
                className={`ed-btn ed-btn-sm ${cardSide === 'BACK' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                onClick={() => setCardSide('BACK')}
              >
                Back Side
              </button>
            </div>

            {/* CR80 Card Body */}
            <div
              style={{
                width: '380px',
                height: '240px',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-dark-sidebar, #111e17)',
                color: '#ffffff',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--academic-gold-500, #d4af37)',
              }}
            >
              {/* Top Accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  backgroundColor: 'var(--academic-gold-500, #d4af37)',
                }}
              />

              {cardSide === 'FRONT' ? (
                <>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--brand-forest-700, #173327)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: '#ffffff',
                          border: '1px solid var(--academic-gold-500)',
                        }}
                      >
                        {branding.schoolName ? branding.schoolName.charAt(0) : 'E'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.1 }}>
                          {branding.schoolName || 'EduNexa Central School'}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
                          OFFICIAL INSTITUTIONAL CREDENTIAL
                        </div>
                      </div>
                    </div>

                    <Badge variant={previewCard.card.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {previewCard.card.status}
                    </Badge>
                  </div>

                  {/* Card Body */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '68px',
                        height: '80px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: '#93c5fd',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      {previewCard.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {previewCard.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--academic-gold-500)', fontWeight: 600, marginTop: '2px' }}>
                        {previewCard.holderType} • {previewCard.subDetail}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '6px' }}>
                        ID: <strong style={{ color: '#ffffff' }}>{previewCard.identifier}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '2px' }}>
                        Card: {previewCard.card.cardNumber}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with QR */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingTop: '8px',
                    }}
                  >
                    <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                      Issued: {new Date(previewCard.card.issuedAt).toLocaleDateString()} • Session: 2026–2027
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QrCode size={22} style={{ color: 'var(--academic-gold-500)' }} />
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Cryptographic QR</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Card Back */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        height: '28px',
                        backgroundColor: '#0a0d0b',
                        margin: '-4px -20px 6px -20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    />
                    <div style={{ fontSize: '0.70rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                      <strong style={{ color: '#ffffff' }}>Terms:</strong> This credential is the official property of {branding.schoolName || 'the institution'} and must be surrendered upon graduation or transfer.
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                      Campus Administration: +91 98765 43210
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8' }}>
                    <span>Principal Signature [Verified]</span>
                    <span style={{ fontFamily: 'monospace' }}>ENC-SHA256</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={() => setPreviewCard(null)}>
                Close Preview
              </Button>
              <Button
                variant="primary"
                icon={<Download size={14} />}
                onClick={() => handleDownloadSinglePdf(previewCard, previewCard.holderType)}
              >
                Download PDF (CR80)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVOKE CARD CONFIRMATION                                            */}
      {/* ========================================================================= */}
      {revokeTarget && (
        <Modal
          isOpen={Boolean(revokeTarget)}
          onClose={() => setRevokeTarget(null)}
          title="Revoke Institutional ID Card"
        >
          <form onSubmit={handleConfirmRevoke} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--danger-700)' }}>
              <Ban size={28} />
              <div>
                <div style={{ fontWeight: 700 }}>Security Revocation</div>
                <div style={{ fontSize: '0.84rem' }}>
                  Revoking card <strong>{revokeTarget.card?.cardNumber}</strong> for{' '}
                  <strong>{revokeTarget.name}</strong> ({revokeTarget.identifier}).
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Revocation Reason *
              </label>
              <textarea
                required
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="ed-input"
                placeholder="Specify the reason for card deactivation (e.g. Lost in transit, holder separation, compromised token)..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' }}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEMPLATE EDITOR                                                    */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title={editingTemplate ? 'Edit Card Template' : 'Create New Card Template'}
        >
          <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Template Name *
              </label>
              <input
                required
                type="text"
                className="ed-input"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Target Role
                </label>
                <select
                  className="ed-input"
                  value={templateForm.targetRole}
                  onChange={(e) => setTemplateForm({ ...templateForm, targetRole: e.target.value })}
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="TEACHER">Teachers Only</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Card Orientation
                </label>
                <select
                  className="ed-input"
                  value={templateForm.cardOrientation}
                  onChange={(e) => setTemplateForm({ ...templateForm, cardOrientation: e.target.value })}
                >
                  <option value="LANDSCAPE">Landscape (ISO CR80)</option>
                  <option value="PORTRAIT">Portrait</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Primary Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={templateForm.primaryColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, primaryColor: e.target.value })}
                    style={{ width: '40px', height: '36px', padding: 0, border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="ed-input"
                    value={templateForm.primaryColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Secondary Gold Accent
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={templateForm.secondaryColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, secondaryColor: e.target.value })}
                    style={{ width: '40px', height: '36px', padding: 0, border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="ed-input"
                    value={templateForm.secondaryColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Field Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={templateForm.showBloodGroup}
                  onChange={(e) => setTemplateForm({ ...templateForm, showBloodGroup: e.target.checked })}
                />
                Show Blood Group
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={templateForm.showPrincipalSign}
                  onChange={(e) => setTemplateForm({ ...templateForm, showPrincipalSign: e.target.checked })}
                />
                Show Principal Sign
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={templateForm.showSchoolSeal}
                  onChange={(e) => setTemplateForm({ ...templateForm, showSchoolSeal: e.target.checked })}
                />
                Show School Seal Watermark
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={templateForm.isDefault}
                  onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                />
                Set as Default Template
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Custom Back Terms Text
              </label>
              <textarea
                rows={2}
                className="ed-input"
                value={templateForm.customTermsText}
                onChange={(e) => setTemplateForm({ ...templateForm, customTermsText: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VirtualIdCardsPage;
