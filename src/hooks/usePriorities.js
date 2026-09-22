import { useState, useEffect } from "react";
import { fetchPriorities } from "../lib/clickup";

export function usePriorities() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPriorities()
      .then((data) => { if (!cancelled) { setPriorities(data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { priorities, loading, error };
}
