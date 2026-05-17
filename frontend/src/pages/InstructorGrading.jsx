import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";
import ErrorState from "../components/shared/ErrorState";
import SkeletonCard from "../components/shared/SkeletonCard";
import api from "../api/axios";
import { buildApiUrl } from "../api/baseUrl";
import { getApiErrorState } from "../lib/apiState";

const styles = {
  instPageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 400,
    color: "var(--text-dark)",
    marginBottom: 4,
  },
  pageSub: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20 },
  analyticsCourseSelect: {
    height: 36,
    padding: "0 12px",
    borderRadius: 9,
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    color: "var(--text-dark)",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    outline: "none",
    cursor: "pointer",
  },
  gradingLayout: { display: "flex", gap: 24, alignItems: "flex-start" },
  gradingListCol: { width: 340, flexShrink: 0 },
  gradingDetailCol: { flex: 1, minWidth: 0 },
  gradingFilterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  gradingFilterBtn: {
    fontSize: 11,
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontFamily: "'Gowun Batang',serif",
    transition: "border-color .12s,background .12s,color .12s",
  },
  gradingFilterBtnActive: {
    background: "var(--btn)",
    color: "var(--light)",
    borderColor: "var(--btn)",
  },
  submissionList: { display: "flex", flexDirection: "column", gap: 8 },
  submissionItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 11,
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    cursor: "pointer",
    transition: "border-color .12s,background .12s",
  },
  submissionItemSel: {
    borderColor: "var(--accent)",
    background: "rgba(182,147,169,0.1)",
  },
  subAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    background: "rgba(182,147,169,0.18)",
    color: "#7a5a6a",
  },
  subInfo: { flex: 1, minWidth: 0 },
  subName: { fontSize: 13, color: "var(--text-dark)", marginBottom: 2 },
  subMeta: { fontSize: 11, color: "var(--text-muted)" },
  subBadge: {
    fontSize: 10,
    padding: "3px 9px",
    borderRadius: 20,
    flexShrink: 0,
  },
  subBadgePending: {
    background: "rgba(232,90,48,0.1)",
    color: "#d85a30",
    border: "1px solid rgba(232,90,48,0.2)",
  },
  subBadgeGraded: {
    background: "rgba(29,158,117,0.1)",
    color: "#1d9e75",
    border: "1px solid rgba(29,158,117,0.2)",
  },
  gradePanel: {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "22px 24px",
  },
  gradePanelTitle: { fontSize: 16, color: "var(--text-dark)", marginBottom: 4 },
  gradePanelMeta: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginBottom: 20,
  },
  gradeFileBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "#fff",
    marginBottom: 20,
  },
  gradeFileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(232,90,48,0.1)",
    color: "#d85a30",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  gradeFileInfo: { flex: 1 },
  gradeFileName: { fontSize: 13, color: "var(--text-dark)", marginBottom: 2 },
  gradeFileMeta: { fontSize: 11, color: "var(--text-muted)" },
  gradeDownloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "var(--accent)",
    cursor: "pointer",
    border: "1px solid var(--border)",
    borderRadius: 7,
    padding: "5px 12px",
    background: "transparent",
    fontFamily: "'Gowun Batang',serif",
    transition: "border-color .12s",
  },
  gradeScoreRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 14,
  },
  gradeTextarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "#fff",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    color: "var(--text-dark)",
    outline: "none",
    resize: "vertical",
    minHeight: 80,
    transition: "border .15s,box-shadow .15s",
  },
  gradeActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  gradeEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 260,
    color: "var(--text-muted)",
    gap: 10,
  },
  gradeEmptyText: { fontSize: 13 },
  autogradedBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 10,
    marginBottom: 16,
  },
  breakdownPts: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  breakdownPtsCorrect: { background: "#E1F5EE", color: "#085041" },
  breakdownPtsWrong: { background: "#FEF2F2", color: "#b91c1c" },
  fieldInput: {
    width: "100%",
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    color: "var(--text-dark)",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    outline: "none",
  },
  readOnlyInput: {
    width: "100%",
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "#f0e8e2",
    color: "var(--text-muted)",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    outline: "none",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 38,
    padding: "0 18px",
    borderRadius: 9,
    background: "var(--btn)",
    color: "var(--light)",
    border: "none",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    cursor: "pointer",
    flexShrink: 0,
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    padding: "0 16px",
    borderRadius: 9,
    background: "transparent",
    color: "var(--text-dark)",
    border: "1px solid var(--border)",
    fontSize: 13,
    fontFamily: "'Gowun Batang',serif",
    cursor: "pointer",
    flexShrink: 0,
  },
};

const avatarAccentStyles = [
  {},
  { background: "rgba(83,74,183,0.15)", color: "#534ab7" },
  { background: "rgba(24,95,165,0.15)", color: "#185fa5" },
  { background: "rgba(186,117,23,0.15)", color: "#ba7517" },
  { background: "rgba(29,158,117,0.15)", color: "#1d9e75" },
];

function Icon({ children, style }) {
  return (
    <span className="material-symbols-rounded icon" style={style}>
      {children}
    </span>
  );
}

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function SubmissionSkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function initialsFor(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function normalizeStatus(raw) {
  const status = String(raw?.status || "").toLowerCase();
  if (status === "graded" || status === "marked" || raw?.score != null)
    return "graded";
  return "pending";
}

function normalizeAssignment(raw) {
  return {
    id: raw.id ?? raw.assignmentId,
    title: raw.title || raw.name || "Untitled assignment",
    type:
      String(raw.type || raw.assignmentType || "FILE").toUpperCase() === "AUTO"
        ? "AUTO"
        : "FILE",
    maxScore: raw.maxScore ?? raw.totalMarks ?? 10,
  };
}

function normalizeSubmission(raw, assignment) {
  const studentName =
    raw.studentName ||
    raw.student?.name ||
    raw.user?.name ||
    raw.name ||
    "Unnamed student";
  const type =
    String(
      raw.type || raw.assignmentType || assignment?.type || "FILE",
    ).toUpperCase() === "AUTO"
      ? "AUTO"
      : "FILE";
  return {
    id: raw.id ?? raw.submissionId,
    studentName,
    initials: raw.initials || initialsFor(studentName),
    assignmentTitle: raw.assignmentTitle || assignment?.title || "Assignment",
    submittedAt: raw.submittedAt || raw.createdAt || raw.updatedAt,
    status: normalizeStatus(raw),
    type,
    score: raw.score ?? raw.grade ?? null,
    feedback: raw.feedback ?? "",
    maxScore: raw.maxScore ?? assignment?.maxScore ?? 10,
  };
}

function normalizeDetail(raw, selectedSub, assignment) {
  const type =
    String(
      raw.type || selectedSub?.type || assignment?.type || "FILE",
    ).toUpperCase() === "AUTO"
      ? "AUTO"
      : "FILE";
  const studentName =
    raw.studentName ||
    raw.student?.name ||
    selectedSub?.studentName ||
    "Unnamed student";
  return {
    ...raw,
    id: raw.id ?? raw.submissionId ?? selectedSub?.id,
    type,
    studentName,
    submittedAt: raw.submittedAt || selectedSub?.submittedAt,
    assignmentTitle:
      raw.assignmentTitle ||
      selectedSub?.assignmentTitle ||
      assignment?.title ||
      "Assignment",
    score: raw.score ?? raw.grade ?? selectedSub?.score ?? null,
    feedback: raw.feedback ?? "",
    maxScore:
      raw.maxScore ?? selectedSub?.maxScore ?? assignment?.maxScore ?? 10,
    fileName:
      raw.fileName || raw.filename || raw.file?.name || "Submission.pdf",
    fileSize: raw.fileSize || raw.file?.sizeLabel || "PDF",
    breakdown: raw.breakdown || raw.questionBreakdown || raw.answers || [],
  };
}

function formatDate(value, options) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", options)
    .format(date)
    .replace(/\s(am|pm)$/i, (match) => match.trim().toLowerCase());
}

function formatListDate(value) {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPanelDate(value) {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateOnly(value) {
  return formatDate(value, { day: "numeric", month: "short", year: "numeric" });
}

export default function InstructorGrading() {
  const {
    courseId: routeCourseId,
    id: routeId,
    asgId: routeAsgId,
    assignmentId: routeAssignmentId,
  } = useParams();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAsgId, setSelectedAsgId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subDetail, setSubDetail] = useState(null);
  const [filter, setFilter] = useState("all");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [error, setError] = useState(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const activeCourseId = routeCourseId || routeId || selectedCourseId;
  const activeAsgId = routeAsgId || routeAssignmentId || selectedAsgId;

  const selectedCourse = courses.find(
    (course) => String(course.id) === String(selectedCourseId),
  );
  const selectedAssignment = assignments.find(
    (assignment) => String(assignment.id) === String(selectedAsgId),
  );

  const filtered = useMemo(() => submissions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  }), [filter, submissions]);

  const counts = useMemo(
    () => ({
      all: submissions.length,
      pending: submissions.filter((item) => item.status === "pending").length,
      graded: submissions.filter((item) => item.status === "graded").length,
    }),
    [submissions],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      setError(null);
      try {
        const response = await api.get("/courses");
        if (!isMounted) return;
        const nextCourses = response.data?.data ?? [];
        setCourses(nextCourses);
        setSelectedCourseId((current) => current ?? nextCourses[0]?.id ?? null);
        if (nextCourses.length === 0) {
          setAssignments([]);
          setSubmissions([]);
          setSelectedAsgId(null);
          setSelectedSub(null);
          setSubDetail(null);
          setSubmissionsLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setCourses([]);
        setAssignments([]);
        setSubmissions([]);
        setSelectedCourseId(null);
        setSelectedAsgId(null);
        setSelectedSub(null);
        setSubDetail(null);
        setError(getApiErrorState(err));
        setSubmissionsLoading(false);
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      setSubmissions([]);
      setSelectedAsgId(null);
      setSelectedSub(null);
      setSubDetail(null);
      setSubmissionsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadAssignments() {
      setError(null);
      setSubmissionsLoading(true);
      try {
        const response = await api.get(
          `/courses/${selectedCourseId}/assignments`,
        );
        if (!isMounted) return;
        const nextAssignments = (response.data?.data ?? []).map(
          normalizeAssignment,
        );
        setAssignments(nextAssignments);
        setSelectedAsgId(nextAssignments[0]?.id ?? null);
        if (nextAssignments.length === 0) {
          setSubmissions([]);
          setSelectedSub(null);
          setSubDetail(null);
          setSubmissionsLoading(false);
          return;
        }
      } catch (err) {
        if (!isMounted) return;
        setAssignments([]);
        setSelectedAsgId(null);
        setSubmissions([]);
        setSelectedSub(null);
        setSubDetail(null);
        setError(getApiErrorState(err));
        setSubmissionsLoading(false);
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId || !selectedAsgId) {
      setSubmissions([]);
      setSelectedSub(null);
      setSubDetail(null);
      setSubmissionsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSubmissions() {
      setError(null);
      setSubmissionsLoading(true);
      try {
        const response = await api.get(
          `/courses/${selectedCourseId}/assignments/${selectedAsgId}/submissions`,
        );
        if (!isMounted) return;
        const nextSubmissions = response.data.map((item) =>
          normalizeSubmission(item, selectedAssignment),
        );
        setSubmissions(nextSubmissions);
        setSelectedSub(nextSubmissions[0] ?? null);
        setSubDetail(null);
      } catch (err) {
        if (!isMounted) return;
        setSubmissions([]);
        setSelectedSub(null);
        setSubDetail(null);
        setError(getApiErrorState(err));
      } finally {
        if (isMounted) setSubmissionsLoading(false);
      }
    }

    loadSubmissions();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, selectedAsgId, selectedAssignment]);

  useEffect(() => {
    if (!selectedSub || !selectedCourseId || !selectedAsgId) {
      setSubDetail(null);
      return;
    }

    let isMounted = true;

    async function loadDetail() {
      setError(null);
      try {
        const response = await api.get(
          `/courses/${selectedCourseId}/assignments/${selectedAsgId}/submissions/${selectedSub.id}`,
        );
        if (!isMounted) return;
        const detail = normalizeDetail(
          response.data,
          selectedSub,
          selectedAssignment,
        );
        setSubDetail(detail);
        setScore(detail.score ?? "");
        setFeedback(detail.feedback ?? "");
        setOverrideReason(detail.overrideReason ?? "");
        setSaveMessage("");
        setSaveError("");
      } catch (err) {
        if (!isMounted) return;
        setSubDetail(null);
        setError(getApiErrorState(err));
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [
    selectedSub,
    selectedCourseId,
    selectedAsgId,
    selectedAssignment,
  ]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedSub(null);
      return;
    }
    if (
      selectedSub &&
      filtered.some((item) => String(item.id) === String(selectedSub.id))
    )
      return;
    setSelectedSub(filtered[0]);
  }, [filter, filtered, selectedSub]);

  const handleDownload = async () => {
    if (
      !selectedCourseId ||
      !selectedAsgId ||
      !selectedSub ||
      !subDetail?.fileName
    )
      return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        buildApiUrl(`/courses/${selectedCourseId}/assignments/${selectedAsgId}/submissions/${selectedSub.id}/file`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const downloadError = new Error(data.message || "Download failed");
        downloadError.response = { status: res.status, data };
        throw downloadError;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = subDetail.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorState(err));
    } finally {
      setDownloading(false);
    }
  };

  function handleClear() {
    setScore("");
    setFeedback("");
    setSaveMessage("");
    setSaveError("");
  }

  function getApiErrorMessage(error) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Could not save the grade. Please try again."
    );
  }

  async function handleSaveGrade({ auto = false } = {}) {
    if (!activeCourseId || !activeAsgId || !selectedSub?.id) return;

    const nextScore = Number(score);
    if (score === "" || Number.isNaN(nextScore)) {
      setSaveMessage("");
      setSaveError("Enter a valid score before saving.");
      return;
    }

    setSavingGrade(true);
    setSaveMessage("");
    setSaveError("");

    const body = auto
      ? { overriddenScore: nextScore, overrideReason }
      : { score: nextScore, feedback };

    try {
      const response = await api.put(
        `/courses/${activeCourseId}/assignments/${activeAsgId}/submissions/${selectedSub.id}/grade`,
        body,
      );
      const updatedDetail = normalizeDetail(
        response.data,
        selectedSub,
        selectedAssignment,
      );
      const updatedSubmission = normalizeSubmission(
        response.data,
        selectedAssignment,
      );
      const nextScoreValue =
        updatedDetail.score ?? updatedDetail.overriddenScore ?? nextScore;
      const nextFeedback = updatedDetail.feedback ?? feedback;

      setSubmissions((current) =>
        current.map((item) =>
          String(item.id) === String(selectedSub.id)
            ? {
                ...item,
                ...updatedSubmission,
                status: "graded",
                score: nextScoreValue,
                feedback: nextFeedback,
              }
            : item,
        ),
      );
      setSelectedSub((current) =>
        current && String(current.id) === String(selectedSub.id)
          ? {
              ...current,
              ...updatedSubmission,
              status: "graded",
              score: nextScoreValue,
              feedback: nextFeedback,
            }
          : current,
      );
      setSubDetail({
        ...updatedDetail,
        status: "graded",
        score: nextScoreValue,
        feedback: nextFeedback,
      });
      setFeedback(nextFeedback);
      setScore(nextScoreValue ?? "");
      setOverrideReason(updatedDetail.overrideReason ?? overrideReason);
      if (auto) setOverrideOpen(false);
      setSaveMessage(auto ? "Override saved ✓" : "Grade saved ✓");
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSavingGrade(false);
    }
  }

  const manualSubmissions = filtered.filter((item) => item.type !== "AUTO");
  const autoSubmissions = filtered.filter((item) => item.type === "AUTO");
  const isAuto = subDetail?.type === "AUTO";
  const detailTitle = subDetail
    ? `${subDetail.assignmentTitle || selectedSub?.assignmentTitle || selectedAssignment?.title || "Assignment"} — ${subDetail.studentName}`
    : "Select a submission";
  const detailMeta = subDetail
    ? `Submitted ${formatPanelDate(subDetail.submittedAt)} · ${selectedCourse?.code || "ISIT950"} · ${isAuto ? "Auto-graded quiz" : "Group submission"}`
    : "Choose a student submission from the list";

  return (
    <>
      <div className="inst-page-header" style={styles.instPageHeader}>
        <div>
          <div className="page-title" style={styles.pageTitle}>
            Grading
          </div>
          <div className="page-sub" style={styles.pageSub}>
            Review submissions and provide feedback
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="analytics-course-select"
            style={styles.analyticsCourseSelect}
            value={selectedCourseId ?? ""}
            onChange={(event) => {
              setSelectedCourseId(event.target.value || null);
              setSelectedAsgId(null);
              setSelectedSub(null);
              setSubDetail(null);
              setSaveMessage("");
              setSaveError("");
            }}
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code ? `${course.code} — ${course.name}` : course.name}
              </option>
            ))}
          </select>
          <select
            className="analytics-course-select"
            style={styles.analyticsCourseSelect}
            value={selectedAsgId ?? ""}
            onChange={(event) => {
              setSelectedAsgId(event.target.value || null);
              setSelectedSub(null);
              setSubDetail(null);
              setSaveMessage("");
              setSaveError("");
            }}
          >
            <option value="">All assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          {error.kind === "upgrade" ? (
            <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
              This feature requires a membership.{" "}
              <a href="/membership" className="underline">Upgrade</a>
            </div>
          ) : (
            <ErrorState
              message={error.message}
              onRetry={error.kind === "retryable" ? () => setReloadKey((value) => value + 1) : null}
            />
          )}
        </div>
      )}

      <div className="grading-layout" style={styles.gradingLayout}>
        <div className="grading-list-col" style={styles.gradingListCol}>
          <div className="grading-filter-row" style={styles.gradingFilterRow}>
            {[
              ["all", `All (${counts.all})`],
              ["pending", `Pending (${counts.pending})`],
              ["graded", `Graded (${counts.graded})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`grading-filter-btn${filter === key ? " active" : ""}`}
                style={{
                  ...styles.gradingFilterBtn,
                  ...(filter === key ? styles.gradingFilterBtnActive : {}),
                }}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="submission-list" style={styles.submissionList}>
            {submissionsLoading ? (
              <SubmissionSkeletonList />
            ) : filtered.length === 0 ? (
              <EmptyState icon="grading" title="No submissions to review" />
            ) : manualSubmissions.map((submission, index) => (
              <SubmissionItem
                key={submission.id}
                selected={selectedSub?.id === submission.id}
                submission={submission}
                avatarStyle={
                  avatarAccentStyles[index % avatarAccentStyles.length]
                }
                onClick={() => setSelectedSub(submission)}
              />
            ))}

            {!submissionsLoading && autoSubmissions.length > 0 && (
              <div
                style={{
                  padding: "8px 14px",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "rgba(83,74,183,0.04)",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon style={{ fontSize: 14, color: "#534ab7" }}>
                  auto_fix_high
                </Icon>{" "}
                Week 5 Scrum Quiz — Auto-graded
              </div>
            )}

            {!submissionsLoading && autoSubmissions.map((submission, index) => (
              <SubmissionItem
                key={submission.id}
                selected={selectedSub?.id === submission.id}
                submission={submission}
                avatarStyle={
                  avatarAccentStyles[
                    (manualSubmissions.length + index) %
                      avatarAccentStyles.length
                  ]
                }
                onClick={() => setSelectedSub(submission)}
              />
            ))}
          </div>
        </div>

        <div className="grading-detail-col" style={styles.gradingDetailCol}>
          <div className="grade-panel" style={styles.gradePanel}>
            <div className="grade-panel-title" style={styles.gradePanelTitle}>
              {detailTitle}
            </div>
            <div className="grade-panel-meta" style={styles.gradePanelMeta}>
              {detailMeta}
            </div>

            {!subDetail ? (
              <div className="grade-empty" style={styles.gradeEmpty}>
                <Icon style={{ fontSize: 40, opacity: 0.4 }}>grading</Icon>
                <div className="grade-empty-text" style={styles.gradeEmptyText}>
                  Select a submission to review
                </div>
              </div>
            ) : isAuto ? (
              <AutoGradePanel
                detail={subDetail}
                overrideOpen={overrideOpen}
                setOverrideOpen={setOverrideOpen}
                score={score}
                setScore={setScore}
                overrideReason={overrideReason}
                setOverrideReason={setOverrideReason}
                savingGrade={savingGrade}
                saveMessage={saveMessage}
                saveError={saveError}
                onSubmit={() => handleSaveGrade({ auto: true })}
              />
            ) : (
              <div id="manual-grade-area">
                <div className="grade-file-box" style={styles.gradeFileBox}>
                  <div className="grade-file-icon" style={styles.gradeFileIcon}>
                    <Icon>picture_as_pdf</Icon>
                  </div>
                  <div className="grade-file-info" style={styles.gradeFileInfo}>
                    <div
                      className="grade-file-name"
                      style={styles.gradeFileName}
                    >
                      {subDetail.fileName}
                    </div>
                    <div
                      className="grade-file-meta"
                      style={styles.gradeFileMeta}
                    >
                      PDF · {subDetail.fileSize}
                    </div>
                  </div>
                  <button
                    className="grade-download-btn"
                    style={styles.gradeDownloadBtn}
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? <ButtonSpinner /> : <Icon style={{ fontSize: 16 }}>download</Icon>} Download
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-dark)",
                    marginBottom: 12,
                  }}
                >
                  Score &amp; Feedback
                </div>
                <div className="grade-score-row" style={styles.gradeScoreRow}>
                  <div className="field">
                    <label>Score</label>
                    <input
                      type="number"
                      placeholder="0–10"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                      style={styles.fieldInput}
                    />
                  </div>
                  <div className="field">
                    <label>Max score</label>
                    <input
                      type="text"
                      value={subDetail.maxScore ?? 10}
                      readOnly
                      style={styles.readOnlyInput}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Feedback</label>
                  <textarea
                    className="grade-textarea"
                    rows="5"
                    placeholder="Write feedback for the student…"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    style={styles.gradeTextarea}
                  />
                </div>
                <div className="grade-actions" style={styles.gradeActions}>
                  {(saveMessage || saveError) && (
                    <div
                      style={{
                        marginRight: "auto",
                        alignSelf: "center",
                        fontSize: 12,
                        color: saveError ? "#b91c1c" : "#15803d",
                      }}
                    >
                      {saveError || saveMessage}
                    </div>
                  )}
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={handleClear}
                    style={styles.btnOutline}
                  >
                    Clear
                  </button>
                  <button
                    className="btn-primary"
                    disabled={savingGrade}
                    type="button"
                    onClick={() => handleSaveGrade()}
                    style={{
                      ...styles.btnPrimary,
                      ...(savingGrade ? { opacity: 0.7, cursor: "wait" } : {}),
                    }}
                  >
                {savingGrade ? <ButtonSpinner /> : <Icon>check_circle</Icon>}{" "}
                {savingGrade ? "Saving..." : "Submit grade"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SubmissionItem({ selected, submission, avatarStyle, onClick }) {
  const isGraded = submission.status === "graded";
  const badgeText =
    submission.type === "AUTO" && submission.score != null
      ? `${submission.score} / ${submission.maxScore ?? 10}`
      : isGraded
        ? "Graded"
        : "Pending";

  return (
    <div
      className={`submission-item${selected ? " sel" : ""}`}
      style={{
        ...styles.submissionItem,
        ...(selected ? styles.submissionItemSel : {}),
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
    >
      <div
        className="sub-avatar"
        style={{ ...styles.subAvatar, ...avatarStyle }}
      >
        {submission.initials}
      </div>
      <div className="sub-info" style={styles.subInfo}>
        <div className="sub-name" style={styles.subName}>
          {submission.studentName}
        </div>
        <div className="sub-meta" style={styles.subMeta}>
          {submission.assignmentTitle}{" "}
          {submission.type === "AUTO" ? "· Auto-graded" : "·"}{" "}
          {formatListDate(submission.submittedAt)}
        </div>
      </div>
      <span
        className={`sub-badge ${isGraded ? "graded" : "pending"}`}
        style={{
          ...styles.subBadge,
          ...(isGraded ? styles.subBadgeGraded : styles.subBadgePending),
        }}
      >
        {badgeText}
      </span>
    </div>
  );
}

function AutoGradePanel({
  detail,
  overrideOpen,
  setOverrideOpen,
  score,
  setScore,
  overrideReason,
  setOverrideReason,
  savingGrade,
  saveMessage,
  saveError,
  onSubmit,
}) {
  const breakdown = detail.breakdown || [];

  return (
    <div id="auto-grade-panel">
      <div className="autograded-banner" style={styles.autogradedBanner}>
        <Icon style={{ color: "#16a34a" }}>auto_fix_high</Icon>
        <div>
          <div style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
            Auto-graded — no action needed
          </div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>
            Score calculated from {breakdown.length} questions · Submitted{" "}
            {formatDateOnly(detail.submittedAt)}
          </div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 22,
            color: "#15803d",
            fontWeight: 500,
          }}
        >
          {detail.score} / {detail.maxScore}
        </span>
      </div>

      <div
        style={{ fontSize: 13, color: "var(--text-dark)", marginBottom: 10 }}
      >
        Question breakdown
      </div>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 130px 52px",
            padding: "8px 14px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          <span>Question</span>
          <span>Student&apos;s answer</span>
          <span>Correct answer</span>
          <span style={{ textAlign: "center" }}>Pts</span>
        </div>
        {breakdown.map((row, index) => (
          <div
            key={`${row.question}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px 130px 52px",
              alignItems: "center",
              padding: "10px 14px",
              borderBottom:
                index === breakdown.length - 1
                  ? "none"
                  : "1px solid rgba(221,208,212,0.4)",
              fontSize: 12,
              ...(row.correct ? {} : { background: "rgba(254,242,242,0.5)" }),
            }}
          >
            <span style={{ color: "var(--text-dark)" }}>{row.question}</span>
            <span
              style={{
                color: row.correct ? "#15803d" : "#dc2626",
                textDecoration: row.correct ? "none" : "line-through",
              }}
            >
              {row.studentAnswer}
            </span>
            <span style={{ color: "#15803d", fontWeight: 500 }}>
              {row.correctAnswer}
            </span>
            <span
              className={`breakdown-pts ${row.correct ? "correct" : "wrong"}`}
              style={{
                ...styles.breakdownPts,
                ...(row.correct
                  ? styles.breakdownPtsCorrect
                  : styles.breakdownPtsWrong),
                margin: "0 auto",
              }}
            >
              {row.pts} / {row.maxPts}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => setOverrideOpen((current) => !current)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ")
              setOverrideOpen((current) => !current);
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            ⚙ Override auto-grade{" "}
            <span style={{ fontSize: 10 }}>(optional)</span>
          </div>
          <Icon style={{ fontSize: 16, color: "var(--text-muted)" }}>
            {overrideOpen ? "expand_less" : "expand_more"}
          </Icon>
        </div>
        <div style={{ display: overrideOpen ? "block" : "none", padding: 14 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 12,
            }}
          >
            Use this if the auto-grade needs manual correction. This will
            replace the auto-calculated score.
          </div>
          <div
            className="grade-score-row"
            style={{ ...styles.gradeScoreRow, marginBottom: 12 }}
          >
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Override score</label>
              <input
                type="number"
                placeholder="0–10"
                min="0"
                max="10"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                style={styles.fieldInput}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Max score</label>
              <input
                type="text"
                value={detail.maxScore ?? 10}
                readOnly
                style={styles.readOnlyInput}
              />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>
              Override reason{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <textarea
              className="grade-textarea"
              rows="3"
              placeholder="e.g. Student used an acceptable alternative answer for Q3…"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              style={styles.gradeTextarea}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {(saveMessage || saveError) && (
              <div
                style={{
                  marginRight: "auto",
                  alignSelf: "center",
                  fontSize: 12,
                  color: saveError ? "#b91c1c" : "#15803d",
                }}
              >
                {saveError || saveMessage}
              </div>
            )}
            <button
              className="btn-outline"
              type="button"
              onClick={() => setOverrideOpen(false)}
              style={styles.btnOutline}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={savingGrade}
              type="button"
              onClick={onSubmit}
              style={{
                ...styles.btnPrimary,
                ...(savingGrade ? { opacity: 0.7, cursor: "wait" } : {}),
              }}
            >
              {savingGrade ? <ButtonSpinner /> : <Icon>check_circle</Icon>}{" "}
              {savingGrade ? "Saving..." : "Submit override"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Icon.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
};

Icon.defaultProps = {
  style: undefined,
};

SubmissionItem.propTypes = {
  selected: PropTypes.bool.isRequired,
  submission: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    studentName: PropTypes.string.isRequired,
    initials: PropTypes.string.isRequired,
    assignmentTitle: PropTypes.string.isRequired,
    submittedAt: PropTypes.string,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  avatarStyle: PropTypes.object,
  onClick: PropTypes.func.isRequired,
};

SubmissionItem.defaultProps = {
  avatarStyle: {},
};

AutoGradePanel.propTypes = {
  detail: PropTypes.shape({
    type: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    submittedAt: PropTypes.string,
    breakdown: PropTypes.arrayOf(
      PropTypes.shape({
        question: PropTypes.string.isRequired,
        studentAnswer: PropTypes.string.isRequired,
        correctAnswer: PropTypes.string.isRequired,
        pts: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        maxPts: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        correct: PropTypes.bool.isRequired,
      }),
    ),
  }).isRequired,
  overrideOpen: PropTypes.bool.isRequired,
  setOverrideOpen: PropTypes.func.isRequired,
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setScore: PropTypes.func.isRequired,
  overrideReason: PropTypes.string.isRequired,
  setOverrideReason: PropTypes.func.isRequired,
  savingGrade: PropTypes.bool.isRequired,
  saveMessage: PropTypes.string.isRequired,
  saveError: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
