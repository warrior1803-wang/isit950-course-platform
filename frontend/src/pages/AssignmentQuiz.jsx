import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const mockAssignment = {
  id: 'asg2',
  title: 'Week 5 Scrum Quiz',
  description:
    'Answer all 5 questions. Your submission will be automatically marked and your score displayed immediately.',
  dueDate: '2026-05-08T23:59:00',
  maxScore: 10,
  type: 'AUTO',
  questions: [
    {
      id: 'q1',
      type: 'MCQ',
      text: 'In Scrum, who is responsible for managing and prioritising the Product Backlog?',
      points: 2,
      options: ['Scrum Master', 'Product Owner', 'Development Team', 'Stakeholders'],
      correctOption: 1,
    },
    {
      id: 'q2',
      type: 'MCQ',
      text: 'What is the recommended maximum length of a Sprint?',
      points: 2,
      options: ['1 week', '2 weeks', '4 weeks', '8 weeks'],
      correctOption: 2,
    },
    {
      id: 'q3',
      type: 'FILLIN',
      text: 'The Scrum ceremony where the team inspects the Sprint and adapts the process is called the Sprint _______.',
      points: 2,
      correctAnswer: 'Retrospective',
    },
    {
      id: 'q4',
      type: 'MCQ',
      text: 'Which Scrum event is a 15-minute daily planning session?',
      points: 2,
      options: ['Sprint Planning', 'Daily Scrum', 'Sprint Review', 'Sprint Retrospective'],
      correctOption: 1,
    },
    {
      id: 'q5',
      type: 'UNIQUE',
      text: 'What does the abbreviation "WIP" stand for in the context of Scrum and Kanban boards?',
      points: 2,
      correctAnswer: 'Work in Progress',
    },
  ],
};

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

function normaliseAnswer(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
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

export default function AssignmentQuiz() {
  const { id: courseId } = useParams();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [resubmissionsUsed, setResubmissionsUsed] = useState(0);
  const resubmissionsLimit = 1;

  const answeredCount = useMemo(
    () =>
      mockAssignment.questions.filter(question => {
        const value = answers[question.id];
        return question.type === 'MCQ' ? value != null : String(value || '').trim().length > 0;
      }).length,
    [answers]
  );

  const allAnswered = answeredCount === mockAssignment.questions.length;
  const progressPercent = (answeredCount / mockAssignment.questions.length) * 100;
  const resubmissionsRemaining = Math.max(resubmissionsLimit - resubmissionsUsed, 0);
  const limitReached = submitted && resubmissionsRemaining === 0;

  function updateAnswer(questionId, value) {
    if (submitted) return;
    setAnswers(current => ({ ...current, [questionId]: value }));
  }

  function calculateResult() {
    let score = 0;
    const perQuestion = {};

    mockAssignment.questions.forEach(question => {
      const answer = answers[question.id];
      const correct =
        question.type === 'MCQ'
          ? answer === question.correctOption
          : normaliseAnswer(answer) === normaliseAnswer(question.correctAnswer);
      const earned = correct ? question.points : 0;
      score += earned;
      perQuestion[question.id] = { correct, earned };
    });

    return { score, perQuestion };
  }

  function submitQuiz() {
    if (!allAnswered || submitted) return;
    setResult(calculateResult());
    setSubmitted(true);
  }

  function resubmitQuiz() {
    if (resubmissionsRemaining <= 0) return;
    setResubmissionsUsed(current => current + 1);
    setAnswers({});
    setResult(null);
    setSubmitted(false);
  }

  function renderQuestion(question, index) {
    const questionResult = result?.perQuestion?.[question.id];
    const selectedAnswer = answers[question.id];

    return (
      <div key={question.id} className="quiz-question-card">
        <div className="quiz-question-header">
          <div className="quiz-question-num">Question {index + 1}</div>
          <div className="quiz-question-points">
            {submitted && questionResult ? `+${questionResult.earned} pts` : `${question.points} pts`}
          </div>
        </div>
        <div className="quiz-question-text">{question.text}</div>

        {question.type === 'MCQ' ? (
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => {
              const selected = selectedAnswer === optionIndex;
              const correct = optionIndex === question.correctOption;
              const showCorrect = submitted && correct;
              const showWrong = submitted && selected && !correct;
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
                <div className="quiz-correct-answer">Correct answer: {question.correctAnswer}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb-row">
        <Link to={`/courses/${courseId}`} className="breadcrumb-link">
          ISIT950
        </Link>
        <span className="material-symbols-rounded">chevron_right</span>
        <Link to={`/courses/${courseId}?tab=assignments`} className="breadcrumb-link">
          Assignments
        </Link>
        <span className="material-symbols-rounded">chevron_right</span>
        <span>{mockAssignment.title}</span>
      </div>

      <div className="submit-layout">
        <div className="submit-main">
          <div className="asgn-card">
            <div className="asgn-title">{mockAssignment.title}</div>
            <div className="asgn-meta-row">
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">schedule</span>
                Due {formatDateTime(mockAssignment.dueDate)}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">star</span>
                {mockAssignment.maxScore} marks
              </span>
              <AutoMarkBadge />
              <span className="instant-chip">
                <span className="material-symbols-rounded icon">auto_fix_high</span>
                Instant result
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{mockAssignment.description}</div>
          </div>

          {submitted && result && (
            <div className="quiz-result-banner">
              <div className="quiz-result-score">
                {result.score} / {mockAssignment.maxScore}
              </div>
              <div>
                <AutoMarkBadge />
                <div className="quiz-result-message">
                  {result.score >= mockAssignment.maxScore / 2
                    ? 'Passed. Your result is available immediately.'
                    : 'Not yet passed. Review the correct answers and try again.'}
                </div>
              </div>
            </div>
          )}

          <div className="quiz-question-list">
            {mockAssignment.questions.map((question, index) => renderQuestion(question, index))}
          </div>

          {!submitted ? (
            <button type="button" className="submit-btn" onClick={submitQuiz} disabled={!allAnswered}>
              <span className="material-symbols-rounded icon">send</span>
              Submit quiz
            </button>
          ) : (
            <div className="resubmit-card">
              {limitReached ? (
                <UpgradePrompt />
              ) : (
                <>
                  <div className="resubmit-heading">
                    {resubmissionsRemaining} resubmission remaining (Free plan)
                  </div>
                  <Link to="/membership" className="membership-link">
                    Upgrade to Member for unlimited resubmissions
                  </Link>
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
              <span className="info-row-val">{formatDateTime(mockAssignment.dueDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">
                {submitted && result ? `${result.score} / ${mockAssignment.maxScore}` : `${mockAssignment.maxScore} points`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Questions</span>
              <span className="info-row-val">{mockAssignment.questions.length}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Result</span>
              <span className="info-row-val">Instant on submit</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Progress</div>
            <div className="progress-count">
              {answeredCount} / {mockAssignment.questions.length} answered
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
