import { useState, useCallback, useMemo } from "react";
import { focusStore, sessionsStore, todayKey } from "../lib/storage";
import { FOCUS_GOAL_MIN } from "../data";

export function useFocus() {
  const today = todayKey();
  const [todayMins, setTodayMins] = useState(() => focusStore.get(today));
  const [sessions, setSessions] = useState(() => sessionsStore.get());

  const logSession = useCallback((session) => {
    focusStore.add(today, session.mins);
    setTodayMins(focusStore.get(today));
    sessionsStore.push(session);
    setSessions(sessionsStore.get());
  }, [today]);

  const goalMin = FOCUS_GOAL_MIN;
  const pct = useMemo(() => Math.min(100, Math.round((todayMins / goalMin) * 100)), [todayMins]);

  return { todayMins, goalMin, pct, sessions, logSession };
}
