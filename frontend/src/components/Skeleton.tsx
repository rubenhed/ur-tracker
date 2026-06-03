export function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-slate-200" />

        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div>
                <div className="mb-2 h-5 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
              </div>

              <div className="h-8 w-12 animate-pulse rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
