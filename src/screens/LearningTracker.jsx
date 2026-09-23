import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RefreshCw, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { C } from "../theme";
import { Label, Fig, Panel, rise } from "../kit";
import { fetchLearningPages } from "../lib/clickup";

const LEARNING_HUB_ROOT = "8ccvrfk-28773";
const SKIP_IDS = [LEARNING_HUB_ROOT, "8ccvrfk-44073"];

const CURRENT_KEY = "learning:current";

const CAT_ICONS = {
  "Business":                    "💼",
  "Personal Development":        "🧠",
  "Novels":                      "📖",
  "Technology":                  "🛰️",
  "Memoirs":                     "✍️",
  "Movies":                      "🎬",
  "Cooking":                     "🍳",
  "Health and Lifestyle":        "💪",
  "Parenthood and Relationships":"👨‍👩‍👧",
  "Productivity":                "⚡",
};

const CAT_COLOR = {
  "Business": "#A9C4A1", "Novels": "#D4A574", "Personal Development": "#B8C8E0",
  "Productivity": "#C4B8A8", "Memoirs": "#E8A98E", "Technology": "#A9C4A1",
  "Health and Lifestyle": "#A9C4A1", "Movies": "#D4A574", "Cooking": "#E8A98E",
  "Parenthood and Relationships": "#B8C8E0",
};

function safe(fn, def) { try { return fn(); } catch { return def; } }
function loadCurrent() { return safe(() => JSON.parse(localStorage.getItem(CURRENT_KEY) ?? "[]"), []); }
function saveCurrent(v) { safe(() => localStorage.setItem(CURRENT_KEY, JSON.stringify(v))); }

export default function LearningTracker() {
  const [pages,    setPages]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [current,  setCurrent]  = useState(() => loadCurrent());
  const [newTitle, setNewTitle] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    fetchLearningPages()
      .then((p) => { setPages(p); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const { tree, totalRead, recent } = useMemo(() => {
    if (!pages.length) return { tree: [], totalRead: 0, recent: [] };

    const categoryPages = pages.filter((p) => p.parent_page_id === LEARNING_HUB_ROOT && !SKIP_IDS.includes(p.id));
    const catIdSet = new Set(categoryPages.map((p) => p.id));

    const groups = categoryPages
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((cat) => {
        const items = pages
          .filter((p) => !SKIP_IDS.includes(p.id) && p.parent_page_id === cat.id && p.name)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        return { cat, items };
      })
      .filter((g) => g.items.length > 0);

    const allItems = pages.filter((p) => !SKIP_IDS.includes(p.id) && !catIdSet.has(p.id) && p.parent_page_id && p.name);
    // "recent" = last 8 by order_index within their group
    const recentItems = [...allItems].sort((a, b) => (b.order_index ?? 0) - (a.order_index ?? 0)).slice(0, 8);

    return { tree: groups, totalRead: allItems.length, recent: recentItems };
  }, [pages]);

  // ── Currently reading (local) ────────────────────────────────────────────
  const addCurrent = useCallback(() => {
    if (!newTitle.trim()) return;
    const next = [...current, { id: Date.now(), title: newTitle.trim() }];
    setCurrent(next); saveCurrent(next); setNewTitle("");
  }, [current, newTitle]);

  const removeCurrent = useCallback((id) => {
    const next = current.filter((c) => c.id !== id);
    setCurrent(next); saveCurrent(next);
  }, [current]);

  const clickUpUrl = (pageId) => `https://app.clickup.com/9006080499/docs/8ccvrfk-25833/${pageId}`;

  return (
    <div className="space-y-7">

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {!loading && !error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { l: "Books & articles read", v: totalRead, c: C.moss },
              { l: "Currently reading",     v: current.length, c: C.text },
              { l: "Categories",            v: tree.length, c: C.dim },
              { l: "Most read category",    v: tree.sort ? (tree.slice().sort((a,b)=>b.items.length-a.items.length)[0]?.cat.name ?? "—") : "—", c: C.faint, small: true },
            ].map((s) => (
              <div key={s.l} className="px-5 py-4" style={{ background: "rgba(36,46,34,0.7)" }}>
                <Label>{s.l}</Label>
                <div className="mt-3">
                  <span className={`font-black uppercase tracking-[-0.02em] ${s.small ? "text-[18px]" : "text-[28px]"}`} style={{ color: s.c }}>
                    {s.v}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Category breakdown ────────────────────────────────────────────── */}
      {!loading && !error && tree.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0.3}>
          <Panel title="Breakdown by category">
            <div className="space-y-3 py-2">
              {tree.slice().sort((a, b) => b.items.length - a.items.length).map((g) => {
                const pct = Math.round((g.items.length / totalRead) * 100);
                const col = CAT_COLOR[g.cat.name] ?? C.moss;
                return (
                  <div key={g.cat.id} className="px-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold" style={{ color: C.text }}>
                        {CAT_ICONS[g.cat.name] ?? "📚"} {g.cat.name}
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: col }}>{g.items.length}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full" style={{ background: C.lineSoft }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ── Currently reading (local) ─────────────────────────────────────── */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0.6}>
        <Panel title="Currently reading" action={
          <span className="text-[12px] font-light" style={{ color: C.ghost }}>saved locally</span>
        }>
          <div className="space-y-3 pt-1 pb-3 px-5">
            {current.length === 0 && (
              <p className="text-[13px] font-light" style={{ color: C.faint }}>
                Add what you're reading right now — these aren't in your ClickUp archive yet.
              </p>
            )}
            {current.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.moss }} />
                <span className="flex-1 text-[15px] font-light" style={{ color: C.text }}>{c.title}</span>
                <button type="button" onClick={() => removeCurrent(c.id)}
                  className="cursor-pointer opacity-30 hover:opacity-70 transition-opacity"
                  style={{ color: C.faint }}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCurrent()}
                placeholder="Book or article title…"
                className="flex-1 border-b bg-transparent py-1.5 text-[14px] font-light outline-none"
                style={{ borderColor: C.line, color: C.text }}
              />
              <button type="button" onClick={addCurrent} disabled={!newTitle.trim()}
                className="flex cursor-pointer items-center gap-1 border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                style={{ borderColor: C.moss, color: C.moss }}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* ── Loading / error ───────────────────────────────────────────────── */}
      {loading && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Reading Archive">
            <div className="flex items-center gap-3 py-6 text-[13px]" style={{ color: C.faint }}>
              <RefreshCw size={15} className="animate-spin" /> Loading from ClickUp…
            </div>
          </Panel>
        </motion.div>
      )}
      {error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Reading Archive" action={
            <button type="button" onClick={load} className="cursor-pointer text-[12px]" style={{ color: C.moss }}>Retry</button>
          }>
            <div className="py-4 text-[13px]" style={{ color: C.oxide }}>{error}</div>
          </Panel>
        </motion.div>
      )}

      {/* ── Recent reads ──────────────────────────────────────────────────── */}
      {!loading && !error && recent.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0.9}>
          <Panel title="Recent additions to your archive" flush>
            {recent.map((p, i) => {
              const cat = tree.find((g) => g.items.some((it) => it.id === p.id))?.cat;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-[13px]"
                  style={{ borderBottom: i < recent.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium" style={{ color: C.text }}>{p.name}</div>
                    {cat && <div className="mt-0.5 text-[11px]" style={{ color: C.ghost }}>{CAT_ICONS[cat.name] ?? "📚"} {cat.name}</div>}
                  </div>
                  <a href={clickUpUrl(p.id)} target="_blank" rel="noreferrer"
                    className="cursor-pointer opacity-30 hover:opacity-70 transition-opacity">
                    <ExternalLink size={13} color={C.faint} />
                  </a>
                </div>
              );
            })}
          </Panel>
        </motion.div>
      )}

      {/* ── Full archive by category (collapsible) ────────────────────────── */}
      {!loading && !error && tree.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1.2}>
          <Panel title="Full reading archive" flush>
            {tree.map((g, gi) => {
              const open = expanded === g.cat.id;
              return (
                <div key={g.cat.id} style={{ borderBottom: gi < tree.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                  <button type="button" onClick={() => setExpanded(open ? null : g.cat.id)}
                    className="flex w-full cursor-pointer items-center gap-4 px-5 py-[14px] text-left hover:bg-[#2C372A] transition-colors">
                    {open ? <ChevronDown size={14} color={C.moss} /> : <ChevronRight size={14} color={C.ghost} />}
                    <span className="flex-1 text-[14px] font-semibold" style={{ color: C.text }}>
                      {CAT_ICONS[g.cat.name] ?? "📚"} {g.cat.name}
                    </span>
                    <span className="text-[12px] font-bold" style={{ color: CAT_COLOR[g.cat.name] ?? C.ghost }}>
                      {g.items.length}
                    </span>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        {g.items.map((item, ii) => (
                          <div key={item.id} className="flex items-center gap-4 px-10 py-[10px]"
                            style={{ borderBottom: ii < g.items.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                            <span className="flex-1 text-[13px] font-light" style={{ color: C.dim }}>{item.name}</span>
                            <a href={clickUpUrl(item.id)} target="_blank" rel="noreferrer"
                              className="cursor-pointer opacity-20 hover:opacity-60 transition-opacity">
                              <ExternalLink size={12} color={C.faint} />
                            </a>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Panel>
        </motion.div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <div className="flex items-center justify-between px-5 py-3 text-[12px] font-light"
            style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
            <span>Synced from your <span style={{ color: C.text }}>Learning Hub</span> in ClickUp — add new books there, they appear here automatically.</span>
            <button type="button" onClick={load} className="cursor-pointer ml-4 shrink-0 hover:opacity-80 transition-opacity"
              style={{ color: C.moss }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
