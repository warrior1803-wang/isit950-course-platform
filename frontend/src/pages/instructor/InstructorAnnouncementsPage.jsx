import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { announcementApi, courseApi } from '../../api';
import { useAuth } from '../../lib/auth';
import { getApiErrorState } from '../../lib/apiState';

const ALL_COURSES = 'ALL';
const DRAFT_STORAGE_KEY = 'ccp.instructor.announcementDrafts';

function unwrapApiData(response) {
  return response?.data?.data ?? response?.data ?? [];
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTimestamp(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function normalizeCourse(raw) {
  return {
    id: raw.id,
    code: raw.code || `Course ${raw.id}`,
    name: raw.name || 'Untitled course',
    studentCount: raw.enrolmentCount ?? raw.studentCount ?? 0,
  };
}

function normalizeAnnouncement(raw, course) {
  return {
    id: raw.id,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    title: raw.title || 'Untitled announcement',
    body: raw.body || '',
    createdAt: raw.createdAt || null,
    authorName: raw.author?.name || 'Instructor',
    studentCount: course.studentCount,
  };
}

function normalizeDraft(raw, courseMap) {
  const course = courseMap.get(Number(raw.courseId));
  if (!course) return null;
  return {
    id: raw.id,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    title: raw.title || 'Untitled draft',
    body: raw.body || '',
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function makeDraftPayload(values, existingId) {
  return {
    id: existingId || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    courseId: Number(values.courseId),
    title: values.title.trim(),
    body: values.body.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function readDraftStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftStore(nextStore) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextStore));
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function AnnouncementCard({ item, kind, onEdit, onDelete, onPublish, busy }) {
  return (
    <article className="inst-ann-item">
      <div className="inst-ann-header">
        <div className="inst-ann-title">{item.title}</div>

        <div className="inst-ann-actions">
          {kind === 'draft' && (
            <button
              type="button"
              onClick={onPublish}
              disabled={busy}
              className="btn-outline inst-ann-publish-btn"
            >
              {busy ? <ButtonSpinner /> : 'Publish'}
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="inst-mgmt-btn"
            aria-label={`Edit ${item.title}`}
          >
            <span className="material-symbols-rounded icon">edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inst-mgmt-btn"
            aria-label={`Delete ${item.title}`}
          >
            {busy ? <ButtonSpinner /> : <span className="material-symbols-rounded icon">delete_outline</span>}
          </button>
        </div>
      </div>

      <div className="inst-ann-meta">
        <span
          className={`inst-ann-badge ${kind === 'published' ? 'published' : 'draft'}`}
        >
          {kind === 'published' ? 'Published' : 'Draft'}
        </span>
        <span className="course-chip">
          <span className="material-symbols-rounded icon inst-ann-chip-icon">menu_book</span>
          {item.courseCode}
        </span>
        <span className="inst-ann-date">
          {kind === 'published'
            ? `${formatDate(item.createdAt)}${item.studentCount ? ` · ${item.studentCount} students reached` : ''}`
            : `Last edited ${formatTimestamp(item.updatedAt)}`}
        </span>
      </div>

      <p className={`inst-ann-body ${kind === 'draft' ? 'draft-body' : ''}`}>
        {item.body}
      </p>
    </article>
  );
}

export default function InstructorAnnouncementsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(ALL_COURSES);
  const [published, setPublished] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);

  const courseMap = useMemo(
    () => new Map(courses.map(course => [Number(course.id), course])),
    [courses],
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const res = await courseApi.list();
        if (cancelled) return;
        const nextCourses = (unwrapApiData(res) || []).map(normalizeCourse);
        setCourses(nextCourses);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorState(err));
          setCourses([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || courses.length === 0) {
      setDrafts([]);
      if (courses.length === 0) setPublished([]);
      return;
    }

    const store = readDraftStore();
    const rawDrafts = Array.isArray(store[user.id]) ? store[user.id] : [];
    setDrafts(
      rawDrafts
        .map(draft => normalizeDraft(draft, courseMap))
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()),
    );
  }, [user?.id, courses, courseMap]);

  useEffect(() => {
    if (courses.length === 0) return;

    let cancelled = false;

    async function loadAnnouncements() {
      setRefreshing(true);
      setError(null);
      try {
        const responses = await Promise.all(courses.map(course => announcementApi.list(course.id)));
        if (cancelled) return;
        const nextPublished = responses
          .flatMap((response, index) => {
            const course = courses[index];
            const items = Array.isArray(unwrapApiData(response)) ? unwrapApiData(response) : [];
            return items.map(item => normalizeAnnouncement(item, course));
          })
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setPublished(nextPublished);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorState(err));
          setPublished([]);
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    }

    loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, [courses]);

  const filteredPublished = useMemo(
    () => (
      selectedCourseId === ALL_COURSES
        ? published
        : published.filter(item => item.courseId === Number(selectedCourseId))
    ),
    [published, selectedCourseId],
  );

  const filteredDrafts = useMemo(
    () => (
      selectedCourseId === ALL_COURSES
        ? drafts
        : drafts.filter(item => item.courseId === Number(selectedCourseId))
    ),
    [drafts, selectedCourseId],
  );

  function openCreateModal() {
    setModal({
      mode: 'create',
      itemType: 'draft',
      values: {
        courseId: selectedCourseId === ALL_COURSES ? String(courses[0]?.id || '') : String(selectedCourseId),
        title: '',
        body: '',
      },
      error: '',
      saving: false,
    });
  }

  function openEditPublished(item) {
    setModal({
      mode: 'edit',
      itemType: 'published',
      itemId: item.id,
      values: {
        courseId: String(item.courseId),
        title: item.title,
        body: item.body,
      },
      error: '',
      saving: false,
    });
  }

  function openEditDraft(item) {
    setModal({
      mode: 'edit',
      itemType: 'draft',
      itemId: item.id,
      values: {
        courseId: String(item.courseId),
        title: item.title,
        body: item.body,
      },
      error: '',
      saving: false,
    });
  }

  function updateModalField(field, value) {
    setModal(current => (
      current
        ? {
            ...current,
            values: {
              ...current.values,
              [field]: value,
            },
            error: '',
          }
        : current
    ));
  }

  function persistDrafts(nextDrafts) {
    setDrafts(nextDrafts);
    const store = readDraftStore();
    store[user.id] = nextDrafts.map(draft => ({
      id: draft.id,
      courseId: draft.courseId,
      title: draft.title,
      body: draft.body,
      updatedAt: draft.updatedAt,
    }));
    writeDraftStore(store);
  }

  function saveDraftLocally(values, existingId) {
    const payload = makeDraftPayload(values, existingId);
    const draft = normalizeDraft(payload, courseMap);
    if (!draft) {
      throw new Error('Please select a valid course.');
    }

    const nextDrafts = existingId
      ? drafts.map(item => (item.id === existingId ? draft : item))
      : [draft, ...drafts];

    persistDrafts(
      nextDrafts.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()),
    );
  }

  async function reloadPublishedAnnouncements() {
    const responses = await Promise.all(courses.map(course => announcementApi.list(course.id)));
    const nextPublished = responses
      .flatMap((response, index) => {
        const course = courses[index];
        const items = Array.isArray(unwrapApiData(response)) ? unwrapApiData(response) : [];
        return items.map(item => normalizeAnnouncement(item, course));
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setPublished(nextPublished);
  }

  async function handlePublish(values, options = {}) {
    const body = {
      title: values.title.trim(),
      body: values.body.trim(),
    };
    const courseId = Number(values.courseId);

    if (!body.title) {
      throw new Error('Announcement title is required.');
    }
    if (!body.body) {
      throw new Error('Announcement body is required.');
    }
    if (!courseId) {
      throw new Error('Please select a course.');
    }

    if (options.editPublishedId) {
      await announcementApi.update(courseId, options.editPublishedId, body);
    } else {
      await announcementApi.create(courseId, body);
    }

    if (options.removeDraftId) {
      persistDrafts(drafts.filter(item => item.id !== options.removeDraftId));
    }

    await reloadPublishedAnnouncements();
  }

  async function handleModalSave(action) {
    if (!modal) return;
    setModal(current => (current ? { ...current, saving: true, error: '' } : current));

    try {
      if (action === 'draft') {
        saveDraftLocally(modal.values, modal.itemType === 'draft' ? modal.itemId : undefined);
      } else if (modal.itemType === 'published') {
        await handlePublish(modal.values, { editPublishedId: modal.itemId });
      } else if (modal.itemType === 'draft' && modal.mode === 'edit') {
        await handlePublish(modal.values, { removeDraftId: modal.itemId });
      } else {
        await handlePublish(modal.values);
      }
      setModal(null);
    } catch (err) {
      const message = getErrorMessage(err, action === 'draft' ? 'Failed to save draft.' : 'Failed to publish announcement.');
      setModal(current => (current ? { ...current, saving: false, error: message } : current));
      setToast(message);
      return;
    }

    setToast(action === 'draft' ? 'Draft saved.' : 'Announcement saved.');
  }

  async function handleDeletePublished(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setBusyItemId(`published-${item.courseId}-${item.id}`);
    try {
      await announcementApi.delete(item.courseId, item.id);
      await reloadPublishedAnnouncements();
    } catch (err) {
      setToast(getErrorMessage(err, 'Failed to delete announcement.'));
    } finally {
      setBusyItemId(null);
    }
  }

  function handleDeleteDraft(item) {
    if (!window.confirm(`Delete draft "${item.title}"?`)) return;
    persistDrafts(drafts.filter(draft => draft.id !== item.id));
  }

  async function handlePublishDraft(item) {
    setBusyItemId(`draft-${item.id}`);
    try {
      await handlePublish(
        {
          courseId: String(item.courseId),
          title: item.title,
          body: item.body,
        },
        { removeDraftId: item.id },
      );
      setToast('Draft published.');
    } catch (err) {
      setToast(getErrorMessage(err, 'Failed to publish draft.'));
    } finally {
      setBusyItemId(null);
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
    <>
      <div className="inst-ann-page">
        <div className="inst-page-header">
          <div>
            <div className="page-title">Announcements</div>
            <div className="page-sub">Manage announcements across all your courses</div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={courses.length === 0}
            className="btn-primary"
          >
            <span className="inst-ann-plus">+</span>
            New announcement
          </button>
        </div>

        <div className="grading-filter-row" style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setSelectedCourseId(ALL_COURSES)}
            className={`grading-filter-btn${selectedCourseId === ALL_COURSES ? ' active' : ''}`}
          >
            All courses
          </button>
          {courses.map(course => (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedCourseId(String(course.id))}
              className={`grading-filter-btn${String(selectedCourseId) === String(course.id) ? ' active' : ''}`}
            >
              {course.code}
            </button>
          ))}
        </div>

        {error && (
          error.kind === 'upgrade' ? (
            <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
              This feature requires a membership. <a href="/membership" className="underline">Upgrade</a>
            </div>
          ) : (
            <ErrorState message={error.message} />
          )
        )}

        <section className="inst-ann-section">
          <div className="inst-ann-section-head">
            <div className="inst-ann-section-title">Published</div>
            {refreshing && <span className="inst-ann-refreshing">Refreshing…</span>}
          </div>

          <div className="inst-ann-list">
            {filteredPublished.length === 0 ? (
              <EmptyState
                icon="notifications"
                title="No announcements created yet"
              />
            ) : (
              filteredPublished.map(item => (
                <AnnouncementCard
                  key={`published-${item.courseId}-${item.id}`}
                  item={item}
                  kind="published"
                  onEdit={() => openEditPublished(item)}
                  onDelete={() => handleDeletePublished(item)}
                  busy={busyItemId === `published-${item.courseId}-${item.id}`}
                />
              ))
            )}
          </div>
        </section>

        <section className="inst-ann-section inst-ann-section-drafts">
          <div className="inst-ann-section-title">Drafts</div>

          <div className="inst-ann-list">
            {filteredDrafts.length === 0 ? (
              <EmptyState
                icon="notifications"
                title="No drafts saved"
                subtitle="Use the modal to save unfinished announcements and publish them when the content is ready."
              />
            ) : (
              filteredDrafts.map(item => (
                <AnnouncementCard
                  key={`draft-${item.id}`}
                  item={item}
                  kind="draft"
                  onEdit={() => openEditDraft(item)}
                  onDelete={() => handleDeleteDraft(item)}
                  onPublish={() => handlePublishDraft(item)}
                  busy={busyItemId === `draft-${item.id}`}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={
          modal?.itemType === 'published'
            ? 'Edit announcement'
            : modal?.mode === 'edit'
            ? 'Edit draft'
              : 'New announcement'
        }
        footer={modal ? (
          <>
            {modal.itemType !== 'published' && (
              <button
                type="button"
              disabled={modal.saving}
              onClick={() => handleModalSave('draft')}
              className="btn-outline"
            >
                {modal.saving ? <ButtonSpinner /> : 'Save as draft'}
            </button>
            )}
            <button
              type="button"
              disabled={modal.saving}
              onClick={() => handleModalSave('publish')}
              className="btn-primary"
            >
              {modal.saving ? <ButtonSpinner /> : (
                <span className="material-symbols-rounded icon">
                  {modal.itemType === 'published' ? 'save' : 'send'}
                </span>
              )}
              {modal.itemType === 'published'
                ? 'Save changes'
                : modal.mode === 'edit'
                  ? 'Publish draft'
                  : 'Publish'}
            </button>
          </>
        ) : null}
      >
        {modal && (
          <div className="inst-ann-modal-form">
            {modal.error && (
              <div className="inst-ann-error">
                {modal.error}
              </div>
            )}

            <label className="field">
              <span>COURSE</span>
              <select
                value={modal.values.courseId}
                disabled={modal.itemType === 'published'}
                onChange={event => updateModalField('courseId', event.target.value)}
                className="inst-ann-select"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>TITLE</span>
              <input
                type="text"
                value={modal.values.title}
                onChange={event => updateModalField('title', event.target.value)}
                placeholder="Announcement title…"
                className="auth-input inst-ann-input"
              />
            </label>

            <label className="field">
              <span>CONTENT</span>
              <textarea
                rows="5"
                value={modal.values.body}
                onChange={event => updateModalField('body', event.target.value)}
                placeholder="Write your announcement…"
                className="grade-textarea"
              />
            </label>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="inst-ann-toast">
          {toast}
        </div>
      )}
    </>
  );
}
