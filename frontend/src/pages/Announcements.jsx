import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../components/shared/EmptyState';
import ErrorState from '../components/shared/ErrorState';
import { announcementApi, courseApi } from '../api';
import { getApiErrorState } from '../lib/apiState';

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function normalizeCourse(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title || raw.name || raw.code || 'Course',
  };
}

function normalizeAnnouncement(raw, courseName) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body || '',
    createdAt: raw.createdAt || null,
    author: {
      id: raw.author?.id || null,
      name: raw.author?.name || 'Instructor',
    },
    courseName,
  };
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnnouncements = useCallback(async (isCancelled = () => false) => {
      setLoading(true);
      setError(null);

      try {
        const coursesRes = await courseApi.list();
        const courses = (coursesRes.data?.data ?? []).map(normalizeCourse).filter(Boolean);
        const announcementResponses = await Promise.all(
          courses.map(course => announcementApi.list(course.id)),
        );

        if (isCancelled()) return;

        const merged = announcementResponses
          .flatMap((res, index) => {
            const course = courses[index];
            return (res.data?.data ?? [])
              .map(announcement => normalizeAnnouncement(announcement, course.title))
              .filter(Boolean);
          })
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setAnnouncements(merged);
      } catch (err) {
        if (isCancelled()) return;
        setAnnouncements([]);
        setError(getApiErrorState(err));
      } finally {
        if (!isCancelled()) {
          setLoading(false);
        }
      }
    }, []);

  useEffect(() => {
    let cancelled = false;
    loadAnnouncements(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAnnouncements]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Announcements</h1>
      <p className="page-sub">Latest updates from your courses</p>

      {error ? (
        error.kind === 'upgrade' ? (
          <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
            This feature requires a membership. <a href="/membership" className="underline">Upgrade</a>
          </div>
        ) : (
          <ErrorState
            message={error.message}
            onRetry={error.kind === 'retryable' ? () => loadAnnouncements() : null}
          />
        )
      ) : announcements.length === 0 ? (
        <EmptyState icon="notifications" title="No announcements yet" />
      ) : (
        <div className="ann-list">
          {announcements.map(announcement => (
            <div key={`${announcement.courseName}-${announcement.id}`} className="ann-item">
              <div className="ann-header">
                <div>
                  <div
                    className="course-tag"
                    style={{
                      display: 'inline-flex',
                      marginBottom: 8,
                      background: 'rgba(182, 147, 169, 0.16)',
                      color: 'var(--accent)',
                      borderColor: 'rgba(182, 147, 169, 0.26)',
                    }}
                  >
                    {announcement.courseName}
                  </div>
                  <div className="ann-title">{announcement.title}</div>
                </div>
                <div className="ann-date">{formatDateShort(announcement.createdAt)}</div>
              </div>
              <div className="ann-author">{announcement.author?.name}</div>
              <div className="ann-body">{announcement.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
