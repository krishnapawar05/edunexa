import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Printer,
  Layers,
  ArrowUp,
  ArrowDown,
  Database,
  Search,
  Clock,
  Shuffle,
  BookOpen,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { assessmentApi, coreApi, academicApi } from '../../services/api.js';

export const QuestionPaperBuilderPage: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form / Builder State
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Metadata
  const [title, setTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [examScheduleId, setExamScheduleId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [passingMarks, setPassingMarks] = useState<number>(20);
  const [instructions, setInstructions] = useState<string>(
    '1. Answer all questions.\n2. Write legibly and present working steps clearly.\n3. Electronic devices and unauthorized materials are strictly prohibited.'
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(false);
  const [randomizeOptions, setRandomizeOptions] = useState<boolean>(false);

  // Sections
  const [sections, setSections] = useState<Array<{ id: string; name: string; instructions?: string; marks?: number }>>([
    { id: 'sec-a', name: 'Section A - Objective Questions', marks: 20 },
    { id: 'sec-b', name: 'Section B - Short & Long Answer', marks: 30 },
  ]);

  // Questions in Paper
  const [items, setItems] = useState<any[]>([]);

  // Bank Import Drawer
  const [showBankModal, setShowBankModal] = useState<boolean>(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState<boolean>(false);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  // Print / Preview Modal
  const [previewPaper, setPreviewPaper] = useState<any | null>(null);

  // Options
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paperList, structure, schedules] = await Promise.all([
        assessmentApi.listQuestionPapers(),
        coreApi.getAcademicStructure().catch(() => null),
        academicApi.listExamSchedules().catch(() => []),
      ]);

      setPapers(paperList || []);
      if (structure) {
        setClasses(structure.classes || []);
        const allSubjects = (structure.classes || []).flatMap((c: any) =>
          (c.subjects || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            className: c.name,
          }))
        );
        setSubjects(allSubjects);
        if (allSubjects.length > 0 && !subjectId) {
          setSubjectId(allSubjects[0].id);
        }
      }
      setExamSchedules(schedules || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch question papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCalculatedMarks = items.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);

  const handleOpenCreate = () => {
    setEditingPaperId(null);
    setTitle('');
    setDurationMinutes(60);
    setPassingMarks(20);
    setStatus('DRAFT');
    setRandomizeQuestions(false);
    setRandomizeOptions(false);
    setItems([]);
    setSections([
      { id: 'sec-a', name: 'Section A - Objective Questions', marks: 20 },
      { id: 'sec-b', name: 'Section B - Short & Long Answer', marks: 30 },
    ]);
    setShowBuilder(true);
  };

  const handleOpenEdit = async (paper: any) => {
    try {
      setLoading(true);
      const full = await assessmentApi.getQuestionPaper(paper.id);
      setEditingPaperId(full.id);
      setTitle(full.title);
      setSubjectId(full.subjectId);
      setClassId(full.classId || '');
      setExamScheduleId(full.examScheduleId || '');
      setDurationMinutes(full.durationMinutes);
      setPassingMarks(full.passingMarks);
      setInstructions(full.instructions || '');
      setStatus(full.status);
      setRandomizeQuestions(full.randomizeQuestions);
      setRandomizeOptions(full.randomizeOptions);
      setSections(full.sections || [
        { id: 'sec-a', name: 'Section A - Objective Questions', marks: 20 },
      ]);
      setItems(full.items || []);
      setShowBuilder(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load paper details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await assessmentApi.deleteQuestionPaper(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete question paper');
    }
  };

  const handleTogglePublish = async (paper: any) => {
    try {
      const nextStatus = paper.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await assessmentApi.updateQuestionPaper(paper.id, { status: nextStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Bank Import Drawer Handlers
  const handleOpenBankImport = async () => {
    try {
      setBankLoading(true);
      setShowBankModal(true);
      const list = await assessmentApi.listQuestionBank({
        subjectId: subjectId || undefined,
        search: bankSearch.trim() || undefined,
      });
      setBankItems(list || []);
      setSelectedBankIds([]);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch question bank');
    } finally {
      setBankLoading(false);
    }
  };

  const handleExecuteImport = () => {
    const selected = bankItems.filter((b) => selectedBankIds.includes(b.id));
    const newItems = selected.map((b, idx) => ({
      questionBankItemId: b.id,
      sectionName: sections[0]?.name || 'Section A',
      orderIndex: items.length + idx,
      questionText: b.questionText,
      questionType: b.questionType,
      marks: b.marks,
      negativeMarks: b.negativeMarks || 0,
      explanation: b.explanation || '',
      metadata: b.metadata || {},
    }));

    setItems([...items, ...newItems]);
    setShowBankModal(false);
  };

  const handleMoveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Refresh orderIndex
    updated.forEach((item, idx) => {
      item.orderIndex = idx;
    });

    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    updated.forEach((item, idx) => {
      item.orderIndex = idx;
    });
    setItems(updated);
  };

  const handleSavePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Paper title cannot be empty');
      return;
    }
    if (!subjectId) {
      alert('Please select a subject');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one question to the paper');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        subjectId,
        classId: classId || undefined,
        examScheduleId: examScheduleId || undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalCalculatedMarks),
        passingMarks: Number(passingMarks),
        status,
        randomizeQuestions,
        randomizeOptions,
        instructions,
        sections,
        items: items.map((item, idx) => ({
          questionBankItemId: item.questionBankItemId || undefined,
          sectionName: item.sectionName || 'Section A',
          orderIndex: idx,
          questionText: item.questionText,
          questionType: item.questionType,
          marks: Number(item.marks),
          negativeMarks: Number(item.negativeMarks || 0),
          explanation: item.explanation || undefined,
          metadata: item.metadata || undefined,
        })),
      };

      if (editingPaperId) {
        await assessmentApi.updateQuestionPaper(editingPaperId, payload);
      } else {
        await assessmentApi.createQuestionPaper(payload);
      }

      setShowBuilder(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save question paper');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">
              Examination Board
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 6 Question Paper Assembly</span>
          </div>
          <h1 className="ed-page-header-title">
            <FileSpreadsheet size={26} style={{ color: 'var(--color-primary)' }} />
            Examination Question Paper Builder
          </h1>
          <p className="ed-page-header-desc">
            Build structured exam papers with sections, marks tally, question bank reuse, and formal printable formatting.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
        >
          <Plus size={16} />
          Build New Paper
        </Button>
      </div>

      {/* Papers Table */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Configured Question Papers</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Institutional question papers with automated sections and grading thresholds</p>
          </div>
          <span className="ed-badge ed-badge-neutral">{papers.length} Papers</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="inline-block animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }}></div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading Question Papers...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '20px', margin: '16px', borderLeft: '4px solid #dc2626', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-sm)' }}>{error}</div>
        ) : papers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>No question papers created yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>Click "Build New Paper" to create your first examination paper.</p>
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Build New Paper
            </Button>
          </div>
        ) : (
          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Title & Details</th>
                  <th>Subject</th>
                  <th>Duration & Marks</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.title}</div>
                      {p.examSchedule && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '2px', fontWeight: 600 }}>
                          Linked Exam: {p.examSchedule.name} ({p.examSchedule.examType})
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.subject?.name || p.subjectId}</div>
                      {p.class && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.class.name}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.totalMarks} Marks</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={12} /> {p.durationMinutes} mins | Pass: {p.passingMarks}
                      </div>
                    </td>
                    <td>
                      <span className="ed-badge ed-badge-neutral">
                        {p._count?.items ?? p.items?.length ?? 0} Questions
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`ed-btn ed-btn-sm ${
                          p.status === 'PUBLISHED'
                            ? 'ed-badge-success'
                            : 'ed-badge-warning'
                        }`}
                        style={{
                          border: `1px solid ${p.status === 'PUBLISHED' ? '#bbf7d0' : '#fde68a'}`,
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={async () => {
                            const full = await assessmentApi.getQuestionPaper(p.id);
                            setPreviewPaper(full);
                          }}
                          title="Print / View Paper"
                          className="ed-icon-btn"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Paper"
                          className="ed-icon-btn"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePaper(p.id)}
                          title="Delete Paper"
                          className="ed-icon-btn danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUESTION PAPER BUILDER MODAL */}
      {showBuilder && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large" style={{ maxHeight: '92vh' }}>
            {/* Modal Header */}
            <div className="ed-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {editingPaperId ? 'Edit Question Paper' : 'Question Paper Authoring Studio'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="ed-badge ed-badge-teal" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Calculated Total: {totalCalculatedMarks} Marks
                </span>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="ed-btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePaper} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="ed-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Paper Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Paper Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Physics Mid-Term Examination 2026"
                      required
                      className="ed-input"
                      style={{ width: '100%', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Subject *</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      required
                      className="ed-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Class (Optional)</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="ed-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Linked Exam Schedule</label>
                    <select
                      value={examScheduleId}
                      onChange={(e) => setExamScheduleId(e.target.value)}
                      className="ed-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">Standalone Online Quiz</option>
                      {examSchedules.map((es) => (
                        <option key={es.id} value={es.id}>
                          {es.name} ({es.examType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (Minutes) *</label>
                    <input
                      type="number"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                      required
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Passing Marks *</label>
                    <input
                      type="number"
                      min="1"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(parseFloat(e.target.value) || 20)}
                      required
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Randomization and Status Switches */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                    />
                    <span>Randomize Question Order</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={randomizeOptions}
                      onChange={(e) => setRandomizeOptions(e.target.checked)}
                    />
                    <span>Randomize MCQ Options</span>
                  </label>

                  <div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="ed-select"
                      style={{ width: '100%', fontWeight: 600 }}
                    >
                      <option value="DRAFT">Status: DRAFT (Hidden from Students)</option>
                      <option value="PUBLISHED">Status: PUBLISHED (Live Examination)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Candidate Instructions</label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="ed-textarea"
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>

                {/* Sections Manager */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={16} style={{ color: 'var(--color-primary)' }} />
                      Sections Configuration
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSections([
                          ...sections,
                          { id: `sec-${Date.now()}`, name: `Section ${String.fromCharCode(65 + sections.length)}`, marks: 10 },
                        ])
                      }
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      + Add Section
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {sections.map((sec, idx) => (
                      <div key={sec.id} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx].name = e.target.value;
                            setSections(updated);
                          }}
                          className="ed-input"
                          style={{ flex: 1, height: '32px', fontSize: '0.82rem' }}
                        />
                        {sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSections(sections.filter((_, i) => i !== idx))}
                            className="ed-btn-icon"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Questions in Paper ({items.length})
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenBankImport}
                      >
                        <Database size={14} />
                        Import From Question Bank
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setItems([
                            ...items,
                            {
                              sectionName: sections[0]?.name || 'Section A',
                              orderIndex: items.length,
                              questionText: '',
                              questionType: 'SHORT_ANSWER',
                              marks: 2.0,
                              negativeMarks: 0,
                              metadata: {},
                            },
                          ])
                        }
                      >
                        <Plus size={14} />
                        Add Custom Question
                      </Button>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No questions added yet. Use "Import From Question Bank" or "Add Custom Question".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="ed-badge ed-badge-neutral" style={{ fontFamily: 'monospace' }}>
                                #{idx + 1}
                              </span>
                              <select
                                value={item.sectionName}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].sectionName = e.target.value;
                                  setItems(updated);
                                }}
                                className="ed-select"
                                style={{ height: '30px', fontSize: '0.78rem', padding: '4px 8px' }}
                              >
                                {sections.map((s) => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                              <span className="ed-badge ed-badge-teal">
                                {item.questionType?.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(idx, 'UP')}
                                disabled={idx === 0}
                                className="ed-icon-btn"
                                style={{ opacity: idx === 0 ? 0.3 : 1 }}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(idx, 'DOWN')}
                                disabled={idx === items.length - 1}
                                className="ed-icon-btn"
                                style={{ opacity: idx === items.length - 1 ? 0.3 : 1 }}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="ed-icon-btn danger"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={item.questionText}
                              onChange={(e) => {
                                const updated = [...items];
                                updated[idx].questionText = e.target.value;
                                setItems(updated);
                              }}
                              placeholder="Question text..."
                              required
                              className="ed-input"
                              style={{ width: '100%', fontWeight: 600 }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Marks:</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={item.marks}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].marks = parseFloat(e.target.value) || 1;
                                  setItems(updated);
                                }}
                                className="ed-input"
                                style={{ width: '70px', height: '30px', padding: '4px 8px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Negative:</span>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                value={item.negativeMarks || 0}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].negativeMarks = parseFloat(e.target.value) || 0;
                                  setItems(updated);
                                }}
                                className="ed-input"
                                style={{ width: '70px', height: '30px', padding: '4px 8px' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="ed-dialog-footer" style={{ justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Total Questions: <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> | Total Marks: <strong style={{ color: 'var(--color-primary)' }}>{totalCalculatedMarks}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBuilder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingPaperId ? 'Update Paper' : 'Save Question Paper'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION BANK IMPORT DRAWER */}
      {showBankModal && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box" style={{ maxHeight: '85vh' }}>
            <div className="ed-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Select Questions From Bank</h3>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="ed-btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-default)' }}>
              <div className="ed-search-box" style={{ maxWidth: '100%' }}>
                <Search size={16} className="ed-search-icon" />
                <input
                  type="text"
                  placeholder="Search question bank by keyword..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenBankImport()}
                  className="ed-input"
                />
              </div>
            </div>

            <div className="ed-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bankLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading bank questions...</div>
              ) : bankItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No questions found in bank for this subject.</div>
              ) : (
                bankItems.map((b) => (
                  <label
                    key={b.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${selectedBankIds.includes(b.id) ? 'var(--color-primary)' : 'var(--border-default)'}`,
                      backgroundColor: selectedBankIds.includes(b.id) ? 'rgba(36, 76, 58, 0.05)' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBankIds.includes(b.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBankIds([...selectedBankIds, b.id]);
                        } else {
                          setSelectedBankIds(selectedBankIds.filter((id) => id !== b.id));
                        }
                      }}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="ed-badge ed-badge-teal">
                          {b.questionType?.replace(/_/g, ' ')}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Marks: {b.marks}</span>
                        {b.chapter && <span style={{ color: 'var(--text-muted)' }}>Ch: {b.chapter}</span>}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{b.questionText}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="ed-dialog-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {selectedBankIds.length} question(s) selected
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBankModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={selectedBankIds.length === 0}
                  onClick={handleExecuteImport}
                >
                  Import Selected
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL PRINTABLE QUESTION PAPER PREVIEW */}
      {previewPaper && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large" style={{ maxHeight: '92vh' }}>
            <div className="ed-dialog-header print:hidden">
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Formal Examination Layout Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} /> Print / Export PDF
                </Button>
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="ed-btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="ed-dialog-body" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Formal Exam Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text-primary)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.04em', margin: 0 }}>
                  APEX ACADEMY SENIOR SECONDARY SCHOOL
                </h1>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>{previewPaper.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, paddingTop: '8px', color: 'var(--text-primary)' }}>
                  <span>Subject: {previewPaper.subject?.name}</span>
                  <span>Duration: {previewPaper.durationMinutes} Minutes</span>
                  <span>Maximum Marks: {previewPaper.totalMarks}</span>
                </div>
              </div>

              {/* Instructions */}
              {previewPaper.instructions && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>General Instructions:</strong>
                  <div>{previewPaper.instructions}</div>
                </div>
              )}

              {/* Questions Grouped by Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(previewPaper.items || []).map((item: any, idx: number) => (
                  <div key={item.id} style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Q{idx + 1}.</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item.questionText}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', flexShrink: 0 }}>[{item.marks}]</span>
                    </div>

                    {/* Choices Preview */}
                    {item.metadata?.choices && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '28px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.metadata.choices.map((c: any, cIdx: number) => (
                          <div key={cIdx}>
                            <strong style={{ color: 'var(--text-primary)' }}>({String.fromCharCode(97 + cIdx)})</strong> {c.choiceText}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
