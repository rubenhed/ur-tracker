import { useState } from "react";
import { AreaModal } from "./AreaModal";
import { RegionCard } from "./RegionCard";
import { useRegions } from "../hooks/useRegions";
import type { Area } from "../types";
import { Skeleton } from "./Skeleton";
import { SubscribeModal } from "./SubscribeModal";

export function VacancyDashboard() {
  const { regions, loading } = useRegions();
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedAreaIds, setSelectedAreaIds] = useState<Set<number>>(
    new Set(),
  );
  const [showSubscribe, setShowSubscribe] = useState(false);

  function toggleAreaSelect(area: Area) {
    setSelectedAreaIds((prev) => {
      const next = new Set(prev);
      if (next.has(area.id)) {
        next.delete(area.id);
      } else {
        next.add(area.id);
      }
      return next;
    });
  }

  const selectedAreas = regions
    .flatMap((r) => r.prefectures)
    .flatMap((p) => p.areas)
    .filter((a) => selectedAreaIds.has(a.id));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-slate-900">
            UR Vacancy Tracker
          </h1>
          <button
            onClick={() => setShowSubscribe(true)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors hover:cursor-pointer"
          >
            Subscribe to selected areas ({selectedAreaIds.size})
          </button>
        </div>

        {loading ? (
          <Skeleton />
        ) : (
          regions.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              onAreaClick={setSelectedArea}
              selectedAreaIds={selectedAreaIds}
              onAreaToggle={toggleAreaSelect}
            />
          ))
        )}

        {selectedArea && (
          <AreaModal
            area={selectedArea}
            onClose={() => setSelectedArea(null)}
          />
        )}

        {showSubscribe && (
          <SubscribeModal
            selectedAreas={selectedAreas}
            onClose={() => setShowSubscribe(false)}
          />
        )}
      </div>
    </div>
  );
}
