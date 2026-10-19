import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  MapPin,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { operationsApi } from '../../services/api.js';

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  audience: string;
  targetClass?: string;
  isUrgent: boolean;
  publishedAt: string;
}

interface SchoolEventItem {
  id: string;
  title: string;
  description: string;
  venue?: string;
  startDate: string;
  endDate: string;
  audience: string;
  isPublic: boolean;
}

export const EventsNoticesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'events'>('notices');
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [events, setEvents] = useState<SchoolEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Notice Form State
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    targetClass: '',
    isUrgent: false,
  });

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    venue: 'Main Institutional Auditorium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    audience: 'ALL',
    isPublic: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [noticesRes, eventsRes] = await Promise.all([
        operationsApi.listNotices(),
        operationsApi.listEvents(),
      ]);

      setNotices(Array.isArray(noticesRes) ? noticesRes : (noticesRes as any)?.items || []);
      setEvents(Array.isArray(eventsRes) ? eventsRes : (eventsRes as any)?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notices and events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Broadcast Notice
  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await operationsApi.broadcastNotice(newNotice);
      showToast(`Notice "${newNotice.title}" successfully published to audience [${newNotice.audience}]!`);
      setShowNoticeModal(false);
      setNewNotice({
        title: '',
        content: '',
        audience: 'ALL',
        targetClass: '',
        isUrgent: false,
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await operationsApi.createSchoolEvent({
        ...newEvent,
        startDate: new Date(newEvent.startDate).toISOString(),
        endDate: new Date(newEvent.endDate).toISOString(),
      });
      showToast(`Event "${newEvent.title}" successfully scheduled!`);
      setShowEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        venue: 'Main Institutional Auditorium',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        audience: 'ALL',
        isPublic: true,
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Events & Institutional Notices
            </h1>
            <Badge variant="info">{activeTab === 'notices' ? `${notices.length} Notices` : `${events.length} Events`}</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Broadcast communications, emergency announcements, and academic calendar events with role-based audience scoping.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {activeTab === 'notices' ? (
            <button
              onClick={() => setShowNoticeModal(true)}
              className="ed-btn ed-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Broadcast Notice</span>
            </button>
          ) : (
            <button
              onClick={() => setShowEventModal(true)}
              className="ed-btn ed-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => setActiveTab('notices')}
          className={`ed-btn ed-btn-sm ${activeTab === 'notices' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Bell size={15} />
          <span>Institutional Notices ({notices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`ed-btn ed-btn-sm ${activeTab === 'events' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Calendar size={15} />
          <span>School Events Calendar ({events.length})</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-800)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Tab 1: Notices List */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading notices from PostgreSQL...
            </div>
          ) : notices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
              No institutional notices published yet. Use "Broadcast Notice" to publish an announcement.
            </div>
          ) : (
            notices.map((n) => (
              <div
                key={n.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {n.title}
                    </h3>
                    {n.isUrgent && <Badge variant="danger">Urgent</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="neutral">Audience: {n.audience}</Badge>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {n.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Events Calendar */}
      {activeTab === 'events' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              Loading events from PostgreSQL...
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', gridColumn: '1 / -1' }}>
              No institutional events scheduled. Use "Create Event" to schedule an event.
            </div>
          ) : (
            events.map((e) => (
              <div
                key={e.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant="info">
                    {new Date(e.startDate).toLocaleDateString()}
                  </Badge>
                  <Badge variant="neutral">
                    {e.audience}
                  </Badge>
                </div>

                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {e.title}
                </h3>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>
                  {e.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-default)',
                    paddingTop: '8px',
                  }}
                >
                  <MapPin size={13} style={{ color: 'var(--primary-600)' }} />
                  <span>{e.venue || 'Main Institutional Campus'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Broadcast Notice */}
      {showNoticeModal && (
        <Modal
          isOpen={showNoticeModal}
          onClose={() => setShowNoticeModal(false)}
          title="Broadcast Institutional Notice"
        >
          <form onSubmit={handleBroadcastNotice} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Notice Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Parent-Teacher Conference Schedule"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                className="ed-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Notice Content *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Enter official announcement details..."
                value={newNotice.content}
                onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                className="ed-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Target Audience *
                </label>
                <select
                  value={newNotice.audience}
                  onChange={(e) => setNewNotice({ ...newNotice, audience: e.target.value })}
                  className="ed-input"
                >
                  <option value="ALL">All School Community</option>
                  <option value="STUDENTS_ONLY">Students Only</option>
                  <option value="PARENTS_ONLY">Parents Only</option>
                  <option value="STAFF_ONLY">Faculty & Staff Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newNotice.isUrgent}
                    onChange={(e) => setNewNotice({ ...newNotice, isUrgent: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger-700)' }}>
                    Mark as Urgent / Priority Alert
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowNoticeModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Broadcast Notice'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create School Event */}
      {showEventModal && (
        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="Schedule Institutional Event"
        >
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science & Innovation Exposition 2026"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="ed-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Event Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter event agenda, guest details, and participant requirements..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="ed-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Venue Location
              </label>
              <input
                type="text"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                className="ed-input"
                placeholder="e.g. Ramanujan Auditorium"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="ed-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="ed-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowEventModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling...' : 'Confirm Event'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
