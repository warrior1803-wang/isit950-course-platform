import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../components/shared/ErrorState";
import { assignmentApi } from "../api";
import { getApiErrorState, isUpgradeRequired } from "../lib/apiState";

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

function getFileSizeLimitMb(assignment) {
  return assignment?.fileSizeLimitMb ?? 10;
}

function acceptFile(file, fileSizeLimitMb) {
  const maxBytes = fileSizeLimitMb * 1024 * 1024;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") return { accepted: false };
  if (file.size > maxBytes) {
    return {
      accepted: false,
      error: `File exceeds the ${fileSizeLimitMb}MB limit for this assignment`,
    };
  }
  return { accepted: true };
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
  const [dragOver, setDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
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
        setError(getApiErrorState(assignmentResult.reason).message);
        setLoading(false);
        return;
      }

      if (submissionResult.status === "fulfilled") {
        const nextSubmission = submissionResult.value.data;
        setSubmission(nextSubmission);
      } else if (submissionResult.reason?.response?.status === 404) {
        setSubmission(null);
      } else {
        setError(getApiErrorState(submissionResult.reason).message);
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
  const resubmissionsLimit = Object.prototype.hasOwnProperty.call(submission || {}, "resubmissionsLimit")
    ? submission.resubmissionsLimit
    : Object.prototype.hasOwnProperty.call(assignment || {}, "resubmissionsLimit")
      ? assignment.resubmissionsLimit
      : 0;
  const unlimitedResubmissions =
    submission?.unlimitedResubmissions === true ||
    assignment?.unlimitedResubmissions === true;
  const resubmissionsRemaining = unlimitedResubmissions
    ? null
    : Math.max(resubmissionsLimit - resubmissionsUsed, 0);
  const resubmissionLimitReached =
    submitted && !unlimitedResubmissions && resubmissionsRemaining === 0;
  const canSubmit =
    !submitted || (!isOverdue && !resubmissionLimitReached);

  function pickFile(file) {
    const fileSizeLimitMb = getFileSizeLimitMb(assignment);
    const result = file ? acceptFile(file, fileSizeLimitMb) : { accepted: false };
    if (!file || !result.accepted) {
      setPickedFile(null);
      setSubmitError(result.error || "");
      return;
    }
    setSubmitError("");
    setPickedFile(file);
  }

  function clearFile() {
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitAssignment() {
    if (!pickedFile || submitting || !canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    setShowUpgradePrompt(false);

    try {
      const formData = new FormData();
      formData.append("file", pickedFile);
      const response = await assignmentApi.submitFile(courseId, asgId, formData);
      const savedSubmission = response.data;
      setSubmission({
        ...savedSubmission,
        score: submission?.score ?? null,
        maxScore: submission?.maxScore ?? assignment?.maxScore ?? null,
        feedback: submission?.feedback ?? null,
      });
      clearFile();
      navigate(`/courses/${courseId}/assignments/${asgId}/review`, { replace: true });
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

  function renderUploadZone({ compact = false, disabled = false } = {}) {
    const uploadDisabled = disabled || submitting;

    return (
      <>
        <div
          className={`upload-zone${compact ? " upload-zone-compact" : ""}${
            dragOver ? " dragover" : ""
          }${
            uploadDisabled ? " disabled" : ""
          }`}
          role="button"
          aria-disabled={uploadDisabled}
          tabIndex={uploadDisabled ? -1 : 0}
          onClick={() => {
            if (!uploadDisabled) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (uploadDisabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            if (uploadDisabled) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploadDisabled) pickFile(e.dataTransfer.files?.[0]);
          }}
        >
          <span className="material-symbols-rounded icon">upload_file</span>
          <div className="upload-zone-title">Drag and drop your file here</div>
          <div className="upload-zone-sub">
            or browse to upload · PDF, DOCX up to 50 MB
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={uploadDisabled}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <div className="file-list">
          {pickedFile && (
            <div className="file-item">
              <div className="file-item-icon">
                <span className="material-symbols-rounded icon">
                  description
                </span>
              </div>
              <div className="file-item-info">
                <div className="file-item-name">{pickedFile.name}</div>
                <div className="file-item-size">
                  {formatBytes(pickedFile.size)}
                </div>
              </div>
              <button
                type="button"
                className="file-item-remove"
                aria-label="Remove file"
                disabled={uploadDisabled}
                onClick={clearFile}
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
          <ErrorState message={error || "Content not found"} />
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
                disabled={!pickedFile || submitting || !canSubmit}
              >
                <span className="material-symbols-rounded icon">send</span>
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
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
                    Already submitted
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

              <div className="resubmit-card">
                <div className="resubmit-heading">
                  {isOverdue
                    ? "Resubmissions closed"
                    : resubmissionLimitReached
                      ? "Resubmission limit reached (Free plan)"
                      : unlimitedResubmissions
                        ? "Unlimited resubmissions before the deadline"
                        : `${resubmissionsRemaining} resubmission${resubmissionsRemaining === 1 ? "" : "s"} remaining`}
                </div>
                <div className="resubmit-chip">
                  Upload a new file to replace your latest submission.
                </div>
                {resubmissionLimitReached && <UpgradePrompt />}
                {submitError && <div className="form-error">{submitError}</div>}
                {showUpgradePrompt && <UpgradePrompt />}
                {renderUploadZone({
                  compact: true,
                  disabled: isOverdue || resubmissionLimitReached,
                })}
                <button
                  type="button"
                  className="submit-btn"
                  onClick={submitAssignment}
                  disabled={!pickedFile || submitting || !canSubmit}
                >
                  <span className="material-symbols-rounded icon">
                    {isOverdue || resubmissionLimitReached ? "lock" : "refresh"}
                  </span>
                  {submitting ? "Submitting..." : "Resubmit assignment"}
                </button>
              </div>
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
                {unlimitedResubmissions
                  ? `${submitted ? resubmissionsUsed : 0} / ∞`
                  : submitted
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
