import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../components/shared/ErrorState";
import api from "../api/axios";
import { assignmentApi } from "../api";
import { getApiErrorState } from "../lib/apiState";

async function fetchSubmission(courseId, assignmentId) {
  const response = await api.get(
    `/courses/${courseId}/assignments/${assignmentId}/submissions/me`,
  );
  return response.data;
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function downloadUrlFor(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("/api/")) return fileUrl.slice(4);
  return fileUrl;
}

export default function AssignmentReview() {
  const { courseId: routeCourseId, id, asgId } = useParams();
  const courseId = routeCourseId || id;
  const assignmentId = asgId;

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      setLoading(true);
      setError("");
      setDownloadError("");

      try {
        const [assignmentResult, submissionResult] = await Promise.allSettled([
          assignmentApi.get(courseId, assignmentId),
          fetchSubmission(courseId, assignmentId),
        ]);

        if (cancelled) return;

        if (assignmentResult.status === "fulfilled") {
          setAssignment(
            assignmentResult.value.data?.data ?? assignmentResult.value.data,
          );
        } else {
          setAssignment(null);
        }

        if (submissionResult.status === "fulfilled") {
          setSubmission(submissionResult.value);
        } else if (submissionResult.reason?.response?.status === 404) {
          setSubmission(null);
        } else {
          setSubmission(null);
          setError(getApiErrorState(submissionResult.reason).message);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setSubmission(null);
          } else {
            setSubmission(null);
            setError(getApiErrorState(err).message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReview();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, courseId]);

  async function handleDownload() {
    if (!submission?.fileUrl) return;

    setDownloadError("");
    setDownloading(true);

    try {
      const response = await api.get(downloadUrlFor(submission.fileUrl), {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const blobUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = submission.filename || "submission";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError(getApiErrorState(err).message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
      </div>
    );
  }

  const assignmentTitle = assignment?.title || `Assignment ${assignmentId}`;
  const isGraded = submission?.status === "graded";
  const isOverdue = Boolean(assignment?.dueDate && new Date(assignment.dueDate) < new Date());
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
  const canResubmit =
    assignment?.type !== "AUTO" &&
    !isOverdue &&
    (unlimitedResubmissions || resubmissionsRemaining > 0);

  if (error) {
    return (
      <div>
        <ErrorState message={error} />
        <Link
          to={`/courses/${courseId}`}
          className="review-download-btn"
          style={{
            display: "inline-flex",
            textDecoration: "none",
            padding: "10px 14px",
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          Back
        </Link>
      </div>
    );
  }

  if (!submission) {
    return (
      <div>
        <h1 className="page-title">{assignmentTitle}</h1>
        <p className="course-list-empty">
          You have not submitted this assignment yet.
        </p>
        <Link
          to={`/courses/${courseId}`}
          className="review-download-btn"
          style={{
            display: "inline-flex",
            textDecoration: "none",
            padding: "10px 14px",
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 20,
        }}
      >
        <Link to="/courses" style={{ color: "var(--accent)" }}>
          My Courses
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <Link
          to={`/courses/${courseId}/assignments`}
          style={{ color: "var(--accent)" }}
        >
          Assignments
        </Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
          chevron_right
        </span>
        <span>{assignmentTitle}</span>
      </div>

      <div className="review-layout">
        <div className="review-main">
          <div className="asgn-card">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div className="asgn-title">{assignmentTitle}</div>
                <div className="asgn-meta-row">
                  <span className="asgn-meta-chip">
                    <span className="material-symbols-rounded icon">
                      schedule
                    </span>
                    Submitted {formatDateTime(submission.submittedAt)}
                  </span>
                  <span className="asgn-meta-chip">
                    <span className="material-symbols-rounded icon">star</span>
                    {submission.maxScore} marks
                  </span>
                </div>
              </div>
              <span
                className="discussion-role-badge"
                style={{
                  background: isGraded ? "rgba(29,158,117,0.1)" : "#fef9c3",
                  borderColor: isGraded ? "rgba(29,158,117,0.2)" : "#fde047",
                  color: isGraded ? "#1d9e75" : "#854d0e",
                  flexShrink: 0,
                }}
              >
                {isGraded ? "Graded" : "Pending"}
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              color: "var(--text-dark)",
              marginBottom: 10,
            }}
          >
            Your Submission
          </div>
          <div className="review-file-box">
            <div
              className="review-file-icon"
              style={{ background: "rgba(232,90,48,0.1)", color: "#d85a30" }}
            >
              <span className="material-symbols-rounded">description</span>
            </div>
            <div className="review-file-info">
              <div className="review-file-name">{submission.filename}</div>
              <div className="review-file-meta">
                Submitted {formatDateTime(submission.submittedAt)}
              </div>
            </div>
            <button
              type="button"
              className="review-download-btn"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 16 }}
                >
                  download
                </span>
              )}
              Download
            </button>
          </div>
          {downloadError && (
            <p className="course-list-empty" style={{ padding: "10px 0" }}>
              {downloadError}
            </p>
          )}

          {isGraded ? (
            <>
              <div className="review-status-card">
                <div className="review-feedback-label">Score</div>
                <div className="review-score-display">
                  <div className="review-score-num">{submission.score}</div>
                  <div className="review-score-max">
                    / {submission.maxScore}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-dark)",
                  marginBottom: 10,
                }}
              >
                Feedback
              </div>
              <div className="review-feedback-box">
                <div className="review-feedback-body">
                  {submission.feedback || "No feedback provided."}
                </div>
              </div>
            </>
          ) : (
            <div
              className="review-feedback-box"
              style={{
                textAlign: "center",
                padding: 32,
                color: "var(--text-muted)",
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: 36,
                  display: "block",
                  marginBottom: 10,
                  color: "#d97706",
                }}
              >
                hourglass_empty
              </span>
              <div style={{ fontSize: 14, color: "var(--text-dark)" }}>
                Awaiting Grading
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Your instructor has not marked this submission yet.
              </div>
            </div>
          )}
        </div>

        <div className="review-sidebar">
          <div className="info-card">
            <div className="info-card-title">Submission info</div>
            <div className="info-row">
              <span className="info-row-label">Status</span>
              <span
                className="info-row-val"
                style={{ color: isGraded ? "#1d9e75" : "#854d0e" }}
              >
                {isGraded ? "Graded" : "Awaiting grading"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Submitted</span>
              <span className="info-row-val">
                {formatDateTime(submission.submittedAt)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Score</span>
              <span className="info-row-val">
                {isGraded
                  ? `${submission.score} / ${submission.maxScore}`
                  : "Not yet graded"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Resubmissions</span>
              <span className="info-row-val">
                {unlimitedResubmissions
                  ? `${resubmissionsUsed} / ∞`
                  : `${resubmissionsUsed} / ${resubmissionsLimit}`}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {canResubmit && (
              <Link
                to={`/courses/${courseId}/assignments/${assignmentId}/submit`}
                className="review-download-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  textDecoration: "none",
                  padding: "10px 12px",
                  marginBottom: 10,
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 16 }}
                >
                  refresh
                </span>
                Resubmit assignment
              </Link>
            )}
            <Link
              to={`/courses/${courseId}`}
              className="review-download-btn"
              style={{
                width: "100%",
                justifyContent: "center",
                textDecoration: "none",
                padding: "10px 12px",
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 16 }}
              >
                arrow_back
              </span>
              Back to course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
