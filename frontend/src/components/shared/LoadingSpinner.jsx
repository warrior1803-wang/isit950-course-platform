/**
 * @param {boolean} fullPage  — centre in the full viewport
 * @param {number}  size      — diameter in px (default 36)
 */
export default function LoadingSpinner({ fullPage = false, size = 36 }) {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid rgba(182,147,169,0.25)`,
        borderTopColor: '#b693a9',
        animation: 'ccp-spin 0.7s linear infinite',
      }}
    />
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e8dfd8',
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
      }}
    >
      {spinner}
    </div>
  );
}
