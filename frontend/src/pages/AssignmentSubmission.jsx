// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// TODO Sprint 3: restore → assignmentApi.list(courseId) and assignmentApi.submit(id, formData)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getMockAssignment } from '../mock/assignments';

export default function AssignmentSubmission() {
  const { id: courseId, asgId: assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // Sprint 2: resolve from mock data
    const t = setTimeout(() => {
      setAssignment(getMockAssignment(courseId, assignmentId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [courseId, assignmentId]);

  async function onSubmit() {
    // Sprint 2: mock submit — no real upload
    // TODO Sprint 3: const formData = new FormData(); formData.append('file', data.file[0]);
    //               await assignmentApi.submit(assignmentId, formData);
    await new Promise(r => setTimeout(r, 400)); // simulate upload
    setSubmitted(true);
  }

  if (loading) return <div>Loading assignment...</div>;
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
                {/* Group submission */}
                {assignment.submissionMode}
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{assignment.description}</div>
          </div>

          {/* Upload + submit */}
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
      <Link to={`/courses/${courseId}`}>← Back to Course</Link>
      <h1>{assignment.title}</h1>

      {assignment.description && <p>{assignment.description}</p>}
      {assignment.dueDate && (
        <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
      )}
      {assignment.maxScore && <p>Max Score: {assignment.maxScore}</p>}

      {user?.role === 'student' && (
        <section>
          <h2>Submit Assignment</h2>
          {submitted ? (
            <p>Your submission has been received!</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="file">Upload File</label>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.docx"
                  {...register('file', { required: 'Please select a file' })}
                />
                {errors.file && <span>{errors.file.message}</span>}
              </div>
              <button type="submit">Submit</button>
            </form>
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
        </section>
      )}

      {user?.role === 'instructor' && (
        <section>
          <h2>Submissions</h2>
          <p>View and grade submissions in the instructor dashboard.</p>
        </section>
      )}
    </div>
  );
}
