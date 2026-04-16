import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { courseApi, forumApi } from '../api';

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function normalizePost(raw) {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body || raw.content || '',
    createdAt: raw.createdAt || raw.postedAt || null,
    authorRole: String(raw.author?.role || raw.authorRole || '').toLowerCase(),
    author: {
      name: raw.author?.name || raw.authorName || 'User',
    },
    replies: Array.isArray(raw.replies) ? raw.replies : [],
  };
}

export default function Forum() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadForum() {
      setLoading(true);
      setError('');

      try {
        const courseRes = await courseApi.list();
        const courses = (courseRes.data?.data ?? []).map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }));

        const results = await Promise.allSettled(
          courses.map(course => forumApi.listPosts(course.id))
        );

        if (cancelled) return;

        const nextSections = courses
          .map((course, index) => {
            const result = results[index];
            const posts =
              result.status === 'fulfilled'
                ? (result.value.data?.data ?? [])
                    .map(normalizePost)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                : [];

            return { course, posts };
          })
          .filter(section => section.posts.length > 0);

        setSections(nextSections);

        if (results.every(result => result.status === 'rejected')) {
          setError('Failed to load discussion activity.');
        }
      } catch (err) {
        if (cancelled) return;
        setSections([]);
        setError(err.response?.data?.message || 'Failed to load discussion activity.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadForum();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="global-title">Discussions</div>
      <div className="global-sub">Recent activity across all your courses</div>

      {error ? (
        <p className="course-list-empty">{error}</p>
      ) : sections.length === 0 ? (
        <p className="course-list-empty">No discussion activity yet.</p>
      ) : (
        sections.map(({ course, posts }) => (
          <div key={course.id}>
            <div className="list-section-label">
              {course.code} · {course.name}
            </div>
            <div className="global-list">
              {posts.map(post => {
                const isInstructor = post.authorRole === 'instructor';
                const iconCls = isInstructor ? 'gi-ann' : 'gi-disc';
                const iconName = isInstructor ? 'record_voice_over' : 'chat';
                const replies = post.replies?.length ?? 0;
                const replyLabel = `${replies} ${replies === 1 ? 'reply' : 'replies'}`;

                return (
                  <Link
                    key={post.id}
                    to={`/courses/${course.id}?tab=discussion&post=${post.id}`}
                    className="global-item"
                  >
                    <div className={`global-item-icon ${iconCls}`}>
                      <span className="material-symbols-rounded icon">{iconName}</span>
                    </div>
                    <div className="global-item-body">
                      <div className="global-item-title">{post.title}</div>
                      <div className="global-item-meta">
                        {post.author?.name} · {isInstructor ? 'Instructor' : 'Student'} ·{' '}
                        {formatDateShort(post.createdAt)}
                      </div>
                      <div className="global-item-preview">{post.body}</div>
                    </div>
                    <div className="global-item-right">
                      <span className="pill-new">{replyLabel}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
