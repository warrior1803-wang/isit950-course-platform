import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import api from "../api/axios";
import { assignmentApi } from "../api";

const MOCK_SUBMISSION = {
  id: 1,
  filename: "assignment1_submission.pdf",
  fileUrl: "/api/courses/1/assignments/1/submissions/1/file",
  submittedAt: "2026-05-01T10:30:00",
  status: "graded",
  score: 82,
  maxScore: 100,
  feedback: "Good work overall. Please elaborate more on section 3.",
};

// const MOCK_SUBMISSION = {
//   id: 1,
//   filename: 'assignment1_submission.pdf',
//   fileUrl: '/api/courses/1/assignments/1/submissions/1/file',
//   submittedAt: '2026-05-01T10:30:00',
//   status: 'submitted',
//   score: null,
//   maxScore: 100,
//   feedback: null,
// };

async function fetchSubmission() {
  return MOCK_SUBMISSION;

  // Swap the mock above for this when the backend endpoint is available.
  // const response = await assignmentApi.mySubmission(courseId, assignmentId);
  // return response.data;
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
        } else {
          setSubmission(null);
          setError("Failed to load submission. Please try again.");
        }
      } catch {
        if (!cancelled) {
          setSubmission(null);
          setError("Failed to load submission. Please try again.");
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
    } catch {
      setDownloadError("Failed to download file. Please try again.");
    }
  }

  if (loading) return <LoadingSpinner />;

  const assignmentTitle = assignment?.title || `Assignment ${assignmentId}`;
  const isGraded = submission?.status === "graded";

  if (error) {
    return (
      <div>
        <p className="course-list-empty">
          Failed to load submission. Please try again.
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
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 16 }}
              >
                download
              </span>
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
          </div>

          <div style={{ marginTop: 12 }}>
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
