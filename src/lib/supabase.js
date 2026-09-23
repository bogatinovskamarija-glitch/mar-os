import { createClient } from "@supabase/supabase-js";
import { buildFinanceState } from "./finance";

// Publishable key — safe to include in client-side code
export const supabase = createClient(
  "https://btmxozmpzpxisrczlkop.supabase.co",
  "sb_publishable_bv2-JYq4lde4PzvbIBBcIQ_etwTkf1z"
);

// Module-level UID so storage.js fire-and-forget writes can use it synchronously
let _uid = null;
export const getUid = () => _uid;

export function initAuth(onSession) {
  // Restore session from storage (handles magic-link token in URL hash too)
  supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user?.id ?? null;
    _uid = uid;
    onSession(data.session);
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    _uid = session?.user?.id ?? null;
    onSession(session);
  });
}

// Fetches all rows from mar_os_transactions using pagination to bypass the
// server-side max-rows cap (default 1000 on Supabase free tier).
async function fetchAllTransactions(uid) {
  const PAGE = 1000;
  const cols = "tx_key,date,month,year,account,account_type,merchant,name,description,amount,signed,flow,category,entity,entity_basis,shared,rm_category,flag";
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("mar_os_transactions")
      .select(cols)
      .eq("user_id", uid)
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ── Pull everything from Supabase into localStorage ───────────────────────────
export async function syncDown(uid) {
  if (!uid) return;
  const ago = new Date();
  ago.setFullYear(ago.getFullYear() - 1);
  const since = ago.toISOString().slice(0, 10);

  const [cfg, entries, journal, focus, sessions, settings] = await Promise.all([
    supabase.from("mar_os_habits_config").select("active,retired").eq("user_id", uid).maybeSingle(),
    supabase.from("mar_os_habit_entries").select("date,data").eq("user_id", uid).gte("date", since),
    supabase.from("mar_os_journal_entries").select("date,text,mood,saved_at").eq("user_id", uid).gte("date", since),
    supabase.from("mar_os_focus").select("date,minutes").eq("user_id", uid).gte("date", since),
    supabase.from("mar_os_focus_sessions").select("date_label,target,done,mins,result").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
    supabase.from("mar_os_settings").select("key,value").eq("user_id", uid),
  ]);
  const txns = await fetchAllTransactions(uid);

  try {
    if (cfg.data) {
      localStorage.setItem("habits:config", JSON.stringify({ active: cfg.data.active, retired: cfg.data.retired }));
    }
    for (const e of entries.data ?? []) {
      localStorage.setItem(`habits:${e.date}`, JSON.stringify(e.data));
    }
    for (const j of journal.data ?? []) {
      localStorage.setItem(`journal:${j.date}`, JSON.stringify({ text: j.text, mood: j.mood, saved: j.saved_at }));
    }
    for (const f of focus.data ?? []) {
      localStorage.setItem(`focus:${f.date}`, String(f.minutes));
    }
    if ((sessions.data ?? []).length > 0) {
      localStorage.setItem("focus:sessions", JSON.stringify(sessions.data.map((s) => ({
        date: s.date_label, target: s.target, done: s.done, mins: s.mins, result: s.result,
      }))));
    }
    for (const s of settings.data ?? []) {
      if (s.key === "playlists" && s.value) {
        localStorage.setItem("mar-os-playlists", JSON.stringify(s.value));
      }
    }
    if (txns.length > 0) {
      const state = buildFinanceState(txns);
      localStorage.setItem("finance:data", JSON.stringify(state));
      localStorage.setItem("finance:importedAt", new Date().toISOString());
    }
  } catch {}
  try { window.dispatchEvent(new Event("syncdown-complete")); } catch {}
}
