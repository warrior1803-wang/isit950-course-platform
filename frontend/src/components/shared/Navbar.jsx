import { useAuth } from '../../lib/auth';

export default function Navbar() {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <nav
      style={{
        height: 56,
        background: '#1c1828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #2a2035 0%, #1c1828 100%)',
          pointerEvents: 'none',
        }}
      />

      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: "'Gowun Batang', serif",
          fontSize: 14,
          color: '#ceadb0',
          letterSpacing: '0.02em',
        }}
      >
        Course Collaboration Platform
      </span>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {user && (
          <span style={{ fontSize: 12, color: '#ceadb0' }}>{user.name}</span>
        )}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(182,147,169,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#ceadb0',
            cursor: 'pointer',
            border: '1px solid rgba(182,147,169,0.3)',
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
      </div>
    </nav>
  );
}
