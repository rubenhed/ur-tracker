import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useSubscribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(email: string, areaIds: number[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, area_ids: areaIds }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      return await res.json();
    } catch (e) {
      setError("Something went wrong, try again. Error mesage: " + e);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { subscribe, loading, error };
}
