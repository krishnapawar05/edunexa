import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Award,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { portalsApi } from '../../services/api.js';

export const ParentHomeworkPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadHomework = async () => {
    if (!selectedChild) return;
    try {
      setLoading(true);
      setError(null);
      const res: any = await portalsApi.getParentChildHomework(selectedChild.id);
      setHomework(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve child homework tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [selectedChild?.id]);

  const filteredHomework = homework.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasSubmission = item.submissions && item.submissions.length > 0;
    const submission = hasSubmission ? item.submissions[0] : null;
    const isGraded = submission?.status === 'GRADED';
    const isSubmitted = hasSubmission && submission?.status !== 'PENDING';

    if (statusFilter === 'GRADED') return matchesSearch && isGraded;
    if (statusFilter === 'SUBMITTED') return matchesSearch && isSubmitted;
    if (statusFilter === 'PENDING') return matchesSearch && !hasSubmission;
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Universal Parent Child Switcher */}
      <ParentChildSwitcherBar />

      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Parent & Guardian Suite</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Compliance</span>
          </div>
          <h1 className="ed-page-header-title">
            <BookOpen size={26} style={{ color: 'var(--color-primary)' }} />
            Homework & Assignment Tracker
          </h1>
          <p className="ed-page-header-desc">
            Monitor course assignments, due dates, submission status, and teacher evaluation feedback for{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{selectedChild?.name || 'Selected Ward'}</strong>.
          </p>
        </div>

        <button
          className="ed-btn ed-btn-secondary"
          onClick={loadHomework}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="ed-toolbar">
        <div className="ed-search-box">
          <Search size={16} className="ed-search-icon" />
          <input
            type="text"
            placeholder="Search homework or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ed-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`ed-btn ed-btn-sm ${statusFilter === filter ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
            >
              {filter === 'ALL' ? 'All Assignments' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Listing */}
      <div className="ed-card">
        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 8px' }} />
              Loading assignment records...
            </div>
          ) : filteredHomework.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredHomework.map((item, idx) => {
                const sub = item.submissions?.[0];
                const isOverdue = new Date(item.dueDate) < new Date() && !sub;

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx === filteredHomework.length - 1 ? 'none' : '1px solid var(--border-default)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>
                          {item.subjectCode || 'General'}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.description || 'Complete assigned exercise problems and submit solution draft.'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        <span>Max Marks: {item.maxMarks || 20}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {sub ? (
                        sub.status === 'GRADED' ? (
                          <div style={{ textAlign: 'right' }}>
                            <span className="ed-badge ed-badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Graded: {sub.obtainedMarks}/{item.maxMarks}
                            </span>
                            {sub.feedback && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                "{sub.feedback}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="ed-badge ed-badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Submitted (Pending Review)
                          </span>
                        )
                      ) : isOverdue ? (
                        <span className="ed-badge ed-badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Overdue
                        </span>
                      ) : (
                        <span className="ed-badge ed-badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No homework records found matching your filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ParentHomeworkPage;
