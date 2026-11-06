import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { portalsApi } from '../../services/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

export const StudentMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await portalsApi.getStudentMeetings();
      setMeetings(res || []);
    } catch (err) {
      console.error('Failed to load student meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header Banner */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Mentorship & Counseling</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Communication Hub</span>
          </div>
          <h1 className="ed-page-header-title">
            <Video size={26} style={{ color: 'var(--color-primary)' }} />
            Academic Meetings & Mentorship Schedules
          </h1>
          <p className="ed-page-header-desc">
            Access authorized academic review sessions, parent-teacher meetings, and direct video conferencing links.
          </p>
        </div>

        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="ed-card" style={{ padding: '64px', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading scheduled meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="ed-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Video size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Scheduled Meetings</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            When teachers or counselors schedule a review meeting or PTM, the joining link will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {meetings.map((m) => (
            <div key={m.id} className="ed-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="ed-badge ed-badge-neutral">{m.meetingType.replace(/_/g, ' ')}</span>
                <Badge variant={m.status === 'SCHEDULED' ? 'info' : m.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {m.status}
                </Badge>
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {m.title}
                </h3>
                {m.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {m.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle, #f7f9f6)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{new Date(m.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{m.startTime} – {m.endTime}</span>
                </div>
                {m.locationOrRoom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>{m.locationOrRoom}</span>
                  </div>
                )}
              </div>

              {m.notes && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Notes: {m.notes}
                </div>
              )}

              {m.joiningUrl && m.status === 'SCHEDULED' && (
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <a
                    href={m.joiningUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ed-btn ed-btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={16} />
                    Join Video Conference
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
