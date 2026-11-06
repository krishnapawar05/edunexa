import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { portalsApi, coreApi } from '../../services/api.js';

export const TeacherMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Meeting Form
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('PTM');
  const [meetingMode, setMeetingMode] = useState('ONLINE');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('14:30');
  const [joiningUrl, setJoiningUrl] = useState('https://meet.google.com/edu-nex-ptm');
  const [locationOrRoom, setLocationOrRoom] = useState('Conference Hall 2');
  const [submitting, setSubmitting] = useState(false);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await portalsApi.getTeacherMeetings();
      setMeetings(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await portalsApi.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        meetingType: meetingType as any,
        meetingMode: meetingMode as any,
        scheduledDate,
        startTime,
        endTime,
        joiningUrl: meetingMode === 'ONLINE' ? joiningUrl : undefined,
        locationOrRoom: meetingMode === 'IN_PERSON' ? locationOrRoom : undefined,
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      loadMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule consultation meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (meetingId: string, status: string) => {
    try {
      await portalsApi.updateMeetingStatus(meetingId, { status });
      loadMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to update meeting status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Faculty Collaboration</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent-Teacher Conferences</span>
          </div>
          <h1 className="ed-page-header-title">
            <Video size={26} style={{ color: 'var(--color-primary)' }} />
            PTM & Parent Consultation Scheduling
          </h1>
          <p className="ed-page-header-desc">
            Organize scheduled parent-teacher conferences, launch video calls via Google Meet, and maintain attendance records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadMeetings}
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
            <Plus size={16} /> Schedule Conference
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Meetings List */}
      <div className="ed-card">
        <div className="ed-card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Upcoming & Logged Consultations</h3>
        </div>
        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading scheduled meetings...
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
                      <span className="ed-badge ed-badge-teal">{m.meetingType}</span>
                      <span className="ed-badge ed-badge-neutral">{m.meetingMode}</span>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                        <Clock size={13} /> {m.startTime} – {m.endTime}
                      </span>
                      {m.studentProfile && (
                        <span>Student: {m.studentProfile.user ? `${m.studentProfile.user.firstName} ${m.studentProfile.user.lastName}` : 'Candidate'}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.status === 'SCHEDULED' && m.joiningUrl && (
                      <a
                        href={m.joiningUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ed-btn ed-btn-primary ed-btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Video size={13} /> Start Video Call
                      </a>
                    )}
                    {m.status === 'SCHEDULED' ? (
                      <>
                        <button
                          className="ed-btn ed-btn-secondary ed-btn-sm"
                          onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                        >
                          Mark Completed
                        </button>
                        <button
                          className="ed-btn ed-btn-danger ed-btn-sm"
                          onClick={() => handleUpdateStatus(m.id, 'CANCELLED')}
                        >
                          Cancel
                        </button>
                      </>
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
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No parent consultations scheduled yet.</p>
              <button
                className="ed-btn ed-btn-primary ed-btn-sm"
                onClick={() => setShowModal(true)}
                style={{ marginTop: '12px' }}
              >
                Schedule First Conference
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
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
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>Schedule Parent Consultation</h3>
            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Academic Performance Review"
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Meeting Type & Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="ed-select"
                  >
                    <option value="PTM">Parent-Teacher Meeting (PTM)</option>
                    <option value="ACADEMIC_REVIEW">Academic Review</option>
                    <option value="DISCIPLINARY">Disciplinary Consultation</option>
                    <option value="SPECIAL_COUNSELING">Special Counseling</option>
                  </select>

                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value)}
                    className="ed-select"
                  >
                    <option value="ONLINE">Online Video Conference</option>
                    <option value="IN_PERSON">In-Person Campus Meeting</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {meetingMode === 'ONLINE' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Video Conference URL
                  </label>
                  <input
                    type="url"
                    value={joiningUrl}
                    onChange={(e) => setJoiningUrl(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Room / Campus Location
                  </label>
                  <input
                    type="text"
                    value={locationOrRoom}
                    onChange={(e) => setLocationOrRoom(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Agenda Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key discussion points (e.g. attendance, mock test marks)..."
                  className="ed-textarea"
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="ed-btn ed-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ed-btn ed-btn-primary">
                  {submitting ? 'Scheduling...' : 'Save & Notify Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherMeetingsPage;
