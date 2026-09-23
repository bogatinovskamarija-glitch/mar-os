import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ChevronDown, ChevronRight } from "lucide-react";
import { C, num } from "../theme";
import { Label, Fig, Panel, Btn, rise } from "../kit";
import { reviewStore, currentWeekISO, weekLabel } from "../lib/reviewStore";
import { writeWeeklyReview } from "../lib/clickup";

const WINS_COUNT = 3;

export default function WeeklyReview() {
  const thisWeek   = currentWeekISO();
  const saved      = reviewStore.getWeek(thisWeek);
  const [wins,    setWins]   = useState(saved?.wins  ?? ["", "", ""]);
  const [improve, setImprove] = useState(saved?.improve ?? "");
  const [focus,   setFocus]   = useState(saved?.focus   ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const past = reviewStore.allWeeks().filter((r) => r.week !== thisWeek).slice(0, 12);
  const isDirty = wins.some(Boolean) || improve || focus;
  const isSaved = !!saved;

  const handleSave = useCallback(async (syncToClickUp) => {
    reviewStore.saveWeek(thisWeek, { wins, improve, focus });
    if (syncToClickUp) {
      setSyncing(true);
      const res = await writeWeeklyReview(weekLabel(thisWeek), wins, improve, focus);
      setSyncMsg(res.ok ? "Saved to ClickUp ✓" : `ClickUp error: ${res.error}`);
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }, [thisWeek, wins, improve, focus]);

  return (
    <div className="space-y-7">
      {/* Current week form */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel
          title={`Weekly reflection · ${weekLabel(thisWeek)}`}
          action={
            <div className="flex items-center gap-3">
              {syncMsg && <span className="text-[12px]" style={{ color: syncMsg.includes("error") ? C.oxide : C.moss }}>{syncMsg}</span>}
              {isSaved && <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.moss }}>Saved</span>}
            </div>
          }
        >
          <div className="space-y-6 pt-2">
            {/* Wins */}
            <div>
              <Label>3 wins from this week — anything that went well</Label>
              <p className="mb-3 mt-1 text-[12px] font-light" style={{ color: C.faint }}>
                Big or small. Finished a drawing set, had a good conversation, kept a habit, figured something out.
              </p>
              <div className="space-y-2">
                {wins.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-[12px] font-bold" style={{ color: C.ghost }}>{i + 1}</span>
                    <input
                      type="text"
                      value={w}
                      onChange={(e) => setWins(wins.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={["e.g. Submitted Argo drawings on time", "e.g. Had a good focus session", "e.g. Didn't let a stressful day throw me off"][i]}
                      className="flex-1 border-b bg-transparent py-2.5 text-[15px] font-light outline-none"
                      style={{ borderColor: C.line, color: C.text }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Improve */}
            <div>
              <Label>One thing I want to do differently next week</Label>
              <textarea
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
                rows={2}
                placeholder="e.g. Start the day before checking messages — not a critique, just a direction."
                className="mt-2.5 w-full border bg-transparent px-4 py-3 text-[15px] font-light leading-[1.6] outline-none resize-none"
                style={{ borderColor: C.line, color: C.text }}
              />
            </div>

            {/* Focus */}
            <div>
              <Label>My one focus for next week</Label>
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Close out the Argo permit package"
                className="mt-2.5 w-full border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                style={{ borderColor: C.line, color: C.text }}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t" style={{ borderColor: C.lineSoft }}>
              <Btn onClick={() => handleSave(false)} disabled={!isDirty}>
                <Save size={14} /> Save locally
              </Btn>
              <Btn tone="secondary" onClick={() => handleSave(true)} disabled={!isDirty || syncing}>
                {syncing ? "Saving…" : "Save + sync to ClickUp"}
              </Btn>
              <span className="text-[12px] font-light" style={{ color: C.faint }}>
                Syncing writes a new page to your Weekly Reviews doc in ClickUp.
              </span>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Past reviews */}
      {past.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Past weekly reviews" flush>
            {past.map((r, i) => {
              const open = expanded === r.week;
              return (
                <div key={r.week} style={{ borderBottom: i < past.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : r.week)}
                    className="flex w-full cursor-pointer items-center gap-4 px-5 py-[14px] text-left transition-colors hover:bg-[#2C372A]"
                  >
                    {open ? <ChevronDown size={14} color={C.moss} /> : <ChevronRight size={14} color={C.ghost} />}
                    <span className="flex-1 text-[14px] font-semibold" style={{ color: C.text }}>{weekLabel(r.week)}</span>
                    <span className="text-[12px]" style={{ color: C.ghost }}>
                      {r.wins?.filter(Boolean).length ?? 0} wins
                    </span>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 px-10 pb-5 pt-1">
                          {r.wins?.filter(Boolean).length > 0 && (
                            <div>
                              <Label>Wins</Label>
                              <ul className="mt-1.5 space-y-1">
                                {r.wins.filter(Boolean).map((w, j) => (
                                  <li key={j} className="text-[14px] font-light" style={{ color: C.text }}>· {w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {r.improve && (
                            <div>
                              <Label>Wanted to improve</Label>
                              <p className="mt-1 text-[14px] font-light" style={{ color: C.dim }}>{r.improve}</p>
                            </div>
                          )}
                          {r.focus && (
                            <div>
                              <Label>Next week focus was</Label>
                              <p className="mt-1 text-[14px] font-light" style={{ color: C.dim }}>{r.focus}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Panel>
        </motion.div>
      )}

      {past.length === 0 && !isDirty && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <div className="px-5 py-5 text-[13px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
            Fill in this week's reflection — it takes 5 minutes and past weeks will show up here as a timeline you can scroll back through.
          </div>
        </motion.div>
      )}
    </div>
  );
}
