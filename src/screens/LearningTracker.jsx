import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, BookOpen, RefreshCw } from "lucide-react";
import { C, num } from "../theme";
import { Label, Fig, Panel, Chip, rise } from "../kit";
import { fetchLearningPages } from "../lib/clickup";

const KEY = "learning:status";

const CAT_ICONS = {
  "Business":            "💼",
  "Personal Development":"🧠",
  "Novels":              "📖",
  "Technology":          "🛰️",
  "Memoirs":             "✍️",
};

const STATUS_OPTS = ["Reading", "Queue", "Done"];
const STATUS_COLOR = { Reading: "#A9C4A1", Queue: "#D4A574", Done: "#5A7058" };

function safe(fn, def) { try { return fn(); } catch { return def; } }

function loadStatus() { return safe(() => JSON.parse(localStorage.getItem(KEY) ?? "{}"), {}); }
function saveStatus(s) { safe(() => localStorage.setItem(KEY, JSON.stringify(s))); }

const LEARNING_HUB_ROOT = "8ccvrfk-28773";
const CATEGORY_IDS = ["8ccvrfk-28753", "8ccvrfk-28613", "8ccvrfk-30353", "8ccvrfk-46673", "8ccvrfk-30393"];
const SKIP_IDS = [LEARNING_HUB_ROOT, "8ccvrfk-44073"]; // root + untitled

export default function LearningTracker() {
  const [pages,    setPages]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [status,   setStatus]   = useState(() => loadStatus());

  const load = () => {
    setLoading(true); setError(null);
    fetchLearningPages()
      .then((p) => { setPages(p); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const setItemStatus = (id, val) => {
    const next = val ? { ...status, [id]: val } : Object.fromEntries(Object.entries(status).filter(([k]) => k !== id));
    setStatus(next);
    saveStatus(next);
  };

  // Build tree: categories + their leaves (skip deeply-nested sub-subs beyond items)
  const tree = useMemo(() => {
    if (!pages.length) return [];

    // Map by ID for quick lookup
    const byId = Object.fromEntries(pages.map((p) => [p.id, p]));

    // Category pages (direct children of Learning Hub root)
    const categories = pages
      .filter((p) => p.parent_page_id === LEARNING_HUB_ROOT && !SKIP_IDS.includes(p.id))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    return categories.map((cat) => {
      // Items: direct children of this category (that are leaf-ish content items)
      const items = pages
        .filter((p) => !SKIP_IDS.includes(p.id) && p.parent_page_id === cat.id)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      return { cat, items };
    }).filter((g) => g.items.length > 0);
  }, [pages]);

  const currentlyReading = useMemo(
    () => pages.filter((p) => status[p.id] === "Reading" && !SKIP_IDS.includes(p.id)),
    [pages, status]
  );

  const doneCount = pages.filter((p) => status[p.id] === "Done").length;
  const queueCount = pages.filter((p) => status[p.id] === "Queue").length;
  const totalItems = pages.filter((p) => !SKIP_IDS.includes(p.id) && !CATEGORY_IDS.includes(p.id)).length;

  const clickUpUrl = (pageId) =>
    `https://app.clickup.com/9006080499/docs/8ccvrfk-25833/${pageId}`;

  return (
    <div className="space-y-7">
      {/* Stats */}
      {!loading && !error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <div className="grid gap-px sm:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { l: "Items in Learning Hub", v: totalItems, c: C.text },
              { l: "Currently reading",     v: currentlyReading.length, c: C.moss },
              { l: "In the queue",          v: queueCount, c: "#D4A574" },
              { l: "Completed",             v: doneCount, c: C.ghost },
            ].map((s) => (
              <div key={s.l} className="px-5 py-4" style={{ background: "rgba(36,46,34,0.7)" }}>
                <Label>{s.l}</Label>
                <div className="mt-3"><Fig size={26} color={s.c}>{s.v}</Fig></div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Currently reading */}
      {currentlyReading.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0.5}>
          <Panel title="Currently reading" flush>
            {currentlyReading.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < currentlyReading.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-semibold" style={{ color: C.text }}>{p.name}</div>
                  {p.sub_title && <div className="mt-0.5 text-[12px]" style={{ color: C.faint }}>{p.sub_title}</div>}
                </div>
                <StatusToggle id={p.id} val={status[p.id]} onChange={setItemStatus} />
                <a href={clickUpUrl(p.id)} target="_blank" rel="noreferrer"
                  className="ml-1 cursor-pointer opacity-40 hover:opacity-80">
                  <ExternalLink size={13} color={C.faint} />
                </a>
              </div>
            ))}
          </Panel>
        </motion.div>
      )}

      {/* Loading / error */}
      {loading && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Learning Hub">
            <div className="flex items-center gap-3 py-6 text-[13px]" style={{ color: C.faint }}>
              <RefreshCw size={15} className="animate-spin" /> Loading from ClickUp…
            </div>
          </Panel>
        </motion.div>
      )}
      {error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Learning Hub" action={<button type="button" onClick={load} className="cursor-pointer text-[12px]" style={{ color: C.moss }}>Retry</button>}>
            <div className="py-4 text-[13px]" style={{ color: C.oxide }}>{error}</div>
          </Panel>
        </motion.div>
      )}

      {/* Category groups */}
      {!loading && !error && tree.map((g, gi) => (
        <motion.div key={g.cat.id} variants={rise} initial="hidden" animate="show" custom={1 + gi * 0.15}>
          <Panel
            title={`${CAT_ICONS[g.cat.name] ?? "📚"} ${g.cat.name}`}
            action={
              <span className="text-[12px]" style={{ color: C.ghost }}>
                {g.items.filter((i) => status[i.id] === "Done").length} / {g.items.length} done
              </span>
            }
            flush>
            {g.items.map((item, ii) => {
              const st = status[item.id];
              return (
                <div key={item.id}
                  className="flex items-center gap-4 px-5 py-[14px]"
                  style={{
                    borderBottom: ii < g.items.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                    opacity: st === "Done" ? 0.55 : 1,
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium leading-snug"
                      style={{ color: st === "Done" ? C.ghost : C.text,
                               textDecoration: st === "Done" ? "line-through" : "none" }}>
                      {item.name}
                    </div>
                    {item.sub_title && (
                      <div className="mt-0.5 text-[12px]" style={{ color: C.faint }}>{item.sub_title}</div>
                    )}
                    {item.content && item.content.trim() && item.content.length < 120 && (
                      <div className="mt-0.5 text-[12px]" style={{ color: C.ghost }}>{item.content.trim()}</div>
                    )}
                  </div>
                  <StatusToggle id={item.id} val={st} onChange={setItemStatus} />
                  <a href={clickUpUrl(item.id)} target="_blank" rel="noreferrer"
                    className="ml-1 cursor-pointer opacity-30 hover:opacity-70 transition-opacity">
                    <ExternalLink size={13} color={C.faint} />
                  </a>
                </div>
              );
            })}
          </Panel>
        </motion.div>
      ))}

      {/* Footer note */}
      {!loading && !error && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
          <div className="px-5 py-3 text-[12px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
            Synced live from your <span style={{ color: C.text }}>Learning Hub</span> doc in ClickUp.
            Add new books and notes there — they appear here automatically on next refresh.
            Status (Reading / Queue / Done) is saved locally in this app.
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusToggle({ id, val, onChange }) {
  const cycle = () => {
    const idx = val ? STATUS_OPTS.indexOf(val) : -1;
    const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length];
    onChange(id, next === STATUS_OPTS[0] && !val ? next : idx === STATUS_OPTS.length - 1 ? null : next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="shrink-0 cursor-pointer border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-all"
      style={{
        borderColor: val ? STATUS_COLOR[val] : C.lineSoft,
        color:       val ? STATUS_COLOR[val] : C.ghost,
        background:  val ? `${STATUS_COLOR[val]}12` : "transparent",
        minWidth: 72,
      }}>
      {val ?? "· · ·"}
    </button>
  );
}
