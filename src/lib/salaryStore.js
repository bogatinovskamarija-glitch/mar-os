// Weekly salary tracker — independent of transaction data
// Cutoff = first Monday of Oct 2023 (company's last payment was Sep 2023)

const KEY          = "salary:log";
const CUTOFF       = "2023-10-02"; // first unpaid Monday
const DEFAULT_RATE = 1250;

function safe(fn, def) { try { return fn(); } catch { return def; } }

function mondayOf(d) {
  const day = d.getDay();
  const off = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + off);
  m.setHours(0, 0, 0, 0);
  return m;
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function generateWeeks(fromISO = CUTOFF, toDate = new Date()) {
  const weeks = [];
  let cur = mondayOf(new Date(fromISO + "T12:00:00"));
  const end = mondayOf(toDate);
  while (cur <= end) {
    weeks.push(toISO(cur));
    cur = new Date(cur.getTime() + 7 * 86400000);
  }
  return weeks;
}

export function formatWeekRange(iso) {
  const d = new Date(iso + "T12:00:00");
  const e = new Date(d.getTime() + 6 * 86400000);
  const fmt = (x) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(d)} – ${fmt(e)}`;
}

export const salaryStore = {
  _get() {
    return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "{}"), {});
  },
  _save(data) {
    safe(() => localStorage.setItem(KEY, JSON.stringify(data)));
  },
  getRate() {
    return this._get().rate ?? DEFAULT_RATE;
  },
  setRate(r) {
    const s = this._get(); s.rate = r; this._save(s);
  },
  getOverrides() {
    return this._get().overrides ?? {};
  },
  setWeek(weekISO, paid) {
    const s = this._get();
    s.overrides = s.overrides ?? {};
    if (paid === null) delete s.overrides[weekISO];
    else s.overrides[weekISO] = paid;
    this._save(s);
  },
  computeOwed() {
    const rate      = this.getRate();
    const overrides = this.getOverrides();
    const weeks     = generateWeeks();
    const unpaid    = weeks.filter((w) => !(overrides[w] ?? false));
    return { unpaid: unpaid.length, total: unpaid.length * rate, rate };
  },
};

export { CUTOFF, DEFAULT_RATE };
