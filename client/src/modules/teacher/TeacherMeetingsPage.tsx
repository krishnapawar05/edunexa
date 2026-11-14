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
  Search,
  Filter,
  FileText,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Users,
} from 'lucide-react';
import { portalsApi, coreApi, communicationApi, getStoredUser } from '../../services/api.js';

interface StudentOption {
  id: string;
  name: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string | number;
  parentContact?: string;
  parentEmail?: string;
  guardianName?: string;
}

export const TeacherMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [participants, setParticipants] = useState<{
    teachers: Array<{ userId: string; fullName: string; email: string; role: string; employeeCode?: string; department?: string }>;
    principals: Array<{ userId: string; fullName: string; email: string; role: string }>;
    admins: Array<{ userId: string; fullName: string; email: string; role: string }>;
    students: Array<{ studentProfileId: string; userId?: string; fullName: string; admissionNumber?: string }>;
  }>({ teachers: [], principals: [], admins: [], students: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingScope, setMeetingScope] = useState<'TEACHER_PEER' | 'ALL_TEACHERS' | 'TEACHER_TO_PRINCIPAL' | 'TEACHER_TO_ADMIN' | 'PTM'>('TEACHER_PEER');
  const [selectedTargetUserId, setSelectedTargetUserId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('TEACHER_TO_TEACHER');
  const [meetingMode, setMeetingMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('14:30');
  const [joiningUrl, setJoiningUrl] = useState('');
  const [locationOrRoom, setLocationOrRoom] = useState('Conference Hall 2');
  const [submitting, setSubmitting] = useState(false);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleMeetingId, setRescheduleMeetingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Attendance & Notes Modal State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesMeetingId, setNotesMeetingId] = useState<string | null>(null);
  const [notesStatus, setNotesStatus] = useState<'COMPLETED' | 'SCHEDULED' | 'CANCELLED'>('COMPLETED');
  const [attendanceOutcome, setAttendanceOutcome] = useState('Both Parents Attended');
  const [meetingNotes, setMeetingNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [meetingsRes, studentsRes, participantsRes] = await Promise.allSettled([
        portalsApi.getTeacherMeetings(),
        coreApi.listStudents({ limit: 100 }),
        communicationApi.getMeetingParticipants(),
      ]);

      if (meetingsRes.status === 'fulfilled') {
        const val: any = meetingsRes.value;
        setMeetings(Array.isArray(val) ? val : val?.data || []);
      } else {
        setError(meetingsRes.reason?.message || 'Failed to load teacher meetings.');
      }

      if (studentsRes.status === 'fulfilled') {
        const studentItems = studentsRes.value?.items || studentsRes.value?.students || [];
        const mapped: StudentOption[] = studentItems.map((s: any) => ({
          id: s.id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student Candidate',
          admissionNumber: s.admissionNumber,
          className: s.className || s.grade,
          sectionName: s.sectionName,
          rollNumber: s.rollNumber,
          parentContact: s.parentContact || s.phone,
          parentEmail: s.parentEmail,
          guardianName: s.guardianName,
        }));
        setStudents(mapped);
      }

      if (participantsRes.status === 'fulfilled') {
        const pData: any = participantsRes.value;
        if (pData) {
          setParticipants({
            teachers: pData.teachers || [],
            principals: pData.principals || [],
            admins: pData.admins || [],
            students: pData.students || [],
          });
          if (pData.teachers && pData.teachers.length > 0 && !selectedTargetUserId) {
            setSelectedTargetUserId(pData.teachers[0].userId);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize consultation workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const generateAutoMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randomChunk = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${randomChunk(3)}-${randomChunk(4)}-${randomChunk(3)}`;
  };

  const handleOpenScheduleModal = () => {
    setTitle('Faculty Peer Academic Collaboration');
    setDescription('Collaborate on curriculum alignment, student progress reviews, and joint lesson planning.');
    setMeetingScope('TEACHER_PEER');
    setMeetingType('TEACHER_TO_TEACHER');
    setMeetingMode('ONLINE');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setStartTime('14:00');
    setEndTime('14:30');
    setJoiningUrl(generateAutoMeetLink());
    setLocationOrRoom('Room 204, Academic Block');
    if (participants.teachers.length > 0) {
      setSelectedTargetUserId(participants.teachers[0].userId);
    }
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
    setShowScheduleModal(true);
  };

  const handleScopeChange = (scope: 'TEACHER_PEER' | 'ALL_TEACHERS' | 'TEACHER_TO_PRINCIPAL' | 'TEACHER_TO_ADMIN' | 'PTM') => {
    setMeetingScope(scope);
    if (scope === 'TEACHER_PEER') {
      setTitle('Faculty Peer Academic Collaboration');
      setDescription('Collaborate on curriculum alignment, student progress reviews, and joint lesson planning.');
      setMeetingType('TEACHER_TO_TEACHER');
      if (participants.teachers.length > 0) setSelectedTargetUserId(participants.teachers[0].userId);
      else setSelectedTargetUserId('');
    } else if (scope === 'TEACHER_TO_PRINCIPAL') {
      setTitle('Teacher-Principal Academic Briefing');
      setDescription('Discussion on departmental objectives, examination readiness, and institutional feedback.');
      setMeetingType('TEACHER_TO_PRINCIPAL');
      if (participants.principals.length > 0) setSelectedTargetUserId(participants.principals[0].userId);
      else setSelectedTargetUserId('');
    } else if (scope === 'TEACHER_TO_ADMIN') {
      setTitle('Teacher-Admin Resource Coordination');
      setDescription('Administrative sync on classroom supplies, scheduling logistics, and portal support.');
      setMeetingType('TEACHER_TO_ADMIN');
      if (participants.admins.length > 0) setSelectedTargetUserId(participants.admins[0].userId);
      else setSelectedTargetUserId('');
    } else if (scope === 'ALL_TEACHERS') {
      setTitle('Departmental Faculty Assembly');
      setDescription('Whole department discussion on upcoming curriculum milestones and academic benchmarks.');
      setMeetingType('STAFF_INTERNAL');
      setSelectedTargetUserId('');
    } else if (scope === 'PTM') {
      setTitle('Parent-Teacher Academic Performance Review');
      setDescription('Review term assessments, classroom engagement, and recommended study plan.');
      setMeetingType('PARENT_TEACHER');
      if (students.length > 0 && !selectedStudentId) setSelectedStudentId(students[0].id);
      setSelectedTargetUserId('');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      let targetUserId: string | undefined = undefined;
      let participantName: string | undefined = undefined;
      let participantRole: string | undefined = undefined;
      let studentProfileId: string | undefined = undefined;

      if (meetingScope === 'TEACHER_PEER') {
        targetUserId = selectedTargetUserId;
        const targetTeacher = participants.teachers.find((t) => t.userId === selectedTargetUserId);
        participantName = targetTeacher?.fullName;
        participantRole = targetTeacher?.role || 'TEACHER';
      } else if (meetingScope === 'TEACHER_TO_PRINCIPAL') {
        targetUserId = selectedTargetUserId;
        const targetPrincipal = participants.principals.find((p) => p.userId === selectedTargetUserId);
        participantName = targetPrincipal?.fullName;
        participantRole = targetPrincipal?.role || 'PRINCIPAL';
      } else if (meetingScope === 'TEACHER_TO_ADMIN') {
        targetUserId = selectedTargetUserId;
        const targetAdmin = participants.admins.find((a) => a.userId === selectedTargetUserId);
        participantName = targetAdmin?.fullName;
        participantRole = targetAdmin?.role || 'SCHOOL_ADMIN';
      } else if (meetingScope === 'PTM') {
        studentProfileId = selectedStudentId || undefined;
      }

      await portalsApi.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        meetingType: meetingType as any,
        meetingMode,
        studentProfileId,
        targetUserId,
        participantName,
        participantRole,
        scheduledDate,
        startTime,
        endTime,
        joiningUrl: meetingMode === 'ONLINE' ? (joiningUrl.trim() || generateAutoMeetLink()) : undefined,
        locationOrRoom: meetingMode === 'IN_PERSON' ? locationOrRoom.trim() : undefined,
      });

      setShowScheduleModal(false);
      showNotification('Meeting scheduled successfully! Google Meet link generated.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule consultation meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRescheduleModal = (m: any) => {
    setRescheduleMeetingId(m.id);
    setRescheduleDate(new Date(m.scheduledDate).toISOString().split('T')[0]);
    setRescheduleStartTime(m.startTime || '14:00');
    setRescheduleEndTime(m.endTime || '14:30');
    setRescheduleReason('');
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleMeetingId) return;

    try {
      setSubmitting(true);
      setError(null);
      await portalsApi.updateMeetingStatus(rescheduleMeetingId, {
        status: 'RESCHEDULED',
        scheduledDate: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
        notes: rescheduleReason ? `Rescheduled: ${rescheduleReason}` : undefined,
      });

      setShowRescheduleModal(false);
      showNotification('Consultation rescheduled successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenNotesModal = (m: any) => {
    setNotesMeetingId(m.id);
    setNotesStatus((m.status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED') as any);
    setAttendanceOutcome('Both Parents Attended');
    setMeetingNotes(m.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesMeetingId) return;

    try {
      setSubmitting(true);
      setError(null);
      const combinedNotes = `[Attendance: ${attendanceOutcome}] ${meetingNotes.trim()}`.trim();

      await portalsApi.updateMeetingStatus(notesMeetingId, {
        status: notesStatus,
        notes: combinedNotes,
      });

      setShowNotesModal(false);
      showNotification('Consultation attendance and notes saved successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to record meeting outcome.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this consultation conference?')) return;
    try {
      await portalsApi.updateMeetingStatus(meetingId, { status: 'CANCELLED' });
      showNotification('Consultation marked as cancelled.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel meeting.');
    }
  };

  // Filtered Meetings
  const filteredMeetings = meetings.filter((m) => {
    if (activeTab === 'SCHEDULED' && m.status !== 'SCHEDULED' && m.status !== 'RESCHEDULED') return false;
    if (activeTab === 'COMPLETED' && m.status !== 'COMPLETED') return false;
    if (activeTab === 'CANCELLED' && m.status !== 'CANCELLED') return false;

    if (typeFilter !== 'ALL' && m.meetingType !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchStudent = m.studentName?.toLowerCase().includes(q) || m.studentAdmissionNumber?.toLowerCase().includes(q);
      const matchGuardian = m.guardianName?.toLowerCase().includes(q);
      const matchParticipant = m.participantName?.toLowerCase().includes(q) || m.participantEmail?.toLowerCase().includes(q) || m.hostName?.toLowerCase().includes(q);
      if (!matchTitle && !matchStudent && !matchGuardian && !matchParticipant) return false;
    }

    return true;
  });

  const totalCount = meetings.length;
  const upcomingCount = meetings.filter((m) => m.status === 'SCHEDULED' || m.status === 'RESCHEDULED').length;
  const completedCount = meetings.filter((m) => m.status === 'COMPLETED').length;
  const onlineCount = meetings.filter((m) => m.meetingMode === 'ONLINE').length;

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Faculty Collaboration</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent-Teacher Consultations</span>
          </div>
          <h1 className="ed-page-header-title">
            <Video size={26} style={{ color: 'var(--color-primary)' }} />
            PTM & Parent Consultation Scheduling
          </h1>
          <p className="ed-page-header-desc">
            Organize parent-teacher conferences, launch video calls via Google Meet, record attendance, and maintain consultation notes.
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
            onClick={handleOpenScheduleModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Schedule Consultation
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', color: '#16a34a', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="ed-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Consultations</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount}</div>
          </div>
        </div>

        <div className="ed-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Upcoming / Active</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{upcomingCount}</div>
          </div>
        </div>

        <div className="ed-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Completed & Recorded</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{completedCount}</div>
          </div>
        </div>

        <div className="ed-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Google Meet Video</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{onlineCount}</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="ed-card">
        {/* Navigation Tabs & Search Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'var(--bg-secondary)',
                  color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab === 'ALL' && 'All Conferences'}
                {tab === 'SCHEDULED' && `Upcoming (${upcomingCount})`}
                {tab === 'COMPLETED' && `Completed (${completedCount})`}
                {tab === 'CANCELLED' && 'Cancelled'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by student or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ed-input"
                style={{ paddingLeft: '30px', fontSize: '0.82rem', width: '220px' }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ed-select"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            >
              <option value="ALL">All Meeting Types</option>
              <option value="TEACHER_TO_TEACHER">Teacher to Teacher (Peer 1-on-1)</option>
              <option value="TEACHER_TO_PRINCIPAL">Teacher to Principal</option>
              <option value="TEACHER_TO_ADMIN">Teacher to Admin</option>
              <option value="STAFF_INTERNAL">Staff & Faculty Internal</option>
              <option value="PARENT_TEACHER">Parent-Teacher (PTM)</option>
              <option value="ACADEMIC_REVIEW">Academic Review</option>
              <option value="STUDENT_COUNSELING">Student Counseling</option>
              <option value="DISCIPLINARY">Disciplinary</option>
            </select>
          </div>
        </div>

        {/* Meeting Entries List */}
        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading consultation records from database...</p>
            </div>
          ) : filteredMeetings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredMeetings.map((m, idx) => {
                const isOnline = m.meetingMode === 'ONLINE';
                const isUpcoming = m.status === 'SCHEDULED' || m.status === 'RESCHEDULED';
                const isDone = m.status === 'COMPLETED';

                return (
                  <div
                    key={m.id || idx}
                    style={{
                      padding: '18px 22px',
                      borderBottom: idx === filteredMeetings.length - 1 ? 'none' : '1px solid var(--border-default)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Top Row: Meta badges & title */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="ed-badge ed-badge-teal">{m.meetingType?.replace('_', ' ')}</span>
                          <span className={`ed-badge ${isOnline ? 'ed-badge-neutral' : 'ed-badge-amber'}`}>
                            {isOnline ? 'Google Meet Video' : 'In-Person Campus'}
                          </span>
                          <span
                            className="ed-badge"
                            style={{
                              backgroundColor: isUpcoming ? '#fef3c7' : isDone ? '#dcfce7' : '#fee2e2',
                              color: isUpcoming ? '#b45309' : isDone ? '#15803d' : '#b91c1c',
                              fontWeight: 700,
                            }}
                          >
                            {m.status}
                          </span>
                        </div>
                        <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {m.title}
                        </h3>
                        {m.description && (
                          <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            {m.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOnline && m.joiningUrl && isUpcoming && (
                          <a
                            href={m.joiningUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ed-btn ed-btn-primary ed-btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                          >
                            <Video size={14} /> Launch Video Call
                          </a>
                        )}

                        <button
                          className="ed-btn ed-btn-secondary ed-btn-sm"
                          onClick={() => handleOpenNotesModal(m)}
                          title="Record meeting notes and parent attendance"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FileText size={13} /> {isDone ? 'View/Edit Notes' : 'Record Notes'}
                        </button>

                        {isUpcoming && (
                          <>
                            <button
                              className="ed-btn ed-btn-secondary ed-btn-sm"
                              onClick={() => handleOpenRescheduleModal(m)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Edit3 size={13} /> Reschedule
                            </button>
                            <button
                              className="ed-btn ed-btn-danger ed-btn-sm"
                              onClick={() => handleCancelMeeting(m.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Student & Guardian & Timing Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px',
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                      }}
                    >
                      {/* Participant / Candidate Details */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {m.studentName ? 'Candidate Student' : 'Invited Colleague / Attendee'}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.studentName || m.participantName || m.guardianName || 'Staff Participant'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {m.studentName ? (
                            <>
                              {m.studentClassName ? `${m.studentClassName} (Sec ${m.studentSectionName || 'A'})` : 'Institutional Class'}
                              {m.studentRollNumber ? ` • Roll #${m.studentRollNumber}` : ''}
                            </>
                          ) : (
                            <>
                              {m.participantRole ? `${m.participantRole.replace('_', ' ')}` : 'Faculty / Staff'}
                              {m.participantEmail ? ` • ${m.participantEmail}` : ''}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Organizer / Guardian Info */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {m.studentName ? 'Parent / Guardian' : 'Host / Organizer'}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.studentName ? (m.guardianName || 'Authorized Parent') : (m.hostName || 'Meeting Organizer')}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {m.studentName
                            ? (m.guardianPhone || m.guardianEmail || 'Contact verified on portal')
                            : (m.hostRole ? `${m.hostRole.replace('_', ' ')} • ` : '') + (m.hostEmail || 'Institutional Faculty')}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Conference Timing
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                          {new Date(m.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} /> {m.startTime} – {m.endTime}
                        </div>
                      </div>

                      {/* Meeting Access / Location */}
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Platform / Location
                        </div>
                        {isOnline ? (
                          <div style={{ wordBreak: 'break-all' }}>
                            <a
                              href={m.joiningUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                            >
                              <Video size={13} /> {m.joiningUrl || 'Google Meet generated'}
                            </a>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={13} style={{ color: '#d97706' }} />
                            <span>{m.locationOrRoom || 'Academic Conference Hall'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Outcome & Attendance Notes (if recorded) */}
                    {m.notes && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                        <strong>Consultation Record & Attendance:</strong> {m.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Video size={36} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Consultations Found
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {searchQuery || typeFilter !== 'ALL' || activeTab !== 'ALL'
                  ? 'No parent conferences match your current search and filter criteria.'
                  : 'No parent consultations scheduled yet. Click below to schedule a conference with an assigned student.'}
              </p>
              <button
                className="ed-btn ed-btn-primary ed-btn-sm"
                onClick={handleOpenScheduleModal}
                style={{ marginTop: '16px' }}
              >
                Schedule Consultation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Consultation Modal */}
      {showScheduleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Schedule Faculty or Parent Consultation</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Meeting Scope & Target Audience */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Collaboration Scope *
                </label>
                <select
                  value={meetingScope}
                  onChange={(e) => handleScopeChange(e.target.value as any)}
                  className="ed-select"
                  style={{ width: '100%', fontWeight: 600 }}
                >
                  <option value="TEACHER_PEER">Teacher to Specific Teacher (Peer 1-on-1)</option>
                  <option value="ALL_TEACHERS">All Teachers / Faculty Department Sync</option>
                  <option value="TEACHER_TO_PRINCIPAL">Teacher to Principal</option>
                  <option value="TEACHER_TO_ADMIN">Teacher to School Admin</option>
                  <option value="PTM">Student & Parent Consultation (PTM)</option>
                </select>
              </div>

              {/* Dynamic Target Selection */}
              {meetingScope === 'TEACHER_PEER' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select Specific Teacher Colleague *
                  </label>
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                    required
                  >
                    {participants.teachers.length === 0 ? (
                      <option value="">No other faculty members found</option>
                    ) : (
                      participants.teachers.map((t) => (
                        <option key={t.userId} value={t.userId}>
                          {t.fullName} {t.department ? `[${t.department}]` : ''} — {t.email}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {meetingScope === 'TEACHER_TO_PRINCIPAL' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select Principal *
                  </label>
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                    required
                  >
                    {participants.principals.length === 0 ? (
                      <option value="">No principal accounts found</option>
                    ) : (
                      participants.principals.map((p) => (
                        <option key={p.userId} value={p.userId}>
                          {p.fullName} — {p.email}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {meetingScope === 'TEACHER_TO_ADMIN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select School Admin *
                  </label>
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                    required
                  >
                    {participants.admins.length === 0 ? (
                      <option value="">No administrator accounts found</option>
                    ) : (
                      participants.admins.map((a) => (
                        <option key={a.userId} value={a.userId}>
                          {a.fullName} — {a.email}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {meetingScope === 'ALL_TEACHERS' && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    fontSize: '0.8rem',
                    color: '#1d4ed8',
                  }}
                >
                  <strong>All Faculty Meeting:</strong> This Google Meet conference will appear on every faculty member's institutional calendar.
                </div>
              )}

              {meetingScope === 'PTM' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select Assigned Student *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">-- Choose Student from Directory --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.className ? `(${st.className})` : ''} {st.rollNumber ? `[Roll #${st.rollNumber}]` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedStudentObj && (
                    <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 10px', borderRadius: '4px' }}>
                      <strong>Associated Guardian:</strong> {selectedStudentObj.guardianName || 'Primary Parent Contact'}{' '}
                      {selectedStudentObj.parentContact ? `• Phone: ${selectedStudentObj.parentContact}` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Science Dept Peer Sync / Academic Review"
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Type & Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Meeting Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    {meetingScope === 'PTM' ? (
                      <>
                        <option value="PARENT_TEACHER">Parent-Teacher Meeting (PTM)</option>
                        <option value="ACADEMIC_REVIEW">Academic Progress Review</option>
                        <option value="STUDENT_COUNSELING">Student Counseling</option>
                        <option value="DISCIPLINARY">Disciplinary Consultation</option>
                      </>
                    ) : (
                      <>
                        <option value="TEACHER_TO_TEACHER">Teacher to Teacher (Peer 1-on-1)</option>
                        <option value="TEACHER_TO_PRINCIPAL">Teacher to Principal</option>
                        <option value="TEACHER_TO_ADMIN">Teacher to School Admin</option>
                        <option value="STAFF_INTERNAL">Staff Internal</option>
                        <option value="ACADEMIC_REVIEW">Academic Review</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Consultation Mode
                  </label>
                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as any)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="ONLINE">Google Meet Video Call</option>
                    <option value="IN_PERSON">In-Person Campus Meeting</option>
                  </select>
                </div>
              </div>

              {/* Date & Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Date *
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
                    Start Time *
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
                    End Time *
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

              {/* URL or Room */}
              {meetingMode === 'ONLINE' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Google Meet Joining URL
                    </label>
                    <button
                      type="button"
                      onClick={() => setJoiningUrl(generateAutoMeetLink())}
                      style={{ background: 'none', border: 'none', fontSize: '0.74rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Regenerate Meet Link
                    </button>
                  </div>
                  <input
                    type="url"
                    value={joiningUrl}
                    onChange={(e) => setJoiningUrl(e.target.value)}
                    className="ed-input"
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Campus Room / Venue
                  </label>
                  <input
                    type="text"
                    value={locationOrRoom}
                    onChange={(e) => setLocationOrRoom(e.target.value)}
                    className="ed-input"
                    placeholder="e.g. Conference Hall 2, Main Academic Building"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Agenda & Discussion Points
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key academic progress points, attendance, or revision strategy..."
                  className="ed-textarea"
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="ed-btn ed-btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ed-btn ed-btn-primary">
                  {submitting ? 'Scheduling...' : 'Save & Link to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowRescheduleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>Reschedule Consultation</h3>
            <form onSubmit={handleConfirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  New Date *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Rescheduling Reason / Note
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Adjusted as per guardian request to 3:00 PM..."
                  className="ed-textarea"
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="ed-btn ed-btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ed-btn ed-btn-primary">
                  {submitting ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance & Notes Modal */}
      {showNotesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowNotesModal(false)}
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
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>Record Attendance & Consultation Notes</h3>
            <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Meeting Status
                  </label>
                  <select
                    value={notesStatus}
                    onChange={(e) => setNotesStatus(e.target.value as any)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="COMPLETED">Mark as Completed</option>
                    <option value="SCHEDULED">Keep as Scheduled</option>
                    <option value="CANCELLED">Mark as Cancelled</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Guardian Attendance
                  </label>
                  <select
                    value={attendanceOutcome}
                    onChange={(e) => setAttendanceOutcome(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Both Parents Attended">Both Parents Attended</option>
                    <option value="Father Attended">Father Attended</option>
                    <option value="Mother Attended">Mother Attended</option>
                    <option value="Authorized Guardian Attended">Authorized Guardian Attended</option>
                    <option value="Guardian Did Not Attend">Guardian Did Not Attend</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Consultation Discussion & Agreed Action Items
                </label>
                <textarea
                  rows={4}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Record summary of discussion, academic targets, homework tracking agreement, or student guidance notes..."
                  className="ed-textarea"
                  style={{ width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="ed-btn ed-btn-secondary" onClick={() => setShowNotesModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ed-btn ed-btn-primary">
                  {submitting ? 'Saving...' : 'Save Consultation Record'}
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
