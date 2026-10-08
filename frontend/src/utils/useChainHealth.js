import { useEffect, useState } from "react";
import { api } from "./api";

// One shared poll of /api/health for the whole app, so every component that
// shows the network or an explorer link reads the same data without each
// starting its own timer.
const POLL_MS = 8000;
let state = { health: null, error: null };
const listeners = new Set();
let timer = null;

async function tick() {
  try {
    state = { health: await api.health(), error: null };
  } catch (e) {
    state = { health: state.health, error: e.message };
  }
  listeners.forEach((fn) => fn(state));
}

/** Live blockchain connection: { health, error }. */
export function useChainHealth() {
  const [value, setValue] = useState(state);

  useEffect(() => {
    listeners.add(setValue);
    if (!timer) {
      tick();
      timer = setInterval(tick, POLL_MS);
    } else {
      setValue(state);
    }
    return () => {
      listeners.delete(setValue);
      if (listeners.size === 0) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return value;
}

/** Block-explorer URL for a transaction, or null on a local chain. */
export function explorerTxUrl(health, hash) {
  return health?.explorer && hash ? `${health.explorer}/tx/${hash}` : null;
}
