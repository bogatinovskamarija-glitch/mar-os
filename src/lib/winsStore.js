import { supabase, getUid } from "./supabase";

const KEY = "wins:log";

function safe(fn, def) { try { return fn(); } catch { return def; } }

export const WIN_CATS = ["Work", "Personal", "Financial", "Learning", "Wellness"];

export const CAT_COLOR = {
  Work:      "#A9C4A1",
  Personal:  "#D4A574",
  Financial: "#E8A98E",
  Learning:  "#B8C8E0",
  Wellness:  "#C4B8A8",
};

function localGet()    { return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "[]"), []); }
function localSave(d)  { safe(() => localStorage.setItem(KEY, JSON.stringify(d))); }

export const winsStore = {
  all() { return localGet(); },

  async add(cat, text) {
    const win = {
      id:   `${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      cat,
      text: text.trim(),
    };
    // Write to localStorage immediately
    const wins = localGet();
    wins.unshift(win);
    localSave(wins);
    // Sync to Supabase in background
    const uid = getUid();
    if (uid) {
      supabase.from("mar_os_wins").insert({ ...win, user_id: uid }).then(() => {});
    }
    return win;
  },

  async remove(id) {
    localSave(localGet().filter((w) => w.id !== id));
    const uid = getUid();
    if (uid) {
      supabase.from("mar_os_wins").delete().eq("user_id", uid).eq("id", id).then(() => {});
    }
  },

  // Called by syncDown after fetching from Supabase — replaces local cache
  hydrate(rows) {
    const wins = rows
      .map((r) => ({ id: r.id, cat: r.cat, text: r.text, date: String(r.date).slice(0, 10) }))
      .sort((a, b) => b.id.localeCompare(a.id));
    localSave(wins);
    return wins;
  },
};
