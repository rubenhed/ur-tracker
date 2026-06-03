import { useState, useEffect } from "react";
import type { Region } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export function useRegions() {
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
