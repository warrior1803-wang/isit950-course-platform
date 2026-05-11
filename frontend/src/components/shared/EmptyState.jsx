import PropTypes from 'prop-types';

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-text-muted">
      <div className="mb-3 text-[30px] leading-none text-text-muted/70" aria-hidden>
        <span className="icon text-[32px]">{icon}</span>
      </div>
      <div className="text-[14px] text-text-dark">{title}</div>
      {subtitle && (
        <div className="mt-1 text-[12px] text-text-muted">{subtitle}</div>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

EmptyState.defaultProps = {
  subtitle: '',
};
