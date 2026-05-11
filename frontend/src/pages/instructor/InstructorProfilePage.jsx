import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { authApi, courseApi, assignmentApi } from '../../api';

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export default function InstructorProfilePage() {
  const { user } = useAuth();

  // Local copy of the profile data (so edits reflect immediately without
  // needing the AuthContext to expose a setter).
  const [profile, setProfile] = useState(user);

  // Stats
  const [courses, setCourses] = useState([]);
  const [pendingSubs, setPendingSubs] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Name edit form
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

  // Password edit form
  const [editingPassword, setEditingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(res => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setProfile(data);
        setName(data?.name ?? '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive instructor stats from courses + per-course submissions.
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    courseApi
      .list()
      .then(async res => {
        const list = res.data?.data ?? [];
        if (cancelled) return;
        setCourses(list);

        // Pending submissions: prefer the course-level pendingCount when the
        // backend supplies it. Otherwise fall back to scanning each
        // assignment's submission list.
        const hasPendingField = list.some(c => typeof c.pendingCount === 'number');
        if (hasPendingField) {
          const total = list.reduce((sum, c) => sum + (c.pendingCount ?? 0), 0);
          if (!cancelled) setPendingSubs(total);
          return;
        }

        try {
          const perCourse = await Promise.all(
            list.map(async course => {
              const aRes = await assignmentApi.list(course.id).catch(() => null);
              const assignments = aRes?.data?.data ?? [];
              const counts = await Promise.all(
                assignments.map(async a => {
                  const sRes = await assignmentApi
                    .listSubmissions(course.id, a.id)
                    .catch(() => null);
                  const subs = sRes?.data?.data ?? [];
                  return subs.filter(
                    s => s.status !== 'GRADED' && s.grade == null
                  ).length;
                })
              );
              return counts.reduce((a, b) => a + b, 0);
            })
          );
          if (!cancelled) {
            setPendingSubs(perCourse.reduce((a, b) => a + b, 0));
          }
        } catch {
          if (!cancelled) setPendingSubs(0);
        }
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + (c.enrolmentCount ?? 0), 0),
    [courses]
  );

  if (!profile) return null;

  function startEditName() {
    setName(profile.name ?? '');
    setNameError(null);
    setSuccessMessage(null);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setName(profile.name ?? '');
    setNameError(null);
  }

  function startEditPassword() {
    setPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setSuccessMessage(null);
    setEditingPassword(true);
  }

  function cancelEditPassword() {
    setEditingPassword(false);
    setPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  }

  async function saveName(e) {
    e.preventDefault();
    setNameError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name cannot be empty.');
      return;
    }

    setSavingName(true);
    try {
      const res = await authApi.updateMe({ name: trimmedName });
      const updated = res.data?.data ?? res.data;
      setProfile(prev => ({ ...prev, ...updated }));
      setEditingName(false);
      setSuccessMessage('Name updated successfully.');
    } catch (err) {
      setNameError(
        err?.response?.data?.message || err?.message || 'Failed to update name.'
      );
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setSuccessMessage(null);

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updateMe({ password });
      setPassword('');
      setConfirmPassword('');
      setEditingPassword(false);
      setSuccessMessage('Password updated successfully.');
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message || err?.message || 'Failed to update password.'
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <div className="page-title" style={{ marginBottom: 20 }}>My Profile</div>

      <div className="profile-layout">
        {/* Left card: identity + stats */}
        <div className="profile-card">
          <div className="profile-avatar-lg">{getInitials(profile.name)}</div>
          <div className="profile-name">{profile.name}</div>
          <div className="profile-role-badge">Instructor</div>
          <div className="profile-email">{profile.email}</div>

          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-num">
                {statsLoading ? '—' : courses.length}
              </div>
              <div className="profile-stat-label">Courses Taught</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">
                {statsLoading ? '—' : totalStudents}
              </div>
              <div className="profile-stat-label">Total Students</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">
                {statsLoading || pendingSubs == null ? '—' : pendingSubs}
              </div>
              <div className="profile-stat-label">Pending Submissions</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {successMessage && (
            <div
              style={{
                fontSize: 12,
                color: '#1d9e75',
                background: 'rgba(29,158,117,0.08)',
                border: '1px solid rgba(29,158,117,0.2)',
                borderRadius: 9,
                padding: '8px 12px',
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Account information */}
          <div className="profile-info-card">
            <div className="profile-section-title">
              Account information
              {!editingName && (
                <button className="profile-edit-btn" onClick={startEditName}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>
                    edit
                  </span>{' '}
                  Edit
                </button>
              )}
            </div>

            {!editingName ? (
              <>
                <div className="profile-row">
                  <div className="profile-row-label">Full name</div>
                  <div className="profile-row-val">{profile.name}</div>
                </div>
                <div className="profile-row">
                  <div className="profile-row-label">Email</div>
                  <div className="profile-row-val">{profile.email}</div>
                </div>
                <div className="profile-row">
                  <div className="profile-row-label">Role</div>
                  <div className="profile-row-val">Instructor</div>
                </div>
              </>
            ) : (
              <form className="profile-edit-inline" onSubmit={saveName}>
                <div>
                  <div className="pei-label">Full name</div>
                  <input
                    className="pei-input"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={savingName}
                    autoFocus
                  />
                </div>
                <div>
                  <div className="pei-label">Email</div>
                  <input
                    className="pei-input"
                    type="email"
                    value={profile.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                {nameError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#d85a30',
                      background: 'rgba(216,90,48,0.08)',
                      border: '1px solid rgba(216,90,48,0.2)',
                      borderRadius: 9,
                      padding: '8px 12px',
                    }}
                  >
                    {nameError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="pei-save-btn"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                    onClick={cancelEditName}
                    disabled={savingName}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pei-save-btn" disabled={savingName}>
                    {savingName && <ButtonSpinner />}
                    {savingName ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security */}
          <div className="profile-info-card">
            <div className="profile-section-title">
              Security
              {!editingPassword && (
                <button className="profile-edit-btn" onClick={startEditPassword}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>
                    lock
                  </span>{' '}
                  Change password
                </button>
              )}
            </div>

            {!editingPassword ? (
              <div className="profile-row">
                <div className="profile-row-label">Password</div>
                <div className="profile-row-val" style={{ color: 'var(--text-muted)' }}>
                  ••••••••
                </div>
              </div>
            ) : (
              <form className="profile-edit-inline" onSubmit={savePassword}>
                <div>
                  <div className="pei-label">New password</div>
                  <input
                    className="pei-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
                <div>
                  <div className="pei-label">Confirm new password</div>
                  <input
                    className="pei-input"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    autoComplete="new-password"
                  />
                </div>

                {passwordError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#d85a30',
                      background: 'rgba(216,90,48,0.08)',
                      border: '1px solid rgba(216,90,48,0.2)',
                      borderRadius: 9,
                      padding: '8px 12px',
                    }}
                  >
                    {passwordError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="pei-save-btn"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                    onClick={cancelEditPassword}
                    disabled={savingPassword}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pei-save-btn" disabled={savingPassword}>
                    {savingPassword && <ButtonSpinner />}
                    {savingPassword ? 'Saving…' : 'Update password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
