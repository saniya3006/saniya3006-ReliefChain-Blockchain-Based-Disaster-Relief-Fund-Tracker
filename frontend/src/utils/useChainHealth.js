import { useEffect, useState } from "react";
import { api } from "./api";

/** Polls /api/health so the user can see the live blockchain connection. */
export function useChainHealth(intervalMs = 8000) {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const h = await api.health();
        if (alive) {
          setHealth(h);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { health, error };
}
