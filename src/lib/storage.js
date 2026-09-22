import { supabase, getUid } from "./supabase";

const safe = (fn, fallback) => {
  try { return fn(); } catch { return fallback; }
};

// Fire-and-forget Supabase upsert — never throws, never blocks the UI
function sb(table, row, conflict) {
  const uid = getUid();
  if (!uid) return;
  supabase.from(table)
    .upsert({ user_id: uid, ...row }, { onConflict: conflict ?? "user_id" })
    .then(() => {});
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

// ── Habits ───────────────────────────────────────────────────────────────────
export const habitsStore = {
  get(date) {
    return safe(() => JSON.parse(localStorage.getItem(`habits:${date}`)), null);
  },
  set(date, data) {
    safe(() => localStorage.setItem(`habits:${date}`, JSON.stringify(data)));
    sb("mar_os_habit_entries", { date, data }, "user_id,date");
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

export const habitsConfigStore = {
  get(defaultNames) {
    const fallback = { active: defaultNames ?? [], retired: [] };
    const stored = safe(() => {
      const raw = localStorage.getItem("habits:config");
      return raw ? JSON.parse(raw) : null;
    }, null);
    return stored ?? fallback;
  },
  set(config) {
    safe(() => localStorage.setItem("habits:config", JSON.stringify(config)));
    sb("mar_os_habits_config", { active: config.active, retired: config.retired });
  },
};

// ── Focus ────────────────────────────────────────────────────────────────────
export const focusStore = {
  get(date) {
    return safe(() => parseInt(localStorage.getItem(`focus:${date}`) ?? "0"), 0);
  },
  add(date, minutes) {
    const curr = focusStore.get(date);
    const next = curr + minutes;
    safe(() => localStorage.setItem(`focus:${date}`, String(next)));
    sb("mar_os_focus", { date, minutes: next }, "user_id,date");
  },
};

export const sessionsStore = {
  get() {
    return safe(() => JSON.parse(localStorage.getItem("focus:sessions") ?? "[]"), []);
  },
  push(session) {
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = { ...session, date: dateLabel };
    const all = sessionsStore.get();
    all.unshift(entry);
    const trimmed = all.slice(0, 50);
    safe(() => localStorage.setItem("focus:sessions", JSON.stringify(trimmed)));
    // Write to Supabase (INSERT only — sessions are append-only)
    const uid = getUid();
    if (uid) {
      supabase.from("mar_os_focus_sessions")
        .insert({ user_id: uid, date_label: dateLabel, target: session.target, done: session.done, mins: session.mins, result: session.result })
        .then(() => {});
    }
  },
};

// ── Journal ──────────────────────────────────────────────────────────────────
export const journalStore = {
  get(date) {
    return safe(() => JSON.parse(localStorage.getItem(`journal:${date}`)), null);
  },
  set(date, data) {
    safe(() => localStorage.setItem(`journal:${date}`, JSON.stringify(data)));
    sb("mar_os_journal_entries", {
      date,
      text: data.text ?? null,
      mood: data.mood ?? null,
      saved_at: data.saved ?? null,
    }, "user_id,date");
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
    // Sync raw transactions to Supabase in batches
    const uid = getUid();
    if (!uid || !data?.transactions?.length) return;
    const txns = data.transactions;
    const BATCH = 500;
    for (let i = 0; i < txns.length; i += BATCH) {
      const rows = txns.slice(i, i + BATCH).map((t) => ({
        user_id: uid,
        date: t.date,
        description: t.description,
        amount: t.amount,
        account: t.account,
        category: t.category ?? null,
        trucking: t.trucking ?? false,
        dragan: t.dragan ?? false,
      }));
      supabase.from("mar_os_finance_transactions")
        .upsert(rows, { onConflict: "user_id,date,description,amount,account" })
        .then(() => {});
    }
  },
  importedAt() {
    return safe(() => localStorage.getItem("finance:importedAt"), null);
  },
};
