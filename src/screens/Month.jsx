import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Panel, Btn, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

const VIEWS = ["All", "Over plan", "Shared"];

export default function Month() {
  const { envelope, thisMonth, hasData } = useFinance();
  const [view, setView] = useState("All");

  const rows = envelope.filter((e) => {
    if (view === "Over plan") return e.actual > e.plan && e.plan > 0;
    if (view === "Shared") return e.shared;
    return true;
  });

  const totalActual = rows.reduce((a, r) => a + r.actual, 0);
  const totalPlan   = rows.reduce((a, r) => a + r.plan, 0);

  return (
    <div className="space-y-7">
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Category envelope" action={<Seg options={VIEWS} value={view} onChange={setView} />} flush>
          {!hasData && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see budget vs actual.</div>
          )}
          {hasData && rows.length === 0 && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>No categories match this filter.</div>
          )}
          {hasData && rows.length > 0 && (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-5 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)" }}>Category</th>
                    <th className="px-5 py-[10px] text-right text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)" }}>Plan</th>
                    <th className="px-5 py-[10px] text-right text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)" }}>Actual</th>
                    <th className="hidden px-5 py-[10px] text-right text-[11px] font-semibold uppercase tracking-[0.15em] sm:table-cell" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)" }}>Delta</th>
                    <th className="hidden px-5 py-[10px] text-right text-[11px] font-semibold uppercase tracking-[0.15em] md:table-cell" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.5)", width: 140 }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e, i) => {
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
                        <td className="px-5 py-[14px] text-right text-[14px]"
                          style={{ ...num, color: C.ghost, borderBottom: `1px solid ${C.lineSoft}` }}>
                          {e.plan > 0 ? money(e.plan) : "—"}
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
            </>
          )}
        </Panel>
      </motion.div>

      {/* This-month summary strip */}
      {hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <div className="grid gap-px sm:grid-cols-3 lg:grid-cols-6" style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { l: "Earned", v: money(thisMonth.earned), c: C.moss },
              { l: "Came back", v: money(thisMonth.came_back), c: C.moss },
              { l: "Personal spend", v: money(thisMonth.personal), c: C.oxide },
              { l: "Debt cost", v: money(thisMonth.debt_cost), c: thisMonth.debt_cost > 0 ? C.oxide : C.ghost },
              { l: "Fronted", v: money(thisMonth.fronted_trucking + thisMonth.fronted_dragan), c: thisMonth.fronted_trucking + thisMonth.fronted_dragan > 0 ? C.oxide : C.ghost },
              { l: "Net cash", v: money(thisMonth.net_cash), c: thisMonth.net_cash >= 0 ? C.moss : C.oxide },
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
