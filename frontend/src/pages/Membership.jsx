import { useState, useEffect } from 'react';
import { membershipApi } from '../api';

function nextMondayLabel() {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntil);
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function Membership() {
  const [mem, setMem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [modalOpen, setModalOpen] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  // payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    membershipApi.get()
      .then(res => setMem(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isPremium = upgraded || (mem && mem.type !== 'FREE');
  const postsUsed = mem?.usage?.weeklyPostsUsed ?? 0;
  const postsLimit = mem?.usage?.weeklyPostsLimit ?? 10;
  const resubUsed = mem?.usage?.resubmissionsUsed ?? 0;
  const resubLimit = mem?.usage?.resubmissionsLimit ?? 2;
  const postsPercent = isPremium ? 100 : Math.min(100, (postsUsed / postsLimit) * 100);
  const resubPercent = isPremium ? 100 : Math.min(100, (resubUsed / resubLimit) * 100);

  function formatCardNumber(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val) {
    const v = val.replace(/\D/g, '').slice(0, 4);
    return v.length >= 3 ? v.slice(0, 2) + ' / ' + v.slice(2) : v;
  }

  function processPayment() {
    setUpgraded(true);
    setModalOpen(false);
  }

  if (loading) return null;

  return (
    <>
      <div className="page-title" style={{ marginBottom: 4 }}>Membership</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Manage your plan and track your usage
      </div>

      {/* Status hero */}
      <div className={`mem-status-hero ${isPremium ? 'member' : 'free'}`}>
        <div className="mem-icon">{isPremium ? '⭐' : '✦'}</div>
        <div>
          <div className="mem-hero-title">{isPremium ? 'Member Plan' : 'Free Plan'}</div>
          <div className="mem-hero-sub">
            {isPremium ? 'Unlimited posts, resubmissions & priority materials' : 'Limited posts & resubmissions each week'}
          </div>
        </div>
      </div>

      {/* Usage tracker */}
      <div className="mem-page-card">
        <div style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 14, fontWeight: 500 }}>
          This week's usage
        </div>
        <div className="mem-usage-row">
          <div className="mem-usage-label">Discussion posts</div>
          <div className="mem-usage-bar-wrap">
            <div
              className={`mem-usage-bar${postsPercent >= 70 && !isPremium ? ' warn' : ''}`}
              style={{ width: isPremium ? '100%' : `${postsPercent}%` }}
            />
          </div>
          <div className="mem-usage-count">
            {isPremium ? 'Unlimited' : `${postsUsed} / ${postsLimit}`}
          </div>
        </div>
        <div className="mem-usage-row">
          <div className="mem-usage-label">Assignment resubmissions</div>
          <div className="mem-usage-bar-wrap">
            <div
              className={`mem-usage-bar${resubPercent >= 50 && !isPremium ? ' warn' : ''}`}
              style={{ width: isPremium ? '100%' : `${resubPercent}%` }}
            />
          </div>
          <div className="mem-usage-count">
            {isPremium ? 'Unlimited' : `${resubUsed} / ${resubLimit}`}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          ⏱ Limits reset {nextMondayLabel()} at 12:00am AEST
        </div>
      </div>

      {/* Upgrade section — hidden for members */}
      {!isPremium && (
        <div className="mem-page-card">
          <div style={{ fontSize: 14, color: 'var(--text-dark)', marginBottom: 16, fontWeight: 500 }}>
            ⭐ Upgrade to Member
          </div>
          <div className="mem-plans">
            <div
              className={`mem-plan-card${selectedPlan === 'monthly' ? ' selected' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="mem-plan-name">Monthly</div>
              <div className="mem-plan-price">$9.99 <span>/ month</span></div>
              <ul className="mem-benefit-list">
                <li className="on">✓ Unlimited discussion posts</li>
                <li className="on">✓ Unlimited resubmissions</li>
                <li className="on">✓ Priority course materials</li>
                <li>Cancel anytime</li>
              </ul>
            </div>
            <div
              className={`mem-plan-card${selectedPlan === 'annual' ? ' selected' : ''}`}
              onClick={() => setSelectedPlan('annual')}
            >
              <div className="mem-plan-name">Annual</div>
              <div className="mem-plan-price">$79.99 <span>/ year</span></div>
              <div className="mem-plan-savings">Save 33% vs monthly</div>
              <ul className="mem-benefit-list">
                <li className="on">✓ Unlimited discussion posts</li>
                <li className="on">✓ Unlimited resubmissions</li>
                <li className="on">✓ Priority course materials</li>
                <li className="on">✓ Best value</li>
              </ul>
            </div>
          </div>
          <button className="mem-upgrade-btn" onClick={() => setModalOpen(true)}>
            <span>⭐</span> Upgrade Now
          </button>
        </div>
      )}

      {/* Plan comparison */}
      <div className="mem-page-card">
        <div style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 12, fontWeight: 500 }}>
          Plan comparison
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 400 }}>Feature</th>
              <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'center' }}>Free</th>
              <th style={{ padding: '8px 12px', color: '#8b6914', fontWeight: 500, textAlign: 'center' }}>⭐ Member</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Discussion posts', '10 / week', 'Unlimited'],
              ['Assignment resubmissions', '2 per assignment', 'Unlimited'],
              ['Priority course materials', '—', '✓'],
            ].map(([feat, free, member]) => (
              <tr key={feat} style={{ borderBottom: '1px solid rgba(221,208,212,0.4)' }}>
                <td style={{ padding: '10px 0', color: 'var(--text-dark)' }}>{feat}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{free}</td>
                <td style={{ textAlign: 'center', color: '#16a34a' }}>{member}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment modal */}
      {modalOpen && (
        <div className="ccp-modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="ccp-modal-box" style={{ maxWidth: 420 }}>
            <div className="ccp-modal-header">
              <span className="ccp-modal-title">Complete your upgrade</span>
              <button className="ccp-modal-close" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="ccp-modal-body">
              <div className="pay-plan-strip">
                <span className="pay-plan-icon">⭐</span>
                <span>{selectedPlan === 'monthly' ? 'Monthly Plan — $9.99/month' : 'Annual Plan — $79.99/year'}</span>
              </div>
              <div className="pay-grid">
                <div className="field field-full">
                  <label>Card Number</label>
                  <input
                    className="auth-input"
                    style={{ height: 38, marginTop: 4 }}
                    type="text"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  />
                </div>
                <div className="field field-full">
                  <label>Name on Card</label>
                  <input
                    className="auth-input"
                    style={{ height: 38, marginTop: 4 }}
                    type="text"
                    placeholder="Your Name"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Expiry</label>
                  <input
                    className="auth-input"
                    style={{ height: 38, marginTop: 4 }}
                    type="text"
                    maxLength={7}
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>CVV</label>
                  <input
                    className="auth-input"
                    style={{ height: 38, marginTop: 4 }}
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={e => setCvv(e.target.value)}
                  />
                </div>
              </div>
              <p className="pay-secure-note">🔒 This is a simulated payment — no real charge will be made</p>
              <button className="mem-upgrade-btn" style={{ marginTop: 4 }} onClick={processPayment}>
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
