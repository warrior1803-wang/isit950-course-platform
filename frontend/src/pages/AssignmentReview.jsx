import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getMockCourse } from '../mock/courses';
import { getMockSubmissionByAssignment } from '../mock/submission';

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDateShort(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function gradeBand(percent) {
  if (percent >= 85) return 'High distinction';
  if (percent >= 75) return 'Distinction';
  if (percent >= 65) return 'Credit';
  if (percent >= 50) return 'Pass';
  return 'Resubmission recommended';
}

function fileIconMeta(type) {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'pdf') return { icon: 'picture_as_pdf', accent: '#d85a30', bg: 'rgba(232,90,48,0.1)' };
  if (normalized === 'py' || normalized === 'sql' || normalized === 'js') return { icon: 'code', accent: '#534ab7', bg: 'rgba(83,74,183,0.1)' };
  return { icon: 'description', accent: '#1d9e75', bg: 'rgba(29,158,117,0.1)' };
}

export default function AssignmentReview() {
  const { id: courseId, asgId: assignmentId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setSubmission(getMockSubmissionByAssignment(courseId, assignmentId));
      setCourse(getMockCourse(courseId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [courseId, assignmentId]);

  const assignment = submission?.assignment ?? null;
  const isGraded = submission?.score != null;

  const scorePercent = useMemo(() => {
    if (!isGraded || !assignment?.maxScore) return 0;
    return Math.round((submission?.score / assignment.maxScore) * 100);
  }, [assignment?.maxScore, isGraded, submission?.score]);

  const canResubmit = useMemo(() => {
    if (isGraded || !assignment?.dueDate) return false;
    return new Date(assignment.dueDate).getTime() > Date.now();
  }, [assignment?.dueDate, isGraded]);

  function handleDownload() {
    if (!submission) return;
    const fileType = submission.fileType || 'FILE';
    const fileName = submission.filename || `${assignment.title}.${fileType.toLowerCase()}`;
    const blob = new Blob(
      [
        `Mock submission download\n\nAssignment: ${assignment.title}\nFile: ${fileName}\nSubmitted: ${formatDateTime(submission.submittedAt)}`,
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner />;
  if (!assignment || !submission) return <div>Submission not found.</div>;

  const fileMeta = fileIconMeta(submission.fileType);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 20,
        }}
      >
        <Link to="/courses" style={{ cursor: 'pointer', color: 'var(--accent)' }}>
          My Courses
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <Link to={`/courses/${courseId}`} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
          {course?.code ?? `Course ${courseId}`}
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <Link to={`/courses/${courseId}/assignments`} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
          Assignments
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <span>{assignment.title}</span>
      </div>

      <div className="review-layout">
        <div className="review-main">
          <div className="asgn-card">
            <div className="asgn-title">{assignment.title}</div>
            <div className="asgn-meta-row">
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">check_circle</span>
                Submitted {formatDateTime(submission.submittedAt)}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">star</span>
                {assignment.maxScore} marks
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">school</span>
                {course?.code ?? `Course ${courseId}`} · {course?.instructor?.name ?? 'Instructor'}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">
                  {assignment.submissionMode?.toLowerCase().includes('group') ? 'group' : 'person'}
                </span>
                {assignment.submissionMode ?? 'Individual submission'}
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{assignment.description}</div>
          </div>

          <div className={`review-status-banner ${isGraded ? 'graded' : 'submitted'}`}>
            <span className={`material-symbols-rounded review-status-icon ${isGraded ? 'graded' : 'submitted'}`}>
              {isGraded ? 'grading' : 'assignment_turned_in'}
            </span>
            <div>
              <div className="review-status-text">
                {isGraded ? `Graded by ${submission.markedBy ?? course?.instructor?.name ?? 'Instructor'}` : 'Submitted successfully'}
              </div>
              <div className="review-status-sub">
                {isGraded
                  ? `Marked on ${formatDateTime(submission.markedAt)}`
                  : `Submitted on ${formatDateTime(submission.submittedAt)} · Your instructor will provide feedback once marking is complete.`}
              </div>
            </div>
          </div>

          {isGraded && (
            <div className="review-status-card">
              <div className="review-feedback-label">Your score</div>
              <div className="review-score-display">
                <div className="review-score-num">{submission.score}</div>
                <div className="review-score-max">/ {assignment.maxScore}</div>
              </div>
              <div className="review-score-bar">
                <div className="review-score-fill" style={{ width: `${scorePercent}%` }} />
              </div>
              <div className="review-status-sub">
                {scorePercent}% · {gradeBand(scorePercent)}
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 10 }}>Your submission</div>
          <div className="review-file-box">
            <div className="review-file-icon" style={{ background: fileMeta.bg, color: fileMeta.accent }}>
              <span className="material-symbols-rounded">{fileMeta.icon}</span>
            </div>
            <div className="review-file-info">
              <div className="review-file-name">{submission.filename ?? 'submission.pdf'}</div>
              <div className="review-file-meta">
                {submission.fileType ?? 'FILE'}
                {submission.fileSizeBytes ? ` · ${formatBytes(submission.fileSizeBytes)}` : ''}
                {submission.submittedAt ? ` · Submitted ${formatDateShort(submission.submittedAt)}` : ''}
              </div>
            </div>
            <button type="button" className="review-download-btn" onClick={handleDownload}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
              Download
            </button>
          </div>

          {isGraded ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 10 }}>Instructor feedback</div>
              <div className="review-feedback-box">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="disc-avatar"
                    style={{
                      background: 'rgba(29,158,117,0.15)',
                      color: '#1d9e75',
                      width: 32,
                      height: 32,
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {(submission.markedBy ?? course?.instructor?.name ?? 'Instructor')
                      .split(' ')
                      .map(part => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>
                      {submission.markedBy ?? course?.instructor?.name ?? 'Instructor'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDateTime(submission.markedAt)}
                    </div>
                  </div>
                </div>
                <div className="review-feedback-body">{submission.feedback}</div>
              </div>
            </>
          ) : (
            <>
              <div className="review-feedback-box" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.35 }}
                >
                  hourglass_empty
                </span>
                <div style={{ fontSize: 13 }}>Feedback not yet available</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Your instructor hasn&apos;t marked this submission yet.</div>
              </div>
              {canResubmit && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: '1px dashed var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    background: 'var(--input-bg)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>Resubmit before deadline</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Due {formatDateTime(assignment.dueDate)} · You can replace your submission while the deadline has not passed
                    </div>
                  </div>
                  <Link
                    to={`/courses/${courseId}/assignments/${assignmentId}/submit`}
                    className="review-download-btn"
                    style={{
                      flexShrink: 0,
                      justifyContent: 'center',
                      textDecoration: 'none',
                      padding: '9px 14px',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>upload_file</span>
                    Resubmit
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        <div className="review-sidebar">
          <div className="info-card">
            <div className="info-card-title">Submission info</div>
            <div className="info-row">
              <span className="info-row-label">Status</span>
              <span className="info-row-val" style={{ color: isGraded ? '#534ab7' : '#1d9e75' }}>
                {isGraded ? 'Graded' : 'Submitted'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Submitted</span>
              <span className="info-row-val">{formatDateTime(submission.submittedAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Due date</span>
              <span className="info-row-val">{formatDateTime(assignment.dueDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">{assignment.maxScore} points</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Grade</span>
              <span className="info-row-val" style={isGraded ? { color: '#534ab7', fontWeight: 500 } : undefined}>
                {isGraded ? `${submission.score} / ${assignment.maxScore}` : 'Not yet graded'}
              </span>
            </div>
            {isGraded && (
              <div className="info-row">
                <span className="info-row-label">Marked by</span>
                <span className="info-row-val">{submission.markedBy ?? course?.instructor?.name ?? 'Instructor'}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <Link
              to={`/courses/${courseId}/assignments`}
              className="review-download-btn"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', padding: '10px 12px' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
              Back to assignments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
