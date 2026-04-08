// Sprint 2: mock data — swap the import block for real axios calls in Sprint 3.
// TODO Sprint 3: replace mock import with → import { courseApi } from '../api';
//                and restore:  courseApi.list().then(res => setCourses(res.data.courses))
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { MOCK_COURSES } from '../mock/courses';
import PropTypes from "prop-types";

/** Mirrors mock/courses.js: endDate > today → in progress. */
function isInProgress(course) {
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
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setCourses(MOCK_COURSES);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="page-title">My Courses</h1>
      <p className="page-sub">University of Wollongong · Autumn Session 2026</p>

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

      <div className="tab-panel active" role="tabpanel">
        <CourseListToolbar search={search} onSearchChange={setSearch} />
        <CourseGrid courses={filtered} activeTab={activeTab} search={search} />
      </div>
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

function CourseGrid({ courses, activeTab, search }) {
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
            <div className="course-badge">
              <span className="material-symbols-rounded icon">verified</span>
              Enrolled
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
