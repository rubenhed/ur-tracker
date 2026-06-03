import { useState } from "react";
import type { Area } from "../types";
import { useSubscribe } from "../hooks/useSubscribe";

type Props = {
  selectedAreas: Area[];
  onClose: () => void;
};

export function SubscribeModal({ selectedAreas, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [confirmedAreas, setConfirmedAreas] = useState<string[] | null>(null);
  const { subscribe, loading, error } = useSubscribe();

  async function handleSubmit() {
    if (!email || selectedAreas.length === 0) return;
    const res = await subscribe(
      email,
      selectedAreas.map((a) => a.id),
    );
    if (res) setConfirmedAreas(res.subscribed_areas);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Subscribe</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {confirmedAreas ? (
          <div>
            <p className="mb-3 text-slate-600">You're subscribed to:</p>
            <ul className="space-y-1">
              <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
                {confirmedAreas.map((name) => (
                  <li
                    key={name}
                    className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
                  >
                    {name}
                  </li>
                ))}
              </div>
            </ul>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors hover:cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {selectedAreas.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">
                No areas selected. Close this and check some areas first.
              </p>
            ) : (
              <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
                <p className="mb-2 text-sm text-slate-500">Subscribing to:</p>
                {selectedAreas.map((area) => (
                  <div
                    key={area.id}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {area.name_ja}
                  </div>
                ))}
              </div>
            )}

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || selectedAreas.length === 0}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
