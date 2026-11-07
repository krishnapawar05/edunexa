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
  Trash2,
  XCircle,
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

interface ToastState {
  type: 'success' | 'error';
  message: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [eventModalError, setEventModalError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // New Notice Form State
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    targetClass: 'Grade 10',
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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
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
    setModalError(null);

    const titleTrimmed = newNotice.title.trim();
    const contentTrimmed = newNotice.content.trim();

    if (!titleTrimmed) {
      setModalError('Notice title is required.');
      return;
    }
    if (!contentTrimmed) {
      setModalError('Notice content is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await operationsApi.broadcastNotice({
        title: titleTrimmed,
        content: contentTrimmed,
        audience: newNotice.audience,
        targetClass: newNotice.audience === 'SPECIFIC_CLASS' ? newNotice.targetClass : undefined,
        isUrgent: newNotice.isUrgent,
      });

      showToast('success', `Notice "${titleTrimmed}" successfully broadcasted to audience [${newNotice.audience}]!`);
      setShowNoticeModal(false);
      setNewNotice({
        title: '',
        content: '',
        audience: 'ALL',
        targetClass: 'Grade 10',
        isUrgent: false,
      });
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to publish notice.';
      setModalError(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete notice "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await operationsApi.deleteNotice(id);
      showToast('success', `Notice "${title}" deleted successfully.`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete notice.');
    } finally {
      setDeletingId(null);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventModalError(null);

    const titleTrimmed = newEvent.title.trim();
    const descTrimmed = newEvent.description.trim();

    if (!titleTrimmed) {
      setEventModalError('Event title is required.');
      return;
    }
    if (!descTrimmed) {
      setEventModalError('Event description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await operationsApi.createSchoolEvent({
        ...newEvent,
        title: titleTrimmed,
        description: descTrimmed,
        startDate: new Date(newEvent.startDate).toISOString(),
        endDate: new Date(newEvent.endDate).toISOString(),
      });
      showToast('success', `Event "${titleTrimmed}" successfully scheduled!`);
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
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to schedule event.';
      setEventModalError(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.audience?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#ffffff',
            border: `1px solid ${toast.type === 'success' ? '#059669' : '#dc2626'}`,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1100,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '480px',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />
          ) : (
            <XCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
          )}
          <span style={{ lineHeight: 1.4 }}>{toast.message}</span>
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
              onClick={() => {
                setModalError(null);
                setShowNoticeModal(true);
              }}
              className="ed-btn ed-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Broadcast Notice</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEventModalError(null);
                setShowEventModal(true);
              }}
              className="ed-btn ed-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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

        {activeTab === 'notices' && (
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter notices by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ed-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
            />
          </div>
        )}
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
          ) : filteredNotices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
              {searchQuery ? 'No notices matching your search criteria.' : 'No institutional notices published yet. Use "Broadcast Notice" to publish an announcement.'}
            </div>
          ) : (
            filteredNotices.map((n) => (
              <div
                key={n.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: n.isUrgent ? '1px solid #fca5a5' : '1px solid var(--border-default)',
                  borderLeft: n.isUrgent ? '4px solid #ef4444' : undefined,
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge variant="neutral">
                      Audience: {n.audience}{n.targetClass ? ` (${n.targetClass})` : ''}
                    </Badge>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteNotice(n.id, n.title)}
                      disabled={deletingId === n.id}
                      title="Delete notice"
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--danger-200)',
                        backgroundColor: 'var(--danger-50)',
                        color: 'var(--danger-700)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{deletingId === n.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
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
              No institutional events scheduled yet.
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {e.title}
                  </h3>
                  <Badge variant={e.isPublic ? 'success' : 'neutral'}>
                    {e.isPublic ? 'Public' : 'Campus'}
                  </Badge>
                </div>

                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {e.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)' }}>
                  {e.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} />
                      <span>{e.venue}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span>
                      {new Date(e.startDate).toLocaleDateString()} – {new Date(e.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} />
                    <span>Audience: {e.audience}</span>
                  </div>
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
            {modalError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  color: '#991b1b',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Notice Title *
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {newNotice.title.length} characters
                </span>
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Notice Content *
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {newNotice.content.length} characters
                </span>
              </div>
              <textarea
                required
                rows={4}
                placeholder="Enter official announcement details..."
                value={newNotice.content}
                onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                className="ed-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: newNotice.audience === 'SPECIFIC_CLASS' ? '1fr 1fr' : '1fr 1fr', gap: 'var(--space-3)' }}>
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
                  <option value="SPECIFIC_CLASS">Specific Class</option>
                </select>
              </div>

              {newNotice.audience === 'SPECIFIC_CLASS' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Select Class *
                  </label>
                  <select
                    value={newNotice.targetClass}
                    onChange={(e) => setNewNotice({ ...newNotice, targetClass: e.target.value })}
                    className="ed-input"
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>
              ) : (
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
              )}
            </div>

            {newNotice.audience === 'SPECIFIC_CLASS' && (
              <div>
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
            )}

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
            {eventModalError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  color: '#991b1b',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{eventModalError}</span>
              </div>
            )}

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
