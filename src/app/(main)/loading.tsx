export default function MainLoading() {
  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-16 animate-pulse">
      <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
      <div className="h-10 w-48 bg-surface-2 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-surface-2 rounded" />
              <div className="h-5 w-24 bg-surface-2 rounded" />
            </div>
            <div className="h-4 w-full bg-surface-2 rounded" />
            <div className="h-4 w-3/4 bg-surface-2 rounded" />
            <div className="flex gap-3 mt-2">
              <div className="h-3 w-20 bg-surface-2 rounded" />
              <div className="h-3 w-16 bg-surface-2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
