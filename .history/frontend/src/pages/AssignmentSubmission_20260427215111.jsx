import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const mockAssignment = {
  id: 'asg1',
  title: 'Week 7 Progress Report',
  description:
    "Submit your team's Week 7 Progress Report as a single PDF document. The report must include all seven sections as outlined in the subject guide.",
  dueDate: '2026-04-17T17:00:00',
  maxScore: 10,
  type: 'FILE',
};

const mockSubmission = null;
// submitted state:
// { filename: 'report_draft.pdf', submittedAt: '2026-04-15T11:42:00', status: 'submitted', resubmissionsUsed: 1, resubmissionsLimit: 2 }
// graded state:
// { filename: 'report_draft.pdf', submittedAt: '2026-04-15T11:42:00', status: 'graded', score: 8, feedback: 'Good structure, needs more detail in Section 4.', resubmissionsUsed: 1, resubmissionsLimit: 2 }

const mockCourse = {
  code: 'ISIT950',
  name: 'Course Collaboration Platform',
};

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

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptFile(file) {
  const maxBytes = 50 * 1024 * 1024;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf' && ext !== 'docx') return false;
  return file.size <= maxBytes;
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

export default function AssignmentSubmission() {
  const { id: courseId } = useParams();
  const fileInputRef = useRef(null);
  const resubmitInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [resubmitDragOver, setResubmitDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(mockSubmission);

  const dueLabel = useMemo(() => formatDateTime(mockAssignment.dueDate), []);
  const isOverdue = useMemo(() => new Date(mockAssignment.dueDate) < new Date(), []);
  const submitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const graded = submission?.status === 'graded';
  const statusLabel = graded ? 'Graded' : submitted ? 'Submitted' : 'Not submitted';
  const resubmissionsUsed = submission?.resubmissionsUsed ?? 0;
  const resubmissionsLimit = submission?.resubmissionsLimit ?? 2;
  const limitReached = submitted && resubmissionsUsed >= resubmissionsLimit;

  function pickFile(file, mode = 'submit') {
    if (!file || !acceptFile(file)) {
      if (mode === 'resubmit') setResubmitFile(null);
      else setPickedFile(null);
      return;
    }
    if (mode === 'resubmit') setResubmitFile(file);
    else setPickedFile(file);
  }

  function clearFile(mode = 'submit') {
    if (mode === 'resubmit') {
      setResubmitFile(null);
      if (resubmitInputRef.current) resubmitInputRef.current.value = '';
      return;
    }
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function submitAssignment() {
    if (!pickedFile || submitting) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 450));
    setSubmission({
      filename: pickedFile.name,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      resubmissionsUsed: 0,
      resubmissionsLimit: 2,
    });
    clearFile();
    setSubmitting(false);
  }

  async function resubmitAssignment() {
    if (!resubmitFile || submitting || limitReached) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 450));
    setSubmission(current => ({
      ...current,
      filename: resubmitFile.name,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      score: undefined,
      feedback: undefined,
      resubmissionsUsed: (current?.resubmissionsUsed ?? 0) + 1,
      resubmissionsLimit: current?.resubmissionsLimit ?? 2,
    }));
    clearFile('resubmit');
    setSubmitting(false);
  }

  function renderUploadZone({ mode = 'submit', compact = false } = {}) {
    const activeRef = mode === 'resubmit' ? resubmitInputRef : fileInputRef;
    const activeFile = mode === 'resubmit' ? resubmitFile : pickedFile;
    const activeDragOver = mode === 'resubmit' ? resubmitDragOver : dragOver;
    const setActiveDragOver = mode === 'resubmit' ? setResubmitDragOver : setDragOver;

    return (
      <>
        <div
          className={`upload-zone${compact ? ' upload-zone-compact' : ''}${
            activeDragOver ? ' dragover' : ''
          }`}
          role="button"
          tabIndex={0}
          onClick={() => activeRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activeRef.current?.click();
            }
          }}
          onDragOver={e => {
            e.preventDefault();
            setActiveDragOver(true);
          }}
          onDragLeave={() => setActiveDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setActiveDragOver(false);
            pickFile(e.dataTransfer.files?.[0], mode);
          }}
        >
          <span className="material-symbols-rounded icon">upload_file</span>
          <div className="upload-zone-title">Drag and drop your file here</div>
          <div className="upload-zone-sub">or browse to upload · PDF, DOCX up to 50 MB</div>
        </div>
        <input
          ref={activeRef}
          type="file"
          style={{ display: 'none' }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={e => pickFile(e.target.files?.[0], mode)}
        />
        <div className="file-list">
          {activeFile && (
            <div className="file-item">
              <div className="file-item-icon">
                <span className="material-symbols-rounded icon">description</span>
              </div>
              <div className="file-item-info">
                <div className="file-item-name">{activeFile.name}</div>
                <div className="file-item-size">{formatBytes(activeFile.size)}</div>
              </div>
              <button
                type="button"
                className="file-item-remove"
                aria-label="Remove file"
                onClick={() => clearFile(mode)}
              >
                <span className="material-symbols-rounded icon">close</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="breadcrumb-row">
        <Link to={`/courses/${courseId}`} className="breadcrumb-link">
          {mockCourse.code}
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
              <span className={`asgn-meta-chip${isOverdue ? ' urgent' : ''}`}>
                <span className="material-symbols-rounded icon">schedule</span>
                Due {dueLabel}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">star</span>
                {mockAssignment.maxScore} marks
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">school</span>
                {mockCourse.code} · {mockCourse.name}
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{mockAssignment.description}</div>
          </div>

          {!submitted && (
            <>
              {renderUploadZone()}
              <button
                type="button"
                className="submit-btn"
                onClick={submitAssignment}
                disabled={!pickedFile || submitting}
              >
                <span className="material-symbols-rounded icon">send</span>
                {submitting ? 'Submitting...' : 'Submit assignment'}
              </button>
            </>
          )}

          {submitted && (
            <>
              <div className="submit-success submit-state-banner">
                <span className="material-symbols-rounded icon">check_circle</span>
                <div>
                  <div className="submit-success-title">Submitted successfully</div>
                  <div className="submit-success-sub">
                    {submission.filename} · Submitted {formatDateTime(submission.submittedAt)}
                  </div>
                </div>
              </div>

              {graded && (
                <div className="grade-card">
                  <div className="grade-card-header">
                    <div>
                      <div className="grade-score">
                        {submission.score} <span>/ {mockAssignment.maxScore}</span>
                      </div>
                      <div className="grade-feedback-label">Feedback</div>
                    </div>
                    <span className="graded-badge">Graded</span>
                  </div>
                  <div className="grade-feedback">{submission.feedback}</div>
                </div>
              )}

              {!graded && (
                <div className="resubmit-card">
                  <div className="resubmit-heading">Submit a new file to replace your current submission</div>
                  <div className="resubmit-chip">
                    {resubmissionsUsed} resubmissions used of {resubmissionsLimit}
                  </div>
                  {limitReached ? (
                    <UpgradePrompt />
                  ) : (
                    <>
                      {renderUploadZone({ mode: 'resubmit', compact: true })}
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={resubmitAssignment}
                        disabled={!resubmitFile || submitting}
                      >
                        <span className="material-symbols-rounded icon">send</span>
                        {submitting ? 'Submitting...' : 'Resubmit assignment'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="submit-sidebar">
          <div className="info-card">
            <div className="info-card-title">Submission info</div>
            <div className="info-row">
              <span className="info-row-label">Status</span>
              <span className={`info-row-val ${submitted ? 'success' : 'urgent'}`}>{statusLabel}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Due date</span>
              <span className={`info-row-val${isOverdue ? ' urgent' : ''}`}>{dueLabel}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">
                {graded ? `${submission.score} / ${mockAssignment.maxScore}` : `${mockAssignment.maxScore} points`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Resubmissions</span>
              <span className="info-row-val">
                {submitted ? `${resubmissionsUsed} / ${resubmissionsLimit}` : `0 / ${resubmissionsLimit}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
