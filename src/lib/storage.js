const safe = (fn, fallback) => {
  try { return fn(); } catch { return fallback; }
};

export const todayKey = () => new Date().toISOString().slice(0, 10);

// ── Habits ──────────────────────────────────────────────────────────────────
// Shape: { [habitName]: 0 | 1 }  stored at key "habits:{YYYY-MM-DD}"
export const habitsStore = {
  get(date) {
    return safe(() => JSON.parse(localStorage.getItem(`habits:${date}`)), null);
  },
  set(date, data) {
    safe(() => localStorage.setItem(`habits:${date}`, JSON.stringify(data)));
  },
  streak(numHabits) {
    let count = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const entry = safe(() => JSON.parse(localStorage.getItem(`habits:${key}`)), null);
      if (!entry) break;
      const done = Object.values(entry).filter(Boolean).length;
      if (done < numHabits) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  },
  // Returns all stored entries, optionally filtered to a YYYY or YYYY-MM prefix
  allEntries(prefix) {
    return safe(() => {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith("habits:") && k !== "habits:config" &&
          (!prefix || k.replace("habits:", "").startsWith(prefix)))
        .sort()
        .map((k) => ({ date: k.replace("habits:", ""), data: safe(() => JSON.parse(localStorage.getItem(k)), {}) }));
    }, []);
  },
};

// Habits config: which habits are active vs retired
// Shape: { active: string[], retired: string[] }
export const habitsConfigStore = {
  get(defaultNames) {
    return safe(
      () => JSON.parse(localStorage.getItem("habits:config")),
      { active: defaultNames ?? [], retired: [] }
    );
  },
  set(config) {
    safe(() => localStorage.setItem("habits:config", JSON.stringify(config)));
  },
};

// ── Focus ────────────────────────────────────────────────────────────────────
// Shape: number (minutes) stored at "focus:{YYYY-MM-DD}"
export const focusStore = {
  get(date) {
    return safe(() => parseInt(localStorage.getItem(`focus:${date}`) ?? "0"), 0);
  },
  add(date, minutes) {
    const curr = focusStore.get(date);
    safe(() => localStorage.setItem(`focus:${date}`, String(curr + minutes)));
  },
};

// Session log: array of { date, target, done, mins, result }
export const sessionsStore = {
  get() {
    return safe(() => JSON.parse(localStorage.getItem("focus:sessions") ?? "[]"), []);
  },
  push(session) {
    const all = sessionsStore.get();
    all.unshift({ ...session, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
    safe(() => localStorage.setItem("focus:sessions", JSON.stringify(all.slice(0, 50))));
  },
};

// ── Journal ──────────────────────────────────────────────────────────────────
// Shape: { text, mood, words, saved } stored at "journal:{YYYY-MM-DD}"
export const journalStore = {
  get(date) {
    return safe(() => JSON.parse(localStorage.getItem(`journal:${date}`)), null);
  },
  set(date, data) {
    safe(() => localStorage.setItem(`journal:${date}`, JSON.stringify(data)));
  },
  listDates() {
    return safe(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("journal:"));
      return keys.map((k) => k.replace("journal:", "")).sort().reverse();
    }, []);
  },
  today() {
    const key = todayKey();
    const entry = journalStore.get(key);
    if (!entry) return null;
    const words = entry.text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    const excerpt = (entry.text ?? "").slice(0, 120);
    return { words, excerpt, saved: entry.saved ?? null };
  },
  stats() {
    const dates = journalStore.listDates();
    const month = new Date().toISOString().slice(0, 7);
    const thisMonth = dates.filter((d) => d.startsWith(month)).length;
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const e = journalStore.get(key);
      if (!e?.text?.trim()) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return { totalEntries: dates.length, dayStreak: streak, thisMonth };
  },
};

// ── Finance ──────────────────────────────────────────────────────────────────
export const financeStore = {
  get() {
    return safe(() => JSON.parse(localStorage.getItem("finance:data")), null);
  },
  set(data) {
    safe(() => localStorage.setItem("finance:data", JSON.stringify(data)));
    safe(() => localStorage.setItem("finance:importedAt", new Date().toISOString()));
  },
  importedAt() {
    return safe(() => localStorage.getItem("finance:importedAt"), null);
  },
};
