const KEY = "wins:log";

function safe(fn, def) { try { return fn(); } catch { return def; } }

export const WIN_CATS = ["Work", "Personal", "Financial", "Learning", "Wellness"];

export const CAT_COLOR = {
  Work:      "#A9C4A1",  // moss
  Personal:  "#D4A574",  // warm
  Financial: "#E8A98E",  // oxide-warm
  Learning:  "#B8C8E0",  // cool blue
  Wellness:  "#C4B8A8",  // neutral sand
};

export const winsStore = {
  _get() { return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "[]"), []); },
  _save(d) { safe(() => localStorage.setItem(KEY, JSON.stringify(d))); },
  all() { return this._get(); },
  add(cat, text) {
    const wins = this._get();
    const win = {
      id:   `${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      cat,
      text: text.trim(),
    };
    wins.unshift(win);
    this._save(wins);
    return win;
  },
  remove(id) {
    this._save(this._get().filter((w) => w.id !== id));
  },
};
