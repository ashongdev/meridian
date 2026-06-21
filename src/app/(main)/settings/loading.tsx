export default function SettingsLoading() {
  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-16 max-w-2xl animate-pulse">
      <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
      <div className="h-12 w-48 bg-surface-2 rounded mb-10" />

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-10">
          <div className="h-3 w-24 bg-surface-2 rounded mb-4" />
          <div className="bg-surface border border-border rounded-xl p-5 h-20" />
        </div>
      ))}
    </div>
  );
}
