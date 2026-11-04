import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  FileQuestion,
  Layers,
  Sparkles,
  BookOpen,
  Check,
  X,
  HelpCircle,
  Hash,
  Upload,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { assessmentApi, coreApi } from '../../services/api.js';

export const QuestionBankPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Options
  const [subjects, setSubjects] = useState<any[]>([]);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formChapter, setFormChapter] = useState<string>('');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formDifficulty, setFormDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [formType, setFormType] = useState<string>('MULTIPLE_CHOICE');
  const [formText, setFormText] = useState<string>('');
  const [formMarks, setFormMarks] = useState<number>(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState<string>('');

  // Type Specific Metadata
  const [mcqChoices, setMcqChoices] = useState<Array<{ id?: string; choiceText: string; isCorrect: boolean }>>([
    { choiceText: '', isCorrect: true },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
  ]);
  const [tfAnswer, setTfAnswer] = useState<boolean>(true);
  const [blanks, setBlanks] = useState<Array<{ index: number; acceptedAnswers: string[] }>>([
    { index: 0, acceptedAnswers: [''] },
  ]);
  const [matchPairs, setMatchPairs] = useState<{
    leftItems: string[];
    rightItems: string[];
    correctPairs: Array<{ leftIndex: number; rightIndex: number }>;
  }>({
    leftItems: ['', ''],
    rightItems: ['', ''],
    correctPairs: [
      { leftIndex: 0, rightIndex: 0 },
      { leftIndex: 1, rightIndex: 1 },
    ],
  });
  const [numExpected, setNumExpected] = useState<number>(0);
  const [numTolerance, setNumTolerance] = useState<number>(0.01);
  const [numUnit, setNumUnit] = useState<string>('');
  const [sampleAnswer, setSampleAnswer] = useState<string>('');
  const [rubric, setRubric] = useState<string>('');
  const [maxWords, setMaxWords] = useState<number>(250);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subjects from academic structure
      try {
        const structure = await coreApi.getAcademicStructure().catch(() => null);
        if (structure && structure.classes) {
          const allSubjects = structure.classes.flatMap((c: any) =>
            (c.subjects || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              className: c.name,
            }))
          );
          setSubjects(allSubjects);
          if (allSubjects.length > 0 && !formSubjectId) {
            setFormSubjectId(allSubjects[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load academic structure', err);
      }

      // Load questions
      const filters: any = {};
      if (selectedSubject !== 'ALL') filters.subjectId = selectedSubject;
      if (selectedDifficulty !== 'ALL') filters.difficulty = selectedDifficulty;
      if (selectedType !== 'ALL') filters.questionType = selectedType;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const bankList = await assessmentApi.listQuestionBank(filters);
      setItems(bankList || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, selectedDifficulty, selectedType]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormChapter('');
    setFormTopic('');
    setFormDifficulty('MEDIUM');
    setFormType('MULTIPLE_CHOICE');
    setFormText('');
    setFormMarks(2);
    setFormNegativeMarks(0.5);
    setFormExplanation('');
    setMcqChoices([
      { choiceText: '', isCorrect: true },
      { choiceText: '', isCorrect: false },
      { choiceText: '', isCorrect: false },
      { choiceText: '', isCorrect: false },
    ]);
    setTfAnswer(true);
    setBlanks([{ index: 0, acceptedAnswers: [''] }]);
    setMatchPairs({
      leftItems: ['', ''],
      rightItems: ['', ''],
      correctPairs: [
        { leftIndex: 0, rightIndex: 0 },
        { leftIndex: 1, rightIndex: 1 },
      ],
    });
    setNumExpected(0);
    setNumTolerance(0.01);
    setNumUnit('');
    setSampleAnswer('');
    setRubric('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormSubjectId(item.subjectId);
    setFormChapter(item.chapter || '');
    setFormTopic(item.topic || '');
    setFormDifficulty(item.difficulty);
    setFormType(item.questionType);
    setFormText(item.questionText);
    setFormMarks(item.marks);
    setFormNegativeMarks(item.negativeMarks || 0);
    setFormExplanation(item.explanation || '');

    const meta = item.metadata || {};
    if (meta.choices) setMcqChoices(meta.choices);
    if (meta.blanks) setBlanks(meta.blanks);
    if (meta.matchPairs) setMatchPairs(meta.matchPairs);
    if (meta.numerical) {
      setNumExpected(meta.numerical.expectedNumber || 0);
      setNumTolerance(meta.numerical.tolerance || 0.01);
      setNumUnit(meta.numerical.unit || '');
    }
    if (meta.sampleAnswer) setSampleAnswer(meta.sampleAnswer);
    if (meta.evaluationRubric) setRubric(meta.evaluationRubric);
    if (meta.maxWordCount) setMaxWords(meta.maxWordCount);

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await assessmentApi.deleteQuestionBankItem(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId) {
      alert('Please select a subject');
      return;
    }
    if (!formText.trim()) {
      alert('Question text cannot be empty');
      return;
    }

    try {
      setSaving(true);

      // Build metadata according to question type
      let metadata: any = {};
      if (formType === 'MULTIPLE_CHOICE' || formType === 'MULTIPLE_SELECT') {
        metadata.choices = mcqChoices;
      } else if (formType === 'TRUE_FALSE') {
        metadata.choices = [
          { choiceText: 'true', isCorrect: tfAnswer },
          { choiceText: 'false', isCorrect: !tfAnswer },
        ];
      } else if (formType === 'FILL_IN_BLANKS') {
        metadata.blanks = blanks;
      } else if (formType === 'MATCH_THE_FOLLOWING') {
        metadata.matchPairs = matchPairs;
      } else if (formType === 'NUMERICAL') {
        metadata.numerical = {
          expectedNumber: Number(numExpected),
          tolerance: Number(numTolerance),
          unit: numUnit,
        };
      } else if (formType === 'SHORT_ANSWER' || formType === 'LONG_ANSWER' || formType === 'DESCRIPTIVE') {
        metadata.sampleAnswer = sampleAnswer;
        metadata.evaluationRubric = rubric;
        metadata.maxWordCount = maxWords;
      }

      const payload = {
        subjectId: formSubjectId,
        chapter: formChapter || undefined,
        topic: formTopic || undefined,
        difficulty: formDifficulty,
        questionType: formType,
        questionText: formText,
        marks: Number(formMarks),
        negativeMarks: Number(formNegativeMarks),
        explanation: formExplanation || undefined,
        metadata,
      };

      if (editingItem) {
        await assessmentApi.updateQuestionBankItem(editingItem.id, payload);
      } else {
        await assessmentApi.createQuestionBankItem(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return <Badge variant="success">Easy</Badge>;
      case 'HARD':
        return <Badge variant="danger">Hard</Badge>;
      default:
        return <Badge variant="warning">Medium</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">
              Assessment Engine
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 6 Question Repository</span>
          </div>
          <h1 className="ed-page-header-title">
            <Database size={26} style={{ color: 'var(--color-primary)' }} />
            Institutional Question Bank
          </h1>
          <p className="ed-page-header-desc">
            Author, categorize, and curate questions across 10 specialized question types with automated and subjective rubrics.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          Add Question
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="ed-toolbar">
        <div className="ed-toolbar-left">
          <div className="ed-search-box">
            <Search size={16} className="ed-search-icon" />
            <input
              type="text"
              placeholder="Search questions or chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="ed-input"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="ed-select"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="ed-select"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="ed-select"
          >
            <option value="ALL">All Question Types</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</option>
            <option value="MULTIPLE_SELECT">Multiple Select</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Answer</option>
            <option value="DESCRIPTIVE">Descriptive Essay</option>
            <option value="MATCH_THE_FOLLOWING">Match the Following</option>
            <option value="NUMERICAL">Numerical Problem</option>
            <option value="FILE_UPLOAD">File / Document Upload</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> question{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="ed-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="inline-block animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }}></div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading Question Bank items from PostgreSQL...</p>
        </div>
      ) : error ? (
        <div className="ed-card" style={{ padding: '20px', borderLeft: '4px solid #dc2626', color: '#dc2626' }}>
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="ed-card" style={{ padding: '48px', textAlign: 'center' }}>
          <FileQuestion size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No questions found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '4px auto 16px auto' }}>
            Get started by adding questions or adjust your search filters above.
          </p>
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            Add First Question
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map((item, index) => (
            <div key={item.id} className="ed-exam-card">
              <div className="ed-exam-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="ed-badge ed-badge-neutral" style={{ fontFamily: 'monospace' }}>
                    Q{index + 1}
                  </span>
                  <span className="ed-badge ed-badge-teal">
                    {getTypeLabel(item.questionType)}
                  </span>
                  {getDifficultyBadge(item.difficulty)}
                  <span className="ed-badge ed-badge-neutral">
                    Subject: {item.subject?.name || item.subjectId}
                  </span>
                  {item.chapter && (
                    <span className="ed-badge ed-badge-neutral">
                      Ch: {item.chapter}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setPreviewItem(item)}
                    title="Preview Question"
                    className="ed-icon-btn"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Question"
                    className="ed-icon-btn"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete Question"
                    className="ed-icon-btn danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {item.questionText}
              </div>

              {/* Choices / Items Preview */}
              {item.metadata?.choices && (
                <div className="ed-choices-grid">
                  {item.metadata.choices.map((c: any, i: number) => (
                    <div
                      key={i}
                      className={`ed-choice-pill ${c.isCorrect ? 'correct' : ''}`}
                    >
                      <span>
                        <strong style={{ marginRight: '6px' }}>{String.fromCharCode(65 + i)}.</strong>
                        {c.choiceText}
                      </span>
                      {c.isCorrect && (
                        <Check size={14} style={{ color: '#15803d', flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Blanks Preview */}
              {item.metadata?.blanks && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Accepted Blank Answers: </span>
                  {item.metadata.blanks.map((b: any, idx: number) => (
                    <span key={idx} style={{ marginRight: '10px' }}>
                      [Blank {idx + 1}: {b.acceptedAnswers?.join(', ')}]
                    </span>
                  ))}
                </div>
              )}

              {/* Numerical Preview */}
              {item.metadata?.numerical && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Target Value: </span>
                  {item.metadata.numerical.expectedNumber} ±{item.metadata.numerical.tolerance} {item.metadata.numerical.unit}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '10px', borderTop: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span>Marks: <strong style={{ color: 'var(--text-primary)' }}>{item.marks}</strong></span>
                  {item.negativeMarks > 0 && (
                    <span style={{ color: '#dc2626' }}>
                      Negative: -{item.negativeMarks}
                    </span>
                  )}
                </div>
                {item.explanation && (
                  <span style={{ fontStyle: 'italic', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Note: {item.explanation}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {showModal && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large">
            <div className="ed-dialog-header">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {editingItem ? 'Edit Question' : 'Create New Question'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="ed-btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="ed-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Subject *</label>
                    <select
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question Type *</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="ed-select"
                      style={{ width: '100%' }}
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</option>
                      <option value="MULTIPLE_SELECT">Multiple Select</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="LONG_ANSWER">Long Answer</option>
                      <option value="DESCRIPTIVE">Descriptive Essay</option>
                      <option value="MATCH_THE_FOLLOWING">Match the Following</option>
                      <option value="NUMERICAL">Numerical Problem</option>
                      <option value="FILE_UPLOAD">File / Document Upload</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Difficulty *</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="ed-select"
                      style={{ width: '100%' }}
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Chapter / Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 3: Laws of Motion"
                      value={formChapter}
                      onChange={(e) => setFormChapter(e.target.value)}
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Inertia and Force"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question Text *</label>
                  <textarea
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Enter the full question text here..."
                    required
                    className="ed-textarea"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Marks Awarded *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formMarks}
                      onChange={(e) => setFormMarks(parseFloat(e.target.value) || 1)}
                      required
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Negative Marks (Penalty)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={formNegativeMarks}
                      onChange={(e) => setFormNegativeMarks(parseFloat(e.target.value) || 0)}
                      className="ed-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* DYNAMIC CONTROLS FOR EACH QUESTION TYPE */}
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    <Layers size={16} style={{ color: 'var(--color-primary)' }} />
                    Answer Configuration ({getTypeLabel(formType)})
                  </div>

                  {/* MCQ / Multi Select */}
                  {(formType === 'MULTIPLE_CHOICE' || formType === 'MULTIPLE_SELECT') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {formType === 'MULTIPLE_CHOICE'
                          ? 'Select the single radio button for the correct option.'
                          : 'Select checkboxes for all valid correct options.'}
                      </p>
                      {mcqChoices.map((choice, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type={formType === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                            name="mcqChoiceCorrect"
                            checked={choice.isCorrect}
                            onChange={(e) => {
                              const updated = [...mcqChoices];
                              if (formType === 'MULTIPLE_CHOICE') {
                                updated.forEach((c, idx) => (c.isCorrect = idx === i));
                              } else {
                                updated[i].isCorrect = e.target.checked;
                              }
                              setMcqChoices(updated);
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            value={choice.choiceText}
                            onChange={(e) => {
                              const updated = [...mcqChoices];
                              updated[i].choiceText = e.target.value;
                              setMcqChoices(updated);
                            }}
                            required
                            className="ed-input"
                            style={{ flex: 1 }}
                          />
                          {mcqChoices.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setMcqChoices(mcqChoices.filter((_, idx) => idx !== i))}
                              className="ed-btn-icon"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMcqChoices([...mcqChoices, { choiceText: '', isCorrect: false }])}
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}
                      >
                        <Plus size={14} /> Add Option
                      </button>
                    </div>
                  )}

                  {/* True / False */}
                  {formType === 'TRUE_FALSE' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${tfAnswer ? 'var(--color-primary)' : 'var(--border-default)'}`,
                        backgroundColor: tfAnswer ? 'rgba(36, 76, 58, 0.08)' : 'var(--bg-surface)',
                        textAlign: 'center',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: tfAnswer ? 'var(--color-primary)' : 'var(--text-secondary)'
                      }}>
                        <input
                          type="radio"
                          name="tf"
                          checked={tfAnswer}
                          onChange={() => setTfAnswer(true)}
                          style={{ display: 'none' }}
                        />
                        True
                      </label>
                      <label style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${!tfAnswer ? '#dc2626' : 'var(--border-default)'}`,
                        backgroundColor: !tfAnswer ? '#fef2f2' : 'var(--bg-surface)',
                        textAlign: 'center',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: !tfAnswer ? '#dc2626' : 'var(--text-secondary)'
                      }}>
                        <input
                          type="radio"
                          name="tf"
                          checked={!tfAnswer}
                          onChange={() => setTfAnswer(false)}
                          style={{ display: 'none' }}
                        />
                        False
                      </label>
                    </div>
                  )}

                  {/* Fill in Blanks */}
                  {formType === 'FILL_IN_BLANKS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Specify accepted strings for each blank. Case-insensitive matching is applied during auto-grading.
                      </p>
                      {blanks.map((b, idx) => (
                        <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Blank #{idx + 1}</span>
                            {blanks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setBlanks(blanks.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Accepted answers, comma separated (e.g. vacuum, a vacuum)"
                            value={b.acceptedAnswers.join(', ')}
                            onChange={(e) => {
                              const updated = [...blanks];
                              updated[idx].acceptedAnswers = e.target.value.split(',').map((s) => s.trim());
                              setBlanks(updated);
                            }}
                            className="ed-input"
                            style={{ width: '100%' }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBlanks([...blanks, { index: blanks.length, acceptedAnswers: [''] }])}
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Add Blank
                      </button>
                    </div>
                  )}

                  {/* Match the Following */}
                  {formType === 'MATCH_THE_FOLLOWING' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Enter paired items. Left and right items will be presented to students for matching.
                      </p>
                      {matchPairs.leftItems.map((left, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder={`Left Item ${idx + 1}`}
                            value={left}
                            onChange={(e) => {
                              const updated = { ...matchPairs };
                              updated.leftItems[idx] = e.target.value;
                              setMatchPairs(updated);
                            }}
                            className="ed-input"
                            style={{ flex: 1 }}
                          />
                          <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            placeholder={`Right Item ${idx + 1}`}
                            value={matchPairs.rightItems[idx] || ''}
                            onChange={(e) => {
                              const updated = { ...matchPairs };
                              updated.rightItems[idx] = e.target.value;
                              setMatchPairs(updated);
                            }}
                            className="ed-input"
                            style={{ flex: 1 }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setMatchPairs({
                            leftItems: [...matchPairs.leftItems, ''],
                            rightItems: [...matchPairs.rightItems, ''],
                            correctPairs: [
                              ...matchPairs.correctPairs,
                              { leftIndex: matchPairs.leftItems.length, rightIndex: matchPairs.rightItems.length },
                            ],
                          })
                        }
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Add Pair
                      </button>
                    </div>
                  )}

                  {/* Numerical */}
                  {formType === 'NUMERICAL' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Expected Number *</label>
                        <input
                          type="number"
                          step="any"
                          value={numExpected}
                          onChange={(e) => setNumExpected(parseFloat(e.target.value) || 0)}
                          required
                          className="ed-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Tolerance (±)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={numTolerance}
                          onChange={(e) => setNumTolerance(parseFloat(e.target.value) || 0)}
                          className="ed-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Unit (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. m/s², kg, J"
                          value={numUnit}
                          onChange={(e) => setNumUnit(e.target.value)}
                          className="ed-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Short / Long / Descriptive Answer */}
                  {(formType === 'SHORT_ANSWER' || formType === 'LONG_ANSWER' || formType === 'DESCRIPTIVE') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Sample Answer / Model Key</label>
                        <textarea
                          rows={2}
                          value={sampleAnswer}
                          onChange={(e) => setSampleAnswer(e.target.value)}
                          placeholder="Expected key points or model answer..."
                          className="ed-textarea"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Evaluation Rubric & Grading Criteria</label>
                        <textarea
                          rows={2}
                          value={rubric}
                          onChange={(e) => setRubric(e.target.value)}
                          placeholder="Guidelines for examiners (e.g. 2 marks for formula, 3 marks for derivation)..."
                          className="ed-textarea"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {formType === 'FILE_UPLOAD' && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Upload size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span>
                        Students will be prompted to submit documents (PDF, JPG, PNG) for evaluation in the Teacher Grading Dashboard.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Explanation / Solution Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="Solution steps displayed to students after result publication..."
                    className="ed-textarea"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="ed-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Question' : 'Save Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box">
            <div className="ed-dialog-header">
              <span className="ed-badge ed-badge-teal">
                {getTypeLabel(previewItem.questionType)}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="ed-btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ed-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {previewItem.questionText}
              </div>

              <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Metadata & Key:</div>
                <pre style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-default)', overflowX: 'auto', color: 'var(--text-primary)' }}>
                  {JSON.stringify(previewItem.metadata, null, 2)}
                </pre>
              </div>

              {previewItem.explanation && (
                <div style={{ fontSize: '0.85rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                  <strong>Solution / Explanation:</strong> {previewItem.explanation}
                </div>
              )}
            </div>

            <div className="ed-dialog-footer">
              <Button
                variant="outline"
                onClick={() => setPreviewItem(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
