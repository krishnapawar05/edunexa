import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  RefreshCw,
  Award,
} from 'lucide-react';
import { portalsApi, coreApi } from '../../services/api.js';

export const TeacherRemarksPage: React.FC = () => {
  const [remarks, setRemarks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Remark Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'GENERAL' | 'PARTICIPATION'>('ACADEMIC');
  const [remarkText, setRemarkText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [remRes, stuRes] = await Promise.allSettled([
        portalsApi.getTeacherRemarks(),
        coreApi.listStudents({ className: 'Grade 10' }),
      ]);

      if (remRes.status === 'fulfilled') {
        const val: any = remRes.value;
        setRemarks(Array.isArray(val) ? val : val?.data || []);
      }
      if (stuRes.status === 'fulfilled') {
        const studentList = stuRes.value?.students || stuRes.value || [];
        setStudents(studentList);
        if (studentList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentList[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher remarks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !remarkText.trim()) return;

    try {
      setSubmitting(true);
      await portalsApi.addStudentRemark({
        studentProfileId: selectedStudentId,
        category,
        remark: remarkText.trim(),
        isPrivate,
      });

      setShowModal(false);
      setRemarkText('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add student remark.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRemarks = remarks.filter(
    (r) =>
      r.remark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.studentProfile?.user && `${r.studentProfile.user.firstName} ${r.studentProfile.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Student Mentorship</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feedback & Observations</span>
          </div>
          <h1 className="ed-page-header-title">
            <MessageSquare size={26} style={{ color: 'var(--color-primary)' }} />
            Student Observations, Feedback & Report Card Remarks
          </h1>
          <p className="ed-page-header-desc">
            Document student behavioral milestones, academic commendations, and formal report card remarks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Observation
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="ed-toolbar">
        <div className="ed-search-box">
          <Search size={16} className="ed-search-icon" />
          <input
            type="text"
            placeholder="Search student or remark text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ed-input"
          />
        </div>
      </div>

      {/* Remarks Directory */}
      <div className="ed-card">
        <div className="ed-card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Recorded Observations</h3>
        </div>
        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading observations...
            </div>
          ) : filteredRemarks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredRemarks.map((r, idx) => (
                <div
                  key={r.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx === filteredRemarks.length - 1 ? 'none' : '1px solid var(--border-default)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="ed-badge ed-badge-teal">{r.category}</span>
                      {r.isPrivate ? (
                        <span className="ed-badge ed-badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={11} /> Faculty Private
                        </span>
                      ) : (
                        <span className="ed-badge ed-badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={11} /> Visible on Report Card
                        </span>
                      )}
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{r.remark}"
                    </p>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Student: <strong>{r.studentProfile?.user ? `${r.studentProfile.user.firstName} ${r.studentProfile.user.lastName}` : (r.studentProfile?.admissionNumber || 'Candidate')}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No student observations recorded yet.</p>
              <button
                className="ed-btn ed-btn-primary ed-btn-sm"
                onClick={() => setShowModal(true)}
                style={{ marginTop: '12px' }}
              >
                Add First Remark
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Observation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>Record Student Observation</h3>
            <form onSubmit={handleAddRemark} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Target Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="ed-select"
                  style={{ width: '100%' }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName ? `${s.firstName} ${s.lastName} (${s.admissionNumber})` : (s.user ? `${s.user.firstName} ${s.user.lastName} (${s.admissionNumber})` : s.admissionNumber)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="ed-select"
                  style={{ width: '100%' }}
                >
                  <option value="ACADEMIC">Academic Excellence & Progress</option>
                  <option value="BEHAVIORAL">Behavior & Conduct</option>
                  <option value="ATTENDANCE">Attendance & Punctuality</option>
                  <option value="PARTICIPATION">Classroom Participation & Leadership</option>
                  <option value="GENERAL">General Observation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Observation / Remark *
                </label>
                <textarea
                  rows={4}
                  required
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Shows outstanding analytical reasoning in thermodynamics problem-solving sessions..."
                  className="ed-textarea"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <label htmlFor="isPrivate" style={{ fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Private faculty observation (hide from parent report card)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="ed-btn ed-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ed-btn ed-btn-primary">
                  {submitting ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherRemarksPage;
