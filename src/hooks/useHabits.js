import { useState, useCallback, useMemo, useEffect } from "react";
import { habitsStore, todayKey } from "../lib/storage";
import { writeHabitDay } from "../lib/clickup";
import { HABIT_NAMES, HABIT_NOTES } from "../data";

function emptyChecks() {
  return Object.fromEntries(HABIT_NAMES.map((n) => [n, 0]));
}

// Shared subscribers so all useHabits() instances stay in sync
const _subscribers = new Set();

export function useHabits() {
  const today = todayKey();

  const [checks, setChecks] = useState(() => {
    return habitsStore.get(today) ?? emptyChecks();
  });

  useEffect(() => {
    const refresh = () => setChecks(habitsStore.get(today) ?? emptyChecks());
    _subscribers.add(refresh);
    return () => _subscribers.delete(refresh);
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

  const done = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const total = HABIT_NAMES.length;
  const streak = useMemo(() => habitsStore.streak(total), [done]);

  // Current Sun–Sat week for the Habits sheet
  const weekData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);
    // Rewind to Sunday (getDay() returns 0 for Sunday)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const isToday = key === todayStr;
      const stored = isToday ? checks : (habitsStore.get(key) ?? emptyChecks());
      return {
        date: d,
        label: isToday
          ? "Today"
          : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        key,
        isToday,
        habits: stored,
      };
    });
  }, [checks]);

  return { checks, toggle, done, total, streak, weekData, today, names: HABIT_NAMES, notes: HABIT_NOTES };
}
