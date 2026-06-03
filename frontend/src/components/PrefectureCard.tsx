import { AreaRow } from "./AreaRow";
import type { Prefecture, Area } from "../types";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "never";

  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  return `${diff}s ago`;
}

export function PrefectureCard({
  prefecture,
  onAreaClick,
  selectedAreaIds,
  onAreaToggle,
}: {
  prefecture: Prefecture;
  onAreaClick: (area: Area) => void;
  selectedAreaIds: Set<number>;
  onAreaToggle: (area: Area) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">
          {prefecture.name_ja}
        </h3>

        <span className="text-sm text-slate-500">
          Updated {timeAgo(prefecture.last_checked_at)}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {prefecture.areas.map((area) => (
          <AreaRow
            key={area.id}
            area={area}
            onClick={() => onAreaClick(area)}
            selected={selectedAreaIds.has(area.id)}
            onToggleSelect={(e) => {
              e.stopPropagation();
              onAreaToggle(area);
            }}
          />
        ))}
      </div>
    </div>
  );
}
