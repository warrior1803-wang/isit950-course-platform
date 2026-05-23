import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/shared/ErrorState';
import { courseApi, forumApi } from '../api';
import { useAuth } from '../lib/auth';
import { getApiErrorState } from '../lib/apiState';
import {
  hasReachedDiscussionLimit,
  loadDiscussionMembershipState,
} from '../lib/discussionMembership';

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
      id: raw.author?.id || raw.authorId || null,
      name: raw.author?.name || raw.authorName || 'Unknown user',
    },
    replies: Array.isArray(raw.replies) ? raw.replies : [],
  };
}

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export default function Forum() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [discussionMembership, setDiscussionMembership] = useState(null);

  const loadForum = useCallback(async (isCancelled = () => false) => {
      setLoading(true);
      setError(null);

      try {
        const courseRes = await courseApi.list();
        const courses = (courseRes.data?.data ?? []).map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }));

        // TODO(Sprint 8): add thread-list pagination here once the backend supports ?page=0&size=20.
        const results = await Promise.allSettled(
          courses.map(course => forumApi.listPosts(course.id)),
        );

        if (isCancelled()) return;

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

        if (courses.length > 0 && results.every(result => result.status === 'rejected')) {
          setError({ kind: 'retryable', message: 'Something went wrong — please try again' });
        }
      } catch (err) {
        if (isCancelled()) return;
        setSections([]);
        setError(getApiErrorState(err));
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    }, []);

  useEffect(() => {
    let cancelled = false;
    loadForum(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadForum]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembership() {
      if (!user || String(user.role).toUpperCase() !== 'STUDENT') {
        setDiscussionMembership(null);
        return;
      }

      const nextState = await loadDiscussionMembershipState();
      if (!cancelled) {
        setDiscussionMembership(nextState);
      }
    }

    loadMembership();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const discussionLimitReached = hasReachedDiscussionLimit(discussionMembership);
  const discussionUsageText = discussionMembership && !discussionMembership.isMember
    ? `${discussionMembership.weeklyPostsUsed ?? 0} of ${discussionMembership.weeklyPostsLimit ?? 10} posts used this week — ${discussionMembership.remaining ?? 0} remaining`
    : '';

  async function handleDeletePost(courseId, postId) {
    setDeletingPostId(postId);
    try {
      await forumApi.deletePost(courseId, postId);
      setSections(prev => prev
        .map(section => ({
          ...section,
          posts: section.course.id === courseId
            ? section.posts.filter(post => post.id !== postId)
            : section.posts,
        }))
        .filter(section => section.posts.length > 0));
    } catch (err) {
      setError(getApiErrorState(err));
    } finally {
      setDeletingPostId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
      </div>
    );
  }

  return (
    <div>
      <div className="global-title">Discussions</div>
      <div className="global-sub">Recent activity across all your courses</div>

      {discussionMembership && !discussionMembership.isMember && (
        <div className={`limit-banner ${discussionLimitReached ? 'full' : 'warn'}`} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="material-symbols-rounded">warning</span>
            {discussionUsageText}
          </div>
          <Link to="/membership" className="limit-upgrade-link">
            Upgrade for unlimited ›
          </Link>
        </div>
      )}

      {error ? (
        error.kind === 'upgrade' ? (
          <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
            This feature requires a membership. <Link to="/membership" className="underline">Upgrade</Link>
          </div>
      ) : (
          <ErrorState
            message={error.message}
            onRetry={error.kind === 'retryable' ? () => loadForum() : null}
          />
        )
      ) : sections.length === 0 ? (
        <p className="course-list-empty">No posts yet — be the first to start a discussion</p>
      ) : (
        sections.map(({ course, posts }) => (
          <div key={course.id}>
            <div />
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
                    to={`/courses/${course.id}/posts?post=${post.id}`}
                    className="global-item"
                  >
                    <div className={`global-item-icon ${iconCls}`}>
                      <span className="material-symbols-rounded icon">{iconName}</span>
                    </div>
                    <div className="global-item-body">
                      <div className="global-item-title">{post.title}</div>
                      <div className="global-item-meta">
                        {post.author?.name}
                        <span className={`discussion-role-badge ${isInstructor ? 'inst' : 'student'}`}>
                          {isInstructor ? 'Instructor' : 'Student'}
                        </span>
                        · {formatDateShort(post.createdAt)}
                      </div>
                      <div className="global-item-preview">{post.body}</div>
                    </div>
                    <div className="global-item-right">
                      <span className="pill-new">{replyLabel}</span>
                      {user?.id === post.author?.id && (
                        <button
                          type="button"
                          className="discussion-delete-btn"
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDeletePost(course.id, post.id);
                          }}
                          disabled={deletingPostId === post.id}
                          aria-label="Delete post"
                        >
                          {deletingPostId === post.id ? <ButtonSpinner /> : (
                            <span className="material-symbols-rounded">delete</span>
                          )}
                        </button>
                      )}
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
