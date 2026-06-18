export default function ExploreLoading() {
  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-20 animate-pulse">
      {/* Header */}
      <div className="mb-10">
        <div className="h-3 w-16 bg-surface-2 rounded mb-3" />
        <div className="h-14 w-56 bg-surface-2 rounded mb-2" />
        <div className="h-14 w-40 bg-surface-2 rounded mb-3" />
        <div className="h-3 w-72 bg-surface-2 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* University list */}
        <div>
          <div className="h-3 w-24 bg-surface-2 rounded mb-4" />
          <div className="h-9 w-full bg-surface-2 rounded mb-4" />
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-2 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Course grid */}
        <div>
          <div className="h-3 w-24 bg-surface-2 rounded mb-4" />
          <div className="h-9 w-full bg-surface-2 rounded mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-14 bg-surface-2 rounded" />
                  <div className="h-5 w-20 bg-surface-2 rounded" />
                </div>
                <div className="h-4 w-full bg-surface-2 rounded" />
                <div className="h-4 w-3/4 bg-surface-2 rounded" />
                <div className="flex gap-2 pt-1">
                  <div className="h-7 flex-1 bg-surface-2 rounded-lg" />
                  <div className="h-7 flex-1 bg-surface-2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
