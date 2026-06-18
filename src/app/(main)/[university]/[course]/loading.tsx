export default function CourseLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero */}
      <div className="bg-surface border-b border-border px-6 sm:px-10 pt-10 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-12 bg-surface-2 rounded" />
              <div className="h-3 w-2 bg-surface-2 rounded" />
              <div className="h-3 w-24 bg-surface-2 rounded" />
            </div>
            {/* Code + year */}
            <div className="flex gap-2 mb-2">
              <div className="h-5 w-16 bg-surface-2 rounded" />
              <div className="h-5 w-12 bg-surface-2 rounded" />
            </div>
            {/* Title */}
            <div className="h-9 w-80 bg-surface-2 rounded mb-1" />
            <div className="h-9 w-48 bg-surface-2 rounded mb-3" />
            {/* Stats */}
            <div className="flex gap-4">
              <div className="h-3 w-20 bg-surface-2 rounded" />
              <div className="h-3 w-20 bg-surface-2 rounded" />
            </div>
          </div>
          {/* Enroll button */}
          <div className="h-9 w-24 bg-surface-2 rounded-full shrink-0" />
        </div>
        {/* Tab bar */}
        <div className="flex gap-1 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-surface-2 rounded-t" />
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="px-6 sm:px-10 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <div className="flex gap-3">
              <div className="h-10 w-10 bg-surface-2 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-surface-2 rounded" />
                <div className="h-3 w-full bg-surface-2 rounded" />
                <div className="h-3 w-3/4 bg-surface-2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
