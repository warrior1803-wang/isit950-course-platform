import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { announcementApi, courseApi } from '../api';

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
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      setLoading(true);
      setError('');

      try {
        const coursesRes = await courseApi.list();
        const courses = (coursesRes.data?.data ?? []).map(normalizeCourse).filter(Boolean);
        const announcementResponses = await Promise.all(
          courses.map(course => announcementApi.list(course.id)),
        );

        if (cancelled) return;

        const merged = announcementResponses
          .flatMap((res, index) => {
            const course = courses[index];
            return (res.data?.data ?? [])
              .map(announcement => normalizeAnnouncement(announcement, course.title))
              .filter(Boolean);
          })
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setAnnouncements(merged);
      } catch {
        if (cancelled) return;
        setAnnouncements([]);
        setError('Failed to load announcements.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="page-title">Announcements</h1>
      <p className="page-sub">Latest updates from your courses</p>

      {error ? (
        <p className="course-list-empty">Failed to load announcements.</p>
      ) : announcements.length === 0 ? (
        <p className="course-list-empty">No announcements yet.</p>
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
