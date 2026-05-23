import PropTypes from 'prop-types';

export default function ErrorState({ message, onRetry, retryLabel }) {
  return (
    <div className="inline-flex items-center gap-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[#991b1b] underline underline-offset-2 disabled:opacity-60"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
};

ErrorState.defaultProps = {
  onRetry: null,
  retryLabel: 'Try again',
};
