import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
} from 'lucide-react';
import { operationsApi, getStoredUser } from '../../services/api.js';

interface TimetableSlot {
  id: string;
  dayOfWeek: number | string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName?: string;
  roomNumber?: string;
  teacherName?: string;
  className?: string;
  sectionName?: string;
}

const DAY_INDEX_MAP: Record<number, string> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

const resolveSlotDay = (slot: TimetableSlot): string => {
  if (typeof slot.dayOfWeek === 'number') {
    return DAY_INDEX_MAP[slot.dayOfWeek] || 'MONDAY';
  }
  return String(slot.dayOfWeek || 'MONDAY').toUpperCase();
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const TeacherTimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Slot Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newDay, setNewDay] = useState<number>(1);
  const [newPeriod, setNewPeriod] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState('08:30 AM');
  const [newEndTime, setNewEndTime] = useState('09:15 AM');
  const [newSubjectCode, setNewSubjectCode] = useState('PHY-10');
  const [newSubjectName, setNewSubjectName] = useState('Physics (Theory & Lab)');
  const [newRoom, setNewRoom] = useState('Lab 204');

  const user = getStoredUser();
  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const currentDayName = DAY_INDEX_MAP[currentDayIndex === 0 ? 7 : currentDayIndex] || 'MONDAY';

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await operationsApi.getTimetable({
        className: selectedClass,
        sectionName: selectedSection,
      });
      setSlots(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch timetable schedule from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedClass, selectedSection]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingSlot(true);
      setError(null);
      await operationsApi.createTimetableSlot({
        dayOfWeek: Number(newDay),
        periodNumber: Number(newPeriod),
        startTime: newStartTime,
        endTime: newEndTime,
        subjectCode: newSubjectCode,
        subjectName: newSubjectName,
        roomNumber: newRoom,
        className: selectedClass,
        sectionName: selectedSection,
        teacherName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Faculty Member',
      });

      setShowAddModal(false);
      setSuccessToast('New timetable period scheduled successfully in PostgreSQL.');
      setTimeout(() => setSuccessToast(null), 4000);
      loadTimetable();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule timetable period.');
    } finally {
      setAddingSlot(false);
    }
  };

  // Group slots by day
  const slotsByDay: Record<string, TimetableSlot[]> = {};
  DAYS.forEach((d) => (slotsByDay[d] = []));
  slots.forEach((s) => {
    const day = resolveSlotDay(s);
    if (slotsByDay[day]) {
      slotsByDay[day].push(s);
    }
  });

  // Sort each day by period number or start time
  DAYS.forEach((d) => {
    slotsByDay[d].sort((a, b) => a.periodNumber - b.periodNumber);
  });

  // KPI metrics
  const totalWeeklyTeachingPeriods = slots.length;
  const todayPeriods = slotsByDay[currentDayName] || [];
  const designatedVenue = slots.find((s) => s.roomNumber)?.roomNumber || (slots.length > 0 ? 'Assigned Rooms' : 'TBD');

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--success-600, #16a34a)',
            padding: 'var(--space-4) var(--space-6)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--success-500, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600 }}>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-1)',
            }}
          >
            Teacher Schedule & Timetable
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Weekly teaching schedule, laboratory blocks, classrooms, and allocated periods stored in PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={loadTimetable}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Plus size={16} />
            Schedule Period Slot
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger-500, #ef4444)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-600, #dc2626)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Weekly Periods</span>
            <Clock size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {totalWeeklyTeachingPeriods}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Allocated across {selectedClass}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Classes</span>
            <Calendar size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {todayPeriods.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Scheduled for {currentDayName}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Current Section</span>
            <Layers size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {selectedClass} - {selectedSection}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Primary teaching assignment
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Venue</span>
            <MapPin size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {designatedVenue}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Practical / lecture venue
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--surface-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            CLASS
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            SECTION
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Today: {currentDayName}
          </span>
        </div>
      </div>

      {/* Weekly Grid */}
      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto var(--space-3)' }} />
          <p>Loading weekly timetable from PostgreSQL...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {DAYS.map((day) => {
            const daySlots = slotsByDay[day] || [];
            const isToday = day === currentDayName;

            return (
              <div
                key={day}
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: isToday ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {day}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--surface-primary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {daySlots.length} periods
                  </span>
                </div>

                <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
                  {daySlots.length === 0 ? (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      No classes scheduled
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          padding: 'var(--space-3)',
                          borderLeft: '3px solid var(--brand-primary)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: 'var(--brand-primary)',
                            }}
                          >
                            PERIOD {slot.periodNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {slot.subjectCode}
                        </div>
                        {slot.subjectName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {slot.subjectName}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={12} /> {slot.roomNumber || 'Room 101'}
                          </span>
                          <span>{selectedClass} ({selectedSection})</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '520px',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-2xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Schedule Timetable Period</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSlot}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Day of Week *
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Period Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="08:30 AM"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="09:15 AM"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="PHY-10"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Room / Lab *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Lab 204"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Subject Description
                  </label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Physics (Theory & Lab Experiments)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSlot}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {addingSlot ? 'Scheduling...' : 'Save Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
