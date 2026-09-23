const KEY = "review:log";

function safe(fn, def) { try { return fn(); } catch { return def; } }

export function currentWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const off = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + off);
  return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`;
}

export function weekLabel(iso) {
  const d = new Date(iso + "T12:00:00");
  const e = new Date(d.getTime() + 6 * 86400000);
  const fmt = (x) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(d)} – ${fmt(e)}, ${d.getFullYear()}`;
}

export const reviewStore = {
  _get() { return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "{}"), {}); },
  _save(d) { safe(() => localStorage.setItem(KEY, JSON.stringify(d))); },
  getWeek(iso) { return this._get()[iso] ?? null; },
  saveWeek(iso, data) {
    const s = this._get();
    s[iso] = { ...data, saved: new Date().toISOString() };
    this._save(s);
  },
  allWeeks() {
    return Object.entries(this._get())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([week, data]) => ({ week, ...data }));
  },
};
