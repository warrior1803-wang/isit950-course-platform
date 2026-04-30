/**
 * Assignment status pill.
 *
 * Props:
 *   status  'due-soon' | 'upcoming' | 'overdue' | 'submitted' | 'graded'
 *
 * Colours match prototype .pill-due / .pill-upcoming / .pill-submitted
 * plus the inline graded style from the global assignments page.
 */

const CONFIG = {
  'due-soon': {
    label: 'Due soon',
    background: 'rgba(232,90,48,0.1)',
    color:      '#d85a30',
    border:     '1px solid rgba(232,90,48,0.2)',
  },
  upcoming: {
    label: 'Upcoming',
    background: 'rgba(182,147,169,0.1)',
    color:      '#9c8a8e',
    border:     '1px solid #ddd0d4',
  },
  overdue: {
    label: 'Overdue',
    background: 'rgba(232,90,48,0.1)',
    color:      '#d85a30',
    border:     '1px solid rgba(232,90,48,0.2)',
  },
  submitted: {
    label: 'Submitted',
    background: 'rgba(29,158,117,0.12)',
    color:      '#1d9e75',
    border:     '1px solid rgba(29,158,117,0.2)',
  },
  graded: {
    label: 'Graded',
    background: 'rgba(83,74,183,0.1)',
    color:      '#534ab7',
    border:     '1px solid rgba(83,74,183,0.2)',
  },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status];

  if (!cfg) return null;

  return (
    <span
      style={{
        display:      'inline-block',
        fontSize:     '10px',
        padding:      '2px 9px',
        borderRadius: '20px',
        background:   cfg.background,
        color:        cfg.color,
        border:       cfg.border,
        whiteSpace:   'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}
