import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/shared/EmptyState';
import ErrorState from '../components/shared/ErrorState';
import { courseApi, enrolmentApi } from '../api';
import { useAuth } from '../lib/auth';
import { getApiErrorState } from '../lib/apiState';

// Deterministic cover image per course id
const COVERS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
];
function coverFor(id) {
  return COVERS[(id - 1) % COVERS.length];
}

export default function BrowseCourses() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [enrolling, setEnrolling] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseApi.browse();
      const allCourses = res.data?.data ?? [];
      const ids = new Set(allCourses.filter(c => c.enrolled).map(c => c.id));
      setCourses(allCourses);
      setEnrolledIds(ids);
    } catch (err) {
      setCourses([]);
      setEnrolledIds(new Set());
      setError(getApiErrorState(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) loadCourses();
  }, [authLoading, loadCourses]);

  async function handleEnrol(courseId) {
    setEnrolling(prev => new Set(prev).add(courseId));
    try {
      await enrolmentApi.enrol(courseId);
      setEnrolledIds(prev => new Set(prev).add(courseId));
    } catch (err) {
      setError(getApiErrorState(err));
    } finally {
      setEnrolling(prev => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.instructor?.name?.toLowerCase().includes(q),
    );
  }, [courses, search]);

  return (
    <div className="max-w-[900px]">
      {/* Header */}
      <div className="text-[22px] text-[#2e2028] mb-0.5">Browse Courses</div>
      <div className="text-[13px] text-[#9c8a8e] mb-5">
        University of Wollongong · Autumn Session 2026
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-[#ddd0d4] rounded-xl px-3 py-2 mb-6 w-full max-w-sm shadow-sm">
        <span className="material-symbols-rounded text-[#b8a8ad] text-[18px] select-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search all courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-[#2e2028] placeholder-[#b8a8ad] outline-none"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
        </div>
      )}

      {error?.kind === 'upgrade' && (
        <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
          This feature requires a membership.{' '}
          <Link to="/membership" className="underline">Upgrade</Link>
        </div>
      )}

      {error && error.kind !== 'upgrade' && (
        <ErrorState
          message={error.message}
          onRetry={error.kind === 'retryable' ? loadCourses : null}
        />
      )}

      {!loading && !error && courses.length === 0 && (
        <EmptyState
          icon="search"
          title="No courses available"
          subtitle="Check back later"
        />
      )}

      {!loading && !error && courses.length > 0 && filtered.length === 0 && (
        <div className="text-[13px] text-[#b8a8ad] text-center py-12">
          No courses match your search.
        </div>
      )}

      {/* Course grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const enrolled = enrolledIds.has(course.id);
            const busy = enrolling.has(course.id);

            return (
              <div
                key={course.id}
                onClick={() => enrolled && navigate(`/courses/${course.id}`)}
                className={[
                  'relative rounded-2xl overflow-hidden h-52 flex flex-col justify-end shadow-md',
                  enrolled ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${course.coverImageUrl ?? coverFor(course.id)}')` }}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Enrolled / not enrolled badge */}
                <div
                  className={[
                    'absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm',
                    enrolled
                      ? 'bg-[rgba(29,158,117,0.85)] text-white'
                      : 'bg-[rgba(255,255,255,0.18)] text-white border border-white/30',
                  ].join(' ')}
                >
                  <span className="material-symbols-rounded text-[14px]">
                    {enrolled ? 'check_circle' : 'add_circle'}
                  </span>
                  {enrolled ? 'Enrolled' : 'Not enrolled'}
                </div>

                {/* Glass info panel */}
                <div className="relative z-10 px-4 py-3">
                  <div className="text-[11px] text-white/70 font-mono mb-0.5">{course.code}</div>
                  <div className="text-[14px] text-white font-semibold leading-snug mb-2">
                    {course.name}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-white/70 truncate">
                      {course.instructor?.name ?? 'Unknown instructor'}
                    </span>

                    {enrolled ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 whitespace-nowrap">
                        In progress
                      </span>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleEnrol(course.id);
                        }}
                        disabled={busy}
                        className="text-[11px] px-3 py-1 rounded-lg bg-white text-[#2e2028] font-semibold hover:bg-[#f5eeea] active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap inline-flex items-center gap-1.5"
                      >
                        {busy && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#2e2028]" />
                        )}
                        {busy ? 'Enrolling…' : 'Enrol'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
