import { useEffect, useMemo, useState } from 'react';
import { assignmentApi, courseApi } from '../../api';

function getApiData(response) {
  return response?.data?.data ?? response?.data ?? [];
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatScore(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number(value).toFixed(1);
}

function formatRelativeDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getPillClass(level) {
  if (level === 'High') return 'progress-pill high';
  if (level === 'Medium') return 'progress-pill mid';
  return 'progress-pill low';
}

function getEngagementLevel(rate, avgScore, activityCount) {
  if (rate >= 0.8 || avgScore >= 8 || activityCount >= 6) return 'High';
  if (rate >= 0.4 || avgScore >= 6 || activityCount >= 2) return 'Medium';
  return 'Low';
}

function StatSkeleton({ color }) {
  return (
    <div className="analytics-stat">
      <div
        style={{
          width: 68,
          height: 34,
          borderRadius: 8,
          background: color,
          opacity: 0.25,
          marginBottom: 8,
        }}
      />
      <div style={{ width: 120, height: 12, borderRadius: 6, background: '#ede6e0' }} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="analytics-card">
      <div style={{ width: 180, height: 16, borderRadius: 6, background: '#e8dfd8', marginBottom: 16 }} />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="mini-bar-row">
          <div style={{ width: 120, height: 12, borderRadius: 6, background: '#ede6e0' }} />
          <div className="mini-bar-track" />
          <div style={{ width: 30, height: 12, borderRadius: 6, background: '#ede6e0' }} />
        </div>
      ))}
    </div>
  );
}

export default function InstructorAnalyticsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState({
    stats: {
      enrolled: 0,
      submissionRate: 0,
      averageScore: null,
      noActivity: 0,
    },
    assignmentBars: [],
    studentRows: [],
    scoreSummary: {
      average: null,
      lowest: null,
      median: null,
      highest: null,
      title: '',
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const response = await courseApi.list();
        if (cancelled) return;
        const nextCourses = getApiData(response);
        setCourses(nextCourses);
        setSelectedCourseId(current => current || String(nextCourses[0]?.id || ''));
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setAnalytics({
        stats: {
          enrolled: 0,
          submissionRate: 0,
          averageScore: null,
          noActivity: 0,
        },
        assignmentBars: [],
        studentRows: [],
        scoreSummary: {
          average: null,
          lowest: null,
          median: null,
          highest: null,
          title: '',
        },
      });
      setLoadingAnalytics(false);
      return;
    }

    let cancelled = false;

    async function loadAnalytics() {
      setLoadingAnalytics(true);

      try {
        const [progressRes, studentsRes, assignmentsRes] = await Promise.all([
          courseApi.progress(selectedCourseId).catch(() => ({ data: [] })),
          courseApi.students(selectedCourseId).catch(() => ({ data: { data: [] } })),
          assignmentApi.list(selectedCourseId).catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;

        const progressPayload = getApiData(progressRes);
        const progressRows = Array.isArray(progressPayload) ? progressPayload : [];
        const studentPayload = getApiData(studentsRes);
        const students = Array.isArray(studentPayload) && studentPayload.length > 0
          ? studentPayload
          : progressRows.map(item => ({
            id: item.student?.id,
            name: item.student?.name || 'Student',
            email: item.email ?? '',
          }));
        const assignments = Array.isArray(getApiData(assignmentsRes)) ? getApiData(assignmentsRes) : [];

        const submissionsByAssignment = await Promise.all(
          assignments.map(async assignment => ({
            assignment,
            submissions: await assignmentApi.listSubmissions(selectedCourseId, assignment.id)
              .then(response => (Array.isArray(response.data) ? response.data : []))
              .catch(() => []),
          })),
        );
        if (cancelled) return;

        const progressByStudent = new Map(
          progressRows.map(item => [
            String(item.student?.id ?? ''),
            {
              postsCount: toNumber(item.postsCount),
              repliesCount: toNumber(item.repliesCount),
              assignmentsSubmitted: toNumber(item.assignmentsSubmitted),
              assignmentsPending: toNumber(item.assignmentsPending),
              lastActive: item.lastActive ?? null,
            },
          ]),
        );

        const scoreValues = [];
        const scoredAssignments = [];
        const studentMap = new Map(
          students.map(student => [
            String(student.id),
            {
              id: student.id,
              name: student.name,
              email: student.email,
              postsCount: progressByStudent.get(String(student.id))?.postsCount ?? 0,
              repliesCount: progressByStudent.get(String(student.id))?.repliesCount ?? 0,
              assignmentsSubmitted: progressByStudent.get(String(student.id))?.assignmentsSubmitted ?? 0,
              assignmentsPending: progressByStudent.get(String(student.id))?.assignmentsPending ?? 0,
              submissionCount: 0,
              scoreSum: 0,
              scoreCount: 0,
              lastActive: progressByStudent.get(String(student.id))?.lastActive ?? null,
            },
          ]),
        );

        const assignmentBars = submissionsByAssignment.map(({ assignment, submissions }) => {
          const uniqueStudents = new Set();
          const normalizedScores = [];

          submissions.forEach(submission => {
            const studentId = String(submission.student?.id ?? '');
            if (studentId) {
              uniqueStudents.add(studentId);
            }

            const row = studentMap.get(studentId);
            if (row) {
              row.submissionCount += 1;
              row.assignmentsSubmitted = Math.max(
                row.assignmentsSubmitted,
                progressByStudent.get(studentId)?.assignmentsSubmitted ?? 0,
              );

              if (submission.score != null && assignment.maxScore) {
                const normalized = (Number(submission.score) / Number(assignment.maxScore)) * 10;
                row.scoreSum += normalized;
                row.scoreCount += 1;
                scoreValues.push(normalized);
                normalizedScores.push(normalized);
              }
            }
          });

          const submittedCount = uniqueStudents.size;
          const totalStudents = students.length;
          const completionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
          const average = normalizedScores.length > 0
            ? normalizedScores.reduce((sum, value) => sum + value, 0) / normalizedScores.length
            : null;

          if (average != null) {
            scoredAssignments.push({ title: assignment.title, average });
          }

          return {
            id: assignment.id,
            title: assignment.title,
            submittedCount,
            totalStudents,
            completionRate,
            average,
          };
        });

        const studentRows = Array.from(studentMap.values()).map(student => {
          const submitted = student.assignmentsSubmitted;
          const pending = student.assignmentsPending;
          const averageScore = student.scoreCount > 0
            ? student.scoreSum / student.scoreCount
            : null;
          const activityCount = student.postsCount + student.repliesCount + submitted;
          const rate = assignments.length > 0 ? submitted / assignments.length : 0;
          const engagement = getEngagementLevel(rate, averageScore ?? 0, activityCount);

          return {
            id: student.id,
            name: student.name,
            email: student.email,
            postsCount: student.postsCount,
            repliesCount: student.repliesCount,
            assignmentsSubmitted: submitted,
            assignmentsPending: pending,
            averageScore,
            lastActive: student.lastActive,
            engagement,
          };
        }).sort((a, b) => {
          if (b.assignmentsSubmitted !== a.assignmentsSubmitted) {
            return b.assignmentsSubmitted - a.assignmentsSubmitted;
          }
          return (b.averageScore ?? -1) - (a.averageScore ?? -1);
        });

        const submissionRate = assignmentBars.length > 0 && students.length > 0
          ? (assignmentBars.reduce((sum, item) => sum + item.submittedCount, 0) / (students.length * assignmentBars.length)) * 100
          : 0;
        const averageScore = scoreValues.length > 0
          ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length
          : null;
        const sortedScores = [...scoreValues].sort((a, b) => a - b);
        const median = sortedScores.length === 0
          ? null
          : sortedScores.length % 2 === 1
            ? sortedScores[(sortedScores.length - 1) / 2]
            : (sortedScores[(sortedScores.length / 2) - 1] + sortedScores[sortedScores.length / 2]) / 2;
        const noActivity = studentRows.filter(
          row =>
            row.assignmentsSubmitted === 0
            && row.postsCount === 0
            && row.repliesCount === 0,
        ).length;

        setAnalytics({
          stats: {
            enrolled: students.length,
            submissionRate,
            averageScore,
            noActivity,
          },
          assignmentBars,
          studentRows,
          scoreSummary: {
            average: averageScore,
            lowest: sortedScores[0] ?? null,
            median,
            highest: sortedScores[sortedScores.length - 1] ?? null,
            title: scoredAssignments.sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0]?.title ?? '',
          },
        });
      } finally {
        if (!cancelled) {
          setLoadingAnalytics(false);
        }
      }
    }

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return analytics.studentRows;
    return analytics.studentRows.filter(row =>
      row.name.toLowerCase().includes(keyword)
      || String(row.email || '').toLowerCase().includes(keyword),
    );
  }, [analytics.studentRows, search]);

  const discussionBars = useMemo(() => {
    const sorted = [...analytics.studentRows]
      .map(row => ({
        id: row.id,
        name: row.name,
        value: row.postsCount + row.repliesCount,
      }))
      .sort((a, b) => b.value - a.value);

    const head = sorted.slice(0, 7);
    const tail = sorted.slice(7);
    const max = head[0]?.value || 0;

    if (tail.length > 0) {
      head.push({
        id: 'others',
        name: `Others (${tail.length})`,
        value: tail.reduce((sum, item) => sum + item.value, 0),
      });
    }

    return {
      max: Math.max(max, head[head.length - 1]?.value || 0),
      rows: head,
    };
  }, [analytics.studentRows]);

  return (
    <>
      <div className="analytics-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Student Analytics</div>
          <div className="page-sub">Engagement and progress overview</div>
        </div>
        <select
          className="analytics-course-select"
          value={selectedCourseId}
          onChange={(event) => setSelectedCourseId(event.target.value)}
          disabled={loadingCourses || courses.length === 0}
        >
          {courses.length === 0 ? (
            <option value="">No courses available</option>
          ) : courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="analytics-stat-grid">
        {loadingAnalytics ? (
          <>
            <StatSkeleton color="#2e2028" />
            <StatSkeleton color="#1d9e75" />
            <StatSkeleton color="#534ab7" />
            <StatSkeleton color="#d85a30" />
          </>
        ) : (
          <>
            <div className="analytics-stat">
              <div className="analytics-stat-num">{analytics.stats.enrolled}</div>
              <div className="analytics-stat-label">Students enrolled</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-num" style={{ color: '#1d9e75' }}>
                {formatPercent(analytics.stats.submissionRate)}
              </div>
              <div className="analytics-stat-label">Assignment submission rate</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-num" style={{ color: '#534ab7' }}>
                {formatScore(analytics.stats.averageScore)}
              </div>
              <div className="analytics-stat-label">Average score</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-num" style={{ color: '#d85a30' }}>
                {analytics.stats.noActivity}
              </div>
              <div className="analytics-stat-label">Students with no activity</div>
            </div>
          </>
        )}
      </div>

      <div className="analytics-cols">
        {loadingAnalytics ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="analytics-card">
              <div className="analytics-card-title">Discussion activity (posts + replies)</div>
              {discussionBars.rows.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  No discussion activity available for this course yet.
                </div>
              ) : discussionBars.rows.map(item => (
                <div key={item.id} className="mini-bar-row">
                  <div className="mini-bar-label">{item.name}</div>
                  <div className="mini-bar-track">
                    <div
                      className="mini-bar-fill"
                      style={{
                        width: `${discussionBars.max > 0 ? (item.value / discussionBars.max) * 100 : 0}%`,
                        background: item.id === 'others' ? 'rgba(182, 147, 169, 0.45)' : undefined,
                      }}
                    />
                  </div>
                  <div className="mini-bar-val">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="analytics-card">
              <div className="analytics-card-title">Assignment submission rate</div>
              {analytics.assignmentBars.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  No assignment submission data available for this course yet.
                </div>
              ) : analytics.assignmentBars.slice(0, 2).map(item => (
                <div key={item.id} className="mini-bar-row">
                  <div className="mini-bar-label" style={{ width: 160 }}>{item.title}</div>
                  <div className="mini-bar-track">
                    <div
                      className="mini-bar-fill"
                      style={{ width: `${item.completionRate}%`, background: '#1d9e75' }}
                    />
                  </div>
                  <div className="mini-bar-val" style={{ color: item.submittedCount > 0 ? '#1d9e75' : undefined, width: 48 }}>
                    {item.submittedCount}/{item.totalStudents}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div className="analytics-card-title" style={{ marginBottom: 10 }}>
                  Average score (graded)
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 36, color: 'var(--text-dark)' }}>
                    {formatScore(analytics.scoreSummary.average)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    / 10{analytics.scoreSummary.title ? ` · ${analytics.scoreSummary.title}` : ''}
                  </div>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(182, 147, 169, 0.15)',
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${((analytics.scoreSummary.average ?? 0) / 10) * 100}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, var(--accent), #ceadb0)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Lowest: {formatScore(analytics.scoreSummary.lowest)}</span>
                  <span>Median: {formatScore(analytics.scoreSummary.median)}</span>
                  <span>Highest: {formatScore(analytics.scoreSummary.highest)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="analytics-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div className="analytics-card-title" style={{ marginBottom: 0 }}>
            Per-student progress
          </div>
          <div className="search-wrap" style={{ maxWidth: 220 }}>
            <span className="icon">search</span>
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loadingAnalytics ? (
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Posts</th>
                <th>Replies</th>
                <th>Submissions</th>
                <th>Avg score</th>
                <th>Last active</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td><div style={{ width: 140, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 20, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 20, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 64, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 36, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 56, height: 14, borderRadius: 6, background: '#ede6e0' }} /></td>
                  <td><div style={{ width: 44, height: 18, borderRadius: 20, background: '#ede6e0' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredRows.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {analytics.studentRows.length === 0
              ? 'No student progress data available for this course.'
              : 'No students match your search.'}
          </div>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Posts</th>
                <th>Replies</th>
                <th>Submissions</th>
                <th>Avg score</th>
                <th>Last active</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => {
                const totalAssignments = analytics.assignmentBars.length || 0;
                const rate = totalAssignments > 0 ? (row.assignmentsSubmitted / totalAssignments) * 100 : 0;
                return (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>{row.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.email}</div>
                    </td>
                    <td>{row.postsCount}</td>
                    <td>{row.repliesCount}</td>
                    <td>
                      <div className="sub-rate-bar">
                        <div className="sub-rate-track">
                          <div
                            className="sub-rate-fill"
                            style={{ width: `${rate}%`, background: rate > 0 ? '#1d9e75' : undefined }}
                          />
                        </div>
                        {row.assignmentsSubmitted}/{totalAssignments}
                      </div>
                    </td>
                    <td>{formatScore(row.averageScore)}</td>
                    <td style={{ color: row.engagement === 'Low' ? '#d85a30' : 'var(--text-muted)' }}>
                      {formatRelativeDate(row.lastActive)}
                    </td>
                    <td><span className={getPillClass(row.engagement)}>{row.engagement}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
