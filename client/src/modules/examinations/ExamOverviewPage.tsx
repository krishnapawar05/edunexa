import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Calendar,
  Users,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { academicApi, coreApi } from '../../services/api.js';

interface ExamSummaryItem {
  id: string;
  name: string;
  className: string;
  subjectCode: string;
  examType: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  status: string;
}

export const ExamOverviewPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<ExamSummaryItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [academicClasses, setAcademicClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch live exam schedules from PostgreSQL
      const schedulesRes = await academicApi.listExamSchedules();
      const rawSchedules = Array.isArray(schedulesRes) ? schedulesRes : [];
      setSchedules(rawSchedules);

      // 2. Fetch student count from PostgreSQL
      try {
        const studentsRes = await coreApi.listStudents({ limit: 100 });
        const count = Array.isArray(studentsRes)
          ? studentsRes.length
          : (studentsRes as any)?.meta?.total || (studentsRes as any)?.items?.length || 0;
        setTotalStudents(count);
      } catch (err: any) {
        console.warn('Student list fetch notice:', err);
      }

      // 3. Fetch academic structure
      try {
        const structure = await coreApi.getAcademicStructure();
        if (structure && Array.isArray(structure.classes)) {
          setAcademicClasses(structure.classes.map((c: any) => c.name));
        }
      } catch (err: any) {
        console.warn('Academic structure notice:', err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve examination records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalExams = schedules.length;
  const publishedExams = schedules.filter((s) => s.status === 'PUBLISHED').length;
  const pendingExams = schedules.filter((s) => s.status !== 'PUBLISHED').length;
  const submittedExams = schedules.filter((s) => s.status === 'MARKS_SUBMITTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ flex: '1 1 340px', minWidth: '280px' }}>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Examination Workspace & Assessment
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Institutional examination terms, schedules, marks ledger, and result publication for {branding.schoolName}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => navigate('/examinations/schedules')}
          >
            Manage Schedules
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text)',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile clickable" onClick={() => navigate('/examinations/schedules')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Total Assessments</span>
            <FileSpreadsheet size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="value">{loading ? '...' : totalExams}</div>
          <div className="subtitle">
            <Calendar size={13} /> Active in Academic Year
          </div>
        </div>

        <div className="ed-metric-tile clickable" onClick={() => navigate('/examinations/publish')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Published Results</span>
            <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          </div>
          <div className="value" style={{ color: 'var(--success-solid)' }}>
            {loading ? '...' : publishedExams}
          </div>
          <div className="subtitle">
            <Award size={13} /> Visible on Report Cards
          </div>
        </div>

        <div className="ed-metric-tile clickable" onClick={() => navigate('/examinations/marks')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Pending Marks Queue</span>
            <Clock size={16} style={{ color: pendingExams > 0 ? 'var(--warning-solid)' : 'var(--text-muted)' }} />
          </div>
          <div
            className="value"
            style={{ color: pendingExams > 0 ? 'var(--warning-solid)' : 'var(--text-primary)' }}
          >
            {loading ? '...' : pendingExams}
          </div>
          <div className="subtitle">
            <Clock size={13} /> {submittedExams} Awaiting Final Publish
          </div>
        </div>

        <div className="ed-metric-tile clickable" onClick={() => navigate('/examinations/grading')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Enrolled Candidates</span>
            <Users size={16} style={{ color: 'var(--teal-accent)' }} />
          </div>
          <div className="value" style={{ color: 'var(--teal-accent)' }}>
            {loading ? '...' : totalStudents}
          </div>
          <div className="subtitle">
            <BookOpen size={13} /> Across {academicClasses.length || 4} Grade Levels
          </div>
        </div>
      </div>

      {/* Workflow Navigation Cards */}
      <div className="ed-grid-3">
        {/* Card 1: Examination Schedules */}
        <div className="ed-workflow-card" onClick={() => navigate('/examinations/schedules')}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div
                className="ed-workflow-icon-box"
                style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
              >
                <FileSpreadsheet size={22} />
              </div>
              <Badge variant="info">{totalExams} Schedules</Badge>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 600 }}>Examination Schedules</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              Configure examination dates, start times, durations, maximum marks, and passing standards across terms.
            </p>
          </div>

          <div className="ed-workflow-link" style={{ color: 'var(--primary-600)' }}>
            <span>Manage Exam Schedules</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 2: Marks Entry & Grade Calculation */}
        <div className="ed-workflow-card" onClick={() => navigate('/examinations/marks')}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div
                className="ed-workflow-icon-box"
                style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-solid)' }}
              >
                <Award size={22} />
              </div>
              <Badge variant={pendingExams > 0 ? 'warning' : 'success'}>
                {pendingExams} Open Sheets
              </Badge>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 600 }}>Marks Entry & Evaluation</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              Batch enter student marks, record absences, apply automatic grade calculations, and save draft scores.
            </p>
          </div>

          <div className="ed-workflow-link" style={{ color: 'var(--warning-solid)' }}>
            <span>Open Marks Entry Sheet</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 3: Publish Results & Locking */}
        <div className="ed-workflow-card" onClick={() => navigate('/examinations/publish')}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div
                className="ed-workflow-icon-box"
                style={{ backgroundColor: 'var(--teal-subtle)', color: 'var(--teal-accent)' }}
              >
                <CheckCircle2 size={22} />
              </div>
              <Badge variant="teal">{publishedExams} Published</Badge>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 600 }}>Publish Results & Lockdown</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              Validate marks completeness, lock institutional grades, and release report cards to students and parents.
            </p>
          </div>

          <div className="ed-workflow-link" style={{ color: 'var(--teal-accent)' }}>
            <span>Review Results Publication</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Schedules Ledger & Assessment Protocol */}
      <div className="ed-grid-2">
        {/* Active Schedules Ledger */}
        <div className="ed-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Active Assessment Schedules</h3>
            </div>
            <Badge variant="neutral">{schedules.length} Recorded</Badge>
          </div>

          <div className="ed-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.85rem' }}>Loading assessment schedules...</span>
              </div>
            ) : schedules.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>No examination schedules currently active.</p>
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/examinations/schedules')}>
                  Create Examination Schedule
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {schedules.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                        {s.className} • {s.subjectCode} • {s.examDate} at {s.startTime}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Max: {s.maxMarks}</span>
                      <Badge variant={s.status === 'PUBLISHED' ? 'success' : s.status === 'MARKS_SUBMITTED' ? 'info' : 'warning'}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {schedules.length > 4 && (
                  <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    +{schedules.length - 4} more schedules in ledger •{' '}
                    <span
                      style={{ color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => navigate('/examinations/schedules')}
                    >
                      View All Schedules →
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assessment Protocol & Institutional Compliance */}
        <div className="ed-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success-solid)' }} />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Assessment Protocol & Governance</h3>
            </div>
            <Badge variant="success">CBSE Standards Verified</Badge>
          </div>

          <div className="ed-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Protocol Row 1 */}
            <div className="ed-compliance-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>CCE 9-Point Grading Scale</span>
                </div>
                <Badge variant="teal">Active</Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '24px', lineHeight: 1.45 }}>
                Grade boundaries A1 (91–100%) through E are automatically enforced across all evaluation sheets.
              </p>
            </div>

            {/* Protocol Row 2 */}
            <div className="ed-compliance-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} style={{ color: 'var(--warning-solid)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Audited Mark Corrections</span>
                </div>
                <Badge variant="info">Enforced</Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '24px', lineHeight: 1.45 }}>
                Post-submission mark adjustments require mandatory audit rationale and are permanently logged.
              </p>
            </div>

            {/* Protocol Row 3 */}
            <div className="ed-compliance-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success-solid)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Cryptographic Result Lock</span>
                </div>
                <Badge variant="success">Secured</Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '24px', lineHeight: 1.45 }}>
                Published marks are sealed against unauthorized tampering and mirrored to student virtual report cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
