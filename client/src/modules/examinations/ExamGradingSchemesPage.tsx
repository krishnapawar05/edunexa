import React, { useState, useEffect } from 'react';
import {
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Calculator,
  ShieldAlert,
  X,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { academicApi } from '../../services/api.js';

interface GradeBoundary {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  description: string;
}

interface GradingSchemeData {
  schoolId: string;
  schemeName: string;
  passingPercentage: number;
  schemeType: string;
  grades: GradeBoundary[];
  isLocked: boolean;
}

export const ExamGradingSchemesPage: React.FC = () => {
  const [scheme, setScheme] = useState<GradingSchemeData | null>(null);
  const [grades, setGrades] = useState<GradeBoundary[]>([]);
  const [schemeName, setSchemeName] = useState('');
  const [passingPercentage, setPassingPercentage] = useState<number>(33);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Grade Simulator State
  const [simScore, setSimScore] = useState<number>(85);
  const [simResult, setSimResult] = useState<any>(null);

  const loadScheme = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await academicApi.getGradingSchemes();
      if (res) {
        setScheme(res);
        setSchemeName(res.schemeName || 'Institutional 9-Point Scale');
        setPassingPercentage(res.passingPercentage ?? 33);
        setGrades(Array.isArray(res.grades) ? [...res.grades] : []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve grading schemes from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheme();
  }, []);

  // Update simulator when grades or simScore change
  useEffect(() => {
    if (grades.length === 0) {
      setSimResult(null);
      return;
    }
    const score = Number(simScore);
    const matched = grades.find((g) => score >= g.minPercentage && score <= g.maxPercentage);
    if (matched) {
      setSimResult(matched);
    } else {
      setSimResult({
        grade: 'OUT_OF_BOUNDS',
        gradePoint: 0,
        description: 'Score does not fall into any defined range.',
      });
    }
  }, [simScore, grades]);

const STANDARD_LETTER_PRESET: GradeBoundary[] = [
  { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10.0, description: 'Outstanding Academic Mastery' },
  { grade: 'A',  minPercentage: 80, maxPercentage: 89,  gradePoint: 9.0,  description: 'Excellent Knowledge & Application' },
  { grade: 'B+', minPercentage: 70, maxPercentage: 79,  gradePoint: 8.0,  description: 'Very Good Conceptual Understanding' },
  { grade: 'B',  minPercentage: 60, maxPercentage: 69,  gradePoint: 7.0,  description: 'Good Proficiency in Core Topics' },
  { grade: 'C',  minPercentage: 50, maxPercentage: 59,  gradePoint: 6.0,  description: 'Average Competence & Standard Pass' },
  { grade: 'D',  minPercentage: 35, maxPercentage: 49,  gradePoint: 4.0,  description: 'Marginal Passing Standard' },
  { grade: 'E',  minPercentage: 0,  maxPercentage: 34,  gradePoint: 0.0,  description: 'Needs Remedial Support (Fail)' },
];

const CBSE_9POINT_PRESET: GradeBoundary[] = [
  { grade: 'A1', minPercentage: 91, maxPercentage: 100, gradePoint: 10.0, description: 'Outstanding Performance' },
  { grade: 'A2', minPercentage: 81, maxPercentage: 90,  gradePoint: 9.0,  description: 'Excellent Academic Standard' },
  { grade: 'B1', minPercentage: 71, maxPercentage: 80,  gradePoint: 8.0,  description: 'Very Good Comprehension' },
  { grade: 'B2', minPercentage: 61, maxPercentage: 70,  gradePoint: 7.0,  description: 'Good Conceptual Mastery' },
  { grade: 'C1', minPercentage: 51, maxPercentage: 60,  gradePoint: 6.0,  description: 'Above Average Standard' },
  { grade: 'C2', minPercentage: 41, maxPercentage: 50,  gradePoint: 5.0,  description: 'Average Passing Standard' },
  { grade: 'D',  minPercentage: 33, maxPercentage: 40,  gradePoint: 4.0,  description: 'Marginal Pass' },
  { grade: 'E',  minPercentage: 0,  maxPercentage: 32,  gradePoint: 0.0,  description: 'Needs Essential Improvement (Remedial)' },
];

  const handleApplyPreset = (type: 'letter' | 'cbse') => {
    if (type === 'letter') {
      setGrades([...STANDARD_LETTER_PRESET]);
      setSchemeName('Apex Academy Standard Letter Scale (A+, A, B+, B, C, D, E)');
      setPassingPercentage(35);
    } else {
      setGrades([...CBSE_9POINT_PRESET]);
      setSchemeName('CBSE Continuous & Comprehensive Evaluation (9-Point Scale)');
      setPassingPercentage(33);
    }
    setErrorMsg(null);
  };

  const handleGradeChange = (index: number, field: keyof GradeBoundary, val: any) => {
    setGrades((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: field === 'grade' || field === 'description' ? val : Number(val) } : item
      )
    );
  };

  const handleAddRow = () => {
    const newRow: GradeBoundary = {
      grade: 'New',
      minPercentage: 0,
      maxPercentage: 0,
      gradePoint: 0,
      description: 'Custom Band',
    };
    setGrades((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (grades.length <= 2) {
      setErrorMsg('A valid grading scheme must contain at least 2 grade bands.');
      return;
    }
    setGrades((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (grades.length < 2) {
      setErrorMsg('Grading scheme must contain at least 2 grade bands.');
      return;
    }

    // Check unique symbols
    const seen = new Set<string>();
    for (const g of grades) {
      const sym = (g.grade || '').trim().toUpperCase();
      if (!sym) {
        setErrorMsg('Every grade band must have a non-empty grade symbol.');
        return;
      }
      if (seen.has(sym)) {
        setErrorMsg(`Duplicate grade identifier '${sym}'. Each band must have a unique symbol.`);
        return;
      }
      seen.add(sym);

      if (g.minPercentage < 0 || g.maxPercentage > 100) {
        setErrorMsg(`Grade '${g.grade}' boundaries must be between 0% and 100%.`);
        return;
      }
      if (g.minPercentage > g.maxPercentage) {
        setErrorMsg(`Grade '${g.grade}' minimum (${g.minPercentage}%) cannot exceed maximum (${g.maxPercentage}%).`);
        return;
      }
    }

    // Sort ascending by minPercentage to verify 0-100% continuity
    const sorted = [...grades].sort((a, b) => a.minPercentage - b.minPercentage);
    if (sorted[0].minPercentage !== 0) {
      setErrorMsg(`Grading scheme must cover from 0%. Lowest band '${sorted[0].grade}' starts at ${sorted[0].minPercentage}%.`);
      return;
    }
    if (sorted[sorted.length - 1].maxPercentage !== 100) {
      setErrorMsg(`Grading scheme must cover up to 100%. Highest band '${sorted[sorted.length - 1].grade}' ends at ${sorted[sorted.length - 1].maxPercentage}%.`);
      return;
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (cur.maxPercentage >= next.minPercentage) {
        setErrorMsg(`Grade boundary overlap: '${cur.grade}' (ends at ${cur.maxPercentage}%) overlaps with '${next.grade}' (starts at ${next.minPercentage}%).`);
        return;
      }
      if (cur.maxPercentage + 1 < next.minPercentage) {
        setErrorMsg(`Grade boundary gap: Missing percentage coverage between '${cur.grade}' (${cur.maxPercentage}%) and '${next.grade}' (${next.minPercentage}%).`);
        return;
      }
    }

    try {
      setIsSaving(true);
      await academicApi.updateGradingScheme({
        schemeName,
        passingPercentage: Number(passingPercentage),
        grades,
      });

      setSuccessToast('Institutional grading scheme successfully saved to PostgreSQL.');
      await loadScheme();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save grading scheme to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-bg, rgba(16, 185, 129, 0.1))',
            border: '1px solid var(--success-border, rgba(16, 185, 129, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-text, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
            <CheckCircle2 size={16} />
            {successToast}
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Layers style={{ color: 'var(--primary-600)' }} size={26} />
            Institutional Grading Schemes & Boundaries
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Configure percentage brackets, qualitative criteria, and GPA weightings for all school assessments in PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadScheme} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleSaveScheme} disabled={isSaving || loading}>
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ marginRight: '6px' }} />
                Saving to DB...
              </>
            ) : (
              <>
                <Save size={15} style={{ marginRight: '6px' }} />
                Save Grading Scheme
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Integrity Notice Banner */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--info-bg, rgba(2, 132, 199, 0.08))',
          border: '1px solid var(--info-border, rgba(2, 132, 199, 0.25))',
          borderRadius: 'var(--radius-md)',
          color: 'var(--info-text, #0284c7)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '13px',
        }}
      >
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Grading Scheme Integrity Protocol:</strong> Changes committed here adjust calculations for ongoing and future
          assessment drafts. Already published examination records remain locked to prevent retrospective alterations of academic transcripts.
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
            border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Scheme Editor & Live Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left: Scheme Configuration */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                SCHEME IDENTIFIER / TITLE *
              </label>
              <input
                type="text"
                required
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                placeholder="e.g. CBSE Continuous & Comprehensive Evaluation (9-Point Scale)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                PASSING THRESHOLD (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  GRADE BRACKETS & POINT METRICS
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('letter')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: 'var(--primary-600, #3b82f6)',
                      cursor: 'pointer',
                    }}
                  >
                    Restore Letter Scale (A+, A, B+, B, C, D, E)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('cbse')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: '1px solid var(--border-primary)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Restore CBSE 9-Point Scale (A1–E)
                  </button>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddRow}>
                <Plus size={14} style={{ marginRight: '4px' }} />
                Add Grade Band
              </Button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                <span>Loading grading scheme from PostgreSQL...</span>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-primary)', fontWeight: 600 }}>
                      <th style={{ padding: '10px 12px', width: '80px' }}>GRADE</th>
                      <th style={{ padding: '10px 12px', width: '100px' }}>MIN %</th>
                      <th style={{ padding: '10px 12px', width: '100px' }}>MAX %</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>GPA POINT</th>
                      <th style={{ padding: '10px 12px' }}>DESCRIPTIVE CRITERIA</th>
                      <th style={{ padding: '10px 12px', width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            value={row.grade}
                            onChange={(e) => handleGradeChange(idx, 'grade', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              fontWeight: 700,
                              color: 'var(--primary-600)',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.minPercentage}
                            onChange={(e) => handleGradeChange(idx, 'minPercentage', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.maxPercentage}
                            onChange={(e) => handleGradeChange(idx, 'maxPercentage', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            max={10}
                            value={row.gradePoint}
                            onChange={(e) => handleGradeChange(idx, 'gradePoint', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => handleGradeChange(idx, 'description', e.target.value)}
                            placeholder="e.g. Outstanding Performance"
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={grades.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: grades.length <= 1 ? 'not-allowed' : 'pointer',
                              color: 'var(--danger-text, #ef4444)',
                              opacity: grades.length <= 1 ? 0.3 : 1,
                            }}
                          >
                            <Trash2 size={15} />
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

        {/* Right: Interactive Grade Simulator */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Grade Calculation Simulator
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Test your boundary configurations live against raw student percentages.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              SAMPLE PERCENTAGE SCORE: {simScore}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={simScore}
              onChange={(e) => setSimScore(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span>Passing: {passingPercentage}%</span>
              <span>100%</span>
            </div>
          </div>

          {simResult && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                COMPUTED RESULT
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: simScore >= passingPercentage ? 'var(--success-text, #059669)' : 'var(--danger-text, #dc2626)',
                  margin: '4px 0',
                }}
              >
                {simResult.grade}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {simResult.description}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                GPA Weight: <strong>{simResult.gradePoint} pts</strong> | Status:{' '}
                <strong>{simScore >= passingPercentage ? 'PASSED' : 'REMEDIAL REQUIRED'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
