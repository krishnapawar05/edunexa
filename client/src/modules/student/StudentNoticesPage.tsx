import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { operationsApi } from '../../services/api.js';

export const StudentNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'EVENTS'>('NOTICES');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [noticeList, eventList] = await Promise.all([
        operationsApi.listNotices(),
        operationsApi.listEvents(),
      ]);

      setNotices(noticeList || []);
      setEvents(eventList || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve notices and events from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            <Bell size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Campus Notices & Academic Events
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Administrative circulars, term holiday schedules, examination notices, and co-curricular events.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Circulars
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

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'NOTICES' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('NOTICES')}
        >
          Notices & Circulars ({notices.length})
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'EVENTS' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('EVENTS')}
        >
          Upcoming Campus Events ({events.length})
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading circulars from PostgreSQL...</div>
        </div>
      ) : activeTab === 'NOTICES' ? (
        notices.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {notices.map((n) => {
              const isUrgent = n.priority === 'URGENT' || n.priority === 'HIGH' || n.title?.toLowerCase().includes('urgent');

              return (
                <div
                  key={n.id}
                  className="ed-card"
                  style={{
                    padding: 'var(--space-5)',
                    borderLeft: isUrgent ? '4px solid var(--danger-solid)' : '4px solid var(--primary-600)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`ed-badge ${isUrgent ? 'ed-badge-danger' : 'ed-badge-info'}`} style={{ fontSize: '0.70rem' }}>
                        {isUrgent ? 'URGENT CIRCULAR' : 'OFFICIAL NOTICE'}
                      </span>
                      <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {n.audience || 'STUDENTS & FACULTY'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    {n.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {n.content}
                  </p>

                  <div style={{ marginTop: 'var(--space-3)', paddingTop: '8px', borderTop: '1px solid var(--border-default)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Authorized by: Administration & Principal's Office
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              No Active Notices
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              All administrative circulars are up to date. Check back for upcoming notifications.
            </p>
          </div>
        )
      ) : events.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {events.map((evt) => (
            <div
              key={evt.id}
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
                    {evt.audience || 'CAMPUS EVENT'}
                  </span>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.68rem' }}>
                    {evt.isPublic ? 'OPEN EVENT' : 'INTERNAL'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {evt.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  {evt.description || 'Institutional event scheduled in the academic calendar.'}
                </p>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} style={{ color: 'var(--primary-600)' }} />
                  <span>Start: {evt.startDate ? new Date(evt.startDate).toLocaleDateString() : 'TBA'}</span>
                </div>
                {evt.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} style={{ color: 'var(--primary-600)' }} />
                    <span>Venue: {evt.venue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Scheduled Events
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No upcoming school events recorded in the calendar.
          </p>
        </div>
      )}
    </div>
  );
};
export default StudentNoticesPage;
