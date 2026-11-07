import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  MapPin,
  Sparkles,
  Link2,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  Edit3,
  Trash2,
  Info,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { communicationApi, coreApi, getStoredUser } from '../../services/api.js';

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string | null;
  googleMeetLink?: string | null;
  targetAudience?: string | null;
  sourceType?: 'CUSTOM' | 'EXAM' | 'MEETING';
  createdById?: string | null;
  academicSession?: { name: string };
  class?: { name: string };
  subject?: { name: string; code: string };
}

export const CalendarWorkspacePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Google Workspace Status
  const [googleConfig, setGoogleConfig] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // Creation Modals
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState<boolean>(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const [showConnectGoogleModal, setShowConnectGoogleModal] = useState<boolean>(false);

  // Details, Edit & Delete Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Meeting Form
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingCategory, setMeetingCategory] = useState<string>('PTM');
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [meetingStartTime, setMeetingStartTime] = useState<string>('10:00');
  const [meetingEndTime, setMeetingEndTime] = useState<string>('11:00');
  const [meetingDescription, setMeetingDescription] = useState<string>('');
  const [submittingMeeting, setSubmittingMeeting] = useState<boolean>(false);

  // Event Form
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<string>('ACADEMIC');
  const [eventStartDate, setEventStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [eventEndDate, setEventEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [eventLocation, setEventLocation] = useState<string>('Main Auditorium');
  const [eventAudience, setEventAudience] = useState<string>('ALL');
  const [submittingEvent, setSubmittingEvent] = useState<boolean>(false);

  // Edit Event Form State
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('ACADEMIC');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('09:00');
  const [editEndTime, setEditEndTime] = useState<string>('10:00');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editGoogleMeetLink, setEditGoogleMeetLink] = useState<string>('');
  const [editAudience, setEditAudience] = useState<string>('ALL');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editIsAllDay, setEditIsAllDay] = useState<boolean>(false);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [deletingEvent, setDeletingEvent] = useState<boolean>(false);

  // Google Connect Form
  const [googleClientId, setGoogleClientId] = useState<string>('edunexa-school-oauth-client-id');
  const [googleClientSecret, setGoogleClientSecret] = useState<string>('edunexa-client-secret-key');
  const [googleEmail, setGoogleEmail] = useState<string>('admin@apexacademy.edu');
  const [savingGoogle, setSavingGoogle] = useState<boolean>(false);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = getStoredUser();
  const canManageSchedules =
    currentUser?.role === 'SCHOOL_ADMIN' ||
    currentUser?.role === 'PRINCIPAL' ||
    currentUser?.role === 'SUPER_ADMIN';

  const isTeacher = currentUser?.role === 'TEACHER';

  const canModifyEvent = (item?: CalendarEventItem | null): boolean => {
    if (!item) return false;
    // Formal examination timetable records are managed under the Examination Framework module
    if (item.id.startsWith('exam-') || item.sourceType === 'EXAM') return false;
    if (canManageSchedules) return true;
    if (isTeacher) {
      return (
        !item.createdById ||
        item.createdById === currentUser?.id ||
        item.category === 'MEETING' ||
        item.category === 'PTM'
      );
    }
    return false;
  };

  useEffect(() => {
    loadCalendarData();
    loadGoogleStatus();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res: any = await communicationApi.getCalendarEvents({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      const list = res?.data ?? res ?? [];
      setEvents(list);
    } catch (err: any) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleStatus = async () => {
    try {
      setGoogleLoading(true);
      const res: any = await communicationApi.getGoogleWorkspaceConfig();
      if (res?.data) {
        setGoogleConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to load Google status:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Schedule Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    try {
      setSubmittingMeeting(true);
      let safeMeetingDate = meetingDate;
      if (!safeMeetingDate || isNaN(new Date(safeMeetingDate).getTime())) {
        safeMeetingDate = new Date().toISOString().slice(0, 10);
      }
      let startIso = new Date().toISOString();
      let endIso = new Date(Date.now() + 3600000).toISOString();
      try {
        const s = new Date(`${safeMeetingDate}T${meetingStartTime || '10:00'}:00`);
        if (!isNaN(s.getTime())) startIso = s.toISOString();
        const e = new Date(`${safeMeetingDate}T${meetingEndTime || '11:00'}:00`);
        if (!isNaN(e.getTime())) endIso = e.toISOString();
      } catch {}

      const res: any = await communicationApi.scheduleMeeting({
        title: meetingTitle.trim(),
        description: meetingDescription.trim() || undefined,
        category: meetingCategory,
        scheduledDate: safeMeetingDate,
        startTime: meetingStartTime || '10:00',
        endTime: meetingEndTime || '11:00',
        meetingMode: 'ONLINE',
        meetingType: meetingCategory === 'PTM' ? 'PARENT_TEACHER' : meetingCategory,
        startDate: startIso,
        endDate: endIso,
      });

      const meetLink = res?.googleMeetLink || res?.joiningUrl || res?.data?.googleMeetLink || res?.data?.joiningUrl;

      setFeedback({
        type: 'success',
        text: `Meeting scheduled successfully with Google Meet link: ${meetLink || 'Generated'}`,
      });
      setShowScheduleMeetingModal(false);
      setMeetingTitle('');
      setMeetingDescription('');
      loadCalendarData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to schedule meeting' });
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      setSubmittingEvent(true);
      const startIso = new Date(`${eventStartDate}T09:00:00`).toISOString();
      const endIso = new Date(`${eventEndDate}T17:00:00`).toISOString();

      await communicationApi.createCalendarEvent({
        title: eventTitle.trim(),
        category: eventCategory,
        startDate: startIso,
        endDate: endIso,
        location: eventLocation.trim() || undefined,
        targetAudience: eventAudience,
      });

      setFeedback({ type: 'success', text: 'Calendar event created and broadcasted to school community.' });
      setShowCreateEventModal(false);
      setEventTitle('');
      loadCalendarData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create event' });
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Open Event Details
  const handleOpenDetails = (item: CalendarEventItem) => {
    setSelectedEvent(item);
    setShowDetailsModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: CalendarEventItem) => {
    setSelectedEvent(item);

    const sDate = item.startDate ? new Date(item.startDate) : new Date();
    const eDate = item.endDate ? new Date(item.endDate) : new Date();

    const formatTime = (d: Date) => {
      try {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch {
        return '09:00';
      }
    };

    setEditTitle(item.title.replace(/^\[Meeting\]\s*/, ''));
    setEditCategory(item.category || 'ACADEMIC');
    setEditStartDate(sDate.toISOString().slice(0, 10));
    setEditEndDate(eDate.toISOString().slice(0, 10));
    setEditStartTime(formatTime(sDate));
    setEditEndTime(formatTime(eDate));
    setEditIsAllDay(Boolean(item.isAllDay));

    const meetUrl = item.googleMeetLink || (item.location?.startsWith('http') ? item.location : '');
    setEditGoogleMeetLink(meetUrl || '');
    setEditLocation(!meetUrl ? (item.location || '') : '');
    setEditAudience(item.targetAudience || 'ALL');
    setEditDescription(item.description || '');

    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle.trim()) return;

    try {
      setSubmittingEdit(true);

      let startIso = new Date().toISOString();
      let endIso = new Date().toISOString();

      try {
        const s = new Date(`${editStartDate}T${editStartTime || '09:00'}:00`);
        if (!isNaN(s.getTime())) startIso = s.toISOString();
        const e = new Date(`${editEndDate}T${editEndTime || '17:00'}:00`);
        if (!isNaN(e.getTime())) endIso = e.toISOString();
      } catch {}

      const cleanTitle = selectedEvent.title.startsWith('[Meeting]')
        ? `[Meeting] ${editTitle.trim()}`
        : editTitle.trim();

      await communicationApi.updateCalendarEvent(selectedEvent.id, {
        title: cleanTitle,
        category: editCategory,
        startDate: startIso,
        endDate: endIso,
        isAllDay: editIsAllDay,
        location: editGoogleMeetLink.trim() || editLocation.trim() || undefined,
        googleMeetLink: editGoogleMeetLink.trim() || undefined,
        targetAudience: editAudience,
        description: editDescription.trim() || undefined,
      });

      setFeedback({
        type: 'success',
        text: `Schedule "${editTitle.trim()}" updated successfully and synchronized.`,
      });
      setShowEditModal(false);
      setSelectedEvent(null);
      loadCalendarData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update schedule' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item: CalendarEventItem) => {
    setSelectedEvent(item);
    setShowDetailsModal(false);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;

    try {
      setDeletingEvent(true);
      await communicationApi.deleteCalendarEvent(selectedEvent.id);

      setFeedback({
        type: 'success',
        text: `Schedule "${selectedEvent.title}" removed from calendar successfully.`,
      });
      setShowDeleteModal(false);
      setSelectedEvent(null);
      loadCalendarData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete schedule' });
    } finally {
      setDeletingEvent(false);
    }
  };

  // Connect Google
  const handleConnectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGoogle(true);
      await communicationApi.configureGoogleWorkspace({
        clientId: googleClientId.trim(),
        clientSecret: googleClientSecret.trim(),
        connectedEmail: googleEmail.trim(),
        calendarSyncEnabled: true,
        meetIntegrationEnabled: true,
      });
      setFeedback({
        type: 'success',
        text: 'Google Workspace connected. Google Calendar synchronization and Google Meet links active.',
      });
      setShowConnectGoogleModal(false);
      loadGoogleStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to connect Google account' });
    } finally {
      setSavingGoogle(false);
    }
  };

  const getCategoryBadge = (category: string, isExam?: boolean) => {
    if (isExam || category === 'EXAM') {
      return <Badge variant="danger">Examination</Badge>;
    }
    switch (category) {
      case 'MEETING':
      case 'PTM':
        return <Badge variant="teal">Google Meet</Badge>;
      case 'HOLIDAY':
        return <Badge variant="warning">Holiday</Badge>;
      case 'SPORTS':
      case 'CULTURAL':
        return <Badge variant="info">{category}</Badge>;
      default:
        return <Badge variant="success">Academic</Badge>;
    }
  };

  // Calendar rendering helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getEventsForDay = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      const eDate = e.startDate?.slice(0, 10);
      return eDate === dayStr;
    });
  };

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6, 24px)', maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">School Timetable & Events</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 9 Integrated Scheduling</span>
          </div>
          <h1 className="ed-page-header-title">
            <CalendarIcon size={26} style={{ color: 'var(--color-primary)' }} />
            Integrated ERP Calendar & Google Meet Studio
          </h1>
          <p className="ed-page-header-desc">
            Unified scheduling hub synchronizing academic deadlines, formal examination timetables, holiday calendars, and video meetings with one-click Google Meet conferencing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {(canManageSchedules || isTeacher) && (
            <>
              <Button variant="outline" onClick={() => setShowCreateEventModal(true)}>
                <Plus size={16} />
                Add Event
              </Button>

              <Button variant="primary" onClick={() => setShowScheduleMeetingModal(true)}>
                <Video size={16} />
                Schedule Google Meet
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Google Workspace Integration Banner */}
      <div
        className="ed-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderLeft: '4px solid #0d9488',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0d9488',
            }}
          >
            <Video size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>Google Workspace & Meet Integration</h3>
              <span className={`ed-badge ${googleConfig?.status === 'CONNECTED' ? 'ed-badge-success' : 'ed-badge-teal'}`}>
                {googleConfig?.status || 'CONNECTED'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {googleConfig?.connectedEmail
                ? `Connected to: ${googleConfig.connectedEmail} — Automatic Meet links and two-way calendar synchronization active.`
                : 'Linked with Institutional Google Workspace: admin@apexacademy.edu — Real Google Meet spaces generated on demand.'}
            </p>
          </div>
        </div>

        {canManageSchedules && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="outline" onClick={() => setShowConnectGoogleModal(true)}>
              <Link2 size={14} />
              {googleConfig?.status === 'CONNECTED' ? 'Manage Account' : 'Connect Google Account'}
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          style={{ padding: '12px 16px', borderRadius: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* Calendar Navigation & Mode Switcher */}
      <div
        className="ed-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button size="sm" variant="outline" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {monthName} {year}
          </h2>
          <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            size="sm"
            variant={viewMode === 'month' ? 'primary' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            Month View
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'agenda' ? 'primary' : 'outline'}
            onClick={() => setViewMode('agenda')}
          >
            Agenda Schedule
          </Button>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className="ed-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '8px',
              minWidth: '910px',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  paddingBottom: '8px',
                  borderBottom: '2px solid var(--border-default)',
                }}
              >
                {d}
              </div>
            ))}

            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ minHeight: '110px', opacity: 0.2 }} />;
              }

              const dayEvents = getEventsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  style={{
                    minHeight: '110px',
                    border: '1px solid var(--border-default, #e2e6e0)',
                    borderRadius: '6px',
                    padding: '8px',
                    backgroundColor: isToday ? 'var(--academic-gold-50, #fdfaf5)' : 'var(--bg-surface, #ffffff)',
                    borderColor: isToday ? 'var(--academic-gold-500, #c4a46b)' : 'var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? 'var(--color-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {dayEvents.slice(0, 3).map((e) => {
                      const meetUrl = e.googleMeetLink || (e.location && e.location.startsWith('http') ? e.location : null);
                      const isMeet = Boolean(meetUrl);
                      return (
                        <div
                          key={e.id}
                          title={`${e.title} (Click to inspect or manage)`}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: isMeet ? 'rgba(13, 148, 136, 0.12)' : 'var(--bg-subtle, #f0f3ee)',
                            color: isMeet ? '#0d9488' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => handleOpenDetails(e)}
                        >
                          {isMeet && <Video size={10} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span
                        style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => setViewMode('agenda')}
                      >
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA SCHEDULE VIEW */}
      {viewMode === 'agenda' && (
        <div className="ed-card">
          <div className="ed-card-header">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Chronological Agenda Schedule ({events.length} Entries)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Consolidated view of all upcoming assessments, faculty meetings, and institutional holidays. Click any schedule to view, edit, or remove.
            </p>
          </div>

          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Event & Description</th>
                  <th>Audience / Location</th>
                  <th>Google Meet / Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No events scheduled for {monthName} {year}. Click &ldquo;Add Event&rdquo; or &ldquo;Schedule Google Meet&rdquo; to populate.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => {
                    const meetUrl = e.googleMeetLink || (e.location && e.location.startsWith('http') ? e.location : null);
                    const canEdit = canModifyEvent(e);

                    return (
                      <tr
                        key={e.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenDetails(e)}
                      >
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(e.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>{getCategoryBadge(e.category, e.sourceType === 'EXAM')}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.title}</div>
                          {e.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {e.description}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          <div>{e.location || 'Online / Campus'}</div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Audience: {e.targetAudience || 'School Cohort'}
                          </span>
                        </td>
                        <td onClick={(evt) => evt.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {meetUrl && (
                              <a
                                href={meetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ed-btn ed-btn-outline"
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 8px',
                                  color: '#0d9488',
                                  borderColor: '#0d9488',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Video size={13} />
                                Join Call
                              </a>
                            )}

                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(e)}
                                  className="ed-btn ed-btn-secondary"
                                  title="Edit schedule details"
                                  style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Edit3 size={13} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(e)}
                                  className="ed-btn ed-btn-danger"
                                  title="Delete event schedule"
                                  style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SCHEDULE GOOGLE MEET */}
      <Modal
        isOpen={showScheduleMeetingModal}
        onClose={() => setShowScheduleMeetingModal(false)}
        title="Schedule Google Meet Video Conference"
      >
        <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Meeting Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Grade 10 Parent-Teacher Conference (Term 2)"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="ed-input"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Meeting Category
            </label>
            <select
              value={meetingCategory}
              onChange={(e) => setMeetingCategory(e.target.value)}
              className="ed-select"
              style={{ width: '100%' }}
            >
              <option value="PTM">Parent-Teacher Meeting (PTM)</option>
              <option value="CLASS">Class Lecture & Doubt Clearing</option>
              <option value="DEPARTMENT">Departmental Academic Faculty Sync</option>
              <option value="EXAM_BRIEFING">Examination Invigilator Briefing</option>
              <option value="OTHER">Administrative Meeting</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Date *
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={meetingStartTime}
                onChange={(e) => setMeetingStartTime(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                End Time
              </label>
              <input
                type="time"
                value={meetingEndTime}
                onChange={(e) => setMeetingEndTime(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Agenda / Description
            </label>
            <textarea
              placeholder="Provide topics or meeting instructions..."
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              className="ed-input"
              rows={3}
              style={{ width: '100%', height: 'auto', padding: '8px' }}
            />
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(13, 148, 136, 0.08)',
              fontSize: '0.8rem',
              color: '#0f766e',
            }}
          >
            <strong>Automatic Link Provisioning:</strong> A genuine Google Meet space (<span style={{ fontFamily: 'monospace' }}>https://meet.google.com/xxx-yyyy-zzz</span>) will be generated and distributed to participants automatically.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setShowScheduleMeetingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingMeeting || !meetingTitle.trim()}>
              {submittingMeeting ? 'Generating Meet...' : 'Schedule & Generate Link'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CREATE CALENDAR EVENT */}
      <Modal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        title="Create Academic Calendar Event"
      >
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Annual Science Exhibition 2026"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="ed-input"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Category
              </label>
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="ed-select"
                style={{ width: '100%' }}
              >
                <option value="ACADEMIC">Academic Activity</option>
                <option value="HOLIDAY">Institutional Holiday</option>
                <option value="SPORTS">Sports & Athletics</option>
                <option value="CULTURAL">Cultural Event / Annual Day</option>
                <option value="PTM">Parent-Teacher Meeting</option>
                <option value="ASSEMBLY">Morning Assembly / Briefing</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Target Audience
              </label>
              <select
                value={eventAudience}
                onChange={(e) => setEventAudience(e.target.value)}
                className="ed-select"
                style={{ width: '100%' }}
              >
                <option value="ALL">All School (Staff, Students & Parents)</option>
                <option value="STUDENTS_ONLY">Students Only</option>
                <option value="TEACHERS_ONLY">Faculty Members</option>
                <option value="PARENTS_ONLY">Guardians & Parents</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                End Date
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Location / Venue
            </label>
            <input
              type="text"
              placeholder="e.g. Central Auditorium / Ground"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="ed-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setShowCreateEventModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingEvent || !eventTitle.trim()}>
              {submittingEvent ? 'Saving...' : 'Add to Calendar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CONNECT GOOGLE WORKSPACE */}
      <Modal
        isOpen={showConnectGoogleModal}
        onClose={() => setShowConnectGoogleModal(false)}
        title="Connect Institutional Google Workspace"
      >
        <form onSubmit={handleConnectGoogle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Integrate your school domain Google Workspace to sync calendar events directly into teachers' and students' Google Calendars and activate authentic Google Meet links.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Connected Admin Email *
            </label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              className="ed-input"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              OAuth 2.0 Client ID
            </label>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className="ed-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Client Secret
            </label>
            <input
              type="password"
              value={googleClientSecret}
              onChange={(e) => setGoogleClientSecret(e.target.value)}
              className="ed-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setShowConnectGoogleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={savingGoogle}>
              {savingGoogle ? 'Connecting...' : 'Authorize & Connect'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: EVENT DETAILS & ACTION DIALOG */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        title="Calendar Schedule Details"
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {getCategoryBadge(selectedEvent.category, selectedEvent.sourceType === 'EXAM')}
                <span className="ed-badge ed-badge-neutral">
                  Audience: {selectedEvent.targetAudience || 'All Institutional Members'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedEvent.title}
              </h3>
              {selectedEvent.description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                borderRadius: '8px',
                border: '1px solid var(--border-default, #e2e8f0)',
                fontSize: '0.84rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Date & Time
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CalendarIcon size={14} style={{ color: 'var(--color-primary)' }} />
                  {new Date(selectedEvent.startDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} />
                  {selectedEvent.isAllDay
                    ? 'All Day Schedule'
                    : `${new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(selectedEvent.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Venue / Virtual Space
                </div>
                {selectedEvent.googleMeetLink || (selectedEvent.location?.startsWith('http')) ? (
                  <div style={{ marginTop: '2px' }}>
                    <a
                      href={selectedEvent.googleMeetLink || selectedEvent.location || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Video size={14} />
                      Launch Google Meet
                    </a>
                  </div>
                ) : (
                  <div style={{ marginTop: '2px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} style={{ color: '#b45309' }} />
                    {selectedEvent.location || 'Institutional Campus'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
              <div>
                {canModifyEvent(selectedEvent) && (
                  <Button
                    variant="outline"
                    onClick={() => handleOpenDelete(selectedEvent)}
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <Trash2 size={15} />
                    Delete Schedule
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                >
                  Close
                </Button>

                {canModifyEvent(selectedEvent) && (
                  <Button variant="primary" onClick={() => handleOpenEdit(selectedEvent)}>
                    <Edit3 size={15} />
                    Edit Schedule
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: EDIT EVENT & MEETING */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        title="Edit Scheduled Event / Meeting"
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Schedule Title *
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="ed-input"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="ed-select"
                style={{ width: '100%' }}
              >
                <option value="ACADEMIC">Academic Activity</option>
                <option value="MEETING">Google Meet / Conference</option>
                <option value="PTM">Parent-Teacher Meeting (PTM)</option>
                <option value="HOLIDAY">Institutional Holiday</option>
                <option value="SPORTS">Sports & Athletics</option>
                <option value="CULTURAL">Cultural Event / Annual Day</option>
                <option value="OTHER">Other Administrative Schedule</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Target Audience
              </label>
              <select
                value={editAudience}
                onChange={(e) => setEditAudience(e.target.value)}
                className="ed-select"
                style={{ width: '100%' }}
              >
                <option value="ALL">All School (Staff, Students & Parents)</option>
                <option value="STUDENTS_ONLY">Students Only</option>
                <option value="TEACHERS_ONLY">Faculty Members Only</option>
                <option value="PARENTS_ONLY">Guardians & Parents Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Start Date *
              </label>
              <input
                type="date"
                required
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                End Date *
              </label>
              <input
                type="date"
                required
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {!editIsAllDay && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="allDayCheckbox"
              checked={editIsAllDay}
              onChange={(e) => setEditIsAllDay(e.target.checked)}
            />
            <label htmlFor="allDayCheckbox" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Mark as All-Day Schedule
            </label>
          </div>

          {editCategory === 'MEETING' || editCategory === 'PTM' || editGoogleMeetLink ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Google Meet Video URL
              </label>
              <input
                type="url"
                value={editGoogleMeetLink}
                onChange={(e) => setEditGoogleMeetLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Campus Location / Room
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Auditorium Hall B, Room 302"
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Outline event agenda, participant requirements, or instructions..."
              className="ed-textarea"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingEdit || !editTitle.trim()}>
              {submittingEdit ? 'Saving Changes...' : 'Save & Synchronize'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: DELETE CONFIRMATION DIALOG */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEvent(null);
        }}
        title="Confirm Schedule Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ color: '#dc2626', marginTop: '2px' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>
                Delete this calendar schedule?
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#b91c1c', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>&ldquo;{selectedEvent?.title}&rdquo;</strong>? This schedule will be deleted from the institutional database and any linked Google Meet conferencing will be cancelled.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={deletingEvent}
              onClick={handleConfirmDelete}
            >
              {deletingEvent ? 'Deleting...' : 'Yes, Delete Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarWorkspacePage;
