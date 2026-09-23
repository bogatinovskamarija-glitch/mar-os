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
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const date_iso = now.toISOString().slice(0, 10);
    const entry = { ...session, date: dateLabel, date_iso };
    const all = sessionsStore.get();
    all.unshift(entry);
    const trimmed = all.slice(0, 50);
    safe(() => localStorage.setItem("focus:sessions", JSON.stringify(trimmed)));
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

// ── Budget ───────────────────────────────────────────────────────────────────
export const budgetStore = {
  getTemplate() {
    return safe(() => JSON.parse(localStorage.getItem("budget:template") ?? "{}"), {});
  },
  setTemplate(data) {
    safe(() => localStorage.setItem("budget:template", JSON.stringify(data)));
  },
};

// ── Finance ──────────────────────────────────────────────────────────────────
export const financeStore = {
  get() {
    return safe(() => {
      const d = JSON.parse(localStorage.getItem("finance:data"));
      if (!d || !Array.isArray(d.inflow)) return null;
      // Migrate: rebuild trucking/dragan nested objects from drift if missing
      if (!d.trucking && Array.isArray(d.drift) && d.drift.length > 0) {
        const last = d.drift[d.drift.length - 1];
        d.trucking = {
          balance: last.trucking_balance ?? d.truckingBalance ?? 0,
          thisMonth: { fronted: 0, repaid: 0 },
          last12: { fronted: 0, repaid: 0 },
          lifetime: { fronted: 0, repaid: 0 },
          companies: {},
          monthly: d.drift.map((dm) => ({
            month: dm.month,
            fronted: dm.fronted_trucking ?? 0,
            repaid: dm.repaid_trucking ?? 0,
            net: (dm.fronted_trucking ?? 0) - (dm.repaid_trucking ?? 0),
            balance: dm.trucking_balance ?? 0,
          })),
        };
        d.dragan = {
          balance: last.dragan_balance ?? d.draganBalance ?? 0,
          direct_fronted: 0, dragan_share: 0, repaid: 0,
          share12: 0, repaid12: 0, transactions: [],
          monthly: d.drift.map((dm) => ({
            month: dm.month,
            direct: dm.fronted_dragan ?? 0,
            share: dm.dragan_share ?? 0,
            repaid: dm.repaid_dragan ?? 0,
            balance: dm.dragan_balance ?? 0,
          })),
        };
      }
      return d;
    }, null);
  },
  set(data) {
    safe(() => localStorage.setItem("finance:data", JSON.stringify(data)));
    safe(() => localStorage.setItem("finance:importedAt", new Date().toISOString()));
    const uid = getUid();
    if (!uid || !data?.transactions?.length) return;
    const txns = data.transactions;
    const BATCH = 400;
    for (let i = 0; i < txns.length; i += BATCH) {
      const rows = txns.slice(i, i + BATCH).map((t) => ({
        user_id:      uid,
        tx_key:       t.tx_key,
        date:         t.date,
        month:        t.month,
        year:         t.year,
        account:      t.account,
        account_type: t.account_type ?? null,
        merchant:     t.merchant ?? null,
        name:         t.name ?? null,
        description:  t.description ?? null,
        amount:       t.amount,
        signed:       t.signed ?? -(t.amount),
        flow:         t.flow,
        category:     t.category ?? null,
        entity:       t.entity ?? null,
        entity_basis: t.entity_basis ?? null,
        shared:       t.shared ?? false,
        rm_category:  t.rm_category ?? null,
        flag:         t.flag ?? null,
      }));
      supabase.from("mar_os_transactions")
        .upsert(rows, { onConflict: "user_id,tx_key" })
        .then(() => {});
    }
  },
  importedAt() {
    return safe(() => localStorage.getItem("finance:importedAt"), null);
  },
};
