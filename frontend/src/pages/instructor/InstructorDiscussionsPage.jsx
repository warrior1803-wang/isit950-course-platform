import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { courseApi, forumApi } from '../../api';
import { useAuth } from '../../lib/auth';

const AVATAR_STYLES = [
  { background: 'rgba(83, 74, 183, 0.15)', color: '#534ab7' },
  { background: 'rgba(186, 117, 23, 0.15)', color: '#ba7517' },
  { background: 'rgba(24, 95, 165, 0.15)', color: '#185fa5' },
  { background: 'rgba(29, 158, 117, 0.15)', color: '#1d9e75' },
  { background: 'rgba(182, 147, 169, 0.2)', color: '#7a5a6a' },
];

const ALL_COURSES = 'ALL';
const FILTERS = ['ALL', 'NEEDS_REPLY', 'REPLIED'];

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

function getInitials(name) {
  const parts = String(name || 'User')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'U';
}

function getAvatarStyle(seed) {
  const source = String(seed || 'user');
  const total = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_STYLES[total % AVATAR_STYLES.length];
}

function normalizeReply(raw) {
  const authorName = raw.author?.name || 'User';
  return {
    id: raw.id,
    body: raw.body || '',
    createdAt: raw.createdAt || null,
    authorRole: String(raw.author?.role || '').toLowerCase(),
    author: {
      id: raw.author?.id || null,
      name: authorName,
    },
    initials: getInitials(authorName),
    avatarStyle: getAvatarStyle(`${raw.author?.id || authorName}-${raw.author?.role || ''}`),
  };
}

function normalizePost(raw, course) {
  const authorName = raw.author?.name || 'User';
  return {
    id: raw.id,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    title: raw.title || 'Untitled thread',
    body: raw.body || '',
    createdAt: raw.createdAt || null,
    authorRole: String(raw.author?.role || '').toLowerCase(),
    author: {
      id: raw.author?.id || null,
      name: authorName,
    },
    initials: getInitials(authorName),
    avatarStyle: getAvatarStyle(`${raw.author?.id || authorName}-${course.code}`),
    replies: Array.isArray(raw.replies) ? raw.replies.map(normalizeReply) : [],
  };
}

export default function InstructorDiscussionsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(ALL_COURSES);
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [replyDraft, setReplyDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoading(true);
      setError('');

      try {
        const res = await courseApi.list();
        if (cancelled) return;
        const nextCourses = (res.data?.data ?? []).map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }));
        setCourses(nextCourses);
        setSelectedCourseId(ALL_COURSES);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load instructor courses.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadThreads() {
      if (courses.length === 0) {
        setPosts([]);
        setSelectedPostId(null);
        return;
      }

      setThreadsLoading(true);
      setError('');

      try {
        const targetCourses = selectedCourseId === ALL_COURSES
          ? courses
          : courses.filter(course => course.id === Number(selectedCourseId));
        const responses = await Promise.all(targetCourses.map(course => forumApi.listPosts(course.id)));
        if (cancelled) return;

        const nextPosts = responses
          .flatMap((res, index) => {
            const course = targetCourses[index];
            return (res.data?.data ?? []).map(post => normalizePost(post, course));
          })
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setPosts(nextPosts);
        setSelectedPostId(current => (
          nextPosts.some(post => post.id === current) ? current : nextPosts[0]?.id ?? null
        ));
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setSelectedPostId(null);
          setError(err.response?.data?.message || 'Failed to load discussions.');
        }
      } finally {
        if (!cancelled) {
          setThreadsLoading(false);
        }
      }
    }

    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, courses]);

  const filteredPosts = useMemo(() => {
    if (filter === 'NEEDS_REPLY') {
      return posts.filter(post => (post.replies?.length ?? 0) === 0);
    }
    if (filter === 'REPLIED') {
      return posts.filter(post => (post.replies?.length ?? 0) > 0);
    }
    return posts;
  }, [posts, filter]);

  const filterCounts = useMemo(() => ({
    ALL: posts.length,
    NEEDS_REPLY: posts.filter(post => (post.replies?.length ?? 0) === 0).length,
    REPLIED: posts.filter(post => (post.replies?.length ?? 0) > 0).length,
  }), [posts]);

  const selectedPost = filteredPosts.find(post => post.id === selectedPostId)
    ?? posts.find(post => post.id === selectedPostId)
    ?? null;
  const currentInstructorName = user?.name || 'Instructor';
  const currentInstructorInitials = getInitials(currentInstructorName);
  const currentInstructorAvatarStyle = getAvatarStyle(`${user?.id || currentInstructorName}-instructor-self`);

  async function handleReplySubmit() {
    const body = replyDraft.trim();
    if (!body || !selectedPost) return;

    setReplyError('');

    try {
      const res = await forumApi.createReply(selectedPost.courseId, selectedPost.id, { body });
      const reply = normalizeReply(res.data?.data ?? res.data);

      setPosts(prev => prev.map(post => (
        post.id === selectedPost.id
          ? { ...post, replies: [...(post.replies ?? []), reply] }
          : post
      )));
      setReplyDraft('');
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Failed to send reply.');
    }
  }

  async function handleDeletePost(postId) {
    const post = posts.find(item => item.id === postId);
    if (!post) return;

    try {
      await forumApi.deletePost(post.courseId, postId);
      const nextPosts = posts.filter(item => item.id !== postId);
      setPosts(nextPosts);
      if (selectedPostId === postId) {
        const nextSelected = filteredPosts
          .filter(item => item.id !== postId)
          .find(Boolean)
          ?? nextPosts[0]
          ?? null;
        setSelectedPostId(nextSelected?.id ?? null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    }
  }

  async function handleDeleteReply(postId, replyId) {
    const post = posts.find(item => item.id === postId);
    if (!post) return;

    try {
      await forumApi.deleteReply(post.courseId, postId, replyId);
      setPosts(prev => prev.map(item => (
        item.id === postId
          ? { ...item, replies: (item.replies ?? []).filter(reply => reply.id !== replyId) }
          : item
      )));
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Failed to delete reply.');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="inbox-shell">
      <div className="inst-page-header">
        <div>
          <div className="page-title">Discussions</div>
          <div className="page-sub">Student questions across all your courses</div>
        </div>
        <select
          className="analytics-course-select inbox-course-select-proto"
          value={selectedCourseId}
          onChange={event => setSelectedCourseId(event.target.value)}
        >
          <option value={ALL_COURSES}>All courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="course-list-empty">{error}</p>}

      <div className="inst-disc-layout">
        <aside className="inst-disc-list-col">
          <div className="grading-filter-row">
            {FILTERS.map(value => (
              <button
                key={value}
                type="button"
                className={`grading-filter-btn${filter === value ? ' active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {value === 'ALL'
                  ? `All (${filterCounts.ALL})`
                  : value === 'NEEDS_REPLY'
                    ? `Needs reply (${filterCounts.NEEDS_REPLY})`
                    : `Replied (${filterCounts.REPLIED})`}
              </button>
            ))}
          </div>

          <div className="inbox-thread-list inst-disc-thread-list">
            {threadsLoading ? (
              <LoadingSpinner />
            ) : filteredPosts.length === 0 ? (
              <p className="course-list-empty">No threads for this filter.</p>
            ) : (
              filteredPosts.map(post => (
                <button
                  key={post.id}
                  type="button"
                  className={`inst-disc-item${selectedPost?.id === post.id ? ' sel' : ''}`}
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className="disc-avatar inst-disc-avatar" style={post.avatarStyle}>
                    {post.initials}
                  </div>
                  <div className="inst-disc-info">
                    <div className="inst-disc-title">{post.title}</div>
                    <div className="inst-disc-meta">
                      {post.author?.name} · {post.courseCode} · {formatDateShort(post.createdAt)}
                    </div>
                    <div className="inst-disc-preview">{post.body}</div>
                  </div>
                  <span className={`inst-disc-badge ${(post.replies?.length ?? 0) > 0 ? 'replied' : 'unread'}`}>
                    {(post.replies?.length ?? 0) > 0 ? 'Replied' : 'Needs reply'}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="inst-disc-detail-col">
          {selectedPost ? (
            <div className="inst-disc-panel">
              <div className="inst-disc-panel-top">
                <span className="course-chip-sm">
                  <span className="material-symbols-rounded">menu_book</span>
                  {selectedPost.courseCode}
                </span>
                <button
                  type="button"
                  className="inst-disc-remove-btn"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDeletePost(selectedPost.id);
                  }}
                >
                  <span className="material-symbols-rounded">delete</span>
                  Remove post
                </button>
              </div>

              <div className="disc-post-title">{selectedPost.title}</div>
              <div className="disc-post-header">
                <div className="disc-avatar" style={selectedPost.avatarStyle}>
                  {selectedPost.initials}
                </div>
                <div className="inst-disc-post-author-row">
                  <div>
                    <span className="disc-post-author">{selectedPost.author?.name}</span>
                    <span className={`discussion-role-badge ${selectedPost.authorRole === 'instructor' ? 'inst' : 'student'}`}>
                      {selectedPost.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                    </span>
                  </div>
                  <div className="disc-post-date">{formatDateShort(selectedPost.createdAt)}</div>
                </div>
              </div>
              <div className="disc-post-body">{selectedPost.body}</div>

              <div className="disc-replies-heading" style={{ marginTop: 20 }}>
                {selectedPost.replies?.length ?? 0} replies
              </div>
              <div className="inbox-replies">
                {(selectedPost.replies ?? []).map(reply => (
                  <div key={reply.id} className="disc-reply-item inbox-reply-item">
                    <div className="disc-avatar disc-reply-avatar" style={reply.avatarStyle}>
                      {reply.initials}
                    </div>
                    <div className="disc-info">
                      <div className="disc-reply-meta">
                        <div className="inst-disc-reply-head">
                          <div>
                            <span className="disc-reply-author">{reply.author?.name}</span>
                            <span className={`discussion-role-badge ${reply.authorRole === 'instructor' ? 'inst' : 'student'}`}>
                              {reply.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="disc-reply-body">{reply.body}</div>
                    </div>
                    <div className="discussion-reply-side">
                      <div className="disc-reply-date">{formatDateShort(reply.createdAt)}</div>
                      <button
                        type="button"
                        className="discussion-delete-btn"
                        onClick={() => handleDeleteReply(selectedPost.id, reply.id)}
                        aria-label="Delete reply"
                      >
                        <span className="material-symbols-rounded">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="disc-reply-box inst-disc-reply-box">
                <div className="disc-avatar disc-reply-avatar inst-reply-author-avatar" style={currentInstructorAvatarStyle}>
                  {currentInstructorInitials}
                </div>
                <div className="inst-disc-reply-compose">
                  <textarea
                    className="disc-reply-input inst-disc-reply-input"
                    rows={4}
                    placeholder={`Reply as ${currentInstructorName}...`}
                    value={replyDraft}
                    onChange={event => setReplyDraft(event.target.value)}
                  />
                  <div className="inbox-reply-actions">
                    <button type="button" className="disc-submit-btn" onClick={handleReplySubmit}>
                      <span className="material-symbols-rounded icon">send</span> Post reply
                    </button>
                  </div>
                </div>
              </div>
              {replyError && <p className="course-list-empty">{replyError}</p>}
            </div>
          ) : (
            <div className="inst-disc-panel inst-disc-panel-empty">
              <span className="material-symbols-rounded">forum</span>
              <div>Select a thread to review and reply.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
