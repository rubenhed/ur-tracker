import type { Area } from "../types";

export function AreaModal({
  area,
  onClose,
}: {
  area: Area;
  onClose: () => void;
}) {
  const snapshots = [...area.snapshots].sort(
    (a, b) =>
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );

  const latest = snapshots[0]?.vacant_rooms ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{area.name_ja}</h2>

          <button
            onClick={onClose}
            className="
              rounded-lg
              px-3 py-1.5
              text-sm font-medium text-slate-500
              transition-colors
              hover:cursor-pointer
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <span className="text-slate-500">Current vacancies</span>

          <div className="mt-1 text-3xl font-bold">{latest}</div>
        </div>

        <div className="space-y-2">
          {snapshots.map((snapshot, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
            >
              <span className="text-sm text-slate-600">
                {new Date(snapshot.recorded_at).toLocaleString()}
              </span>

              <span className="font-semibold">{snapshot.vacant_rooms}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
