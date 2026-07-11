export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col animate-pulse">
      <div className="space-y-2 px-6 py-6 md:px-8 md:py-8">
        <div className="h-8 w-48 rounded-lg bg-surface-muted" />
        <div className="h-4 w-72 rounded bg-surface-muted" />
      </div>
      <div className="h-64 border-y border-border bg-surface-muted" />
      <div className="h-48 border-b border-border bg-surface-muted" />
    </div>
  );
}
