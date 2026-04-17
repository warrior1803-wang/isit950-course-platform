import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { announcementApi, assignmentApi, courseApi, forumApi } from '../api';

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
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeMeta(m) {
  const t = String(m.fileType || '').toLowerCase();
  if (t === 'pdf') return { label: 'PDF', icon: 'picture_as_pdf', cls: 'mi-pdf' };
  if (t === 'doc' || t === 'docx') return { label: 'Word', icon: 'description', cls: 'mi-doc' };
  if (t === 'ppt' || t === 'pptx') return { label: 'PowerPoint', icon: 'slideshow', cls: 'mi-ppt' };
  if (t === 'zip') return { label: 'ZIP', icon: 'folder_zip', cls: 'mi-zip' };
  return { label: 'File', icon: 'draft', cls: '' };
}

function assignmentStatus(a) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const open = new Date(a.openDate || a.dueDate || Date.now());
  const due = new Date(a.dueDate || Date.now());
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

function normalizeCourse(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    description: raw.description,
    schedule: raw.schedule,
    location: raw.location,
    coverImageUrl: raw.coverImageUrl ?? null,
    instructor: {
      name: raw.instructorName ?? raw.instructor?.name ?? 'Instructor',
    },
    enrolledCount: raw.enrolmentCount ?? raw.enrolledCount ?? 0,
    materialsCount: raw.materialsCount ?? 0,
    assignmentCount: raw.assignmentCount ?? 0,
    pendingCount: raw.pendingCount ?? 0,
  };
}

function normalizeSectionLabel(section) {
  return String(section || 'Materials')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s*[‐-―–—]\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionGroupKey(section) {
  return normalizeSectionLabel(section)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeMaterial(raw) {
  if (!raw) return null;
  const filename = raw.filename || raw.fileName || 'Untitled file';
  const ext = filename.includes('.') ? filename.split('.').pop() : '';
  const sectionLabel = normalizeSectionLabel(raw.section);
  return {
    id: raw.id,
    filename,
    fileType: raw.fileType || ext,
    size: raw.size ?? raw.fileSizeBytes ?? null,
    section: sectionLabel,
    sectionKey: sectionGroupKey(sectionLabel),
    uploadedAt: raw.uploadedAt || raw.createdAt || null,
    url: raw.url || raw.fileUrl || null,
  };
}

function normalizeAnnouncement(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body || raw.content || '',
    createdAt: raw.createdAt || raw.postedAt || raw.updatedAt || null,
    author: {
      name: raw.author?.name || raw.authorName || 'Instructor',
    },
  };
}

function normalizeAssignment(raw) {
  if (!raw) return null;
  const submission = raw.submissionStatus || raw.submission || null;
  return {
    id: raw.id,
    title: raw.title,
    dueDate: raw.dueDate || null,
    openDate: raw.openDate || raw.createdAt || raw.dueDate || null,
    maxScore: raw.maxScore ?? raw.totalMarks ?? null,
    submissionStatus: submission
      ? {
          ...submission,
          score: submission.score ?? null,
        }
      : null,
  };
}

function normalizeReply(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    body: raw.body || raw.content || '',
    createdAt: raw.createdAt || raw.postedAt || new Date().toISOString(),
    authorRole: String(raw.authorRole || raw.author?.role || '').toLowerCase(),
    author: {
      name: raw.author?.name || raw.authorName || 'User',
    },
  };
}

function normalizePost(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body || raw.content || '',
    createdAt: raw.createdAt || raw.postedAt || new Date().toISOString(),
    authorRole: String(raw.authorRole || raw.author?.role || '').toLowerCase(),
    author: {
      name: raw.author?.name || raw.authorName || 'User',
    },
    replies: Array.isArray(raw.replies) ? raw.replies.map(normalizeReply).filter(Boolean) : [],
  };
}

function resolveMaterialUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `http://localhost:8080${url}`;
  return `http://localhost:8080/${url}`;
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
  const [courseError, setCourseError] = useState('');
  const [materialsError, setMaterialsError] = useState('');
  const [announcementsError, setAnnouncementsError] = useState('');
  const [assignmentsError, setAssignmentsError] = useState('');
  const [discussionError, setDiscussionError] = useState('');
  const [postingError, setPostingError] = useState('');
  const [discView, setDiscView] = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const { user } = useAuth();

  const activeTab = searchParams.get('tab') || 'materials';

  function changeTab(tab) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      if (tab !== 'discussion') {
        next.delete('view');
        next.delete('post');
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCourseData() {
      setLoading(true);
      setCourseError('');
      setMaterialsError('');
      setAnnouncementsError('');
      setAssignmentsError('');
      setDiscussionError('');

      const results = await Promise.allSettled([
        courseApi.get(id),
        api.get(`/courses/${id}/materials`),
        announcementApi.list(id),
        assignmentApi.list(id),
        forumApi.listPosts(id),
      ]);

      if (cancelled) return;

      const [courseRes, materialsRes, announcementsRes, assignmentsRes, postsRes] = results;

      if (courseRes.status === 'fulfilled') {
        setCourse(normalizeCourse(courseRes.value.data?.data ?? courseRes.value.data));
      } else {
        setCourse(null);
        setCourseError(courseRes.reason?.response?.data?.message || 'Failed to load course.');
      }

      if (materialsRes.status === 'fulfilled') {
        setMaterials((materialsRes.value.data?.data ?? []).map(normalizeMaterial).filter(Boolean));
      } else {
        setMaterials([]);
        setMaterialsError(materialsRes.reason?.response?.data?.message || 'Materials unavailable.');
      }

      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements((announcementsRes.value.data?.data ?? []).map(normalizeAnnouncement).filter(Boolean));
      } else {
        setAnnouncements([]);
        setAnnouncementsError(
          announcementsRes.reason?.response?.data?.message || 'Announcements unavailable.',
        );
      }

      if (assignmentsRes.status === 'fulfilled') {
        setAssignments((assignmentsRes.value.data?.data ?? []).map(normalizeAssignment).filter(Boolean));
      } else {
        setAssignments([]);
        setAssignmentsError(assignmentsRes.reason?.response?.data?.message || 'Assignments unavailable.');
      }

      if (postsRes.status === 'fulfilled') {
        setPosts((postsRes.value.data?.data ?? []).map(normalizePost).filter(Boolean));
      } else {
        setPosts([]);
        setDiscussionError(postsRes.reason?.response?.data?.message || 'Discussion unavailable.');
      }

      setLoading(false);
    }

    loadCourseData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
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
        return;
      }
    }

    setDiscView('list');
    setSelectedPostId(null);
  }, [location.search, loading]);

  const selectedPost = useMemo(
    () => posts.find(post => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const materialSections = useMemo(() => {
    const order = [];
    const map = new Map();
    materials.forEach(material => {
      const key = material.sectionKey || sectionGroupKey(material.section);
      if (!map.has(key)) {
        map.set(key, { section: material.section || 'Materials', items: [] });
        order.push(key);
      }
      map.get(key).items.push(material);
    });
    return order.map(key => map.get(key));
  }, [materials]);

  async function handleMaterialDownload(material) {
    const url = resolveMaterialUrl(material.url);
    if (!url) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to download file.');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = material.filename || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setMaterialsError(err.message || 'Failed to download file.');
    }
  }

  async function handleReplySubmit() {
    const body = replyDraft.trim();
    if (!body || !selectedPost) return;
    setPostingError('');

    try {
      const res = await forumApi.createReply(selectedPost.id, { body });
      const reply = normalizeReply(res.data?.data ?? res.data);
      setPosts(prev =>
        prev.map(post =>
          post.id === selectedPost.id
            ? { ...post, replies: [...(post.replies ?? []), reply] }
            : post,
        ),
      );
      setReplyDraft('');
    } catch (err) {
      setPostingError(err.response?.data?.message || 'Failed to post reply.');
    }
  }

  async function handleCreatePost() {
    if (!user) return;
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) return;
    setPostingError('');

    try {
      const res = await forumApi.createPost(id, { title, body });
      const post = normalizePost(res.data?.data ?? res.data);
      setPosts(prev => [post, ...prev]);
      setNewTitle('');
      setNewBody('');
      setDiscView('list');
    } catch (err) {
      setPostingError(err.response?.data?.message || 'Failed to create post.');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!course) return <div>{courseError || 'Course not found.'}</div>;

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
                {course.schedule}
              </span>
              <span className="detail-meta-item">
                <span className="material-symbols-rounded icon">location_on</span>
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
        <div className={`detail-tab-panel${activeTab === 'materials' ? ' active' : ''}`}>
          {materialsError && materials.length === 0 ? (
            <p className="course-list-empty">{materialsError}</p>
          ) : materialSections.length === 0 ? (
            <p className="course-list-empty">No materials uploaded yet.</p>
          ) : (
            materialSections.map(section => (
              <div key={section.section}>
                <div className="section-heading">{section.section.replace(':', ' —')}</div>
                <div className="material-list">
                  {section.items.map(material => {
                    const meta = fileTypeMeta(material);
                    return (
                      <div
                        key={material.id}
                        className="material-item"
                        onClick={() => handleMaterialDownload(material)}
                        style={{ cursor: material.url ? 'pointer' : 'default' }}
                      >
                        <div className={`material-icon ${meta.cls}`}>
                          <span className="material-symbols-rounded icon">{meta.icon}</span>
                        </div>
                        <div className="material-info">
                          <div className="material-name">{material.filename}</div>
                          <div className="material-meta">
                            {meta.label}
                            {material.size ? ` · ${formatBytes(material.size)}` : ''}
                            {material.uploadedAt ? ` · Uploaded ${formatDateShort(material.uploadedAt)}` : ''}
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

        <div className={`detail-tab-panel${activeTab === 'announcements' ? ' active' : ''}`}>
          {announcementsError && announcements.length === 0 ? (
            <p className="course-list-empty">{announcementsError}</p>
          ) : announcements.length === 0 ? (
            <p className="course-list-empty">No announcements yet.</p>
          ) : (
            <div className="ann-list">
              {announcements.map((announcement, idx) => (
                <div key={announcement.id} className="ann-item">
                  <div className="ann-header">
                    <div className="ann-title">
                      {announcement.title}
                      {idx < 2 && <span className="ann-new">New</span>}
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

        <div className={`detail-tab-panel${activeTab === 'assignments' ? ' active' : ''}`}>
          {assignmentsError && assignments.length === 0 ? (
            <p className="course-list-empty">{assignmentsError}</p>
          ) : assignments.length === 0 ? (
            <p className="course-list-empty">No assignments yet.</p>
          ) : (
            <div className="material-list">
              {assignments.map(assignment => {
                const status = assignmentStatus(assignment);
                const baseMeta = (() => {
                  if (status === 'due_soon') {
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
                      linkTo: `/courses/${id}/assignments/${assignment.id}/submit`,
                      disabled: false,
                    };
                  }
                  if (status === 'submitted') {
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
                      linkTo: `/courses/${id}/assignments/${assignment.id}/review`,
                      disabled: false,
                    };
                  }
                  if (status === 'graded') {
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
                      linkTo: `/courses/${id}/assignments/${assignment.id}/review`,
                      disabled: false,
                    };
                  }
                  if (status === 'overdue') {
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
                      linkTo: `/courses/${id}/assignments/${assignment.id}/submit`,
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
                  assignment.dueDate ? `Due ${formatDateShort(assignment.dueDate)}` : null,
                  assignment.maxScore != null ? `${assignment.maxScore} marks` : null,
                  status === 'submitted' ? 'Awaiting grade' : null,
                  status === 'graded' && assignment.submissionStatus?.score != null
                    ? `Graded: ${assignment.submissionStatus.score} / ${assignment.maxScore}`
                    : null,
                  status === 'due_soon' || status === 'overdue' ? 'Not submitted' : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                const inner = (
                  <>
                    <div className="material-icon" style={baseMeta.iconStyle}>
                      <span className="material-symbols-rounded icon">{baseMeta.icon}</span>
                    </div>
                    <div className="material-info">
                      <div className="material-name">{assignment.title}</div>
                      <div className="material-meta">{meta}</div>
                    </div>
                    <span style={baseMeta.pill.style}>{baseMeta.pill.label}</span>
                  </>
                );

                const cardStyle = baseMeta.disabled ? { cursor: 'default', opacity: 0.7 } : undefined;
                return baseMeta.linkTo ? (
                  <Link key={assignment.id} to={baseMeta.linkTo} className="material-item" style={cardStyle}>
                    {inner}
                  </Link>
                ) : (
                  <div key={assignment.id} className="material-item" style={cardStyle}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`detail-tab-panel${activeTab === 'discussion' ? ' active' : ''}`}>
          {discView === 'list' && (
            <div>
              <div className="disc-toolbar">
                <div className="disc-count">{posts.length} posts</div>
                <button type="button" className="disc-new-btn" onClick={() => setDiscView('new')}>
                  <span className="material-symbols-rounded icon">add</span> New post
                </button>
              </div>

              {discussionError && posts.length === 0 ? (
                <p className="course-list-empty">{discussionError}</p>
              ) : posts.length === 0 ? (
                <p className="course-list-empty">No posts yet. Be the first to post.</p>
              ) : (
                <div className="disc-list-wrap">
                  {posts.map(post => (
                    <div
                      key={post.id}
                      className="disc-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setDiscView('detail');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPostId(post.id);
                          setDiscView('detail');
                        }
                      }}
                    >
                      <div className="disc-avatar" style={avatarStyleFor(post.author?.name, post.authorRole)}>
                        {initialsFor(post.author?.name)}
                      </div>
                      <div className="disc-info">
                        <div className="disc-title">{post.title}</div>
                        <div className="disc-meta">
                          {post.author?.name} · {post.authorRole === 'instructor' ? 'Instructor' : 'Student'} ·{' '}
                          {formatDateShort(post.createdAt)}
                        </div>
                        <div className="disc-preview">{post.body}</div>
                      </div>
                      <div className="disc-reply-count">
                        <span className="material-symbols-rounded icon">chat_bubble</span>
                        {post.replies?.length ?? 0}
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
                  setPostingError('');
                }}
              >
                <span className="material-symbols-rounded icon">arrow_back</span>
                Back to discussions
              </button>

              <div className="disc-post-card">
                <div className="disc-post-title">{selectedPost.title}</div>
                <div className="disc-post-header">
                  <div className="disc-avatar" style={avatarStyleFor(selectedPost.author?.name, selectedPost.authorRole)}>
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
                {(selectedPost.replies ?? []).map(reply => (
                  <div key={reply.id} className="disc-reply-item">
                    <div className="disc-avatar" style={avatarStyleFor(reply.author?.name, reply.authorRole)}>
                      {initialsFor(reply.author?.name)}
                    </div>
                    <div className="disc-info">
                      <div className="disc-reply-meta">
                        <div className="disc-reply-author">{reply.author?.name}</div>
                        <div className="disc-reply-role">
                          · {reply.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                        </div>
                        <div className="disc-reply-date">{formatDateShort(reply.createdAt)}</div>
                      </div>
                      <div className="disc-reply-body">{reply.body}</div>
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
                      <button type="button" className="disc-submit-btn" onClick={handleReplySubmit}>
                        <span className="material-symbols-rounded icon">send</span> Post reply
                      </button>
                    </div>
                    {postingError && <p className="course-list-empty">{postingError}</p>}
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
                  setPostingError('');
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
                    onClick={handleCreatePost}
                    disabled={!user}
                    style={!user ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    <span className="material-symbols-rounded icon">send</span> Post
                  </button>
                </div>
                {!user && <p className="course-list-empty">Log in to post.</p>}
                {postingError && <p className="course-list-empty">{postingError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
