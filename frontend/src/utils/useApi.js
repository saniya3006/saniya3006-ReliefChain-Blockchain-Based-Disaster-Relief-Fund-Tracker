import { useCallback, useEffect, useState } from "react";

/** Load data from the backend with loading / error state and a reload() helper. */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps);

  const reload = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setData(await load());
        setError(null);
      } catch (e) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
