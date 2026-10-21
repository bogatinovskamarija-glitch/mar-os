import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { C } from "../theme";
import { Label, Fig, Panel, rise } from "../kit";
import { winsStore, WIN_CATS, CAT_COLOR } from "../lib/winsStore";

function monthKey(dateStr) {
  // "2026-10-03" → "2026-10"
  return dateStr?.slice(0, 7) ?? "";
}
function monthLabel(key) {
  // "2026-10" → "October 2026"
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function groupByMonth(wins) {
  const map = new Map();
  for (const w of wins) {
    const k = monthKey(w.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(w);
  }
  // Sorted newest month first
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: monthLabel(key), items }));
}

export default function WinsLog() {
  const [wins,   setWins]   = useState(() => winsStore.all());
  const [selCat, setSelCat] = useState(WIN_CATS[0]);
  const [text,   setText]   = useState("");
  // Default: current month open, all others closed
  const currentMonth = monthKey(new Date().toISOString());
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonth]));

  // Re-read wins when syncdown-complete fires (Supabase just hydrated localStorage)
  useEffect(() => {
    const handler = () => setWins(winsStore.all());
    window.addEventListener("syncdown-complete", handler);
    return () => window.removeEventListener("syncdown-complete", handler);
  }, []);

  const add = useCallback(async () => {
    if (!text.trim()) return;
    await winsStore.add(selCat, text);
    setWins(winsStore.all());
    setText("");
  }, [selCat, text]);

  const remove = useCallback(async (id) => {
    await winsStore.remove(id);
    setWins(winsStore.all());
  }, []);

  const toggleMonth = (key) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const thisYear = new Date().getFullYear().toString();
  const yearWins = wins.filter((w) => w.date?.startsWith(thisYear));
  const byCat    = WIN_CATS.map((c) => ({ c, count: yearWins.filter((w) => w.cat === c).length }));
  const groups   = groupByMonth(wins);

  return (
    <div className="space-y-7">
      {/* What is a wins log */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={-0.5}>
        <div className="px-5 py-4 text-[13px] font-light leading-[1.6]"
          style={{ color: C.faint, border: `1px solid ${C.lineSoft}`, borderLeft: `3px solid ${C.moss}` }}>
          <span style={{ color: C.moss, fontWeight: 600 }}>What is a wins log?</span>{" "}
          A running list of one-liners for things that went right — a positive client response, a habit streak, a problem solved,
          a tough week you got through. Write one when it happens. Over time it becomes proof of your momentum
          that you can read when things feel slow or nothing seems to be going forward.
        </div>
      </motion.div>

      {/* Stats */}
      {wins.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <div className="grid gap-px sm:grid-cols-3 lg:grid-cols-6"
            style={{ background: C.line, border: `1px solid ${C.line}` }}>
            <div className="px-5 py-4 sm:col-span-3 lg:col-span-1" style={{ background: "rgba(36,46,34,0.7)" }}>
              <Label>Wins this year</Label>
              <div className="mt-3"><Fig size={30} color={C.moss}>{yearWins.length}</Fig></div>
            </div>
            {byCat.map((b) => (
              <div key={b.c} className="px-4 py-4" style={{ background: "rgba(36,46,34,0.7)" }}>
                <Label>{b.c}</Label>
                <div className="mt-3">
                  <Fig size={24} color={b.count > 0 ? CAT_COLOR[b.c] : C.ghost}>{b.count}</Fig>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add a win */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0.5}>
        <Panel title="Log a win">
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {WIN_CATS.map((c) => (
                  <button key={c} type="button" onClick={() => setSelCat(c)}
                    className="cursor-pointer border px-3 py-[7px] text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors"
                    style={{
                      borderColor: selCat === c ? CAT_COLOR[c] : C.line,
                      background:  selCat === c ? `${CAT_COLOR[c]}18` : "transparent",
                      color:       selCat === c ? CAT_COLOR[c] : C.dim,
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>What happened?</Label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder={
                    selCat === "Work"      ? "e.g. Submitted Argo permit package on time" :
                    selCat === "Financial" ? "e.g. Calculated exactly what the company owes" :
                    selCat === "Learning"  ? "e.g. Finished The Psychology of Money" :
                    selCat === "Wellness"  ? "e.g. 7 days without missing a workout" :
                                             "e.g. Had a genuinely good conversation"
                  }
                  className="flex-1 border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                  style={{ borderColor: C.line, color: C.text }}
                />
                <button type="button" onClick={add} disabled={!text.trim()}
                  className="flex cursor-pointer items-center gap-1.5 border px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity disabled:opacity-30"
                  style={{ borderColor: CAT_COLOR[selCat], color: CAT_COLOR[selCat], background: `${CAT_COLOR[selCat]}10` }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <p className="mt-1.5 text-[12px]" style={{ color: C.ghost }}>Press Enter to add quickly.</p>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Wins by month */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        {wins.length === 0 ? (
          <Panel title="Your wins will appear here">
            <div className="px-5 py-8 text-[13px] font-light" style={{ color: C.faint }}>
              Log your first win above. It doesn't need to be big — getting through a tough day counts.
            </div>
          </Panel>
        ) : (
          <Panel title={`All wins · ${wins.length} total`} flush>
            {groups.map((g, gi) => {
              const isOpen = openMonths.has(g.key);
              return (
                <div key={g.key} style={{ borderBottom: gi < groups.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                  {/* Month header */}
                  <button type="button" onClick={() => toggleMonth(g.key)}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-[13px] text-left transition-colors hover:bg-[#2C372A]">
                    {isOpen
                      ? <ChevronDown size={13} color={C.moss} />
                      : <ChevronRight size={13} color={C.ghost} />
                    }
                    <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: isOpen ? C.text : C.dim }}>
                      {g.label}
                    </span>
                    <span className="text-[12px] font-bold" style={{ color: C.ghost }}>{g.items.length}</span>
                  </button>

                  {/* Wins in this month */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        {g.items.map((w, i) => (
                          <div key={w.id}
                            className="group flex items-start gap-4 pl-10 pr-5 py-[11px]"
                            style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                            <div className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                              style={{ background: CAT_COLOR[w.cat] ?? C.ghost }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-light leading-snug" style={{ color: C.text }}>{w.text}</div>
                              <div className="mt-0.5 text-[11px]" style={{ color: C.ghost }}>
                                <span style={{ color: CAT_COLOR[w.cat], fontWeight: 600 }}>{w.cat}</span>
                                {" · "}{new Date(w.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                            <button type="button" onClick={() => remove(w.id)}
                              className="mt-1 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-80"
                              style={{ color: C.faint }}>
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Panel>
        )}
      </motion.div>
    </div>
  );
}
