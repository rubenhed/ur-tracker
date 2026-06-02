import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Snapshot = {
  vacant_rooms: number;
  recorded_at: string;
};

type Area = {
  id: number;
  name_ja: string;
  snapshots: Snapshot[];
};

type Prefecture = {
  id: number;
  name_ja: string;
  last_checked_at?: string;
  areas: Area[];
};

type Region = {
  id: number;
  name_ja: string;
  prefectures: Prefecture[];
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "never";

  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  return `${diff}s ago`;
}

function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/regions`)
      .then((res) => res.json())
      .then((data) => {
        setRegions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return { regions, loading };
}

function Skeleton() {
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

function AreaRow({ area, onClick }: { area: Area; onClick: () => void }) {
  const history = [...area.snapshots]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .map((s) => s.vacant_rooms);

  const latest = history[history.length - 1] ?? 0;

  return (
    <div
      onClick={onClick}
      className="
    flex cursor-pointer items-center justify-between
    rounded-xl border border-slate-200 bg-slate-50
    px-4 py-3
    transition-all duration-150
    hover:border-slate-300
    hover:bg-slate-100
    hover:shadow-sm
  "
    >
      <div>
        <div className="font-medium text-slate-900">{area.name_ja}</div>

        <div className="mt-1 text-sm text-slate-500">{history.join(" → ")}</div>
      </div>

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
  );
}

function PrefectureCard({
  prefecture,
  onAreaClick,
}: {
  prefecture: Prefecture;
  onAreaClick: (area: Area) => void;
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
          />
        ))}
      </div>
    </div>
  );
}

function RegionCard({
  region,
  onAreaClick,
}: {
  region: Region;
  onAreaClick: (area: Area) => void;
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
          />
        ))}
      </div>
    </section>
  );
}

function VacancyDashboard() {
  const { regions, loading } = useRegions();

  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">
          UR Vacancy Tracker
        </h1>

        {loading ? (
          <Skeleton />
        ) : (
          regions.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              onAreaClick={setSelectedArea}
            />
          ))
        )}

        {selectedArea && (
          <AreaModal
            area={selectedArea}
            onClose={() => setSelectedArea(null)}
          />
        )}
      </div>
    </div>
  );
}

function AreaModal({ area, onClose }: { area: Area; onClose: () => void }) {
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

export default function App() {
  return <VacancyDashboard />;
}
