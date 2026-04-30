import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assignmentApi } from "../api";

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(/\s/g, "")
    .toLowerCase();
  return `${date} at ${time}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptFile(file) {
  const maxBytes = 50 * 1024 * 1024;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") return false;
  return file.size <= maxBytes;
}

function UpgradePrompt() {
  return (
    <div className="upgrade-prompt">
      <span className="material-symbols-rounded icon">warning</span>
      <div className="upgrade-prompt-body">
        <div className="upgrade-prompt-title">
          Resubmission limit reached (Free plan)
        </div>
        <div className="upgrade-prompt-sub">
          Upgrade to Member for unlimited resubmissions
        </div>
      </div>
      <Link to="/membership" className="upgrade-prompt-btn">
        Upgrade
      </Link>
    </div>
  );
}

export default function AssignmentSubmission() {
  const { id: courseId, asgId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const resubmitInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [resubmitDragOver, setResubmitDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignment() {
      setLoading(true);
      setError("");
      setSubmitError("");
      setShowUpgradePrompt(false);

      const [assignmentResult, submissionResult] = await Promise.allSettled([
        assignmentApi.get(courseId, asgId),
        assignmentApi.mySubmission(courseId, asgId),
      ]);

      if (cancelled) return;

      if (assignmentResult.status === "fulfilled") {
        const nextAssignment = assignmentResult.value.data?.data;
        if (nextAssignment?.type === "AUTO") {
          navigate(`/courses/${courseId}/assignments/${asgId}/quiz`, {
            replace: true,
          });
          return;
        }
        setAssignment(nextAssignment);
      } else {
        setAssignment(null);
        setError(
          assignmentResult.reason?.response?.data?.message ||
            assignmentResult.reason?.response?.data?.error ||
            "Failed to load assignment.",
        );
        setLoading(false);
        return;
      }

      if (submissionResult.status === "fulfilled") {
        const nextSubmission = submissionResult.value.data;
        setSubmission(nextSubmission);
        if (nextSubmission?.status === "graded") {
          navigate(`/courses/${courseId}/assignments/${asgId}/review`, {
            replace: true,
          });
          return;
        }
      } else if (submissionResult.reason?.response?.status === 404) {
        setSubmission(null);
      } else {
        setError(
          submissionResult.reason?.response?.data?.message ||
            submissionResult.reason?.response?.data?.error ||
            "Failed to load your submission.",
        );
      }

      setLoading(false);
    }

    loadAssignment();
    return () => {
      cancelled = true;
    };
  }, [asgId, courseId, navigate]);

  const dueLabel = useMemo(
    () => formatDateTime(assignment?.dueDate),
    [assignment?.dueDate],
  );
  const isOverdue = useMemo(
    () => Boolean(assignment?.dueDate && new Date(assignment.dueDate) < new Date()),
    [assignment?.dueDate],
  );
  const submitted =
    submission?.status === "submitted" || submission?.status === "graded";
  const graded = submission?.status === "graded";
  const statusLabel = graded
    ? "Graded"
    : submitted
      ? "Awaiting grade"
      : "Not submitted";
  const resubmissionsUsed = submission?.resubmissionsUsed ?? 0;
  const resubmissionsLimit =
    submission?.resubmissionsLimit ?? assignment?.resubmissionsLimit ?? 0;
  const limitReached = submitted && resubmissionsUsed >= resubmissionsLimit;

  function pickFile(file, mode = "submit") {
    if (!file || !acceptFile(file)) {
      if (mode === "resubmit") setResubmitFile(null);
      else setPickedFile(null);
      return;
    }
    if (mode === "resubmit") setResubmitFile(file);
    else setPickedFile(file);
  }

  function clearFile(mode = "submit") {
    if (mode === "resubmit") {
      setResubmitFile(null);
      if (resubmitInputRef.current) resubmitInputRef.current.value = "";
      return;
    }
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitAssignment() {
    if (!pickedFile || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    setShowUpgradePrompt(false);

    try {
      const formData = new FormData();
      formData.append("file", pickedFile);
      await assignmentApi.submitFile(courseId, asgId, formData);
      clearFile();
      navigate(`/courses/${courseId}/assignments/${asgId}/review`);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowUpgradePrompt(true);
      } else {
        setSubmitError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to submit assignment.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resubmitAssignment() {
    if (!resubmitFile || submitting || limitReached) return;
    setSubmitting(true);
    setSubmitError("");
    setShowUpgradePrompt(false);

    try {
      const formData = new FormData();
      formData.append("file", resubmitFile);
      await assignmentApi.submitFile(courseId, asgId, formData);
      clearFile("resubmit");
      navigate(`/courses/${courseId}/assignments/${asgId}/review`);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowUpgradePrompt(true);
      } else {
        setSubmitError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to resubmit assignment.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function renderUploadZone({ mode = "submit", compact = false } = {}) {
    const activeRef = mode === "resubmit" ? resubmitInputRef : fileInputRef;
    const activeFile = mode === "resubmit" ? resubmitFile : pickedFile;
    const activeDragOver = mode === "resubmit" ? resubmitDragOver : dragOver;
    const setActiveDragOver =
      mode === "resubmit" ? setResubmitDragOver : setDragOver;

    return (
      <>
        <div
          className={`upload-zone${compact ? " upload-zone-compact" : ""}${
            activeDragOver ? " dragover" : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => activeRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activeRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setActiveDragOver(true);
          }}
          onDragLeave={() => setActiveDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setActiveDragOver(false);
            pickFile(e.dataTransfer.files?.[0], mode);
          }}
        >
          <span className="material-symbols-rounded icon">upload_file</span>
          <div className="upload-zone-title">Drag and drop your file here</div>
          <div className="upload-zone-sub">
            or browse to upload · PDF, DOCX up to 50 MB
          </div>
        </div>
        <input
          ref={activeRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => pickFile(e.target.files?.[0], mode)}
        />
        <div className="file-list">
          {activeFile && (
            <div className="file-item">
              <div className="file-item-icon">
                <span className="material-symbols-rounded icon">
                  description
                </span>
              </div>
              <div className="file-item-info">
                <div className="file-item-name">{activeFile.name}</div>
                <div className="file-item-size">
                  {formatBytes(activeFile.size)}
                </div>
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

  if (loading) {
    return (
      <div className="submit-layout">
        <div className="submit-main">
          <div className="asgn-card">Loading assignment...</div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="submit-layout">
        <div className="submit-main">
          <div className="asgn-card">{error || "Assignment not found."}</div>
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
        <Link
          to={`/courses/${courseId}?tab=assignments`}
          className="breadcrumb-link"
        >
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
              <span className={`asgn-meta-chip${isOverdue ? " urgent" : ""}`}>
                <span className="material-symbols-rounded icon">schedule</span>
                Due {dueLabel}
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">star</span>
                {assignment.maxScore} marks
              </span>
              <span className="asgn-meta-chip">
                <span className="material-symbols-rounded icon">school</span>
                Course {courseId}
              </span>
            </div>
            <div className="asgn-desc-heading">Description</div>
            <div className="asgn-desc">{assignment.description}</div>
          </div>

          {!submitted && (
            <>
              {renderUploadZone()}
              {submitError && <div className="form-error">{submitError}</div>}
              {showUpgradePrompt && <UpgradePrompt />}
              <button
                type="button"
                className="submit-btn"
                onClick={submitAssignment}
                disabled={!pickedFile || submitting}
              >
                <span className="material-symbols-rounded icon">send</span>
                {submitting ? "Submitting..." : "Submit assignment"}
              </button>
            </>
          )}

          {submitted && (
            <>
              <div className="submit-success submit-state-banner">
                <span className="material-symbols-rounded icon">
                  check_circle
                </span>
                <div>
                  <div className="submit-success-title">
                    Awaiting grade
                  </div>
                  <div className="submit-success-sub">
                    {submission.filename} · Submitted{" "}
                    {formatDateTime(submission.submittedAt)}
                  </div>
                </div>
              </div>

              {graded && (
                <div className="grade-card">
                  <div className="grade-card-header">
                    <div>
                      <div className="grade-score">
                        {submission.score}{" "}
                        <span>/ {assignment.maxScore}</span>
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
                  <div className="resubmit-heading">
                    Submit a new file to replace your current submission
                  </div>
                  <div className="resubmit-chip">
                    {resubmissionsUsed} resubmissions used of{" "}
                    {resubmissionsLimit}
                  </div>
                  {limitReached ? (
                    <UpgradePrompt />
                  ) : (
                    <>
                      {renderUploadZone({ mode: "resubmit", compact: true })}
                      {submitError && <div className="form-error">{submitError}</div>}
                      {showUpgradePrompt && <UpgradePrompt />}
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={resubmitAssignment}
                        disabled={!resubmitFile || submitting}
                      >
                        <span className="material-symbols-rounded icon">
                          send
                        </span>
                        {submitting ? "Submitting..." : "Resubmit assignment"}
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
              <span
                className={`info-row-val ${submitted ? "success" : "urgent"}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Due date</span>
              <span className={`info-row-val${isOverdue ? " urgent" : ""}`}>
                {dueLabel}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Marks</span>
              <span className="info-row-val">
                {graded
                  ? `${submission.score} / ${assignment.maxScore}`
                  : `${assignment.maxScore} points`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Resubmissions</span>
              <span className="info-row-val">
                {submitted
                  ? `${resubmissionsUsed} / ${resubmissionsLimit}`
                  : `0 / ${resubmissionsLimit}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
