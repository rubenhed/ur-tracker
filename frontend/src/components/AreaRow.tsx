import type { Area } from "../types";

type Props = {
  area: Area;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
};

export function AreaRow({ area, onClick, selected, onToggleSelect }: Props) {
  const history = [...area.snapshots]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .map((s) => s.vacant_rooms);

  const latest = history[history.length - 1] ?? 0;

  return (
    <div
      className={`
      flex cursor-pointer items-center
      rounded-xl border
      transition-all duration-150
      ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"}
    `}
    >
      <div
        className="flex flex-1 items-center gap-3 px-4 py-3 rounded-l-xl transition-all duration-150 hover:bg-blue-50"
        onClick={onToggleSelect}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="h-4 w-4 accent-slate-900 cursor-pointer"
        />
        <div className="font-medium text-slate-900">{area.name_ja}</div>
      </div>

      <div className="w-px self-stretch bg-slate-200" />

      <div
        className="flex flex-1 items-center justify-between px-4 py-3 rounded-r-xl transition-all duration-150 hover:bg-slate-100"
        onClick={onClick}
      >
        <div className="text-sm text-slate-500">{history.join(" → ")}</div>
        <div
          className={`rounded-lg px-3 py-1 text-sm font-semibold ${
            latest === 0
              ? "bg-red-100 text-red-800 ring-1 ring-red-200"
              : "bg-green-100 text-green-800 ring-1 ring-green-200"
          }`}
        >
          {latest}
        </div>
      </div>
    </div>
  );
}
