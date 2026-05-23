import { useRef, useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { authApi } from '../../api';

// ── constants ────────────────────────────────────────────────────────────────

const EASE = 'cubic-bezier(0.77,0,0.18,1)';

const PILLS = ['Discussion forums', 'Assignment management', 'Course materials', 'Analytics'];

// ── tiny helpers ─────────────────────────────────────────────────────────────

/** Labelled input field for the auth forms. */
function Field({ label, error, small = false, children }) {
  return (
    <div style={{ marginBottom: small ? 10 : 15 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: '#9c8a8e',
          marginBottom: 6,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  );
}

/**
 * Styled text / email / password input.
 * Must use forwardRef so that {...register('fieldName')} can attach
 * React Hook Form's ref callback to the underlying DOM <input>.
 * Without forwardRef, React silently drops the ref on function components,
 * which means RHF never registers the field and shows "required" on submit.
 */
const AuthInput = forwardRef(({ small = false, ...props }, ref) => (
  <input
    ref={ref}
    className="auth-input"
    style={{ height: small ? 38 : 42 }}
    {...props}
  />
));
AuthInput.displayName = 'AuthInput';

// ── sub-forms ────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch, onError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    onError('');

    try {
      const res = await authApi.login({ email: data.email, password: data.password });
      login(res.data.data.token, res.data.data.user);
      navigate(res.data.data.user.role === 'INSTRUCTOR' ? '/dashboard' : '/courses', { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        onError('Incorrect email or password.');
      } else {
        onError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Email" error={errors.email?.message}>
        <AuthInput
          type="email"
          placeholder="you@uowmail.edu.au"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
          })}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <AuthInput
          type="password"
          placeholder="••••••••"
          {...register('password', { required: 'Password is required' })}
        />
      </Field>

      <a
        href="#"
        onClick={e => e.preventDefault()}
        style={{
          display: 'block',
          textAlign: 'right',
          fontSize: 11,
          color: '#b693a9',
          cursor: 'pointer',
          marginTop: -4,
          marginBottom: 18,
          textDecoration: 'none',
        }}
      >
        Forgot password?
      </a>

      <button
        type="submit"
        className="auth-btn"
        style={{ height: 44 }}
        disabled={submitting}
      >
        {submitting ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(240,232,226,0.4)',
              borderTopColor: '#f0e8e2',
              borderRadius: '50%',
              animation: 'ccp-spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        ) : (
          'Sign in'
        )}
      </button>

      <div
        style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9c8a8e' }}
      >
        Don&apos;t have an account?{' '}
        <a
          onClick={onSwitch}
          style={{ color: '#b693a9', cursor: 'pointer', textDecoration: 'none' }}
        >
          Create one
        </a>
      </div>
    </form>
  );
}

function RegisterForm({ onSwitch, onError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'student', terms: false } });

  // Watch the role field so RoleCard selection stays in sync with RHF state
  const selectedRole = watch('role');
  const nameMaxMessage = 'Name must be 100 characters or fewer';
  const passwordMaxMessage = 'Password must be 128 characters or fewer';

  function validateNameLength(firstName, lastName) {
    const name = `${firstName} ${lastName}`;
    if (name.length > 100) {
      setError('lastName', {
        type: 'maxLength',
        message: nameMaxMessage,
      });
    } else if (errors.lastName?.message === nameMaxMessage) {
      clearErrors('lastName');
    }
  }

  function validatePasswordMaxLength(password) {
    if (password.length > 128) {
      setError('password', {
        type: 'maxLength',
        message: passwordMaxMessage,
      });
    } else if (errors.password?.message === passwordMaxMessage) {
      clearErrors('password');
    }
  }

  const firstNameField = register('firstName', {
    required: 'Required',
    maxLength: { value: 100, message: nameMaxMessage },
  });
  const lastNameField = register('lastName', {
    required: 'Required',
    maxLength: { value: 100, message: nameMaxMessage },
  });
  const passwordField = register('password', {
    required: 'Password is required',
    minLength: { value: 8, message: 'Minimum 8 characters' },
    maxLength: { value: 128, message: passwordMaxMessage },
  });

  const onSubmit = async (data) => {
    onError('');
    const name = `${data.firstName} ${data.lastName}`;

    if (name.length > 100) {
      setError('lastName', {
        type: 'maxLength',
        message: nameMaxMessage,
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await authApi.register({
        name,
        email: data.email,
        password: data.password,
        role: data.role.toUpperCase(),
      });
      login(res.data.data.token, res.data.data.user);
      navigate(res.data.data.user.role === 'INSTRUCTOR' ? '/dashboard' : '/courses', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        onError('An account with this email already exists.');
      } else {
        onError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Role selector */}
      <Field label="I am a" error={null}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
          <RoleCard
            icon="school"
            label="Student"
            desc="Enrol & submit"
            selected={selectedRole === 'student'}
            onClick={() => setValue('role', 'student', { shouldValidate: true })}
          />
          <RoleCard
            icon="assignment_ind"
            label="Instructor"
            desc="Manage courses"
            selected={selectedRole === 'instructor'}
            onClick={() => setValue('role', 'instructor', { shouldValidate: true })}
          />
        </div>
      </Field>

      {/* First + last name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="First name" error={errors.firstName?.message} small>
          <AuthInput
            small
            type="text"
            placeholder="Bingyan"
            maxLength={100}
            {...firstNameField}
            onChange={(event) => {
              firstNameField.onChange(event);
              validateNameLength(event.target.value, watch('lastName') || '');
            }}
          />
        </Field>
        <Field label="Last name" error={errors.lastName?.message} small>
          <AuthInput
            small
            type="text"
            placeholder="Wang"
            maxLength={100}
            {...lastNameField}
            onChange={(event) => {
              lastNameField.onChange(event);
              validateNameLength(watch('firstName') || '', event.target.value);
            }}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message} small>
        <AuthInput
          small
          type="email"
          placeholder="you@uowmail.edu.au"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
          })}
        />
      </Field>

      <Field label="Password" error={errors.password?.message} small>
        <AuthInput
          small
          type="password"
          placeholder="At least 8 characters"
          {...passwordField}
          onChange={(event) => {
            passwordField.onChange(event);
            validatePasswordMaxLength(event.target.value);
          }}
        />
      </Field>

      {/* Terms checkbox */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 11,
          color: '#9c8a8e',
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        <input
          type="checkbox"
          style={{ accentColor: '#b693a9', marginTop: 2, flexShrink: 0 }}
          {...register('terms', { required: 'You must agree to continue' })}
        />
        <span>
          I agree to the{' '}
          <a href="#" onClick={e => e.preventDefault()} style={{ color: '#b693a9', textDecoration: 'none' }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" onClick={e => e.preventDefault()} style={{ color: '#b693a9', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </span>
      </div>
      {errors.terms && (
        <span className="auth-field-error" style={{ marginTop: -8, marginBottom: 8, display: 'block' }}>
          {errors.terms.message}
        </span>
      )}

      <button
        type="submit"
        className="auth-btn"
        style={{ height: 44 }}
        disabled={submitting || Object.keys(errors).length > 0}
      >
        {submitting ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(240,232,226,0.4)',
              borderTopColor: '#f0e8e2',
              borderRadius: '50%',
              animation: 'ccp-spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        ) : (
          'Create account'
        )}
      </button>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#9c8a8e' }}>
        Already have an account?{' '}
        <a
          onClick={onSwitch}
          style={{ color: '#b693a9', cursor: 'pointer', textDecoration: 'none' }}
        >
          Sign in
        </a>
      </div>
    </form>
  );
}

function RoleCard({ icon, label, desc, selected, onClick }) {
  return (
    <div
      className={`auth-role-card${selected ? ' sel' : ''}`}
      onClick={onClick}
      style={{ padding: '8px 13px' }}
    >
      <div className="role-icon" style={{ marginBottom: 4 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#2e2028' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9c8a8e', marginTop: 1 }}>{desc}</div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [authError, setAuthError] = useState('');

  const busyRef = useRef(false);
  const cwLRef = useRef(null);
  const cwRRef = useRef(null);

  function switchMode(target) {
    if (busyRef.current || target === mode) return;
    busyRef.current = true;
    setAuthError('');

    const cwL = cwLRef.current;
    const cwR = cwRRef.current;

    // Set wipe panel colours that match the destination layout.
    // In 'register': light panel is on the LEFT → left wipe is light, right wipe is dark.
    cwL.style.background = target === 'register' ? '#f0e8e2' : '#1c1828';
    cwR.style.background = target === 'register' ? '#1c1828' : '#f0e8e2';

    // Phase 1 — expand wipes inward to fully cover the card.
    cwL.style.transformOrigin = 'left center';
    cwR.style.transformOrigin = 'right center';
    cwL.style.transition = `transform 0.4s ${EASE}`;
    cwR.style.transition = `transform 0.4s ${EASE}`;
    cwL.style.transform = 'scaleX(1)';
    cwR.style.transform = 'scaleX(1)';

    setTimeout(() => {
      // Swap layout + form while hidden behind the wipes.
      setMode(target);

      // Phase 2 — collapse wipes outward to reveal the new layout.
      requestAnimationFrame(() => {
        cwL.style.transformOrigin = 'right center';
        cwR.style.transformOrigin = 'left center';
        cwL.style.transition = `transform 0.42s ${EASE}`;
        cwR.style.transition = `transform 0.42s ${EASE}`;
        cwL.style.transform = 'scaleX(0)';
        cwR.style.transform = 'scaleX(0)';
      });

      setTimeout(() => { busyRef.current = false; }, 440);
    }, 410);
  }

  // Panel order: login → dark=1 light=2 | register → dark=2 light=1
  const darkOrder = mode === 'login' ? 1 : 2;
  const lightOrder = mode === 'login' ? 2 : 1;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e8dfd8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Gowun Batang', serif",
      }}
    >
      {/* ── Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          height: 580,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          boxShadow: '0 24px 80px rgba(44,28,36,0.18)',
        }}
      >
        {/* ── Wipe overlay ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div
            ref={cwLRef}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '50%',
              background: '#1c1828',
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
            }}
          />
          <div
            ref={cwRRef}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '50%',
              background: '#f0e8e2',
              transform: 'scaleX(0)',
              transformOrigin: 'right center',
            }}
          />
        </div>

        {/* ── Dark panel ── */}
        <div
          style={{
            flex: '0 0 45%',
            background: '#1c1828',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 40px 36px',
            overflow: 'hidden',
            order: darkOrder,
          }}
        >
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(145deg, #2a2035 0%, #1c1828 60%, #251e30 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Orb 1 — top right */}
          <div
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #b693a9 0%, transparent 70%)',
              top: -80,
              right: -60,
              opacity: 0.18,
              pointerEvents: 'none',
            }}
          />
          {/* Orb 2 — bottom left */}
          <div
            style={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #8c7d72 0%, transparent 70%)',
              bottom: -60,
              left: -40,
              opacity: 0.2,
              pointerEvents: 'none',
            }}
          />

          {/* Brand */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 11,
              color: 'rgba(206,173,176,0.5)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              lineHeight: 1.6,
            }}
          >
            Course
            <br />
            Collaboration
            <br />
            Platform
          </div>

          {/* Hero */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: '#f5ede8',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Learn.
              <br />
              Share.
              <br />
              <span style={{ color: '#ceadb0' }}>Grow together.</span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(245,237,232,0.48)',
                lineHeight: 1.8,
                maxWidth: 260,
              }}
            >
              A centralized platform for students and instructors to share resources,
              manage assignments, and collaborate through discussions.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {PILLS.map(p => (
                <span
                  key={p}
                  style={{
                    fontSize: 11,
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: '0.5px solid rgba(182,147,169,0.28)',
                    color: 'rgba(206,173,176,0.65)',
                    background: 'rgba(182,147,169,0.07)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 11,
              color: 'rgba(206,173,176,0.22)',
              letterSpacing: '0.05em',
            }}
          >
            ISIT950 · University of Wollongong · Autumn 2026
          </div>
        </div>

        {/* ── Light panel ── */}
        <div
          style={{
            flex: 1,
            background: '#f0e8e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '44px 48px',
            order: lightOrder,
            overflowY: 'auto',
          }}
        >
          <div style={{ width: '100%', maxWidth: 300 }}>
            {/* Global auth error (from mock login failure) */}
            {authError && (
              <div
                style={{
                  fontSize: 12,
                  color: '#d85a30',
                  background: 'rgba(216,90,48,0.08)',
                  border: '1px solid rgba(216,90,48,0.18)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 16,
                }}
              >
                {authError}
              </div>
            )}

            {mode === 'login' ? (
              <>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 400,
                    color: '#2e2028',
                    marginBottom: 6,
                  }}
                >
                  Welcome back
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#9c8a8e',
                    marginBottom: 26,
                    lineHeight: 1.6,
                  }}
                >
                  Sign in to your account
                </div>
                <LoginForm
                  onSwitch={() => switchMode('register')}
                  onError={setAuthError}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 400,
                    color: '#2e2028',
                    marginBottom: 6,
                  }}
                >
                  Create account
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#9c8a8e',
                    marginBottom: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Join the platform to get started
                </div>
                <RegisterForm
                  onSwitch={() => switchMode('login')}
                  onError={setAuthError}
                />
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
