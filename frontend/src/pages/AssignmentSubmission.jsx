// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// // TODO Sprint 3: restore → assignmentApi.list(courseId) and assignmentApi.submit(id, formData)
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getMockCourse } from '../mock/courses';
import { getMockAssignment } from '../mock/assignments';

export default function AssignmentSubmission() {
  const { id: courseId, asgId: assignmentId } = useParams();
  const fileInputRef = useRef(null);
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  useEffect(() => {
    // Sprint 2: resolve from mock data
    const t = setTimeout(() => {
      setAssignment(getMockAssignment(courseId, assignmentId));
      setCourse(getMockCourse(courseId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [courseId, assignmentId]);

  const submitted = Boolean(submittedAt);

  const dueLabel = useMemo(() => {
    if (!assignment?.dueDate) return '';
    const d = new Date(assignment.dueDate);
    const date = new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
    return `${date}, ${time}`;
  }, [assignment?.dueDate]);

  const isUrgent = useMemo(() => {
    if (!assignment?.dueDate) return false;
    const due = new Date(assignment.dueDate);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= -365;
  }, [assignment?.dueDate]);

  const canSubmit = Boolean(pickedFile) && !submitted && !submitting;

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function acceptFile(file) {
    const maxBytes = 50 * 1024 * 1024;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const okExt = ext === 'pdf' || ext === 'docx';
    if (!okExt) return { ok: false, reason: 'Please upload a PDF or DOCX file.' };
    if (file.size > maxBytes) return { ok: false, reason: 'File must be ≤ 50 MB.' };
    return { ok: true, reason: null };
  }

  function pickFile(file) {
    if (!file) return;
    const res = acceptFile(file);
    if (!res.ok) {
      // keep UX minimal: just ignore invalid; in Sprint 3 we'd show a toast
      setPickedFile(null);
      return;
    }
    setPickedFile(file);
  }

  async function submitAssignment() {
    if (!pickedFile || submitted || submitting) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 650)); // simulate upload
    setSubmitting(false);
    setSubmittedAt(new Date());
  }

  if (loading) return <LoadingSpinner />;
  if (!assignment) return <div>Assignment not found.</div>;

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
        <Link to={`/courses/${courseId}`} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
          {course?.code ?? `Course ${courseId}`}
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <Link to={`/courses/${courseId}`} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
          Assignments
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <span>{assignment.title}</span>
      </div>

      <div className="submit-layout">
        <div className="submit-main">
          <div className="asgn-card">
            <div className="asgn-title">{assignment.title}</div>
            <div className="asgn-meta-row">
              <span className={`asgn-meta-chip${isUrgent ? ' urgent' : ''}`}>
                <span className="material-symbols-rounded icon">schedule</span>
                {assignment.dueDate ? `Due ${dueLabel}` : 'No due date'}
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
                <span className="material-symbols-rounded icon">group</span>
                {assignment.submissionMode}
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{assignment.description}</div>
          </div>

          {!submitted && (
            <>
              <div
                id="upload-zone"
                className={`upload-zone${dragOver ? ' dragover' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  pickFile(file);
                }}
              >
                <span className="material-symbols-rounded icon">upload_file</span>
                <div className="upload-zone-title">Drag and drop your file here</div>
                <div className="upload-zone-sub">
                  or <span>browse to upload</span> · {assignment.allowedFileTypes} up to 50 MB
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={e => pickFile(e.target.files?.[0])}
              />

              <div className="file-list" id="file-list">
                {pickedFile && (
                  <div className="file-item">
                    <div className="file-item-icon">
                      <span className="material-symbols-rounded icon">description</span>
                    </div>
                    <div className="file-item-info">
                      <div className="file-item-name">{pickedFile.name}</div>
                      <div className="file-item-size">{formatBytes(pickedFile.size)}</div>
                    </div>
                    <button
                      type="button"
                      className="file-item-remove"
                      aria-label="Remove file"
                      onClick={() => {
                        setPickedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <span className="material-symbols-rounded icon">close</span>
                    </button>
                  </div>
                )}
              </div>

              <div id="submit-area">
                <button
                  type="button"
                  className="submit-btn"
                  id="submit-btn"
                  onClick={submitAssignment}
                  disabled={!canSubmit}
                >
                  <span className="material-symbols-rounded icon">send</span>
                  {submitting ? 'Submitting…' : 'Submit assignment'}
                </button>
              </div>
            </>
          )}

          <div
            className="submit-success"
            id="submit-success"
            style={{ display: submitted ? 'block' : 'none' }}
          >
            <span className="material-symbols-rounded icon">check_circle</span>
            <div className="submit-success-title">Submitted successfully</div>
            <div className="submit-success-sub">
              Your assignment has been received.
              <br />
              Submitted on{' '}
              {submittedAt
                ? new Intl.DateTimeFormat('en-AU', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(submittedAt)
                : ''}
              <br />
              <br />
              Your instructor will provide feedback once marking is complete.
            </div>
            <Link
              to={`/courses/${courseId}`}
              className="submit-btn"
              style={{
                marginTop: 20,
                maxWidth: 240,
                marginLeft: 'auto',
                marginRight: 'auto',
                textDecoration: 'none',
              }}
            >
              <span className="material-symbols-rounded icon">arrow_back</span>
              Back to course
            </Link>
          </div>
        </div>

        <div className="submit-sidebar">
          <div className="info-card">
            <div className="info-card-title">Submission info</div>
            <div className="info-row">
              <span className="info-row-label">Status</span>
              <span
                className={`info-row-val${!submitted ? ' urgent' : ''}`}
                id="sub-status"
                style={!submitted ? { color: '#d85a30' } : undefined}
              >
                {submitted ? 'Submitted' : 'Not submitted'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Due date</span>
              <span className={`info-row-val${isUrgent ? ' urgent' : ''}`}>
                {assignment.dueDate ? dueLabel : '-'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">{assignment.maxScore} points</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Attempts</span>
              <span className="info-row-val">{assignment.attempts}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">File type</span>
              <span className="info-row-val">{assignment.allowedFileTypes}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-title">Submission checklist</div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> All 7 report
              sections included
            </div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> Screenshots
              clearly labelled
            </div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> GitHub commit log
              included
            </div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> Sprint Board
              screenshot included
            </div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> Reviewed by all
              team members
            </div>
            <div className="checklist-item">
              <span className="material-symbols-rounded icon">check_circle</span> Submitted as
              single PDF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
