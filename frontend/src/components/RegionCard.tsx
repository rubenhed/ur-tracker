import { PrefectureCard } from "./PrefectureCard";
import type { Region, Area } from "../types";

export function RegionCard({
  region,
  onAreaClick,
  selectedAreaIds,
  onAreaToggle,
}: {
  region: Region;
  onAreaClick: (area: Area) => void;
  selectedAreaIds: Set<number>;
  onAreaToggle: (area: Area) => void;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold text-slate-800">
        {region.name_ja}
      </h2>

      <div className="space-y-4">
        {region.prefectures.map((prefecture) => (
          <PrefectureCard
            key={prefecture.id}
            prefecture={prefecture}
            onAreaClick={onAreaClick}
            selectedAreaIds={selectedAreaIds}
            onAreaToggle={onAreaToggle}
          />
        ))}
      </div>
    </section>
  );
}
