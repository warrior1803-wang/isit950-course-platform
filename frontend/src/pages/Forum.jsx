// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// TODO Sprint 3: restore → forumApi.listPosts / createPost / createReply
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getMockPosts, createMockPost, createMockReply } from '../mock/forum';

export default function Forum() {
  const { id: courseId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    // Sprint 2: load from mock data
    const t = setTimeout(() => {
      setPosts(getMockPosts(courseId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [courseId]);

  function onSubmitPost(data) {
    // Sprint 2: mock create — update local state without API call
    // TODO Sprint 3: const res = await forumApi.createPost(courseId, data); setPosts([res.data.post, ...posts]);
    const post = createMockPost(courseId, data, user);
    setPosts(prev => [post, ...prev]);
    reset();
  }

  function handleReply(postId, body) {
    // Sprint 2: mock reply — update local state without API call
    // TODO Sprint 3: const res = await forumApi.createReply(postId, { body }); ...
    const reply = createMockReply(postId, { body }, user);
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p,
      ),
    );
  }

  if (loading) return <div>Loading forum...</div>;

  return (
    <div>
      <Link to={`/courses/${courseId}`}>← Back to Course</Link>
      <h1>Forum</h1>

      <section>
        <h2>New Post</h2>
        <form onSubmit={handleSubmit(onSubmitPost)}>
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <span>{errors.title.message}</span>}
          </div>
          <div>
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              {...register('body', { required: 'Body is required' })}
            />
            {errors.body && <span>{errors.body.message}</span>}
          </div>
          <button type="submit">Post</button>
        </form>
      </section>

      <section>
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <p>No posts yet. Be the first to post!</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onReply={handleReply}
            />
          ))
        )}
      </section>
    </div>
  );
}

function PostCard({ post, currentUser, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  function onSubmitReply(data) {
    onReply(post.id, data.body);
    reset();
    setShowReplyForm(false);
  }

  return (
    <article>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <small>by {post.author?.name}</small>

      {post.replies?.length > 0 && (
        <div>
          <strong>Replies:</strong>
          {post.replies.map((r) => (
            <div key={r.id}>
              <p>{r.body}</p>
              <small>by {r.author?.name}</small>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <button onClick={() => setShowReplyForm(!showReplyForm)}>
          {showReplyForm ? 'Cancel' : 'Reply'}
        </button>
      )}

      {showReplyForm && (
        <form onSubmit={handleSubmit(onSubmitReply)}>
          <textarea {...register('body', { required: true })} placeholder="Write a reply..." />
          <button type="submit">Submit Reply</button>
        </form>
      )}
    </article>
  );
}
