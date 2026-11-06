import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { portalsApi } from '../../services/api.js';

export const ParentMeetingsPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = async () => {
    if (!selectedChild) return;
    try {
      setLoading(true);
      setError(null);
      const res: any = await portalsApi.getParentChildMeetings(selectedChild.id);
      setMeetings(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scheduled meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [selectedChild?.id]);

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PTM & Consultations</span>
          </div>
          <h1 className="ed-page-header-title">
            <Video size={26} style={{ color: 'var(--color-primary)' }} />
            Parent-Teacher Meetings & Consultations
          </h1>
          <p className="ed-page-header-desc">
            Direct coordination with class teachers and subject faculty regarding academic progress for{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{selectedChild?.name || 'Selected Ward'}</strong>.
          </p>
        </div>

        <button
          className="ed-btn ed-btn-secondary"
          onClick={loadMeetings}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Meetings Grid */}
      <div className="ed-card">
        <div className="ed-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Scheduled Consultations</span>
          </div>
        </div>
        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 8px' }} />
              Loading meeting appointments...
            </div>
          ) : meetings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {meetings.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx === meetings.length - 1 ? 'none' : '1px solid var(--border-default)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="ed-badge ed-badge-teal">{m.meetingType || 'PTM'}</span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.title}
                      </h3>
                    </div>
                    {m.description && (
                      <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        {m.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {new Date(m.scheduledDate).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {m.startTime} - {m.endTime}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} /> Host: {m.hostUser ? `${m.hostUser.firstName} ${m.hostUser.lastName}` : 'Faculty Member'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {m.status === 'SCHEDULED' && m.joiningUrl ? (
                      <a
                        href={m.joiningUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ed-btn ed-btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                      >
                        <Video size={15} /> Join Video Conference
                      </a>
                    ) : (
                      <span className="ed-badge ed-badge-neutral">{m.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Video size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No parent-teacher meetings scheduled currently.</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Your child's class teacher will post conference slots here ahead of term evaluations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ParentMeetingsPage;
