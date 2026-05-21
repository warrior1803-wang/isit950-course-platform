import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { membershipApi, authApi } from '../api';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);

  // Collaboration section
  const [collabEditing, setCollabEditing] = useState(false);
  const [skills, setSkills] = useState(user?.skills ?? []);
  const [collabMode, setCollabMode] = useState(user?.collabMode ?? 'online');
  const [availability, setAvailability] = useState(user?.availability ?? '');
  const [skillInput, setSkillInput] = useState('');
  const [collabSaving, setCollabSaving] = useState(false);
  const [collabError, setCollabError] = useState(null);

  // Account info edit
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

  // Password edit
  const [editingPassword, setEditingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);

  const [memData, setMemData] = useState(null);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      membershipApi.getCurrent().then(res => setMemData(res.data ?? null)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(res => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setProfile(data);
        setName(data?.name ?? '');
        setSkills(data?.skills ?? []);
        setCollabMode(data?.collabMode ?? 'online');
        setAvailability(data?.availability ?? '');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!profile) return null;

  const isPremium = memData ? memData.type !== 'FREE' : profile.membership?.type !== 'FREE';
  const planLabel = isPremium ? '⭐ Member' : '✦ Free Plan';
  const badgeClass = isPremium ? 'member' : 'free';
  const roleName = profile.role === 'INSTRUCTOR' ? 'Instructor' : 'Student';

  // ── Skill tag helpers ────────────────────────────────────────────────────────

  function handleSkillKeyDown(e) {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.trim();
      if (!skills.includes(val)) setSkills(prev => [...prev, val]);
      setSkillInput('');
    }
  }

  function removeSkill(skill) {
    setSkills(prev => prev.filter(s => s !== skill));
  }

  // ── Collaboration ────────────────────────────────────────────────────────────

  async function saveCollab() {
    setCollabError(null);
    setCollabSaving(true);
    try {
      const res = await authApi.updateMe({ skills, collabMode, availability });
      const updated = res.data?.data ?? res.data;
      setProfile(prev => ({ ...prev, ...updated }));
      setCollabEditing(false);
    } catch (err) {
      setCollabError(err?.response?.data?.message || err?.message || 'Failed to save.');
    } finally {
      setCollabSaving(false);
    }
  }

  function cancelCollab() {
    setSkills(profile.skills ?? []);
    setCollabMode(profile.collabMode ?? 'online');
    setAvailability(profile.availability ?? '');
    setCollabError(null);
    setCollabEditing(false);
  }

  // ── Name edit ────────────────────────────────────────────────────────────────

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

  async function saveName(e) {
    e.preventDefault();
    setNameError(null);
    setSuccessMessage(null);
    const trimmedName = name.trim();
    if (!trimmedName) { setNameError('Name cannot be empty.'); return; }
    setSavingName(true);
    try {
      const res = await authApi.updateMe({ name: trimmedName });
      const updated = res.data?.data ?? res.data;
      setProfile(prev => ({ ...prev, ...updated }));
      setEditingName(false);
      setSuccessMessage('Name updated successfully.');
    } catch (err) {
      setNameError(err?.response?.data?.message || err?.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  }

  // ── Password edit ────────────────────────────────────────────────────────────

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

  async function savePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setSuccessMessage(null);
    if (!password || password.length < 8) { setPasswordError('Minimum 8 characters'); return; }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      await authApi.updateMe({ password });
      setPassword('');
      setConfirmPassword('');
      setEditingPassword(false);
      setSuccessMessage('Password updated successfully.');
    } catch (err) {
      setPasswordError(err?.response?.data?.message || err?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  const collabModeLabel = collabMode === 'offline' ? 'Offline' : collabMode === 'both' ? 'Both' : 'Online';

  return (
    <>
      <div className="page-title" style={{ marginBottom: 20 }}>My Profile</div>

      {successMessage && (
        <div style={{
          fontSize: 12, color: '#1d9e75',
          background: 'rgba(29,158,117,0.08)',
          border: '1px solid rgba(29,158,117,0.2)',
          borderRadius: 9, padding: '8px 12px', marginBottom: 12,
        }}>
          {successMessage}
        </div>
      )}

      <div className="profile-layout">

        {/* Left card */}
        <div className="profile-card">
          <div className="profile-avatar-lg">{getInitials(profile.name)}</div>
          <div className="profile-name">{profile.name}</div>
          <div className="profile-role-badge">{roleName}</div>
          <div style={{ margin: '6px 0 10px' }}>
            <span className={`mem-badge ${badgeClass}`}>{planLabel}</span>
          </div>
          <div className="profile-email">{profile.email}</div>
          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-num">—</div>
              <div className="profile-stat-label">Courses</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">—</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">—</div>
              <div className="profile-stat-label">Submitted</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Account information */}
          <div className="profile-info-card">
            <div className="profile-section-title">
              Account information
              {!editingName && (
                <button className="profile-edit-btn" onClick={startEditName}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span> Edit
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
                  <div className="profile-row-val">{roleName}</div>
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
                  <div style={{
                    fontSize: 12, color: '#d85a30',
                    background: 'rgba(216,90,48,0.08)',
                    border: '1px solid rgba(216,90,48,0.2)',
                    borderRadius: 9, padding: '8px 12px',
                  }}>
                    {nameError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="pei-save-btn"
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
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

          {/* Collaboration */}
          <div className="profile-info-card">
            <div className="profile-section-title">
              Collaboration
              <button className="profile-edit-btn" onClick={() => setCollabEditing(v => !v)}>
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span> Edit
              </button>
            </div>

            {!collabEditing ? (
              <>
                <div className="profile-row">
                  <div className="profile-row-label">Skills</div>
                  <div className="profile-row-val">
                    {skills.length > 0
                      ? skills.map(s => <span key={s} className="collab-tag">{s}</span>)
                      : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>None set</span>}
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-row-label">Collab mode</div>
                  <div className="profile-row-val">
                    <span className={`collab-mode-pill ${collabMode}`}>{collabModeLabel}</span>
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-row-label">Availability</div>
                  <div className="profile-row-val" style={{ fontSize: 13, color: 'var(--text-dark)' }}>
                    {availability || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="profile-edit-inline">
                <div>
                  <div className="pei-label">
                    Skills / Expertise
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> (press Enter to add)</span>
                  </div>
                  <div className="pei-tag-wrap">
                    {skills.map(s => (
                      <span key={s} className="pei-tag-item">
                        {s}
                        <span className="pei-tag-remove" onClick={() => removeSkill(s)}>×</span>
                      </span>
                    ))}
                    <input
                      className="pei-tag-add"
                      placeholder="+ Add skill"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                    />
                  </div>
                </div>
                <div>
                  <div className="pei-label">Preferred collaboration mode</div>
                  <div className="pei-mode-row">
                    {[['online', '🌐 Online'], ['offline', '🏢 Offline'], ['both', '✦ Both']].map(([m, label]) => (
                      <button
                        key={m}
                        className={`pei-mode-btn${collabMode === m ? ' sel' : ''}`}
                        onClick={() => setCollabMode(m)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="pei-label">Availability</div>
                  <textarea
                    className="pei-input"
                    rows={2}
                    placeholder="e.g. Weekday evenings after 6pm, flexible weekends"
                    value={availability}
                    onChange={e => setAvailability(e.target.value)}
                  />
                </div>

                {collabError && (
                  <div style={{
                    fontSize: 12, color: '#d85a30',
                    background: 'rgba(216,90,48,0.08)',
                    border: '1px solid rgba(216,90,48,0.2)',
                    borderRadius: 9, padding: '8px 12px',
                  }}>
                    {collabError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    className="pei-save-btn"
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    onClick={cancelCollab}
                    disabled={collabSaving}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="pei-save-btn" onClick={saveCollab} disabled={collabSaving} type="button">
                    {collabSaving && <ButtonSpinner />}
                    {collabSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Membership */}
          <div className="profile-info-card">
            <div className="profile-section-title">Membership</div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid rgba(221,208,212,0.5)',
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 3 }}>Current plan</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {isPremium
                    ? 'Unlimited posts and resubmissions'
                    : memData
                      ? `${memData.usage?.weeklyPostsUsed ?? 0} / ${memData.usage?.weeklyPostsLimit ?? 0} posts used this week · ${memData.usage?.resubmissionsUsed ?? 0} / ${memData.usage?.resubmissionsLimit ?? 0} resubmissions used`
                      : 'Limited posts and resubmissions'}
                </div>
              </div>
              <span className={`mem-badge ${badgeClass}`}>{planLabel}</span>
            </div>
            {!isPremium && (
              <div style={{ paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Unlock unlimited posts, resubmissions and more
                </div>
                <button
                  className="profile-edit-btn"
                  onClick={() => navigate('/membership')}
                  style={{ borderColor: '#ffd700', color: '#8b6914' }}
                >
                  ⭐ Upgrade
                </button>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="profile-info-card">
            <div className="profile-section-title">
              Security
              {!editingPassword && (
                <button className="profile-edit-btn" onClick={startEditPassword}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>lock</span>
                  Change password
                </button>
              )}
            </div>

            {!editingPassword ? (
              <div className="profile-row">
                <div className="profile-row-label">Password</div>
                <div className="profile-row-val" style={{ color: 'var(--text-muted)' }}>••••••••</div>
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
                    placeholder="At least 8 characters"
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
                  <div style={{
                    fontSize: 12, color: '#d85a30',
                    background: 'rgba(216,90,48,0.08)',
                    border: '1px solid rgba(216,90,48,0.2)',
                    borderRadius: 9, padding: '8px 12px',
                  }}>
                    {passwordError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="pei-save-btn"
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
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
