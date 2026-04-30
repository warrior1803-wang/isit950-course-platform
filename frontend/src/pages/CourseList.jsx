import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { courseApi } from '../api';
import { useAuth } from '../context/AuthContext';
import PropTypes from "prop-types";

function isInProgress(course) {
  if (!course?.semester?.endDate) return true;
  const end = new Date(`${course.semester.endDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return end > today;
}

/** When `coverImageUrl` is null, use a stable decorative image per course id. */
const COVER_FALLBACKS = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
];

function coverUrlFor(course) {
  if (course.coverImageUrl) return course.coverImageUrl;
  return COVER_FALLBACKS[(course.id - 1) % COVER_FALLBACKS.length];
}

function matchesSearch(course, q) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const inst = course.instructor?.name?.toLowerCase() ?? '';
  return (
    course.code.toLowerCase().includes(s) ||
    course.name.toLowerCase().includes(s) ||
    inst.includes(s)
  );
}

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    setError('');
    courseApi
      .list()
      .then(res => {
        const apiCourses = res.data?.data ?? [];
        setCourses(
          apiCourses.map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
            description: course.description,
            schedule: course.schedule,
            location: course.location,
            createdAt: course.createdAt,
            coverImageUrl: course.coverImageUrl ?? null,
            instructor: { name: course.instructorName ?? 'Instructor' },
          })),
        );
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load courses.');
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [authLoading]);

  const counts = useMemo(() => {
    const total = courses.length;
    const inProg = courses.filter(c => isInProgress(c)).length;
    return { total, inProg, done: total - inProg };
  }, [courses]);

  const filtered = useMemo(() => {
    let list = courses;
    if (activeTab === 'in_progress') list = list.filter(c => isInProgress(c));
    if (activeTab === 'completed') list = list.filter(c => !isInProgress(c));
    return list.filter(c => matchesSearch(c, search));
  }, [courses, activeTab, search]);

  const enrolledCourseIds = useMemo(
    () => new Set(courses.map(course => course.id)),
    [courses],
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="page-title">My Courses</h1>
      <p className="page-sub">University of Wollongong · Autumn Session 2026</p>

      {error && <p className="course-list-empty">{error}</p>}

      <div className="tabs" role="tablist" aria-label="Filter courses">
        <button
          type="button"
          role="tab"
          id="tab-all"
          aria-selected={activeTab === 'all'}
          className={`tab-btn${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All {counts.total}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-progress"
          aria-selected={activeTab === 'in_progress'}
          className={`tab-btn${activeTab === 'in_progress' ? ' active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          In progress {counts.inProg}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-done"
          aria-selected={activeTab === 'completed'}
          className={`tab-btn${activeTab === 'completed' ? ' active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed {counts.done}
        </button>
      </div>

      {!error && (
        <div className="tab-panel active" role="tabpanel">
          <CourseListToolbar search={search} onSearchChange={setSearch} />
          <CourseGrid
            courses={filtered}
            activeTab={activeTab}
            search={search}
            enrolledCourseIds={enrolledCourseIds}
          />
        </div>
      )}
    </div>
  );
}

function CourseListToolbar({ search, onSearchChange }) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <span className="material-symbols-rounded icon" aria-hidden>
          search
        </span>
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search courses"
        />
      </div>
    </div>
  );
}

CourseListToolbar.propTypes = {
  search: PropTypes.string,
  onSearchChange: PropTypes.func
};

function CourseGrid({ courses, activeTab, search, enrolledCourseIds }) {
  if (courses.length === 0) {
    const emptyMsg = search.trim()
      ? 'No courses match your search.'
      : activeTab === 'all'
        ? 'No courses available.'
        : activeTab === 'in_progress'
          ? 'No courses in progress.'
          : 'No courses completed.';
    return <p className="course-list-empty">{emptyMsg}</p>;
  }

  return (
    <div className="course-grid">
      {courses.map(course => {
        const progress = isInProgress(course);
        const isEnrolled = enrolledCourseIds.has(course.id);
        return (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="course-card"
            aria-label={`${course.code} ${course.name}`}
          >
            <div
              className="course-card-bg"
              style={{ backgroundImage: `url(${coverUrlFor(course)})` }}
            />
            <div className="course-card-overlay" />
            <div
              className="course-badge"
              style={
                isEnrolled
                  ? undefined
                  : {
                      background: 'rgba(44, 28, 36, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.16)',
                      color: 'rgba(255, 255, 255, 0.82)',
                    }
              }
            >
              <span className="material-symbols-rounded icon">
                {isEnrolled ? 'verified' : 'person_off'}
              </span>
              {isEnrolled ? 'Enrolled' : 'Not enrolled'}
            </div>
            <div className="course-glass">
              <div className="course-code-g">{course.code}</div>
              <div className="course-name-g">{course.name}</div>
              <div className="course-glass-foot">
                <span className="course-inst">{course.instructor?.name}</span>
                <span className={`course-tag${progress ? '' : ' done'}`}>
                  {progress ? 'In progress' : 'Completed'}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

CourseGrid.propTypes = {
  courses: PropTypes.array,
  activeTab: PropTypes.string,
  search: PropTypes.string,
  enrolledCourseIds: PropTypes.instanceOf(Set),
};
