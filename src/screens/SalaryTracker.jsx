import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, rise } from "../kit";
import { salaryStore, generateWeeks, formatWeekRange, CUTOFF, DEFAULT_RATE } from "../lib/salaryStore";

const HIST_LABEL = "Before Oct 2, 2023"; // company stopped paying

export default function SalaryTracker() {
  const [overrides, setOverrides] = useState(() => salaryStore.getOverrides());
  const [rate, setRate] = useState(() => salaryStore.getRate());
  const [editingRate, setEditingRate] = useState(false);
  const [rateVal, setRateVal] = useState("");
  const [showAll, setShowAll] = useState(false);

  const weeks = useMemo(() => generateWeeks(), []);

  const toggle = useCallback((w) => {
    const next = { ...overrides, [w]: !(overrides[w] ?? false) };
    setOverrides(next);
    salaryStore.setWeek(w, next[w]);
  }, [overrides]);

  const commitRate = (raw) => {
    const n = parseFloat(raw.replace(/[$,\s]/g, ""));
    if (!isNaN(n) && n > 0) { setRate(n); salaryStore.setRate(n); }
    setEditingRate(false);
  };

  // Stats
  const unpaidWeeks  = weeks.filter((w) => !(overrides[w] ?? false));
  const paidWeeks    = weeks.filter((w)  => overrides[w] === true);
  const totalOwed    = unpaidWeeks.length * rate;
  const totalTracked = weeks.length;

  // Week display helpers
  const today = new Date();
  const currentWeek = useMemo(() => {
    const d = today;
    const day = d.getDay();
    const off = day === 0 ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + off);
    return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`;
  }, []);

  const visibleWeeks = showAll ? weeks.slice().reverse() : weeks.slice().reverse().slice(0, 26);
  const currentIsPaid = overrides[currentWeek] === true;

  return (
    <div className="space-y-7">
      {/* Summary */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <div className="grid gap-px sm:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
          {[
            { l: "Weeks tracked", v: String(totalTracked), c: C.text,
              s: `Oct 2, 2023 → today` },
            { l: "Weeks paid", v: String(paidWeeks.length), c: paidWeeks.length > 0 ? C.moss : C.ghost,
              s: paidWeeks.length > 0 ? `${paidWeeks.length} marked as received` : "None marked yet" },
            { l: "Weeks not paid", v: String(unpaidWeeks.length), c: unpaidWeeks.length > 0 ? C.oxide : C.ghost,
              s: unpaidWeeks.length > 0 ? `${unpaidWeeks.length} weeks without salary` : "All paid!" },
            { l: "Total owed to you", v: money(totalOwed), c: totalOwed > 0 ? C.oxide : C.moss,
              s: `${unpaidWeeks.length} × ${money(rate)}/week` },
          ].map((s) => (
            <div key={s.l} className="px-5 py-5" style={{ background: "rgba(36,46,34,0.7)" }}>
              <Label>{s.l}</Label>
              <div className="mt-3"><Fig size={25} color={s.c}>{s.v}</Fig></div>
              <div className="mt-1.5 text-[12px] font-light" style={{ color: C.faint }}>{s.s}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Current week — prominent action */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0.5}>
        <Panel title={`This week · ${formatWeekRange(currentWeek)}`} flush>
          <div className="flex flex-wrap items-center gap-5 px-5 py-5">
            <div className="flex-1">
              <div className="text-[15px] font-semibold" style={{ color: C.text }}>
                {currentIsPaid ? "Marked as paid" : "Not paid yet"}
              </div>
              <div className="mt-1 text-[13px] font-light" style={{ color: C.faint }}>
                {currentIsPaid
                  ? "You received your $1,250 salary this week."
                  : "Mark this week as paid only if actual salary arrived — not business transfers."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(currentWeek)}
              className="flex shrink-0 cursor-pointer items-center gap-2 border px-5 py-3 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors"
              style={{
                borderColor: currentIsPaid ? C.moss : C.oxide,
                color: currentIsPaid ? C.moss : C.oxide,
                background: currentIsPaid ? "rgba(74,128,68,0.12)" : "rgba(188,100,65,0.12)",
              }}>
              {currentIsPaid ? <Check size={15} /> : <X size={15} />}
              {currentIsPaid ? "Paid" : "Not paid"}
            </button>
          </div>
        </Panel>
      </motion.div>

      {/* Weekly log */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Weekly log — since company stopped paying" action={
          <div className="flex items-center gap-4">
            {/* Rate editor */}
            <div className="flex items-center gap-2 text-[12px]" style={{ color: C.faint }}>
              <span className="uppercase tracking-[0.12em] font-semibold">Rate:</span>
              {editingRate ? (
                <input
                  autoFocus
                  defaultValue={String(rate)}
                  className="w-20 border-b bg-transparent text-right text-[13px] font-semibold outline-none"
                  style={{ borderColor: C.moss, color: C.text }}
                  onBlur={(e) => commitRate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRate(e.target.value); if (e.key === "Escape") setEditingRate(false); }}
                />
              ) : (
                <button type="button" onClick={() => setEditingRate(true)}
                  className="cursor-pointer underline decoration-dotted"
                  style={{ color: C.dim }}>{money(rate)}/wk</button>
              )}
            </div>
          </div>
        } flush>
          {/* Historical note */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ background: "rgba(74,128,68,0.10)", borderBottom: `1px solid ${C.lineSoft}` }}>
            <Check size={13} color={C.moss} />
            <span className="text-[12px]" style={{ color: C.faint }}>
              <span style={{ color: C.moss, fontWeight: 600 }}>Paid period (historical): </span>
              Jan 2022 – Sep 2023 — you were receiving $1,250/week. Those weeks are not listed here.
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                  {["Week", "Status", "Amount"].map((h, i) => (
                    <th key={h} className="px-5 py-[9px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleWeeks.map((w, i) => {
                  const paid = overrides[w] === true;
                  const isCurrent = w === currentWeek;
                  return (
                    <tr key={w} style={{ background: isCurrent ? "rgba(74,128,68,0.07)" : "transparent" }}>
                      <td className="px-5 py-[11px] text-[13px]"
                        style={{ color: isCurrent ? C.text : C.dim, borderBottom: `1px solid ${C.lineSoft}`, fontWeight: isCurrent ? 600 : 400 }}>
                        {formatWeekRange(w)}
                        {isCurrent && <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.moss }}>this week</span>}
                      </td>
                      <td className="px-5 py-[11px] text-right" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <button
                          type="button"
                          onClick={() => toggle(w)}
                          className="ml-auto flex cursor-pointer items-center gap-1.5 border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:opacity-80"
                          style={{
                            borderColor: paid ? C.moss : "rgba(188,100,65,0.5)",
                            color: paid ? C.moss : C.oxide,
                            background: paid ? "rgba(74,128,68,0.1)" : "transparent",
                          }}>
                          {paid ? <Check size={11} /> : <X size={11} />}
                          {paid ? "Paid" : "Not paid"}
                        </button>
                      </td>
                      <td className="px-5 py-[11px] text-right text-[13px] font-semibold"
                        style={{ ...num, color: paid ? C.ghost : C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {paid ? "—" : money(rate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Show all / less */}
          {weeks.length > 26 && (
            <div className="border-t" style={{ borderColor: C.lineSoft }}>
              <button type="button" onClick={() => setShowAll((v) => !v)}
                className="w-full cursor-pointer py-3 text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
                style={{ color: C.faint }}>
                {showAll ? "Show less" : `Show all ${weeks.length} weeks`}
              </button>
            </div>
          )}
        </Panel>
      </motion.div>

      {/* Footer note */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
        <div className="px-5 py-4 text-[12px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
          Salary tracker — $1,250/week agreed rate, company stopped paying in September 2023.
          Mark a week as <span style={{ color: C.moss }}>Paid</span> only when actual salary arrived, not business transfers or trucking expense pass-throughs.
          Running total auto-updates each week you leave unmarked.
          To change the weekly rate, click on the rate amount above the table.
        </div>
      </motion.div>
    </div>
  );
}
