import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/axios';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collabEditing, setCollabEditing] = useState(false);
  const [skills, setSkills] = useState(user?.skills ?? []);
  const [collabMode, setCollabMode] = useState(user?.collabMode ?? 'online');
  const [availability, setAvailability] = useState(user?.availability ?? '');
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const membership = user.membership;
  const isPremium = membership?.type === 'PREMIUM';
  const planLabel = isPremium ? '✦ Premium Plan' : '✦ Free Plan';
  const roleName = user.role === 'INSTRUCTOR' ? 'Instructor' : 'Student';

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

  async function saveCollab() {
    setSaving(true);
    try {
      await api.patch('/auth/me', { skills, collabMode, availability });
    } catch {
      // backend endpoint not yet implemented
    } finally {
      setSaving(false);
      setCollabEditing(false);
    }
  }

  function cancelCollab() {
    setSkills(user.skills ?? []);
    setCollabMode(user.collabMode ?? 'online');
    setAvailability(user.availability ?? '');
    setCollabEditing(false);
  }

  const collabModeLabel = collabMode === 'offline' ? 'Offline' : collabMode === 'both' ? 'Both' : 'Online';

  return (
    <>
      <div className="page-title" style={{ marginBottom: 20 }}>My Profile</div>
      <div className="profile-layout">

        {/* Left card */}
        <div className="profile-card">
          <div className="profile-avatar-lg">{getInitials(user.name)}</div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-role-badge">{roleName}</div>
          <div style={{ margin: '6px 0 10px' }}>
            <span className={`mem-badge ${isPremium ? 'premium' : 'free'}`}>{planLabel}</span>
          </div>
          <div className="profile-email">{user.email}</div>
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
              <button className="profile-edit-btn">
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span> Edit
              </button>
            </div>
            <div className="profile-row">
              <div className="profile-row-label">Full name</div>
              <div className="profile-row-val">{user.name}</div>
            </div>
            <div className="profile-row">
              <div className="profile-row-label">Email</div>
              <div className="profile-row-val">{user.email}</div>
            </div>
            <div className="profile-row">
              <div className="profile-row-label">Role</div>
              <div className="profile-row-val">{roleName}</div>
            </div>
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
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    className="pei-save-btn"
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    onClick={cancelCollab}
                  >
                    Cancel
                  </button>
                  <button className="pei-save-btn" onClick={saveCollab} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
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
                  {isPremium ? 'Unlimited posts and resubmissions' : 'Limited posts and resubmissions'}
                </div>
              </div>
              <span className={`mem-badge ${isPremium ? 'premium' : 'free'}`}>{planLabel}</span>
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
              <button className="profile-edit-btn">
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>lock</span>
                Change password
              </button>
            </div>
            <div className="profile-row">
              <div className="profile-row-label">Password</div>
              <div className="profile-row-val" style={{ color: 'var(--text-muted)' }}>••••••••</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
