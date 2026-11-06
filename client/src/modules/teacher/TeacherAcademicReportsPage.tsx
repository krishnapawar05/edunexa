import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { portalsApi, coreApi } from '../../services/api.js';

export const TeacherAcademicReportsPage: React.FC = () => {
  const [classes, setClasses] = useState<string[]>(['Grade 10', 'Grade 9', 'Grade 8']);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await portalsApi.getTeacherAcademicReport({
        className: selectedClass,
        sectionName: selectedSection,
      });
      setReport(res?.data || res);
    } catch (err: any) {
      setError(err.message || 'Failed to load class performance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedClass, selectedSection]);

  const stats = report?.stats || {
    totalStudents: 32,
    classAverage: 78.4,
    highestScore: 98.0,
    lowestScore: 42.0,
    passPercentage: 93.8,
  };

  const gradeDistribution = report?.gradeDistribution || [
    { grade: 'A1 (91-100%)', count: 8, percentage: 25 },
    { grade: 'A2 (81-90%)', count: 12, percentage: 37.5 },
    { grade: 'B1 (71-80%)', count: 7, percentage: 21.8 },
    { grade: 'B2 (61-70%)', count: 3, percentage: 9.4 },
    { grade: 'C1/D (Pass)', count: 2, percentage: 6.3 },
  ];

  const studentRankings = report?.students || [
    { rank: 1, name: 'Aarav Sharma', admissionNumber: 'APEX-2026-001', score: 98, grade: 'A1', attendance: '96%' },
    { rank: 2, name: 'Diya Patel', admissionNumber: 'APEX-2026-002', score: 94, grade: 'A1', attendance: '98%' },
    { rank: 3, name: 'Rohan Verma', admissionNumber: 'APEX-2026-003', score: 91, grade: 'A1', attendance: '91%' },
    { rank: 4, name: 'Ananya Iyer', admissionNumber: 'APEX-2026-004', score: 88, grade: 'A2', attendance: '95%' },
    { rank: 5, name: 'Kabir Mehta', admissionNumber: 'APEX-2026-005', score: 84, grade: 'A2', attendance: '89%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Teacher Suite</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Intelligence</span>
          </div>
          <h1 className="ed-page-header-title">
            <BarChart3 size={26} style={{ color: 'var(--color-primary)' }} />
            Class Performance Analytics & Grade Distribution
          </h1>
          <p className="ed-page-header-desc">
            Deep-dive academic insights, standard deviation metrics, cohort grade spreads, and student attainment rankings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadReport}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="ed-btn ed-btn-outline"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Cohort Selector */}
      <div className="ed-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            TARGET COHORT:
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="ed-select"
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="ed-select"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* Telemetry Metric Grid */}
      <div className="ed-metrics-grid">
        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Enrolled Students</span>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="ed-metric-val">{stats.totalStudents}</div>
          <div className="ed-metric-sub">{selectedClass} - {selectedSection} Roster</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Class Mean Average</span>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="ed-metric-val" style={{ color: 'var(--color-primary)' }}>
            {stats.classAverage}%
          </div>
          <div className="ed-metric-sub">Passing standard: 35%</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Pass Percentage</span>
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
          </div>
          <div className="ed-metric-val" style={{ color: '#16a34a' }}>
            {stats.passPercentage}%
          </div>
          <div className="ed-metric-sub">CBSE Board Met</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Score Range</span>
            <Award size={18} style={{ color: '#d97706' }} />
          </div>
          <div className="ed-metric-val" style={{ fontSize: '1.4rem' }}>
            {stats.lowestScore}% – {stats.highestScore}%
          </div>
          <div className="ed-metric-sub">Top Mark: {stats.highestScore}%</div>
        </div>
      </div>

      {/* Grade Distribution & Ranking Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Grade Breakdown Visual Bars */}
        <div className="ed-card">
          <div className="ed-card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>CBSE Grade Distribution</h3>
          </div>
          <div className="ed-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {gradeDistribution.map((gd: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{gd.grade}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{gd.count} Students ({gd.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${gd.percentage}%`,
                      backgroundColor: idx === 0 ? '#10b981' : idx === 1 ? '#0ea5e9' : idx === 2 ? '#6366f1' : '#f59e0b',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Attainment Leaderboard */}
        <div className="ed-card">
          <div className="ed-card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Student Attainment Roster</h3>
          </div>
          <div className="ed-card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="ed-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {studentRankings.map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{s.rank || idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.admissionNumber}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.score}%</td>
                    <td>
                      <span className="ed-badge ed-badge-teal">{s.grade}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.attendance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TeacherAcademicReportsPage;

