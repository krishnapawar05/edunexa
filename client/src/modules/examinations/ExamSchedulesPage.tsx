import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit2,
  ArrowRight,
  ShieldCheck,
  X,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { academicApi, coreApi } from '../../services/api.js';

interface ExamScheduleItem {
  id: string;
  name: string;
  className: string;
  subjectCode: string;
  examType: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  weightagePercent?: number;
  status: string;
}

export const ExamSchedulesPage: React.FC = () => {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    examType: 'MIDTERM',
    className: 'Grade 10',
    subjectCode: 'PHYS-101',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    durationMinutes: 120,
    maxMarks: 100,
    passMarks: 40,
    weightagePercent: 30,
    status: 'SCHEDULED',
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [schedulesRes, structureRes] = await Promise.allSettled([
        academicApi.listExamSchedules(),
        coreApi.getAcademicStructure(),
      ]);

      if (schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value)) {
        setSchedules(schedulesRes.value);
      } else if (schedulesRes.status === 'rejected') {
        throw new Error(schedulesRes.reason?.message || 'Failed to retrieve schedules.');
      }

      if (structureRes.status === 'fulfilled' && structureRes.value?.classes) {
        setClassesList(structureRes.value.classes.map((c: any) => c.name));
      } else {
        setClassesList(['Grade 10', 'Grade 9', 'Grade 11', 'Grade 12']);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load examination schedules from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const openCreateModal = () => {
    setEditingScheduleId(null);
    setFormData({
      name: '',
      examType: 'MIDTERM',
      className: classesList[0] || 'Grade 10',
      subjectCode: 'PHYS-101',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      durationMinutes: 120,
      maxMarks: 100,
      passMarks: 40,
      weightagePercent: 30,
      status: 'SCHEDULED',
    });
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (schedule: ExamScheduleItem) => {
    setEditingScheduleId(schedule.id);
    setFormData({
      name: schedule.name,
      examType: schedule.examType || 'MIDTERM',
      className: schedule.className,
      subjectCode: schedule.subjectCode,
      examDate: schedule.examDate,
      startTime: schedule.startTime || '09:00',
      durationMinutes: schedule.durationMinutes || 120,
      maxMarks: schedule.maxMarks || 100,
      passMarks: schedule.passMarks || 40,
      weightagePercent: schedule.weightagePercent || 30,
      status: schedule.status || 'SCHEDULED',
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validation
    if (!formData.name.trim()) {
      setModalError('Examination title is required.');
      return;
    }
    if (formData.passMarks > formData.maxMarks) {
      setModalError('Passing marks cannot exceed maximum marks.');
      return;
    }
    if (formData.durationMinutes <= 0) {
      setModalError('Duration must be greater than 0 minutes.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingScheduleId) {
        await academicApi.updateExamSchedule(editingScheduleId, {
          name: formData.name,
          examType: formData.examType,
          examDate: formData.examDate,
          startTime: formData.startTime,
          durationMinutes: Number(formData.durationMinutes),
          maxMarks: Number(formData.maxMarks),
          passMarks: Number(formData.passMarks),
          weightagePercent: Number(formData.weightagePercent),
          status: formData.status,
        });
        setSuccessToast(`Examination schedule '${formData.name}' successfully updated in PostgreSQL.`);
      } else {
        await academicApi.createExamSchedule({
          name: formData.name,
          examType: formData.examType,
          className: formData.className,
          subjectCode: formData.subjectCode,
          examDate: formData.examDate,
          startTime: formData.startTime,
          durationMinutes: Number(formData.durationMinutes),
          maxMarks: Number(formData.maxMarks),
          passMarks: Number(formData.passMarks),
          weightagePercent: Number(formData.weightagePercent),
        });
        setSuccessToast(`New examination schedule '${formData.name}' created in PostgreSQL.`);
      }

      setShowModal(false);
      await loadSchedules();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setModalError(err.message || 'Operation failed. Check server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'MARKS_SUBMITTED':
        return <Badge variant="info">Marks Submitted</Badge>;
      case 'SCHEDULED':
        return <Badge variant="warning">Scheduled</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-bg, rgba(16, 185, 129, 0.1))',
            border: '1px solid var(--success-border, rgba(16, 185, 129, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-text, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
            <CheckCircle2 size={16} />
            {successToast}
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <FileSpreadsheet style={{ color: 'var(--primary-600)' }} size={26} />
            Examination Schedules & Timetable
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Configure and monitor institutional term assessments, room timings, and assessment boundaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadSchedules} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Create Exam Schedule
          </Button>
        </div>
      </div>

      {/* Metrics Ledger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL SCHEDULES</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {schedules.length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning-text, #d97706)' }}>
            ACTIVE / SCHEDULED
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--warning-text, #d97706)', marginTop: '4px' }}>
            {schedules.filter((s) => s.status === 'SCHEDULED').length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--info-text, #0284c7)' }}>
            MARKS RECORDED
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--info-text, #0284c7)', marginTop: '4px' }}>
            {schedules.filter((s) => s.status === 'MARKS_SUBMITTED').length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success-text, #059669)' }}>
            PUBLISHED RESULTS
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--success-text, #059669)', marginTop: '4px' }}>
            {schedules.filter((s) => s.status === 'PUBLISHED').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by exam name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Classes</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="MARKS_SUBMITTED">Marks Submitted</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
            border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      {/* Schedules Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Loading examination schedules from PostgreSQL...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              No examination schedules found
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm || selectedClass !== 'ALL' || selectedStatus !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'No examination schedules exist in the database for your school. Click "Create Exam Schedule" above to add one.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>EXAMINATION NAME</th>
                  <th style={{ padding: '12px 16px' }}>CLASS / SUBJECT</th>
                  <th style={{ padding: '12px 16px' }}>EXAM DATE & TIME</th>
                  <th style={{ padding: '12px 16px' }}>DURATION</th>
                  <th style={{ padding: '12px 16px' }}>MARKS SCALING</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => (
                  <tr
                    key={schedule.id}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{schedule.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Type: {schedule.examType}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{schedule.className}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Code: {schedule.subjectCode}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {schedule.examDate}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        <Clock size={12} />
                        {schedule.startTime}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {schedule.durationMinutes} mins
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{schedule.maxMarks} max</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        (Pass: {schedule.passMarks})
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(schedule.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(schedule)}
                          title="Edit Schedule"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/examinations/marks?scheduleId=${schedule.id}`)}
                          title="Enter / Review Marks"
                        >
                          <Award size={13} style={{ marginRight: '4px' }} />
                          Marks
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/examinations/marks-audit?scheduleId=${schedule.id}`)}
                          title="View Audit Trail"
                        >
                          <ShieldCheck size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Schedule Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {editingScheduleId ? 'Edit Examination Schedule' : 'Schedule New Assessment'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
                  border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-text, #dc2626)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  EXAMINATION NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Physics Core Midterm Examination"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CLASS TARGET *
                  </label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    disabled={Boolean(editingScheduleId)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    SUBJECT CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. PHYS-101"
                    disabled={Boolean(editingScheduleId)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    EXAM DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    START TIME *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DURATION (MINS) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    MAX MARKS *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PASS MARKS *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={formData.maxMarks}
                    required
                    value={formData.passMarks}
                    onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {editingScheduleId && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    SCHEDULE STATUS
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="MARKS_SUBMITTED">Marks Submitted</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} />
                      Saving to DB...
                    </>
                  ) : editingScheduleId ? (
                    'Save Schedule Changes'
                  ) : (
                    'Create Schedule'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
