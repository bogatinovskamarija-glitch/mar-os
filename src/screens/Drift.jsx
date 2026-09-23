import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Panel, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

const METRICS = ["Net cash", "Personal", "Earned", "Fronted", "Balances"];

function mini(val, max) {
  if (!max || max === 0) return 0;
  return Math.min(1, Math.abs(val) / max);
}

export default function Drift() {
  const { drift, hasData } = useFinance();
  const [metric, setMetric] = useState("Net cash");

  if (!hasData || drift.length === 0) {
    return (
      <div className="space-y-7">
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <Panel title="Month-over-month drift">
            <div className="py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see historical drift.</div>
          </Panel>
        </motion.div>
      </div>
    );
  }

  // Key extractor per metric
  const keys = {
    "Net cash":  (d) => ({ pos: Math.max(0, d.net_cash), neg: Math.min(0, d.net_cash), label: money(d.net_cash) }),
    "Personal":  (d) => ({ pos: 0, neg: -d.personal, label: money(d.personal) }),
    "Earned":    (d) => ({ pos: d.earned, neg: 0, label: money(d.earned) }),
    "Fronted":   (d) => ({ pos: 0, neg: -(d.fronted_trucking + d.fronted_dragan), label: money(d.fronted_trucking + d.fronted_dragan) }),
    "Balances":  (d) => ({ pos: 0, neg: 0, label: money(d.trucking_balance + d.dragan_balance), trucking: d.trucking_balance, dragan: d.dragan_balance }),
  };

  const fn = keys[metric];
  const maxVal = Math.max(...drift.map((d) => {
    const v = fn(d);
    return Math.max(Math.abs(v.pos), Math.abs(v.neg), Math.abs(v.trucking ?? 0), Math.abs(v.dragan ?? 0));
  }));

  // Table columns per metric
  const cols = {
    "Net cash":  ["Month", "Earned", "Personal", "Fronted", "Net cash"],
    "Personal":  ["Month", "Personal", "Debt cost", "Own life", "Net cash"],
    "Earned":    ["Month", "Earned", "Came back", "Total in", "Net cash"],
    "Fronted":   ["Month", "Trucking fronted", "Dragan fronted", "Total repaid", "Net float"],
    "Balances":  ["Month", "Trucking balance", "Dragan balance", "Combined"],
  };

  const rowData = (d) => {
    switch (metric) {
      case "Net cash": return [d.earned, d.personal, d.fronted_trucking + d.fronted_dragan, d.net_cash];
      case "Personal": return [d.personal, d.debt_cost, d.own_life, d.net_cash];
      case "Earned":   return [d.earned, d.came_back, d.total_in, d.net_cash];
      case "Fronted":  return [d.fronted_trucking, d.fronted_dragan, d.repaid_trucking + d.repaid_dragan, d.fronted_trucking + d.fronted_dragan - d.repaid_trucking - d.repaid_dragan];
      case "Balances": return [d.trucking_balance, d.dragan_balance, d.trucking_balance + d.dragan_balance];
    }
  };

  const rowColor = (metric, i, val) => {
    if (metric === "Earned" && i === 0) return C.moss;
    if (metric === "Personal" && i === 0) return C.oxide;
    if (metric === "Fronted" && i < 2) return C.oxide;
    if (metric === "Fronted" && i === 2) return C.moss;
    if (val < 0) return C.oxide;
    if (val > 0 && metric === "Net cash" && i === 3) return C.moss;
    return C.text;
  };

  const shown = drift.slice().reverse();

  return (
    <div className="space-y-7">
      {/* Bar chart */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Month-over-month drift" action={
          <div className="overflow-x-auto">
            <Seg options={METRICS} value={metric} onChange={setMetric} />
          </div>
        } flush>
          {/* Chart */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 px-5 pb-3 pt-6" style={{ minWidth: shown.length * 44 }}>
              {shown.map((d, i) => {
                const v   = fn(d);
                const pos = mini(v.pos, maxVal);
                const neg = mini(v.neg, maxVal);
                const trk = metric === "Balances" ? mini(v.trucking ?? 0, maxVal) : 0;
                const drg = metric === "Balances" ? mini(v.dragan ?? 0, maxVal) : 0;
                const BAR_H = 80;
                return (
                  <div key={d.month} className="flex flex-col items-center gap-1" style={{ minWidth: 38 }}>
                    {/* Positive bar (above) */}
                    <div className="flex items-end" style={{ height: BAR_H }}>
                      {metric !== "Balances" && pos > 0 && (
                        <motion.div style={{ width: 18, height: pos * BAR_H, background: C.moss, alignSelf: "flex-end" }}
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                          style={{ width: 18, height: pos * BAR_H, background: C.moss, transformOrigin: "bottom", alignSelf: "flex-end" }} />
                      )}
                      {metric === "Balances" && (
                        <div className="flex gap-[2px] items-end" style={{ height: BAR_H }}>
                          {trk > 0 && (
                            <motion.div
                              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: 0.04 * i }}
                              style={{ width: 8, height: trk * BAR_H, background: C.oxide, transformOrigin: "bottom", alignSelf: "flex-end" }} />
                          )}
                          {drg > 0 && (
                            <motion.div
                              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: 0.04 * i + 0.05 }}
                              style={{ width: 8, height: drg * BAR_H, background: "#D4A574", transformOrigin: "bottom", alignSelf: "flex-end" }} />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Negative bar (below) */}
                    {metric !== "Balances" && neg < 0 && (
                      <motion.div
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ duration: 0.5, delay: 0.04 * i + 0.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: 18, height: mini(neg, maxVal) * BAR_H, background: C.oxide, transformOrigin: "top" }} />
                    )}
                    <div className="mt-1 text-center text-[9px] uppercase tracking-[0.1em]"
                      style={{ color: C.ghost, writingMode: "vertical-rl", transform: "rotate(180deg)", height: 38 }}>
                      {d.month.slice(0, 7)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Table */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Monthly breakdown" flush>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                  {cols[metric].map((h, i) => (
                    <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => {
                  const cells = rowData(d);
                  return (
                    <tr key={d.month}>
                      <td className="px-5 py-[13px] text-[13px] whitespace-nowrap font-semibold"
                        style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{d.month}</td>
                      {cells.map((val, ci) => (
                        <td key={ci} className="px-5 py-[13px] text-right text-[13px]"
                          style={{ ...num, color: rowColor(metric, ci, val), borderBottom: `1px solid ${C.lineSoft}` }}>
                          {money(val)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
