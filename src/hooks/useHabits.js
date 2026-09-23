import { useState, useCallback, useMemo, useEffect } from "react";
import { habitsStore, habitsConfigStore, todayKey } from "../lib/storage";
import { writeHabitDay } from "../lib/clickup";
import { HABIT_NAMES, HABIT_NOTES } from "../data";

// Shared subscribers so all useHabits() instances stay in sync
const _subscribers = new Set();

export function useHabits() {
  const today = todayKey();

  const [config, setConfig] = useState(() => habitsConfigStore.get(HABIT_NAMES));
  const activeNames = config.active;

  function emptyChecks(names) {
    return Object.fromEntries((names ?? activeNames).map((n) => [n, 0]));
  }

  const [checks, setChecks] = useState(() => habitsStore.get(today) ?? emptyChecks(config.active));

  useEffect(() => {
    const refresh = () => {
      const fresh = habitsConfigStore.get(HABIT_NAMES);
      setConfig(fresh);
      setChecks(habitsStore.get(today) ?? emptyChecks(fresh.active));
    };
    _subscribers.add(refresh);
    // Re-read after Supabase syncDown writes to localStorage
    window.addEventListener("syncdown-complete", refresh);
    return () => {
      _subscribers.delete(refresh);
      window.removeEventListener("syncdown-complete", refresh);
    };
  }, [today]);

  const toggle = useCallback((habitName) => {
    setChecks((prev) => {
      const next = { ...prev, [habitName]: prev[habitName] ? 0 : 1 };
      habitsStore.set(today, next);
      writeHabitDay(today, next);
      _subscribers.forEach((fn) => fn());
      return next;
    });
  }, [today]);

  const addHabit = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setConfig((prev) => {
      if (prev.active.includes(trimmed)) return prev;
      const next = { active: [...prev.active, trimmed], retired: prev.retired };
      habitsConfigStore.set(next);
      _subscribers.forEach((fn) => fn());
      return next;
    });
  }, []);

  const retireHabit = useCallback((name) => {
    setConfig((prev) => {
      const next = {
        active: prev.active.filter((n) => n !== name),
        retired: [...prev.retired, name],
      };
      habitsConfigStore.set(next);
      setChecks((c) => { const n = { ...c }; delete n[name]; return n; });
      _subscribers.forEach((fn) => fn());
      return next;
    });
  }, []);

  const restoreHabit = useCallback((name) => {
    setConfig((prev) => {
      const next = {
        active: [...prev.active, name],
        retired: prev.retired.filter((n) => n !== name),
      };
      habitsConfigStore.set(next);
      _subscribers.forEach((fn) => fn());
      return next;
    });
  }, []);

  const done = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const total = activeNames.length;
  const streak = useMemo(() => habitsStore.streak(total), [done]);

  const weekData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const isToday = key === todayStr;
      const stored = isToday ? checks : (habitsStore.get(key) ?? emptyChecks(activeNames));
      return {
        date: d,
        label: isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        key,
        isToday,
        habits: stored,
      };
    });
  }, [checks, activeNames]);

  const notes = useMemo(() => {
    const base = { ...HABIT_NOTES };
    activeNames.forEach((n) => { if (!(n in base)) base[n] = ""; });
    return base;
  }, [activeNames]);

  return {
    checks, toggle, done, total, streak, weekData, today,
    names: activeNames,
    notes,
    retiredNames: config.retired,
    addHabit, retireHabit, restoreHabit,
  };
}
