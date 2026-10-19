export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border space-y-3">
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}
