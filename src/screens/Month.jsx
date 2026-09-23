import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, Printer } from "lucide-react";
import { C, money, num } from "../theme";
import { Label, Panel, Btn, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";
import { budgetStore } from "../lib/storage";
import { EXPENSE_CATS, SHARED_CATS } from "../lib/finance";

const VIEWS = ["All", "Over budget", "Shared"];

export default function Month() {
  const { envelope, thisMonth, drift, transactions, hasData } = useFinance();
  const [view, setView]           = useState("All");
  const [editingCat, setEditingCat] = useState(null);
  const [editVal, setEditVal]     = useState("");
  const [budget, setBudget]       = useState(() => budgetStore.getTemplate());
  const [editMode, setEditMode]   = useState(false);

  // ── Month navigation ───────────────────────────────────────────────────────
  const availableMonths = useMemo(() => {
    const fromDrift = drift.map((d) => d.month);
    if (!fromDrift.includes(thisMonth.month) && thisMonth.month) {
      fromDrift.push(thisMonth.month);
    }
    return [...new Set(fromDrift)].sort().reverse(); // newest first
  }, [drift, thisMonth.month]);

  const [selectedMonth, setSelectedMonth] = useState(() => thisMonth.month || "");

  // Keep selectedMonth valid when data loads
  const resolvedMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : availableMonths[0] ?? "";

  const monthIdx  = availableMonths.indexOf(resolvedMonth);
  const canNext   = monthIdx > 0;
  const canPrev   = monthIdx < availableMonths.length - 1;
  const isCurrentMonth = resolvedMonth === (availableMonths[0] ?? "");

  const navMonth = useCallback((dir) => {
    const next = availableMonths[monthIdx + dir];
    if (next) setSelectedMonth(next);
  }, [availableMonths, monthIdx]);

  // ── Per-month actuals ──────────────────────────────────────────────────────
  const monthRows = useMemo(() => {
    let rows;
    if (isCurrentMonth) {
      rows = envelope.map((e) => ({ ...e, plan: budget[e.cat] ?? e.plan }));
    } else {
      const monthTxns = transactions.filter(
        (t) => t.month === resolvedMonth && t.flow === "EXPENSE"
      );
      rows = EXPENSE_CATS.map((cat) => {
        const catTxns = monthTxns.filter((t) => t.category === cat);
        const actual  = catTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
        const drShare = catTxns.filter((t) => t.shared).reduce((s, t) => s + Math.abs(t.amount) * 0.5, 0);
        const plan    = budget[cat] ?? (envelope.find((e) => e.cat === cat)?.plan ?? 0);
        return { cat, plan, actual, shared: SHARED_CATS.has(cat), txns: catTxns.length, dragan_share: drShare };
      }).filter((e) => e.actual > 0 || e.plan > 0);
    }
    return rows.filter((e) => {
      if (view === "Over budget") return e.actual > e.plan && e.plan > 0;
      if (view === "Shared")      return e.shared;
      return true;
    });
  }, [isCurrentMonth, resolvedMonth, envelope, transactions, budget, view]);

  // Summary strip — use drift for historical months
  const monthSummary = useMemo(() => {
    if (isCurrentMonth) return thisMonth;
    return drift.find((d) => d.month === resolvedMonth) ?? thisMonth;
  }, [isCurrentMonth, resolvedMonth, drift, thisMonth]);

  const totalActual = monthRows.reduce((a, r) => a + r.actual, 0);
  const totalPlan   = monthRows.reduce((a, r) => a + r.plan, 0);

  // ── Budget editing ─────────────────────────────────────────────────────────
  const commitEdit = useCallback((cat, raw) => {
    const n = parseFloat(raw.replace(/[$,\s]/g, ""));
    if (!isNaN(n) && n >= 0) {
      const updated = { ...budget, [cat]: n };
      setBudget(updated);
      budgetStore.setTemplate(updated);
    }
    setEditingCat(null);
  }, [budget]);

  return (
    <div className="space-y-7">
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Category envelope" action={
          <div className="flex items-center gap-3" data-no-print>
            <Seg options={VIEWS} value={view} onChange={setView} />
            <button type="button"
              onClick={() => { setEditMode((v) => !v); setEditingCat(null); }}
              title="Edit monthly budget targets"
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-opacity"
              style={{ color: editMode ? C.moss : C.faint, opacity: editMode ? 1 : 0.5 }}>
              <Pencil size={12} /> Budget
            </button>
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: C.faint }}>
              <Printer size={12} /> Print
            </button>
          </div>
        } flush>
          {/* Month navigator */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.3)" }}>
            <button type="button" onClick={() => navMonth(1)} disabled={!canPrev}
              className="cursor-pointer disabled:opacity-20 transition-opacity" style={{ color: C.faint }}>
              <ChevronLeft size={16} />
            </button>
            <span className="flex-1 text-center text-[13px] font-bold tracking-[0.1em]" style={{ color: C.white }}>
              {resolvedMonth}
              {isCurrentMonth && <span className="ml-2 text-[10px] font-normal uppercase tracking-[0.14em]" style={{ color: C.moss }}>current</span>}
            </span>
            <button type="button" onClick={() => navMonth(-1)} disabled={!canNext}
              className="cursor-pointer disabled:opacity-20 transition-opacity" style={{ color: C.faint }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {editMode && (
            <div className="px-5 py-3 text-[12px]" style={{ background: "rgba(59,82,55,0.2)", color: C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>
              Click any Plan value to edit your monthly budget target for that category. Changes apply as your default for all months.
            </div>
          )}

          {!hasData && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see budget vs actual.</div>
          )}
          {hasData && monthRows.length === 0 && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>No categories match this filter.</div>
          )}
          {hasData && monthRows.length > 0 && (
            <table className="w-full" data-print-panel>
              <thead>
                <tr>
                  {["Category", "Plan", "Actual", "Delta", "Bar"].map((h, i) => (
                    <th key={h}
                      className={`px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.15em] ${i >= 3 ? (i === 3 ? "hidden sm:table-cell" : "hidden md:table-cell") : ""}`}
                      style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)", textAlign: i === 0 ? "left" : "right" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthRows.map((e, i) => {
                  const over  = e.actual - e.plan;
                  const ratio = e.plan > 0 ? e.actual / e.plan : 1;
                  const fill  = Math.min(1, ratio);
                  const over1 = Math.min(1, Math.max(0, ratio - 1));
                  return (
                    <motion.tr key={e.cat}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.03 * i, duration: 0.3 }}>
                      <td className="px-5 py-[14px] text-[14px]"
                        style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>
                        <div className="flex items-center gap-2">
                          {e.cat}
                          {e.shared && (
                            <span className="rounded px-[5px] py-[2px] text-[10px] font-semibold uppercase tracking-[0.1em]"
                              style={{ background: "rgba(59,82,55,0.4)", color: C.moss }}>split</span>
                          )}
                        </div>
                      </td>
                      {/* Plan cell — editable when editMode */}
                      <td className="px-5 py-[14px] text-right text-[14px]"
                        style={{ ...num, color: C.ghost, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {editMode && editingCat === e.cat ? (
                          <input
                            autoFocus
                            className="w-24 bg-transparent text-right text-[14px] outline-none border-b"
                            style={{ color: C.white, borderColor: C.moss, fontFamily: "Montserrat, sans-serif" }}
                            value={editVal}
                            onChange={(ev) => setEditVal(ev.target.value)}
                            onBlur={() => commitEdit(e.cat, editVal)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") ev.target.blur();
                              if (ev.key === "Escape") setEditingCat(null);
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => editMode && (setEditingCat(e.cat), setEditVal(e.plan > 0 ? String(e.plan) : ""))}
                            style={{ cursor: editMode ? "text" : "default" }}
                            title={editMode ? "Click to set budget" : undefined}>
                            {e.plan > 0 ? money(e.plan) : (
                              editMode
                                ? <span style={{ color: C.ghost }}>Set…</span>
                                : "—"
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-[14px] text-right text-[14px] font-semibold"
                        style={{ ...num, color: e.actual > e.plan && e.plan > 0 ? C.oxide : C.text, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {money(e.actual)}
                      </td>
                      <td className="hidden px-5 py-[14px] text-right text-[13px] sm:table-cell"
                        style={{ ...num, color: over > 0 ? C.oxide : C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {over > 0 ? `+${money(over)}` : over < 0 ? money(over) : "—"}
                      </td>
                      <td className="hidden px-5 py-[14px] md:table-cell"
                        style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        {e.plan > 0 && (
                          <div className="relative h-[5px] w-full" style={{ background: C.lineSoft }}>
                            <motion.div className="absolute left-0 h-full"
                              style={{ background: C.moss }}
                              initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.05 + i * 0.03, ease: [0.16, 1, 0.3, 1] }} />
                            {over1 > 0 && (
                              <motion.div className="absolute h-full"
                                style={{ background: C.oxide, left: `${fill * 100}%` }}
                                initial={{ width: 0 }} animate={{ width: `${over1 * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.35 + i * 0.03, ease: [0.16, 1, 0.3, 1] }} />
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(44,55,42,0.6)", backdropFilter: "blur(8px)" }}>
                  <td className="px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint }}>Total</td>
                  <td className="px-5 py-3 text-right text-[14px] font-semibold" style={{ ...num, color: C.ghost }}>{money(totalPlan)}</td>
                  <td className="px-5 py-3 text-right text-[14px] font-semibold" style={{ ...num, color: totalActual > totalPlan ? C.oxide : C.text }}>{money(totalActual)}</td>
                  <td className="hidden px-5 py-3 sm:table-cell" />
                  <td className="hidden px-5 py-3 md:table-cell" />
                </tr>
              </tfoot>
            </table>
          )}
        </Panel>
      </motion.div>

      {/* Summary strip */}
      {hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <div className="grid gap-px sm:grid-cols-3 lg:grid-cols-6" style={{ background: C.line, border: `1px solid ${C.line}` }} data-print-panel>
            {[
              { l: "Earned",        v: money(monthSummary.earned),    c: C.moss },
              { l: "Came back",     v: money(monthSummary.came_back), c: C.moss },
              { l: "Personal spend",v: money(monthSummary.personal),  c: C.oxide },
              { l: "Debt cost",     v: money(monthSummary.debt_cost), c: monthSummary.debt_cost > 0 ? C.oxide : C.ghost },
              { l: "Fronted",       v: money((monthSummary.fronted_trucking ?? 0) + (monthSummary.fronted_dragan ?? 0)), c: (monthSummary.fronted_trucking ?? 0) + (monthSummary.fronted_dragan ?? 0) > 0 ? C.oxide : C.ghost },
              { l: "Net cash",      v: money(monthSummary.net_cash),  c: monthSummary.net_cash >= 0 ? C.moss : C.oxide },
            ].map((s) => (
              <div key={s.l} className="px-5 py-5" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
                <Label>{s.l}</Label>
                <div className="mt-3 text-[22px] font-bold" style={{ ...num, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
