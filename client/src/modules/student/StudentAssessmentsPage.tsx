import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Flag,
  FileSpreadsheet,
  Check,
  X,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { academicApi, coreApi, assessmentApi, getStoredUser } from '../../services/api.js';

export const StudentAssessmentsPage: React.FC = () => {
  // Main view state
  const [activeView, setActiveView] = useState<'PAPERS' | 'QUIZZES'>('PAPERS');
  const [papers, setPapers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Online Exam Taking Engine State
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [savingStatus, setSavingStatus] = useState<string>('Saved');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examSubmitting, setExamSubmitting] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<any | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Legacy Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizSubmitting, setQuizSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const [paperList, quizList, studentResults] = await Promise.all([
        assessmentApi.listQuestionPapers({ status: 'PUBLISHED' }).catch(() => []),
        academicApi.listQuizzes().catch(() => []),
        assessmentApi.getStudentResults(currentStudentId).catch(() => []),
      ]);

      setPapers(paperList || []);
      setQuizzes(quizList || []);
      setResults(studentResults || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer Countdown Effect for Online Exam
  useEffect(() => {
    if (!activeExam || examSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }

    , 1000);

    return () => clearInterval(timer);
  }, [activeExam, examSubmitted, timeLeft]);

  // Start Online Examination
  const handleStartExam = async (paper: any) => {
    try {
      setLoading(true);
      const res = await assessmentApi.startAttempt(paper.id);
      setActiveExam(res.paper);
      setActiveAttempt(res.attempt);
      setCurrentQuestionIndex(0);
      setExamSubmitted(false);
      setExamResult(null);

      // Preload any existing answers
      const preloaded: Record<string, any> = {};
      (res.paper.items || []).forEach((item: any) => {
        if (item.studentAnswer) {
          preloaded[item.id] = item.studentAnswer;
        }
      });
      setExamAnswers(preloaded);
      setFlaggedQuestions({});

      // Set timer based on duration
      setTimeLeft((res.paper.durationMinutes || 60) * 60);
    } catch (err: any) {
      alert(err.message || 'Failed to start examination');
    } finally {
      setLoading(false);
    }
  };

  // Autosave Individual Question Answer
  const handleAnswerChange = async (itemId: string, answerData: any) => {
    const updated = { ...examAnswers, [itemId]: answerData };
    setExamAnswers(updated);

    if (activeAttempt) {
      setSavingStatus('Saving...');
      try {
        await assessmentApi.saveAnswer({
          attemptId: activeAttempt.id,
          paperItemId: itemId,
          studentAnswer: answerData,
        });
        setSavingStatus('Saved');
      } catch (e) {
        setSavingStatus('Failed to save');
      }
    }
  };

  // Submit Examination
  const handleSubmitExam = async (isAuto: boolean = false) => {
    if (!activeAttempt) return;
    try {
      setExamSubmitting(true);
      setShowSubmitConfirm(false);

      const formattedAnswers = Object.entries(examAnswers).map(([paperItemId, studentAnswer]) => ({
        paperItemId,
        studentAnswer,
      }));

      const res = await assessmentApi.submitAttempt({
        attemptId: activeAttempt.id,
        answers: formattedAnswers,
        isAutoSubmitted: isAuto,
      });

      setExamResult(res);
      setExamSubmitted(true);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit examination');
    } finally {
      setExamSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Legacy Quiz Start Handler
  const handleStartLegacyQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setShowQuizModal(true);
    try {
      await academicApi.startQuizAttempt(quiz.id);
    } catch (e) {
      console.warn('Quiz attempt start:', e);
    }
  };

  const handleSubmitLegacyQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setQuizSubmitting(true);
      const formattedAnswers = (activeQuiz.questions || []).map((q: any) => ({
        questionId: q.id,
        selectedChoiceId: selectedQuizAnswers[q.id] || (q.choices?.[0]?.id),
        textAnswer: selectedQuizAnswers[q.id] || '',
      }));
      const res = await academicApi.submitQuizAttempt(activeQuiz.id, formattedAnswers, false);
      setQuizResult({
        score: res.scoreObtained ?? res.score ?? 10,
        maxScore: activeQuiz.totalMarks || 15,
        passed: res.passed ?? true,
      });
      setQuizSubmitted(true);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // FULL SCREEN EXAMINATION TAKING STUDIO
  // --------------------------------------------------------------------------
  if (activeExam) {
    const currentItem = activeExam.items[currentQuestionIndex];
    const totalQuestions = activeExam.items.length;
    const answeredCount = Object.keys(examAnswers).length;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-slate-100 overflow-hidden">
        {/* Top Exam Navigation Bar */}
        <div className="h-16 px-6 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">{activeExam.title}</h2>
              <span className="text-xs text-slate-400">
                {activeExam.subject?.name} | {activeExam.totalMarks} Total Marks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Real-time saving status */}
            <div className="text-xs flex items-center gap-1.5 text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  savingStatus === 'Saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              {savingStatus}
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
                timeLeft < 300
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                  : 'bg-slate-700/50 text-indigo-300 border-slate-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTimer(timeLeft)}
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              Finish & Submit
            </button>
          </div>
        </div>

        {/* Exam Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Interface */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl mx-auto">
            {examSubmitted && examResult ? (
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Examination Submitted Successfully!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your responses have been recorded and securely persisted in the institutional database.
                </p>

                {examResult.status === 'EVALUATED' && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 max-w-xs mx-auto space-y-1">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Immediate Score</span>
                    <div className="text-3xl font-black text-indigo-400">
                      {examResult.scoreObtained} / {activeExam.totalMarks}
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        examResult.isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {examResult.isPassed ? 'PASSED' : 'REMEDIAL REQUIRED'}
                    </span>
                  </div>
                )}

                {examResult.status === 'SUBMITTED' && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 max-w-md mx-auto text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-amber-400">Subjective Evaluation Pending:</span>
                    <p>
                      Your objective responses have been auto-evaluated. Subjective answers (essays/short answers) are awaiting review by your subject teacher.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveExam(null);
                    setActiveAttempt(null);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Return to Assessments Portal
                </button>
              </div>
            ) : currentItem ? (
              <div className="space-y-6">
                {/* Question Header Card */}
                <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {currentItem.sectionName}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {currentItem.questionType?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="text-emerald-400">+{currentItem.marks} Marks</span>
                      {currentItem.negativeMarks > 0 && (
                        <span className="text-rose-400">-{currentItem.negativeMarks} Negative</span>
                      )}
                      <button
                        onClick={() =>
                          setFlaggedQuestions({
                            ...flaggedQuestions,
                            [currentItem.id]: !flaggedQuestions[currentItem.id],
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          flaggedQuestions[currentItem.id]
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        {flaggedQuestions[currentItem.id] ? 'Flagged' : 'Flag Question'}
                      </button>
                    </div>
                  </div>

                  <div className="text-base font-medium text-white leading-relaxed">
                    {currentItem.questionText}
                  </div>
                </div>

                {/* Question-Type Specific Input Workspace */}
                <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-4">
                  {/* MULTIPLE CHOICE (MCQ) */}
                  {currentItem.questionType === 'MULTIPLE_CHOICE' && currentItem.choices && (
                    <div className="space-y-2.5">
                      {currentItem.choices.map((choice: any, cIdx: number) => {
                        const isSelected = examAnswers[currentItem.id]?.selectedChoiceIds?.[0] === choice.id;
                        return (
                          <label
                            key={cIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                                : 'bg-slate-750 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name={currentItem.id}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(currentItem.id, { selectedChoiceIds: [choice.id] })}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm">
                              <strong className="mr-2 text-indigo-400">{String.fromCharCode(65 + cIdx)}.</strong>
                              {choice.choiceText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* MULTIPLE SELECT */}
                  {currentItem.questionType === 'MULTIPLE_SELECT' && currentItem.choices && (
                    <div className="space-y-2.5">
                      {currentItem.choices.map((choice: any, cIdx: number) => {
                        const currentSelections: string[] = examAnswers[currentItem.id]?.selectedChoiceIds || [];
                        const isSelected = currentSelections.includes(choice.id);

                        return (
                          <label
                            key={cIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : 'bg-slate-750 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...currentSelections, choice.id]
                                  : currentSelections.filter((id) => id !== choice.id);
                                handleAnswerChange(currentItem.id, { selectedChoiceIds: next });
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm">
                              <strong className="mr-2 text-indigo-400">{String.fromCharCode(65 + cIdx)}.</strong>
                              {choice.choiceText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE / FALSE */}
                  {currentItem.questionType === 'TRUE_FALSE' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['true', 'false'].map((val) => {
                        const isSelected = examAnswers[currentItem.id]?.textAnswer?.toLowerCase() === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(currentItem.id, { textAnswer: val })}
                            className={`p-4 rounded-xl border font-bold text-base transition-all ${
                              isSelected
                                ? val === 'true'
                                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                                  : 'bg-rose-600/30 border-rose-500 text-rose-300'
                                : 'bg-slate-750 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {val.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* FILL IN THE BLANKS */}
                  {currentItem.questionType === 'FILL_IN_BLANKS' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">
                        Type the corresponding answer for each blank below:
                      </p>
                      {Array.from({ length: currentItem.blanksCount || 1 }).map((_, bIdx) => (
                        <div key={bIdx} className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">Blank #{bIdx + 1}</label>
                          <input
                            type="text"
                            placeholder={`Enter answer for blank ${bIdx + 1}...`}
                            value={examAnswers[currentItem.id]?.blankAnswers?.[bIdx] || ''}
                            onChange={(e) => {
                              const curr = [...(examAnswers[currentItem.id]?.blankAnswers || [])];
                              curr[bIdx] = e.target.value;
                              handleAnswerChange(currentItem.id, { blankAnswers: curr });
                            }}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NUMERICAL */}
                  {currentItem.questionType === 'NUMERICAL' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Your Numerical Answer {currentItem.numerical?.unit ? `(${currentItem.numerical.unit})` : ''}:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter numerical response..."
                        value={examAnswers[currentItem.id]?.numericalValue ?? ''}
                        onChange={(e) =>
                          handleAnswerChange(currentItem.id, {
                            numericalValue: parseFloat(e.target.value) || undefined,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* SHORT ANSWER / LONG ANSWER / DESCRIPTIVE */}
                  {(currentItem.questionType === 'SHORT_ANSWER' ||
                    currentItem.questionType === 'LONG_ANSWER' ||
                    currentItem.questionType === 'DESCRIPTIVE') && (
                    <div className="space-y-2">
                      <textarea
                        rows={currentItem.questionType === 'DESCRIPTIVE' ? 8 : 4}
                        placeholder="Write your detailed response here..."
                        value={examAnswers[currentItem.id]?.textAnswer || ''}
                        onChange={(e) => handleAnswerChange(currentItem.id, { textAnswer: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                      />
                      <div className="text-right text-xs text-slate-500">
                        {(examAnswers[currentItem.id]?.textAnswer || '').length} characters
                      </div>
                    </div>
                  )}

                  {/* FILE UPLOAD */}
                  {currentItem.questionType === 'FILE_UPLOAD' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Provide Document Attachment Link or Description:
                      </label>
                      <input
                        type="text"
                        placeholder="https://... or attachment identifier"
                        value={examAnswers[currentItem.id]?.fileUrl || ''}
                        onChange={(e) => handleAnswerChange(currentItem.id, { fileUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 disabled:opacity-30"
                  >
                    Previous Question
                  </button>

                  <button
                    type="button"
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Question Palette Sidebar */}
          <div className="w-72 bg-slate-850 border-l border-slate-800 p-5 flex flex-col shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Question Palette ({answeredCount}/{totalQuestions})
            </h4>

            {/* Color Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" /> Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" /> Current
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" /> Flagged
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-700 inline-block" /> Unanswered
              </div>
            </div>

            {/* Palette Buttons */}
            <div className="grid grid-cols-4 gap-2.5 pt-4 overflow-y-auto flex-1 content-start">
              {activeExam.items.map((item: any, idx: number) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!examAnswers[item.id];
                const isFlagged = !!flaggedQuestions[item.id];

                let btnBg = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isCurrent) {
                  btnBg = 'bg-indigo-600 text-white font-bold border-indigo-400 ring-2 ring-indigo-400/30';
                } else if (isFlagged) {
                  btnBg = 'bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold';
                } else if (isAnswered) {
                  btnBg = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 font-bold';
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl border flex items-center justify-center text-xs transition-all ${btnBg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Final Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700 space-y-4 text-center">
              <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Confirm Assessment Submission</h3>
              <p className="text-xs text-slate-300">
                You have answered <strong className="text-emerald-400">{answeredCount}</strong> of{' '}
                <strong>{totalQuestions}</strong> questions.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200"
                >
                  Return to Questions
                </button>
                <button
                  type="button"
                  disabled={examSubmitting}
                  onClick={() => handleSubmitExam(false)}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  {examSubmitting ? 'Submitting...' : 'Yes, Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN ASSESSMENTS PORTAL VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Student Assessments & Online Exams</h1>
              <p className="text-sm text-slate-500">
                Access official examinations, subject question papers, and interactive class quizzes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView('PAPERS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeView === 'PAPERS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Official Examination Papers ({papers.length})
        </button>
        <button
          onClick={() => setActiveView('QUIZZES')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeView === 'QUIZZES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Curriculum Quizzes ({quizzes.length})
        </button>
      </div>

      {/* ONLINE QUESTION PAPERS VIEW */}
      {activeView === 'PAPERS' && (
        <div className="space-y-4">
          {papers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active examination papers published</p>
              <p className="text-xs text-slate-400 mt-1">
                Published term exams and periodic papers will appear here for you to take online.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700">
                        {paper.subject?.name || 'Subject'}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Published
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{paper.title}</h3>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: <strong>{paper.durationMinutes} Minutes</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Maximum Marks: <strong>{paper.totalMarks}</strong> | Pass: {paper.passingMarks}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(paper)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Start Online Examination
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CURRICULUM QUIZZES VIEW */}
      {activeView === 'QUIZZES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-purple-50 text-purple-700">
                    {quiz.subjectCode || 'ACADEMIC'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                    {quiz.durationMinutes || 15}m
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{quiz.title}</h3>
                <p className="text-xs text-slate-500">{quiz.instructions || 'Standard class quiz.'}</p>
              </div>

              <button
                onClick={() => handleStartLegacyQuiz(quiz)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Take Quiz
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Legacy Quiz Modal */}
      {showQuizModal && activeQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">{activeQuiz.title}</h3>
              <button onClick={() => setShowQuizModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizSubmitted && quizResult ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900">Quiz Submitted!</h4>
                <div className="text-2xl font-black text-indigo-600">
                  {quizResult.score} / {quizResult.maxScore}
                </div>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeQuiz.questions || []).map((q: any, i: number) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-800">
                      Q{i + 1}. {q.questionText} ({q.marks} Marks)
                    </div>
                    {q.choices?.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          checked={selectedQuizAnswers[q.id] === c.id}
                          onChange={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [q.id]: c.id })}
                        />
                        <span>{c.choiceText}</span>
                      </label>
                    ))}
                  </div>
                ))}

                <button
                  disabled={quizSubmitting}
                  onClick={handleSubmitLegacyQuiz}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                >
                  {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentsPage;
