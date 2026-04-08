// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// TODO Sprint 3: restore → forumApi.listPosts / createPost / createReply
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { MOCK_COURSES } from '../mock/courses';
import { getMockPosts } from '../mock/forum';

export default function Forum() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprint 2: load from mock data
    const t = setTimeout(() => {
      const next = MOCK_COURSES.map(course => {
        const posts = getMockPosts(course.id)
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { course, posts };
      }).filter(s => s.posts.length > 0);

      setSections(next);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  function formatDateShort(iso) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="global-title">Discussions</div>
      <div className="global-sub">Recent activity across all your courses</div>

      {sections.length === 0 ? (
        <p className="course-list-empty">No discussion activity yet.</p>
      ) : (
        sections.map(({ course, posts }) => (
          <div key={course.id}>
            <div></div>
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
