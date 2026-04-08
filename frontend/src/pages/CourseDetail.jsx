// Sprint 2: mock data — swap the import block for real axios calls in Sprint 3.
// TODO Sprint 3: replace mock imports with → import { courseApi, materialApi, announcementApi, assignmentApi } from '../api';
//                and restore Promise.all([courseApi.get(id), materialApi.list(id), ...])
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getMockCourse } from '../mock/courses';
import { getMockMaterials } from '../mock/materials';
import { getMockAnnouncements } from '../mock/announcements';
import { getMockAssignments } from '../mock/assignments';
import { createMockPost, createMockReply, getMockPosts } from '../mock/forum';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80',
];

function heroUrlFor(course) {
  if (course.coverImageUrl) return course.coverImageUrl;
  return HERO_IMAGES[(course.id - 1) % HERO_IMAGES.length];
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeMeta(m) {
  const t = (m.fileType || '').toLowerCase();
  if (t === 'pdf') return { label: 'PDF', icon: 'picture_as_pdf', cls: 'mi-pdf' };
  if (t === 'doc') return { label: 'Word', icon: 'description', cls: 'mi-doc' };
  if (t === 'ppt') return { label: 'PowerPoint', icon: 'slideshow', cls: 'mi-ppt' };
  if (t === 'zip') return { label: 'ZIP', icon: 'folder_zip', cls: 'mi-zip' };
  return { label: 'File', icon: 'draft', cls: '' };
}

function assignmentStatus(a) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const open = new Date(a.openDate);
  const due = new Date(a.dueDate);
  open.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const submitted = !!a.submissionStatus;
  if (submitted) {
    return a.submissionStatus.score == null ? 'submitted' : 'graded';
  }

  if (open > today) return 'upcoming';
  if (due < today) return 'overdue';
  return 'due_soon';
}

function initialsFor(name) {
  return name
    ? name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';
}

function avatarStyleFor(name, role) {
  const key = `${name || '?'}:${role || '?'}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) % 360;
  const bg = `hsla(${h}, 45%, 55%, 0.18)`;
  const fg = `hsl(${h}, 35%, 35%)`;
  return { background: bg, color: fg };
}

export default function CourseDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discView, setDiscView] = useState('list'); // list | detail | new
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');

  // Get active tab from URL params, default to 'materials'
  const activeTab = searchParams.get('tab') || 'materials';

  // Function to change active tab and update URL
  const changeTab = (tab) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Sprint 2: simulate async load with mock data
    const t = setTimeout(() => {
      setCourse(getMockCourse(id));
      setMaterials(getMockMaterials(id));
      setAnnouncements(getMockAnnouncements(id));
      setAssignments(getMockAssignments(id));
      setPosts(getMockPosts(id));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [id]);

  // Deep-link support from /discussions:
  // /courses/:id?tab=discussion&view=new
  // /courses/:id?tab=discussion&post=123
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'discussion') {
      setSearchParams(prev => ({ ...Object.fromEntries(prev), tab: 'discussion' }));
    }

    const view = params.get('view');
    const post = params.get('post');
    if (tab === 'discussion' && view === 'new') {
      setDiscView('new');
      setSelectedPostId(null);
      return;
    }
    if (tab === 'discussion' && post) {
      const pid = Number(post);
      if (!Number.isNaN(pid)) {
        setSelectedPostId(pid);
        setDiscView('detail');
      }
    }
  }, [location.search, loading]);

  const selectedPost = useMemo(
    () => posts.find(p => p.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const materialSections = useMemo(() => {
    const order = [];
    const map = new Map();
    materials.forEach(m => {
      const key = m.section || 'Materials';
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key).push(m);
    });
    return order.map(section => ({ section, items: map.get(section) }));
  }, [materials]);

  function handleMaterialDownload(material) {
    // Sprint 2: mock download behavior
    // In a real app, this would download the actual file from the server
    // For now, we'll simulate a download by creating a blob with sample content
    const fileType = material.fileType;
    let mimeType = 'application/octet-stream';
    let sampleContent = `This is a mock ${fileType.toUpperCase()} file: ${material.filename}\n\nMock content for demonstration purposes.`;

    if (fileType === 'pdf') {
      mimeType = 'application/pdf';
      sampleContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Mock PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000200 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n284\n%%EOF';
    } else if (fileType === 'doc' || fileType === 'docx') {
      mimeType = fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword';
      sampleContent = 'Mock Word document content...';
    } else if (fileType === 'ppt' || fileType === 'pptx') {
      mimeType = fileType === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/vnd.ms-powerpoint';
      sampleContent = 'Mock PowerPoint content...';
    } else if (fileType === 'zip') {
      mimeType = 'application/zip';
      sampleContent = 'Mock ZIP archive content...';
    }

    const blob = new Blob([sampleContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = material.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner />;
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
                Thu 10:00 – 12:00
              </span>
              <span className="detail-meta-item">
                <span className="material-symbols-rounded icon">location_on</span>
                Building 40, Room 205
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
                          {r.authorRole === 'instructor' ? 'Instructor' : 'Student'}
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
    </div>
  );
}
