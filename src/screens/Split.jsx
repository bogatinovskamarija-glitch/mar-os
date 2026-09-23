import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

const TRUCK_VIEWS = ["Summary", "Monthly", "Companies"];
const DRAG_VIEWS  = ["Summary", "Monthly", "Transactions"];

export default function Split() {
  const { trucking, dragan, hasData } = useFinance();
  const [truckView, setTruckView] = useState("Summary");
  const [dragView, setDragView]   = useState("Summary");

  return (
    <div className="space-y-7">
      {/* Trucking group */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Trucking group float" action={<Seg options={TRUCK_VIEWS} value={truckView} onChange={setTruckView} />} flush>
          {!hasData && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see trucking balances.</div>
          )}
          {hasData && (
            <>
              {/* Balance hero */}
              <div className="grid gap-px sm:grid-cols-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                {[
                  { l: "Running balance", v: money(trucking.balance), c: trucking.balance > 0 ? C.oxide : C.moss, s: trucking.balance > 0 ? "They owe you" : "Net positive" },
                  { l: "This month fronted", v: money(trucking.thisMonth.fronted), c: C.oxide },
                  { l: "This month repaid", v: money(trucking.thisMonth.repaid), c: C.moss },
                  { l: "12-month fronted", v: money(trucking.last12.fronted), c: C.dim },
                ].map((s) => (
                  <div key={s.l} className="px-5 py-5">
                    <Label>{s.l}</Label>
                    <div className="mt-3"><Fig size={23} color={s.c}>{s.v}</Fig></div>
                    {s.s && <div className="mt-2 text-[12px]" style={{ color: C.faint }}>{s.s}</div>}
                  </div>
                ))}
              </div>

              {truckView === "Summary" && (
                <div className="grid gap-px sm:grid-cols-3" style={{ borderTop: "none" }}>
                  {[
                    { l: "Lifetime fronted", v: money(trucking.lifetime.fronted) },
                    { l: "Lifetime repaid",  v: money(trucking.lifetime.repaid) },
                    { l: "Net lifetime",     v: money(trucking.lifetime.repaid + trucking.lifetime.fronted), c: (trucking.lifetime.repaid + trucking.lifetime.fronted) < 0 ? C.oxide : C.moss },
                  ].map((s) => (
                    <div key={s.l} className="px-5 py-5">
                      <Label>{s.l}</Label>
                      <div className="mt-3"><Fig size={20} color={s.c ?? C.text}>{s.v}</Fig></div>
                    </div>
                  ))}
                </div>
              )}

              {truckView === "Monthly" && (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                      {["Month", "Fronted", "Repaid", "Running balance"].map((h, i) => (
                        <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(trucking.monthly ?? []).slice().reverse().map((m) => (
                      <tr key={m.month}>
                        <td className="px-5 py-[13px] text-[13px]" style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{m.month}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.fronted)}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.repaid)}</td>
                        <td className="px-5 py-[13px] text-right text-[14px] font-semibold"
                          style={{ ...num, color: m.balance > 0 ? C.oxide : C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {truckView === "Companies" && (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                      {["Entity", "Fronted", "Repaid", "Net"].map((h, i) => (
                        <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(trucking.companies ?? {}).map(([co, v]) => (
                      <tr key={co}>
                        <td className="px-5 py-[13px] text-[13px]" style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{co}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>{money(v.fronted ?? 0)}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>{money(v.repaid ?? 0)}</td>
                        <td className="px-5 py-[13px] text-right text-[14px] font-semibold"
                          style={{ ...num, color: (v.fronted - v.repaid) > 0 ? C.oxide : C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>
                          {money((v.fronted ?? 0) - (v.repaid ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Panel>
      </motion.div>

      {/* Dragan */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Dragan balance" action={<Seg options={DRAG_VIEWS} value={dragView} onChange={setDragView} />} flush>
          {!hasData && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see Dragan split.</div>
          )}
          {hasData && (
            <>
              {/* Balance hero */}
              <div className="grid gap-px sm:grid-cols-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                {[
                  { l: "Running balance", v: money(dragan.balance), c: dragan.balance > 0 ? C.oxide : C.moss, s: "Direct fronted + 50% shared" },
                  { l: "Direct fronted", v: money(dragan.direct_fronted), c: C.oxide },
                  { l: "His share (50%)", v: money(dragan.dragan_share), c: C.dim },
                  { l: "Repaid", v: money(dragan.repaid), c: C.moss },
                ].map((s) => (
                  <div key={s.l} className="px-5 py-5">
                    <Label>{s.l}</Label>
                    <div className="mt-3"><Fig size={23} color={s.c}>{s.v}</Fig></div>
                    {s.s && <div className="mt-2 text-[12px]" style={{ color: C.faint }}>{s.s}</div>}
                  </div>
                ))}
              </div>

              {dragView === "Summary" && (
                <div className="grid gap-px sm:grid-cols-3">
                  {[
                    { l: "12-month share", v: money(dragan.share12) },
                    { l: "12-month repaid", v: money(dragan.repaid12) },
                    { l: "12-month net", v: money(dragan.share12 - dragan.repaid12), c: (dragan.share12 - dragan.repaid12) > 0 ? C.oxide : C.moss },
                  ].map((s) => (
                    <div key={s.l} className="px-5 py-5">
                      <Label>{s.l}</Label>
                      <div className="mt-3"><Fig size={20} color={s.c ?? C.text}>{s.v}</Fig></div>
                    </div>
                  ))}
                </div>
              )}

              {dragView === "Monthly" && (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                      {["Month", "Direct", "Share", "Repaid", "Balance"].map((h, i) => (
                        <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(dragan.monthly ?? []).slice().reverse().map((m) => (
                      <tr key={m.month}>
                        <td className="px-5 py-[13px] text-[13px]" style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{m.month}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.direct ?? 0)}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.dim, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.share ?? 0)}</td>
                        <td className="px-5 py-[13px] text-right text-[13px]" style={{ ...num, color: C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.repaid ?? 0)}</td>
                        <td className="px-5 py-[13px] text-right text-[14px] font-semibold"
                          style={{ ...num, color: m.balance > 0 ? C.oxide : C.moss, borderBottom: `1px solid ${C.lineSoft}` }}>{money(m.balance ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dragView === "Transactions" && (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                      {["Date", "Description", "Type", "Amount"].map((h, i) => (
                        <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i > 2 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(dragan.transactions ?? []).slice(0, 60).map((t, i) => (
                      <tr key={t.tx_key ?? i}>
                        <td className="px-5 py-[12px] text-[12px] whitespace-nowrap" style={{ color: C.ghost, borderBottom: `1px solid ${C.lineSoft}` }}>{t.date}</td>
                        <td className="max-w-[220px] px-5 py-[12px] text-[13px]" style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>
                          <div className="truncate">{t.name ?? t.description}</div>
                        </td>
                        <td className="px-5 py-[12px]" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                          <Chip tone={t.flow === "REPAID" ? "keep" : t.flow === "FRONTED" ? "cancel" : "neutral"}>{t.flow}</Chip>
                        </td>
                        <td className="px-5 py-[12px] text-right text-[14px] font-semibold"
                          style={{ ...num, color: t.flow === "REPAID" ? C.moss : C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>
                          {money(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Panel>
      </motion.div>

      {hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <div className="px-5 py-4 text-[12px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
            Trucking entities: Carat Expedited · Pro Freight Transportation · Pro Freight Logistics · Treviator · Stork ·
            Dragan balance = direct Zelle forwards + 50% of shared household categories (Housing, Utilities, Groceries, Dining, Entertainment) − repayments.
            All running totals are cumulative over full transaction history, not just this month.
          </div>
        </motion.div>
      )}
    </div>
  );
}
