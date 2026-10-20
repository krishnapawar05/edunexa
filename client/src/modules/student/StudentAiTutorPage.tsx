import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  ShieldAlert,
  Send,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  askConceptTutorApi,
  askSchoolAssistantApi,
  getStoredAuthToken,
} from '../../services/api.js';

export const StudentAiTutorPage: React.FC = () => {
  const [activeAssistantTab, setActiveAssistantTab] = useState<'CONCEPT_TUTOR' | 'SCHOOL_POLICIES'>('CONCEPT_TUTOR');

  // Concept Tutor State
  const [topic, setTopic] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [subject, setSubject] = useState<string>('Physics');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 10');
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);
  const [tutorResult, setTutorResult] = useState<any | null>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);

  // School Policies Assistant State
  const [policyQuestion, setPolicyQuestion] = useState<string>('');
  const [policyLoading, setPolicyLoading] = useState<boolean>(false);
  const [policyAnswer, setPolicyAnswer] = useState<string | null>(null);
  const [policySources, setPolicySources] = useState<string[]>([]);
  const [policyMissingInfo, setPolicyMissingInfo] = useState<boolean>(false);
  const [policyUnconfigured, setPolicyUnconfigured] = useState<boolean>(false);
  const [policyDisclaimer, setPolicyDisclaimer] = useState<string | null>(null);

  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setTutorLoading(true);
    setTutorResult(null);
    setTutorError(null);

    try {
      const token = getStoredAuthToken('STUDENT');
      const res = await askConceptTutorApi(
        {
          topic: topic.trim() || 'General Concept',
          question: question.trim(),
          subject,
          gradeLevel,
        },
        token
      );

      if (res.success && res.data) {
        setTutorResult(res.data);
      } else {
        setTutorError(res.error?.message || 'Unable to generate explanation from AI Concept Tutor.');
      }
    } catch (err: any) {
      setTutorError('Connection error to AI Tutor: ' + err.message);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleAskPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyQuestion.trim()) return;

    setPolicyLoading(true);
    setPolicyAnswer(null);
    setPolicySources([]);
    setPolicyMissingInfo(false);
    setPolicyUnconfigured(false);

    try {
      const token = getStoredAuthToken('STUDENT');
      const res = await askSchoolAssistantApi(policyQuestion.trim(), 'GENERAL', token);

      if (res.success && res.data) {
        setPolicyAnswer(res.data.answer);
        setPolicySources(res.data.groundedSources || []);
        setPolicyMissingInfo(!!res.data.isMissingInformation);
        setPolicyDisclaimer(res.data.disclaimer);
      } else if (res.error?.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        setPolicyUnconfigured(true);
        setPolicyAnswer(
          'AI Provider API key is not configured in server/.env. Synthetic grounded responses are verified in backend unit tests.'
        );
      } else {
        setPolicyAnswer(res.error?.message || 'Unable to retrieve grounded answer.');
      }
    } catch (err: any) {
      setPolicyAnswer('Connection error: ' + err.message);
    } finally {
      setPolicyLoading(false);
    }
  };

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
            <Sparkles size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              AI Learning Assistant & Concept Tutor
            </h2>
            <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
              POWERED BY AI
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Personalized curriculum tutor for step-by-step subject explanations, plus grounded school policy guide.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        <button
          className={`ed-btn ed-btn-sm ${activeAssistantTab === 'CONCEPT_TUTOR' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveAssistantTab('CONCEPT_TUTOR')}
          style={{ display: 'inline-flex', gap: '6px' }}
        >
          <BookOpen size={14} /> AI Concept Tutor (Academic Revision)
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeAssistantTab === 'SCHOOL_POLICIES' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveAssistantTab('SCHOOL_POLICIES')}
          style={{ display: 'inline-flex', gap: '6px' }}
        >
          <Building2 size={14} /> School Policies & Campus Assistant
        </button>
      </div>

      {/* TAB 1: CONCEPT TUTOR */}
      {activeAssistantTab === 'CONCEPT_TUTOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
          {/* Left Column: Form Controls */}
          <div className="ed-card">
            <div className="ed-card-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Ask Your Concept Question</span>
            </div>
            <div className="ed-card-body">
              <form onSubmit={handleAskTutor} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Subject
                  </label>
                  <select
                    className="ed-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="English Literature">English Literature</option>
                    <option value="History & Civics">History & Civics</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Grade / Standard Level
                  </label>
                  <select
                    className="ed-input"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10 (Secondary Board)</option>
                    <option value="Grade 11">Grade 11 (Senior Secondary)</option>
                    <option value="Grade 12">Grade 12 (Board Examination)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Specific Topic / Chapter (Optional)
                  </label>
                  <input
                    className="ed-input"
                    placeholder="e.g. Electromagnetic Induction, Quadratic Equations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Your Question or Problem Statement *
                  </label>
                  <textarea
                    className="ed-input"
                    rows={4}
                    placeholder="Type the concept you want explained step-by-step, or paste the problem..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={tutorLoading}
                  className="ed-btn ed-btn-primary"
                  style={{ width: '100%' }}
                >
                  {tutorLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Analyzing & Generating Lesson...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Concept Explanation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: AI Lesson Output */}
          <div className="ed-card">
            <div className="ed-card-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Tutor Explanation & Practice Hints</span>
              {tutorResult && (
                <span className="ed-badge ed-badge-success" style={{ fontSize: '0.68rem' }}>
                  Pedagogical Response
                </span>
              )}
            </div>
            <div className="ed-card-body">
              {tutorError && (
                <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.84rem' }}>
                  {tutorError}
                </div>
              )}

              {tutorLoading && (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto var(--space-3)', color: 'var(--primary-600)' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Formulating Curriculum Breakdown
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>
                    Tailoring explanation to {gradeLevel} curriculum standards...
                  </p>
                </div>
              )}

              {!tutorLoading && !tutorResult && !tutorError && (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Lightbulb size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Ready to Learn
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>
                    Select your subject and ask any problem or theoretical concept. The AI tutor provides step-by-step intuition, formulas, and revision hints.
                  </p>
                </div>
              )}

              {tutorResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Main Explanation */}
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {tutorResult.explanation}
                  </div>

                  {/* Step-by-Step Breakdown */}
                  {tutorResult.steps && tutorResult.steps.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--primary-700)' }}>
                        Step-by-Step Problem Solving Sequence:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {tutorResult.steps.map((st: string, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '8px 12px',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.82rem',
                            }}
                          >
                            <span style={{ fontWeight: 800, color: 'var(--primary-600)' }}>{idx + 1}.</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Hints */}
                  {tutorResult.hints && tutorResult.hints.length > 0 && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--primary-50, rgba(14, 165, 233, 0.08))',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--primary-200, rgba(14, 165, 233, 0.25))',
                        fontSize: '0.80rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--primary-800)', marginBottom: '4px' }}>
                        💡 Key Revision Tips:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                        {tutorResult.hints.map((hint: string, idx: number) => (
                          <li key={idx} style={{ marginTop: '2px' }}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL POLICY ASSISTANT */}
      {activeAssistantTab === 'SCHOOL_POLICIES' && (
        <div className="ed-card">
          <div className="ed-card-header">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Grounded Campus & Institutional Policy Guide</span>
            <span className="ed-badge ed-badge-info">Grounded Sources</span>
          </div>

          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <form onSubmit={handleAskPolicy} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                className="ed-input"
                placeholder="Ask about school hours, attendance threshold, uniform rules, examination criteria, library hours..."
                value={policyQuestion}
                onChange={(e) => setPolicyQuestion(e.target.value)}
              />
              <button
                type="submit"
                disabled={policyLoading}
                className="ed-btn ed-btn-primary"
                style={{ minWidth: '110px' }}
              >
                {policyLoading ? 'Searching...' : 'Ask Assistant'}
              </button>
            </form>

            {/* Unconfigured Alert */}
            {policyUnconfigured && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>AI Provider Unconfigured</div>
                  <div>To enable the live AI Assistant, configure <code>AI_PROVIDER_API_KEY</code> in <code>server/.env</code>. Grounded responses are checked in test suite.</div>
                </div>
              </div>
            )}

            {/* Answer Display */}
            {policyAnswer && !policyUnconfigured && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: policyMissingInfo ? '#fffbeb' : 'var(--bg-subtle)',
                  border: `1px solid ${policyMissingInfo ? '#fde68a' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: policyMissingInfo ? '#92400e' : 'var(--primary-700)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {policyMissingInfo ? <AlertTriangle size={15} /> : <Sparkles size={15} />}
                  {policyMissingInfo ? 'Information Not Found in Approved Records:' : 'Campus Assistant Answer:'}
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{policyAnswer}</div>

                {policySources.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Sources:</span>
                    {policySources.map((source, idx) => (
                      <span key={idx} className="ed-badge ed-badge-neutral" style={{ fontSize: '0.70rem' }}>
                        {source}
                      </span>
                    ))}
                  </div>
                )}

                {policyDisclaimer && (
                  <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-default)', paddingTop: '6px' }}>
                    ⚠️ {policyDisclaimer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentAiTutorPage;
