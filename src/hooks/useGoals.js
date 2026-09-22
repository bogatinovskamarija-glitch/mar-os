import { useState, useEffect } from "react";
import { fetchGoals } from "../lib/clickup";

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchGoals()
      .then((data) => { if (!cancelled) { setGoals(data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { goals, loading, error };
}
