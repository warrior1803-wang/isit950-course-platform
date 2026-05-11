export default function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white/70 p-4 shadow-sm animate-pulse">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-6 h-2 w-full rounded bg-gray-200" />
    </div>
  );
}
