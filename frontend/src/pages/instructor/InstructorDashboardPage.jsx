import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentApi, authApi, courseApi } from '../../api';
import { useAuth } from '../../lib/auth';

const COURSE_THUMBS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=70',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&q=70',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=70',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&q=70',
];

function getApiData(response) {
  return response?.data?.data ?? response?.data ?? [];
}

function formatToday() {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

function formatDueDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function countPending(submissions) {
  return submissions.filter(submission => submission.score == null || submission.status === 'pending').length;
}

function StatCardSkeleton({ background }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background }} />
      <div style={{ width: 48, height: 28, borderRadius: 6, background: '#e8dfd8', marginBottom: 4 }} />
      <div style={{ width: 120, height: 14, borderRadius: 6, background: '#e8dfd8', marginBottom: 6 }} />
      <div style={{ width: 96, height: 11, borderRadius: 6, background: '#ede6e0' }} />
    </div>
  );
}

function CourseItemSkeleton() {
  return (
    <div className="inst-course-item" style={{ cursor: 'default' }}>
      <div className="inst-course-thumb" style={{ background: '#e8dfd8' }} />
      <div className="inst-course-info">
        <div style={{ width: 260, height: 18, borderRadius: 6, background: '#e8dfd8', marginBottom: 8 }} />
        <div style={{ width: 280, height: 12, borderRadius: 6, background: '#ede6e0' }} />
      </div>
      <div className="inst-course-right">
        <div style={{ width: 34, height: 16, borderRadius: 6, background: '#ede6e0' }} />
        <div style={{ width: 34, height: 16, borderRadius: 6, background: '#ede6e0' }} />
      </div>
    </div>
  );
}

function ActionItemSkeleton() {
  return (
    <div className="action-item" style={{ cursor: 'default' }}>
      <div className="action-icon" style={{ background: '#ede6e0' }} />
      <div className="action-body">
        <div style={{ width: 180, height: 16, borderRadius: 6, background: '#e8dfd8', marginBottom: 8 }} />
        <div style={{ width: 210, height: 11, borderRadius: 6, background: '#ede6e0' }} />
      </div>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [instructorName, setInstructorName] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [meRes, courseRes] = await Promise.all([
          authApi.me().catch(() => ({ data: { data: null } })),
          courseApi.list(),
        ]);
        if (cancelled) return;

        const currentUser = getApiData(meRes);
        setInstructorName(currentUser?.name || '');

        const nextCourses = getApiData(courseRes);
        setCourses(nextCourses);

        if (nextCourses.length === 0) {
          setPendingItems([]);
          return;
        }

        const assignmentsByCourse = await Promise.all(
          nextCourses.map(async course => ({
            course,
            assignments: getApiData(await assignmentApi.list(course.id)),
          })),
        );
        if (cancelled) return;

        const pendingAssignments = await Promise.all(
          assignmentsByCourse.flatMap(({ course, assignments }) =>
            assignments.map(async assignment => {
              const submissions = await assignmentApi.listSubmissions(course.id, assignment.id)
                .then(response => (Array.isArray(response.data) ? response.data : []))
                .catch(() => []);

              return {
                id: `${course.id}-${assignment.id}`,
                title: assignment.title,
                courseCode: course.code,
                pendingCount: countPending(submissions),
                dueDate: assignment.dueDate,
              };
            }),
          ),
        );
        if (cancelled) return;

        setPendingItems(
          pendingAssignments
            .filter(item => item.pendingCount > 0)
            .sort((a, b) => {
              if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
              return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
            })
            .slice(0, 6),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolmentCount ?? 0), 0);
    const totalPending = courses.reduce((sum, course) => sum + (course.pendingCount ?? 0), 0);
    const totalAssignments = courses.reduce((sum, course) => sum + (course.assignmentCount ?? 0), 0);

    return [
      {
        key: 'courses',
        icon: 'menu_book',
        iconColor: '#534ab7',
        iconBg: 'rgba(83, 74, 183, 0.1)',
        value: totalCourses,
        label: 'Active courses',
        sub: 'This semester',
        subStyle: undefined,
      },
      {
        key: 'students',
        icon: 'group',
        iconColor: '#7a5a6a',
        iconBg: 'rgba(182, 147, 169, 0.15)',
        value: totalStudents,
        label: 'Students enrolled',
        sub: 'Across all courses',
        subStyle: undefined,
      },
      {
        key: 'pending',
        icon: 'assignment_late',
        iconColor: '#d85a30',
        iconBg: 'rgba(232, 90, 48, 0.1)',
        value: totalPending,
        label: 'Pending submissions',
        sub: 'Needs grading',
        subStyle: { color: '#d85a30' },
      },
      {
        key: 'assignments',
        icon: 'assignment',
        iconColor: '#1d9e75',
        iconBg: 'rgba(29, 158, 117, 0.1)',
        value: totalAssignments,
        label: 'Assignments',
        sub: 'Across all courses',
        subStyle: { color: '#1d9e75' },
      },
    ];
  }, [courses]);

  return (
    <>
      <div className="page-title">Good morning, {instructorName || user?.name || 'Instructor'}</div>
      <div className="page-sub">Here&apos;s what needs your attention today · {formatToday()}</div>

      <div className="stat-grid">
        {loading ? (
          <>
            <StatCardSkeleton background="rgba(83, 74, 183, 0.1)" />
            <StatCardSkeleton background="rgba(182, 147, 169, 0.15)" />
            <StatCardSkeleton background="rgba(232, 90, 48, 0.1)" />
            <StatCardSkeleton background="rgba(29, 158, 117, 0.1)" />
          </>
        ) : stats.map(stat => (
          <div key={stat.key} className="stat-card">
            <div className="stat-card-icon" style={{ background: stat.iconBg }}>
              <span className="icon" style={{ color: stat.iconColor }}>{stat.icon}</span>
            </div>
            <div className="stat-card-num">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
            <div className="stat-card-sub" style={stat.subStyle}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        <div>
          <div className="dash-section-title">
            My courses
            <span className="dash-link" onClick={() => navigate('/instructor/courses')}>View all →</span>
          </div>
          <div className="inst-course-list">
            {loading ? (
              <>
                <CourseItemSkeleton />
                <CourseItemSkeleton />
                <CourseItemSkeleton />
              </>
            ) : courses.length === 0 ? (
              <div className="inst-course-item" style={{ cursor: 'default' }}>
                <div className="inst-course-info">
                  <div className="inst-course-name">No courses yet</div>
                  <div className="inst-course-meta">Create a course to start managing students and submissions.</div>
                </div>
              </div>
            ) : courses.map((course, index) => (
              <div
                key={course.id}
                className="inst-course-item"
                onClick={() => navigate('/instructor/courses')}
              >
                <div
                  className="inst-course-thumb"
                  style={{
                    backgroundImage: `url(${COURSE_THUMBS[index % COURSE_THUMBS.length]})`
                  }}
                />
                <div className="inst-course-info">
                  <div className="inst-course-name">{course.name}</div>
                  <div className="inst-course-meta">
                    {course.code}
                    {course.schedule ? ` · ${course.schedule}` : ''}
                    {course.location ? ` · ${course.location}` : ''}
                  </div>
                </div>
                <div className="inst-course-right">
                  <div className="inst-course-stat">
                    <span className="icon">group</span> {course.enrolmentCount ?? 0}
                  </div>
                  <div className="inst-course-stat" style={{ color: '#d85a30' }}>
                    <span className="icon">assignment_late</span> {course.pendingCount ?? 0}
                  </div>
                  <span className="icon" style={{ color: 'var(--text-muted)', fontSize: 18 }}>chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="dash-section-title">Needs attention</div>
          <div className="action-list">
            {loading ? (
              <>
                <ActionItemSkeleton />
                <ActionItemSkeleton />
                <ActionItemSkeleton />
              </>
            ) : pendingItems.length === 0 ? (
              <div className="action-item" style={{ cursor: 'default' }}>
                <div className="action-icon ai-grade">
                  <span className="icon">assignment_late</span>
                </div>
                <div className="action-body">
                  <div className="action-title">No pending submissions</div>
                  <div className="action-meta">Everything that needs grading is up to date.</div>
                </div>
              </div>
            ) : pendingItems.map(item => (
              <div
                key={item.id}
                className="action-item"
                onClick={() => navigate('/instructor/grading')}
              >
                <div className="action-icon ai-grade">
                  <span className="icon">assignment_late</span>
                </div>
                <div className="action-body">
                  <div className="action-title">{item.title}</div>
                  <div className="action-meta">
                    {item.pendingCount} submissions · {item.courseCode}
                    {item.dueDate ? ` · Due ${formatDueDate(item.dueDate)}` : ''}
                  </div>
                </div>
                <div className="action-right">
                  <span className="icon" style={{ color: 'var(--text-muted)', fontSize: 18 }}>chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
