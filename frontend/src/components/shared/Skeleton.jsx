/**
 * Generic shimmer skeleton block.
 *
 * @param {string}  width    CSS width  (default '100%')
 * @param {string}  height   CSS height (default '16px')
 * @param {string}  radius   CSS border-radius (default '8px')
 * @param {string}  className
 */
function SkeletonBlock({ width = '100%', height = '16px', radius = '8px', className = '' }) {
  return (
    <div
      className={`ccp-skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/**
 * Pre-composed skeleton layout for a course card.
 */
function CourseCardSkeleton() {
  return (
    <div
      style={{
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
      className="ccp-skeleton"
    />
  );
}

/**
 * Pre-composed skeleton for a generic list row.
 */
function RowSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
      <SkeletonBlock width="60%" height="14px" />
      <SkeletonBlock width="40%" height="12px" />
    </div>
  );
}

/**
 * Default export renders a configurable set of skeleton rows.
 *
 * @param {number} rows   — number of row skeletons to render (default 4)
 */
export default function Skeleton({ rows = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

Skeleton.Block = SkeletonBlock;
Skeleton.CourseCard = CourseCardSkeleton;
Skeleton.Row = RowSkeleton;
