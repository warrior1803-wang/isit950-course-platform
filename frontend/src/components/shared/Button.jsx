import { useRef } from 'react';

const VARIANTS = {
  primary: {
    background: '#3d2e35',
    color: '#f0e8e2',
    border: 'none',
    hoverBg: '#2e2028',
  },
  secondary: {
    background: 'transparent',
    color: '#3d2e35',
    border: '1px solid #ddd0d4',
    hoverBg: 'rgba(182,147,169,0.1)',
  },
  danger: {
    background: '#d85a30',
    color: '#fff',
    border: 'none',
    hoverBg: '#c04828',
  },
};

/**
 * @param {'primary'|'secondary'|'danger'} variant
 * @param {boolean} loading
 * @param {boolean} disabled
 */
export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  className,
}) {
  const btnRef = useRef(null);
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const isDisabled = disabled || loading;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 18px',
    height: 38,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'Gowun Batang', serif",
    fontWeight: 400,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.12s, opacity 0.12s',
    background: v.background,
    color: v.color,
    border: v.border,
    opacity: isDisabled ? 0.55 : 1,
    ...style,
  };

  return (
    <button
      ref={btnRef}
      type={type}
      style={baseStyle}
      disabled={isDisabled}
      onClick={onClick}
      className={className}
      onMouseEnter={() => {
        if (!isDisabled && btnRef.current) {
          btnRef.current.style.background = v.hoverBg;
        }
      }}
      onMouseLeave={() => {
        if (!isDisabled && btnRef.current) {
          btnRef.current.style.background = v.background;
        }
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'ccp-spin 0.7s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}
