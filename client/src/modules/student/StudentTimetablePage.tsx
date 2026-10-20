import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  User,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { operationsApi, coreApi, getStoredUser } from '../../services/api.js';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export const StudentTimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Day: defaults to current day of week if Mon-Sat, else Monday
  const currentDayIndex = new Date().getDay(); // 0 is Sunday
  const defaultDay = currentDayIndex >= 1 && currentDayIndex <= 6 ? DAYS_OF_WEEK[currentDayIndex - 1] : 'MONDAY';
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const studentProfile = await coreApi.getStudentById(currentStudentId);
      setStudent(studentProfile);

      const targetClass = studentProfile?.className || studentProfile?.enrollments?.[0]?.class?.name || 'Grade 10';
      const targetSection = studentProfile?.sectionName || studentProfile?.enrollments?.[0]?.section?.name || 'A';

      const slots = await operationsApi.getTimetable({ className: targetClass, sectionName: targetSection });
      setTimetable(slots || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve timetable schedule from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const className = student?.className || student?.enrollments?.[0]?.class?.name || 'Grade 10';
  const sectionName = student?.sectionName || student?.enrollments?.[0]?.section?.name || 'A';

  const DAY_INDEX_MAP: Record<number, string> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY',
  };

  const resolveSlotDay = (slot: any): string => {
    if (typeof slot?.dayOfWeek === 'number') return DAY_INDEX_MAP[slot.dayOfWeek] || 'MONDAY';
    if (typeof slot?.dayOfWeek === 'string') return slot.dayOfWeek.toUpperCase();
    if (typeof slot?.day === 'string') return slot.day.toUpperCase();
    if (typeof slot?.day === 'number') return DAY_INDEX_MAP[slot.day] || 'MONDAY';
    return '';
  };

  // Filter slots for the selected day and sort by periodNumber or startTime
  const daySlots = timetable
    .filter((slot) => {
      const slotDay = resolveSlotDay(slot);
      return slotDay === selectedDay;
    })
    .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0) || (a.startTime || '').localeCompare(b.startTime || ''));

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
            <Calendar size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Class Timetable & Daily Schedule
            </h2>
            <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
              {className} - {sectionName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Institutional period schedules, assigned classroom venues, and faculty rosters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadTimetable}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Timetable
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

      {/* Day Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-2)',
          overflowX: 'auto',
        }}
      >
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const count = timetable.filter(
            (t) => resolveSlotDay(t) === day
          ).length;

          return (
            <button
              key={day}
              className={`ed-btn ed-btn-sm ${isSelected ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
              onClick={() => setSelectedDay(day)}
              style={{ minWidth: '110px' }}
            >
              {day.slice(0, 3)} {isSelected ? `(${count} Periods)` : ''}
            </button>
          );
        })}
      </div>

      {/* Timetable Period Grid */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading timetable from PostgreSQL...</div>
        </div>
      ) : daySlots.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {daySlots.map((slot, idx) => (
            <div
              key={slot.id || idx}
              className="ed-card"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                gap: 'var(--space-4)',
                borderLeft: '4px solid var(--primary-600)',
              }}
            >
              {/* Period Number and Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: '220px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-50, rgba(14, 165, 233, 0.1))',
                    border: '1px solid var(--primary-200, rgba(14, 165, 233, 0.3))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-700)',
                    fontWeight: 800,
                  }}
                >
                  <span style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Period</span>
                  <span style={{ fontSize: '1.15rem' }}>{slot.periodNumber || idx + 1}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.90rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    {slot.startTime || '09:00'} – {slot.endTime || '09:45'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Standard 45-minute instruction block
                  </div>
                </div>
              </div>

              {/* Subject & Teacher Info */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {slot.subjectName || slot.subjectCode || 'Class Period'}
                  </h4>
                  {slot.subjectCode && (
                    <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.70rem' }}>
                      {slot.subjectCode}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} style={{ color: 'var(--primary-600)' }} />
                    <span>{slot.teacherName || 'Faculty Instructor Assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} style={{ color: 'var(--primary-600)' }} />
                    <span>Room: {slot.roomNumber || 'Room 101'}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span className="ed-badge ed-badge-success" style={{ fontSize: '0.74rem' }}>
                  SCHEDULED
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Classes Scheduled for {selectedDay}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            There are no timetable slots recorded for this day in the academic database.
          </p>
        </div>
      )}
    </div>
  );
};
export default StudentTimetablePage;
