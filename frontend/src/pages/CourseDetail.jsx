// Sprint 2: mock data — swap the import block for real axios calls in Sprint 3.
// // TODO Sprint 3: replace mock imports with → import { courseApi, materialApi, announcementApi, assignmentApi } from '../api';
//                and restore Promise.all([courseApi.get(id), materialApi.list(id), ...])
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMockCourse } from '../mock/courses';
import { getMockMaterials } from '../mock/materials';
import { getMockAnnouncements } from '../mock/announcements';
import { getMockAssignments } from '../mock/assignments';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprint 2: simulate async load with mock data
    const t = setTimeout(() => {
      setCourse(getMockCourse(id));
      setMaterials(getMockMaterials(id));
      setAnnouncements(getMockAnnouncements(id));
      setAssignments(getMockAssignments(id));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [id]);

  if (loading) return <div>Loading course...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div
      style={{
        margin: '-28px -36px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className="detail-hero">
        <div
          className="detail-hero-bg"
          style={{ backgroundImage: `url(${heroUrlFor(course)})` }}
        />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <div>
            <div className="detail-course-code">
              {course.code} · {course.instructor?.name}
            </div>
            <div className="detail-course-name">{course.name}</div>
            <div className="detail-meta">
              <span className="detail-meta-item">
                <span className="material-symbols-rounded icon">group</span>
                {course.enrolledCount} students enrolled
              </span>
              <span className="detail-meta-item">
                <span className="material-symbols-rounded icon">schedule</span>
                {/* Thu 10:00 – 12:00 */}
                {course.schedule}
              </span>
              <span className="detail-meta-item">
                <span className="material-symbols-rounded icon">location_on</span>
                {/* Building 40, Room 205 */}
                {course.location}
              </span>
            </div>
          </div>

          <button type="button" className="detail-back-btn" onClick={() => navigate('/courses')}>
            <span className="material-symbols-rounded icon">arrow_back</span>
            Back to courses
          </button>
        </div>
      </div>

      <div className="detail-tabs" role="tablist" aria-label="Course detail tabs">
        <button
          type="button"
          className={`detail-tab-btn${activeTab === 'materials' ? ' active' : ''}`}
          onClick={() => changeTab('materials')}
        >
          <span className="material-symbols-rounded icon">folder_open</span> Materials
        </button>
        <button
          type="button"
          className={`detail-tab-btn${activeTab === 'announcements' ? ' active' : ''}`}
          onClick={() => changeTab('announcements')}
        >
          <span className="material-symbols-rounded icon">campaign</span> Announcements
        </button>
        <button
          type="button"
          className={`detail-tab-btn${activeTab === 'assignments' ? ' active' : ''}`}
          onClick={() => changeTab('assignments')}
        >
          <span className="material-symbols-rounded icon">assignment</span> Assignments
        </button>
        <button
          type="button"
          className={`detail-tab-btn${activeTab === 'discussion' ? ' active' : ''}`}
          onClick={() => changeTab('discussion')}
        >
          <span className="material-symbols-rounded icon">forum</span> Discussion
        </button>
      </div>

      <div className="detail-body">
        {/* MATERIALS */}
        <div className={`detail-tab-panel${activeTab === 'materials' ? ' active' : ''}`}>
          {materialSections.length === 0 ? (
            <p className="course-list-empty">No materials uploaded yet.</p>
          ) : (
            materialSections.map(sec => (
              <div key={sec.section}>
                <div className="section-heading">{sec.section.replace(':', ' —')}</div>
                <div className="material-list">
                  {sec.items.map(m => {
                    const meta = fileTypeMeta(m);
                    return (
                      <div
                        key={m.id}
                        className="material-item"
                        onClick={() => handleMaterialDownload(m)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`material-icon ${meta.cls}`}>
                          <span className="material-symbols-rounded icon">{meta.icon}</span>
                        </div>
                        <div className="material-info">
                          <div className="material-name">{m.filename}</div>
                          <div className="material-meta">
                            {meta.label}
                            {m.size ? ` · ${formatBytes(m.size)}` : ''}
                            {m.uploadedAt ? ` · Uploaded ${formatDateShort(m.uploadedAt)}` : ''}
                          </div>
                        </div>
                        <span className="material-dl" aria-hidden>
                          <span className="material-symbols-rounded icon">download</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ANNOUNCEMENTS */}
        <div className={`detail-tab-panel${activeTab === 'announcements' ? ' active' : ''}`}>
          {announcements.length === 0 ? (
            <p className="course-list-empty">No announcements yet.</p>
          ) : (
            <div className="ann-list">
              {announcements.map((a, idx) => (
                <div key={a.id} className="ann-item">
                  <div className="ann-header">
                    <div className="ann-title">
                      {a.title}
                      {idx < 2 && <span className="ann-new">New</span>}
                    </div>
                    <div className="ann-date">{formatDateShort(a.createdAt)}</div>
                  </div>
                  <div className="ann-author">{a.author?.name}</div>
                  <div className="ann-body">{a.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ASSIGNMENTS */}
        <div className={`detail-tab-panel${activeTab === 'assignments' ? ' active' : ''}`}>
          {assignments.length === 0 ? (
            <p className="course-list-empty">No assignments yet.</p>
          ) : (
            <div className="material-list">
              {assignments.map(a => {
                const st = assignmentStatus(a);
                const baseMeta = (() => {
                  if (st === 'due_soon') {
                    return {
                      icon: 'assignment',
                      iconStyle: { background: 'rgba(182,147,169,0.12)', color: '#7a5a6a' },
                      pill: {
                        label: 'Due soon',
                        style: {
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(232,90,48,0.1)',
                          color: '#d85a30',
                          border: '1px solid rgba(232,90,48,0.2)',
                          flexShrink: 0,
                        },
                      },
                      linkTo: `/courses/${id}/assignments/${a.id}/submit`,
                      disabled: false,
                    };
                  }
                  if (st === 'submitted') {
                    return {
                      icon: 'assignment_turned_in',
                      iconStyle: { background: 'rgba(29,158,117,0.1)', color: '#1d9e75' },
                      pill: {
                        label: 'Submitted',
                        style: {
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(29,158,117,0.1)',
                          color: '#1d9e75',
                          border: '1px solid rgba(29,158,117,0.2)',
                          flexShrink: 0,
                        },
                      },
                      linkTo: `/courses/${id}/assignments/${a.id}/review`,
                      disabled: false,
                    };
                  }
                  if (st === 'graded') {
                    return {
                      icon: 'grading',
                      iconStyle: { background: 'rgba(83,74,183,0.1)', color: '#534ab7' },
                      pill: {
                        label: 'Graded',
                        style: {
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(83,74,183,0.1)',
                          color: '#534ab7',
                          border: '1px solid rgba(83,74,183,0.2)',
                          flexShrink: 0,
                        },
                      },
                      linkTo: `/courses/${id}/assignments/${a.id}/review`,
                      disabled: false,
                    };
                  }
                  if (st === 'overdue') {
                    return {
                      icon: 'assignment_late',
                      iconStyle: { background: 'rgba(232,90,48,0.1)', color: '#d85a30' },
                      pill: {
                        label: 'Overdue',
                        style: {
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(232,90,48,0.1)',
                          color: '#d85a30',
                          border: '1px solid rgba(232,90,48,0.2)',
                          flexShrink: 0,
                        },
                      },
                      linkTo: `/courses/${id}/assignments/${a.id}/submit`,
                      disabled: false,
                    };
                  }
                  return {
                    icon: 'lock_clock',
                    iconStyle: { background: 'rgba(182,147,169,0.1)', color: '#9c8a8e' },
                    pill: {
                      label: 'Upcoming',
                      style: {
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'rgba(182,147,169,0.1)',
                        color: '#9c8a8e',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                      },
                    },
                    linkTo: null,
                    disabled: true,
                  };
                })();

                const meta = [
                  a.dueDate ? `Due ${formatDateShort(a.dueDate)}` : null,
                  a.maxScore != null ? `${a.maxScore} marks` : null,
                  st === 'submitted' ? 'Awaiting grade' : null,
                  st === 'graded' && a.submissionStatus?.score != null
                    ? `Graded: ${a.submissionStatus.score} / ${a.maxScore}`
                    : null,
                  st === 'due_soon' ? 'Not submitted' : null,
                  st === 'overdue' ? 'Not submitted' : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                const inner = (
                  <>
                    <div className="material-icon" style={baseMeta.iconStyle}>
                      <span className="material-symbols-rounded icon">{baseMeta.icon}</span>
                    </div>
                    <div className="material-info">
                      <div className="material-name">{a.title}</div>
                      <div className="material-meta">{meta}</div>
                    </div>
                    <span style={baseMeta.pill.style}>{baseMeta.pill.label}</span>
                  </>
                );

                const cardStyle = baseMeta.disabled ? { cursor: 'default', opacity: 0.7 } : undefined;
                return baseMeta.linkTo ? (
                  <Link key={a.id} to={baseMeta.linkTo} className="material-item" style={cardStyle}>
                    {inner}
                  </Link>
                ) : (
                  <div key={a.id} className="material-item" style={cardStyle}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DISCUSSION */}
        <div className={`detail-tab-panel${activeTab === 'discussion' ? ' active' : ''}`}>
          {discView === 'list' && (
            <div>
              <div className="disc-toolbar">
                <div className="disc-count">{posts.length} posts</div>
                <button type="button" className="disc-new-btn" onClick={() => setDiscView('new')}>
                  <span className="material-symbols-rounded icon">add</span> New post
                </button>
              </div>

              {posts.length === 0 ? (
                <p className="course-list-empty">No posts yet. Be the first to post.</p>
              ) : (
                <div className="disc-list-wrap">
                  {posts.map(p => (
                    <div
                      key={p.id}
                      className="disc-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedPostId(p.id);
                        setDiscView('detail');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPostId(p.id);
                          setDiscView('detail');
                        }
                      }}
                    >
                      <div
                        className="disc-avatar"
                        style={avatarStyleFor(p.author?.name, p.authorRole)}
                      >
                        {initialsFor(p.author?.name)}
                      </div>
                      <div className="disc-info">
                        <div className="disc-title">{p.title}</div>
                        <div className="disc-meta">
                          {p.author?.name} · {p.authorRole === 'instructor' ? 'Instructor' : 'Student'} ·{' '}
                          {formatDateShort(p.createdAt)}
                        </div>
                        <div className="disc-preview">{p.body}</div>
                      </div>
                      <div className="disc-reply-count">
                        <span className="material-symbols-rounded icon">chat_bubble</span>
                        {p.replies?.length ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {discView === 'detail' && selectedPost && (
            <div>
              <button
                type="button"
                className="disc-back-btn"
                onClick={() => {
                  setDiscView('list');
                  setSelectedPostId(null);
                  setReplyDraft('');
                }}
              >
                <span className="material-symbols-rounded icon">arrow_back</span>
                Back to discussions
              </button>

              <div className="disc-post-card">
                <div className="disc-post-title">{selectedPost.title}</div>
                <div className="disc-post-header">
                  <div
                    className="disc-avatar"
                    style={avatarStyleFor(selectedPost.author?.name, selectedPost.authorRole)}
                  >
                    {initialsFor(selectedPost.author?.name)}
                  </div>
                  <div className="disc-post-author">
                    {selectedPost.author?.name}
                    <span className="disc-post-role">
                      · {selectedPost.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                    </span>
                  </div>
                  <div className="disc-post-date">{formatDateShort(selectedPost.createdAt)}</div>
                </div>
                <div className="disc-post-body">{selectedPost.body}</div>
              </div>

              <div className="disc-replies-heading">{selectedPost.replies?.length ?? 0} replies</div>
              <div>
                {(selectedPost.replies ?? []).map(r => (
                  <div key={r.id} className="disc-reply-item">
                    <div
                      className="disc-avatar"
                      style={avatarStyleFor(r.author?.name, r.authorRole)}
                    >
                      {initialsFor(r.author?.name)}
                    </div>
                    <div className="disc-info">
                      <div className="disc-reply-meta">
                        <div className="disc-reply-author">{r.author?.name}</div>
                        <div className="disc-reply-role">
                          · {r.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                        </div>
                        <div className="disc-reply-date">{formatDateShort(r.createdAt)}</div>
                      </div>
                      <div className="disc-reply-body">{r.body}</div>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="disc-reply-box">
                  <div className="disc-avatar" style={avatarStyleFor(user.name, user.role)}>
                    {initialsFor(user.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className="disc-reply-input"
                      placeholder="Write a reply…"
                      rows={3}
                      value={replyDraft}
                      onChange={e => setReplyDraft(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        type="button"
                        className="disc-submit-btn"
                        onClick={() => {
                          const body = replyDraft.trim();
                          if (!body) return;
                          const reply = createMockReply(selectedPost.id, { body }, user);
                          setPosts(prev =>
                            prev.map(p =>
                              p.id === selectedPost.id
                                ? { ...p, replies: [...(p.replies ?? []), reply] }
                                : p,
                            ),
                          );
                          setReplyDraft('');
                        }}
                      >
                        <span className="material-symbols-rounded icon">send</span> Post reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="course-list-empty">Log in to reply.</p>
              )}
            </div>
          )}

          {discView === 'new' && (
            <div>
              <button
                type="button"
                className="disc-back-btn"
                onClick={() => {
                  setDiscView('list');
                  setNewTitle('');
                  setNewBody('');
                }}
              >
                <span className="material-symbols-rounded icon">arrow_back</span>
                Back to discussions
              </button>

              <div className="disc-post-card">
                <div style={{ fontSize: 16, color: 'var(--text-dark)', marginBottom: 16 }}>
                  New discussion post
                </div>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label htmlFor="new-post-title">Title</label>
                  <input
                    id="new-post-title"
                    type="text"
                    placeholder="What's your question or topic?"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label htmlFor="new-post-body">Post</label>
                  <textarea
                    id="new-post-body"
                    className="disc-reply-input"
                    rows={5}
                    placeholder="Share your question or idea…"
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="disc-submit-btn"
                    onClick={() => {
                      if (!user) return;
                      const title = newTitle.trim();
                      const body = newBody.trim();
                      if (!title || !body) return;
                      const post = createMockPost(id, { title, body }, user);
                      setPosts(prev => [post, ...prev]);
                      setNewTitle('');
                      setNewBody('');
                      setDiscView('list');
                    }}
                    disabled={!user}
                    style={!user ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    <span className="material-symbols-rounded icon">send</span> Post
                  </button>
                </div>
                {!user && <p className="course-list-empty">Log in to post.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    <div>
      <Link to="/courses">← Back to Courses</Link>

      <h1>{course.code} — {course.name}</h1>
      <p>{course.description}</p>
      <p>Instructor: {course.instructor?.name}</p>

      <section>
        <h2>Announcements</h2>
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          <ul>
            {announcements.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong> — {a.body}
                <small> by {a.author?.name}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Materials</h2>
        {materials.length === 0 ? (
          <p>No materials uploaded yet.</p>
        ) : (
          <ul>
            {materials.map((m) => (
              <li key={m.id}>
                <a href={m.url} target="_blank" rel="noreferrer">{m.filename}</a>
                {m.section && <span> — Section: {m.section}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Assignments</h2>
        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <ul>
            {assignments.map((a) => (
              <li key={a.id}>
                <Link to={`/courses/${id}/assignments/${a.id}/submit`}>
                  {a.title}
                </Link>
                {a.dueDate && <span> — Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Forum</h2>
        <Link to={`/courses/${id}/forum`}>Go to Forum</Link>
      </section>
    </div>
  );
}
