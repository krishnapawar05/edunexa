import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { operationsApi, coreApi, getStoredUser } from '../../services/api.js';

export const StudentResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const studentProfile = await coreApi.getStudentById(currentStudentId);
      setStudent(studentProfile);

      const targetClass = studentProfile?.className || studentProfile?.enrollments?.[0]?.class?.name || 'Grade 10';
      const list = await operationsApi.listResources({ className: targetClass });
      setResources(list || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve study resources from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const subjects = ['ALL', ...Array.from(new Set(resources.map((r) => r.subjectName || r.subjectCode || 'General').filter(Boolean)))];

  const filteredResources = resources.filter((res) => {
    const matchesSubject = selectedSubject === 'ALL' || (res.subjectName || res.subjectCode || 'General') === selectedSubject;
    const matchesSearch =
      !searchQuery ||
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subjectName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
            <Layers size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Learning Resources & Study Notes
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Teacher-published curriculum guides, lecture slides, revision formula sheets, and reading materials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadResources}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Resources
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg, #fef2f2)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="ed-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search study notes, topics, or formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {subjects.map((subj) => (
            <button
              key={subj}
              className={`ed-btn ed-btn-sm ${selectedSubject === subj ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
              onClick={() => setSelectedSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading learning resources from PostgreSQL...</div>
        </div>
      ) : filteredResources.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filteredResources.map((res) => {
            const isPdf = (res.fileType || res.url || '').toLowerCase().includes('pdf');
            const isVideo = (res.fileType || '').toLowerCase().includes('video');

            return (
              <div
                key={res.id}
                className="ed-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 'var(--space-5)',
                  borderTop: '3px solid var(--primary-600)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="ed-badge ed-badge-info" style={{ fontSize: '0.70rem' }}>
                      {res.subjectName || res.subjectCode || 'General'}
                    </span>
                    <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                      {res.fileType || (isPdf ? 'PDF' : 'DOC')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {res.title}
                  </h3>

                  <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {res.description || 'Teacher-recommended reading material and syllabus notes.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {res.publishedAt ? new Date(res.publishedAt).toLocaleDateString() : 'Approved Resource'}
                  </span>

                  {res.url ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ed-btn ed-btn-sm ed-btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', gap: '6px' }}
                    >
                      <Download size={13} /> Open / Download
                    </a>
                  ) : (
                    <button
                      className="ed-btn ed-btn-sm ed-btn-secondary"
                      onClick={() => alert(`Opening resource: ${res.title}`)}
                    >
                      <FileText size={13} /> View Notes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderOpen size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Resources Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No learning materials match your current filter. Your instructors regularly upload materials before exams.
          </p>
        </div>
      )}
    </div>
  );
};
export default StudentResourcesPage;
