import { useState, useEffect } from 'react';
import ErrorState from '../components/shared/ErrorState';
import { membershipApi } from '../api';
import { getApiErrorState } from '../lib/apiState';

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
  const [loadError, setLoadError] = useState(null);
  const [upgradeError, setUpgradeError] = useState(null);
  const [paying, setPaying] = useState(false);

  // payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  async function loadMembership() {
    setLoading(true);
    setLoadError(null);

    try {
      const res = await membershipApi.get();
      setMem(res.data);
    } catch {
      setMem(null);
      setLoadError('Could not load membership status. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembership();
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

  async function processPayment() {
    if (paying) return;
    setPaying(true);
    setUpgradeError(null);
    await new Promise(r => setTimeout(r, 800));
    try {
      await membershipApi.upgrade({
        plan: selectedPlan === 'monthly' ? 'MONTHLY' : 'ANNUAL',
        paymentToken: 'stub-token',
      });
      setUpgraded(true);
      setModalOpen(false);
    } catch (err) {
      setUpgradeError(getApiErrorState(err));
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <>
        <div className="page-title" style={{ marginBottom: 4 }}>Membership</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          Manage your plan and track your usage
        </div>
        <ErrorState message={loadError} onRetry={loadMembership} retryLabel="Retry" />
      </>
    );
  }

  return (
    <>
      <div className="page-title" style={{ marginBottom: 4 }}>Membership</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Manage your plan and track your usage
      </div>

      {upgradeError && (
        <div style={{ marginBottom: 16 }}>
          {upgradeError.kind === 'upgrade' ? (
            <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
              This feature requires a membership. <a href="/membership" className="underline">Upgrade</a>
            </div>
          ) : (
            <ErrorState message={upgradeError.message} />
          )}
        </div>
      )}

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
              className={`mem-usage-bar${isPremium ? ' ok' : postsPercent >= 70 ? ' warn' : ''}`}
              style={{ width: isPremium ? '0%' : `${postsPercent}%` }}
            />
          </div>
          <div className="mem-usage-count">
            {isPremium ? '∞ / ∞' : `${postsUsed} / ${postsLimit}`}
          </div>
        </div>
        <div className="mem-usage-row">
          <div className="mem-usage-label">Assignment resubmissions</div>
          <div className="mem-usage-bar-wrap">
            <div
              className={`mem-usage-bar${isPremium ? ' ok' : resubPercent >= 50 ? ' warn' : ''}`}
              style={{ width: isPremium ? '0%' : `${resubPercent}%` }}
            />
          </div>
          <div className="mem-usage-count">
            {isPremium ? '∞ / ∞' : `${resubUsed} / ${resubLimit}`}
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
          <button className="mem-upgrade-btn" onClick={() => setModalOpen(true)} disabled={paying}>
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
              <button className="mem-upgrade-btn" style={{ marginTop: 4 }} onClick={processPayment} disabled={paying}>
                {paying && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {paying ? 'Processing…' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
