import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorState from '../components/shared/ErrorState';
import { assignmentApi } from '../api';
import { getApiErrorState, isUpgradeRequired } from '../lib/apiState';

const optionLetters = ['A', 'B', 'C', 'D'];

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const date = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(d)
    .replace(/\s/g, '')
    .toLowerCase();
  return `${date} at ${time}`;
}

function AutoMarkBadge() {
  return <span className="auto-mark-badge">Auto-Mark</span>;
}

function UpgradePrompt() {
  return (
    <div className="upgrade-prompt">
      <span className="material-symbols-rounded icon">warning</span>
      <div className="upgrade-prompt-body">
        <div className="upgrade-prompt-title">Resubmission limit reached (Free plan)</div>
        <div className="upgrade-prompt-sub">Upgrade to Member for unlimited resubmissions</div>
      </div>
      <Link to="/membership" className="upgrade-prompt-btn">
        Upgrade
      </Link>
    </div>
  );
}

function buildResult(submission, assignment) {
  const perQuestion = {};
  const breakdown = Array.isArray(submission?.breakdown) ? submission.breakdown : [];

  breakdown.forEach(item => {
    perQuestion[String(item.questionId)] = {
      correct: Boolean(item.correct),
      points: item.points ?? 0,
    };
  });

  return {
    score: submission?.score ?? 0,
    maxScore: submission?.maxScore ?? assignment?.maxScore ?? 0,
    perQuestion,
    breakdown,
  };
}

export default function AssignmentQuiz() {
  const { id: courseId, asgId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [resubmissionsUsed, setResubmissionsUsed] = useState(0);
  const [resubmissionsLimit, setResubmissionsLimit] = useState(0);
  const [unlimitedResubmissions, setUnlimitedResubmissions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [preparingResubmission, setPreparingResubmission] = useState(false);
  const questions = assignment?.questions ?? [];

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      setLoading(true);
      setError('');
      setSubmitError('');
      setShowUpgradePrompt(false);

      const [assignmentResult, submissionResult] = await Promise.allSettled([
        assignmentApi.get(courseId, asgId),
        assignmentApi.mySubmission(courseId, asgId),
      ]);

      if (cancelled) return;

      if (assignmentResult.status === 'fulfilled') {
        const nextAssignment = assignmentResult.value.data?.data;
        setAssignment(nextAssignment);
        setResubmissionsLimit(
          Object.prototype.hasOwnProperty.call(nextAssignment || {}, 'resubmissionsLimit')
            ? nextAssignment.resubmissionsLimit
            : 0,
        );
        setUnlimitedResubmissions(nextAssignment?.unlimitedResubmissions === true);
      } else {
        setAssignment(null);
        setError(getApiErrorState(assignmentResult.reason).message);
        setLoading(false);
        return;
      }

      if (submissionResult.status === 'fulfilled') {
        const submission = submissionResult.value.data;
        setResubmissionsUsed(submission?.resubmissionsUsed ?? 0);
        setResubmissionsLimit(
          Object.prototype.hasOwnProperty.call(submission || {}, 'resubmissionsLimit')
            ? submission.resubmissionsLimit
            : Object.prototype.hasOwnProperty.call(assignmentResult.value.data?.data || {}, 'resubmissionsLimit')
              ? assignmentResult.value.data.data.resubmissionsLimit
              : 0,
        );
        setUnlimitedResubmissions(
          submission?.unlimitedResubmissions === true ||
            assignmentResult.value.data?.data?.unlimitedResubmissions === true,
        );

        if (submission?.status === 'graded') {
          setSubmitted(true);
          setResult(buildResult(submission, assignmentResult.value.data?.data));
        }
      } else if (submissionResult.reason?.response?.status !== 404) {
        setError(getApiErrorState(submissionResult.reason).message);
      }

      setLoading(false);
    }

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [asgId, courseId]);

  const answeredCount = useMemo(
    () =>
      questions.filter(question => {
        const value = answers[question.id];
        return question.type === 'MCQ' ? value != null : String(value || '').trim().length > 0;
      }).length,
    [answers, questions]
  );

  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const progressPercent = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const isOverdue = Boolean(assignment?.dueDate && new Date(assignment.dueDate) < new Date());
  const safeResubmissionsUsed = resubmissionsUsed ?? 0;
  const resubmissionsRemaining = unlimitedResubmissions
    ? null
    : Math.max(resubmissionsLimit - safeResubmissionsUsed, 0);
  const limitReached = submitted && !unlimitedResubmissions && resubmissionsRemaining === 0;

  function updateAnswer(questionId, value) {
    if (submitted || loading) return;
    setAnswers(current => ({ ...current, [questionId]: value }));
  }

  async function submitQuiz() {
    if (!allAnswered || submitted || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setShowUpgradePrompt(false);

    try {
      const response = await assignmentApi.submitAuto(courseId, asgId, answers);
      setResult(buildResult(response.data, assignment));
      setSubmitted(true);
      setPreparingResubmission(false);
      setResubmissionsUsed(current =>
        response.data?.resubmissionsUsed ?? (preparingResubmission ? current + 1 : current),
      );
      setResubmissionsLimit(current =>
        Object.prototype.hasOwnProperty.call(response.data || {}, 'resubmissionsLimit')
          ? response.data.resubmissionsLimit
          : current,
      );
      setUnlimitedResubmissions(current =>
        Object.prototype.hasOwnProperty.call(response.data || {}, 'unlimitedResubmissions')
          ? response.data.unlimitedResubmissions === true
          : current,
      );
    } catch (err) {
      if (isUpgradeRequired(err)) {
        setShowUpgradePrompt(true);
      } else {
        setSubmitError(getApiErrorState(err).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resubmitQuiz() {
    if (isOverdue || (!unlimitedResubmissions && resubmissionsRemaining <= 0)) {
      return;
    }
    setAnswers({});
    setResult(null);
    setSubmitted(false);
    setPreparingResubmission(true);
    setSubmitError('');
    setShowUpgradePrompt(false);
  }

  function renderResultTable() {
    if (!result?.breakdown?.length) return null;

    return (
      <div className="quiz-result-table-card">
        <table className="quiz-result-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((item, index) => {
              const question = questions.find(
                candidate => String(candidate.id) === String(item.questionId),
              );
              return (
                <tr key={item.questionId ?? index}>
                  <td>{item.questionText ?? question?.text ?? `Question ${index + 1}`}</td>
                  <td>{item.studentAnswer ?? '—'}</td>
                  <td>{item.correctAnswer ?? '—'}</td>
                  <td>{item.points ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderQuestion(question, index) {
    const questionResult = result?.perQuestion?.[String(question.id)];
    const selectedAnswer = answers[question.id];
    const earnedPoints = questionResult?.points ?? questionResult?.earned ?? 0;

    return (
      <div key={question.id} className="quiz-question-card">
        <div className="quiz-question-header">
          <div className="quiz-question-num">Question {index + 1}</div>
          <div className="quiz-question-points">
            {submitted && questionResult ? `+${earnedPoints} pts` : `${question.points} pts`}
          </div>
        </div>
        <div className="quiz-question-text">{question.text}</div>

        {question.type === 'MCQ' ? (
          <>
            <div className="quiz-options">
              {(question.options ?? []).map((option, optionIndex) => {
                const selected = selectedAnswer === optionIndex;
                const showCorrect = submitted && selected && questionResult?.correct;
                const showWrong = submitted && selected && questionResult && !questionResult.correct;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`quiz-option${selected ? ' selected' : ''}${showCorrect ? ' correct' : ''}${
                      showWrong ? ' wrong' : ''
                    }`}
                    onClick={() => updateAnswer(question.id, optionIndex)}
                    disabled={submitted}
                  >
                    <span className="quiz-radio" />
                    <span className="quiz-option-label">
                      {optionLetters[optionIndex]}. {option}
                    </span>
                  </button>
                );
              })}
            </div>
            {submitted && questionResult && (
              <div className="quiz-answer-review">
                <div className={questionResult.correct ? 'quiz-correct-answer' : 'quiz-wrong-answer'}>
                  {questionResult.correct ? 'Marked correct' : 'Marked incorrect'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <input
              className="quiz-text-input"
              type="text"
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={e => updateAnswer(question.id, e.target.value)}
              disabled={submitted}
            />
            {submitted && (
              <div className="quiz-answer-review">
                <div>Your answer: {answers[question.id] || '-'}</div>
                {questionResult && (
                  <div className={questionResult.correct ? 'quiz-correct-answer' : 'quiz-wrong-answer'}>
                    {questionResult.correct ? 'Marked correct' : 'Marked incorrect'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="submit-layout">
        <div className="submit-main">
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="submit-layout">
        <div className="submit-main">
          <ErrorState message={error || 'Content not found'} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb-row">
        <Link to={`/courses/${courseId}`} className="breadcrumb-link">
          Course {courseId}
        </Link>
        <span className="material-symbols-rounded">chevron_right</span>
        <Link to={`/courses/${courseId}?tab=assignments`} className="breadcrumb-link">
          Assignments
        </Link>
        <span className="material-symbols-rounded">chevron_right</span>
        <span>{assignment.title}</span>
      </div>

      <div className="submit-layout">
        <div className="submit-main">
          <div className="asgn-card">
            <div className="asgn-title">{assignment.title}</div>
            <div className="asgn-meta-row">
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">schedule</span>
                Due {formatDateTime(assignment.dueDate)}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">star</span>
                {assignment.maxScore} marks
              </span>
              <AutoMarkBadge />
              <span className="instant-chip">
                <span className="material-symbols-rounded icon">auto_fix_high</span>
                Instant result
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{assignment.description}</div>
          </div>

          {submitted && result && (
            <>
              <div className="quiz-result-banner">
                <div className="quiz-result-score">
                  {result.score} / {result.maxScore}
                </div>
                <div>
                  <AutoMarkBadge />
                  <div className="quiz-result-message">
                    {result.score >= result.maxScore / 2
                      ? 'Passed. Your result is available immediately.'
                      : 'Not yet passed. Review your result and try again.'}
                  </div>
                </div>
              </div>
              {renderResultTable()}
            </>
          )}

          <div className="quiz-question-list">
            {questions.map((question, index) => renderQuestion(question, index))}
          </div>

          {submitError && <div className="form-error">{submitError}</div>}
          {showUpgradePrompt && <UpgradePrompt />}

          {!submitted ? (
            <button type="button" className="submit-btn" onClick={submitQuiz} disabled={!allAnswered || submitting}>
              <span className="material-symbols-rounded icon">send</span>
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {submitting ? 'Submitting...' : 'Submit quiz'}
            </button>
          ) : (
            <div className="resubmit-card">
              {isOverdue ? (
                <div className="resubmit-heading">Resubmissions closed after the deadline</div>
              ) : limitReached ? (
                <UpgradePrompt />
              ) : (
                <>
                  <div className="resubmit-heading">
                    {unlimitedResubmissions
                      ? 'Unlimited resubmissions before the deadline'
                      : `${resubmissionsRemaining} resubmission${resubmissionsRemaining === 1 ? '' : 's'} remaining (Free plan)`}
                  </div>
                  {!unlimitedResubmissions && (
                    <Link to="/membership" className="membership-link">
                      Upgrade to Member for unlimited resubmissions
                    </Link>
                  )}
                  <button type="button" className="submit-btn resubmit-quiz-btn" onClick={resubmitQuiz}>
                    <span className="material-symbols-rounded icon">refresh</span>
                    Resubmit quiz
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="submit-sidebar">
          <div className="info-card">
            <div className="info-card-title">Quiz info</div>
            <div className="info-row">
              <span className="info-row-label">Type</span>
              <AutoMarkBadge />
            </div>
            <div className="info-row">
              <span className="info-row-label">Status</span>
              <span className={`info-row-val ${submitted ? 'success' : 'urgent'}`}>
                {submitted ? 'Submitted · Graded' : 'Not submitted'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Due date</span>
              <span className="info-row-val">{formatDateTime(assignment.dueDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">
                {submitted && result ? `${result.score} / ${result.maxScore}` : `${assignment.maxScore} points`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Questions</span>
              <span className="info-row-val">{questions.length}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Resubmissions</span>
              <span className="info-row-val">
                {unlimitedResubmissions ? '∞ remaining' : `${resubmissionsRemaining} remaining`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Result</span>
              <span className="info-row-val">Instant on submit</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Progress</div>
            <div className="progress-count">
              {answeredCount} / {questions.length} answered
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
