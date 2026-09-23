import { useState } from "react";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { C, money, num } from "../theme";
import { Label, Panel, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

// ── Metric definitions ────────────────────────────────────────────────────────
const METRICS = ["Overview", "Personal", "Income", "Trucking", "Balances"];

const METRIC_DESC = {
  "Overview":  "Total money in vs total money out each month. Green bars = net gain, red bars = net loss.",
  "Personal":  "Your personal finances only — salary income minus your own spending and debt costs.",
  "Income":    "Everything that came IN — money you earned plus repayments received from trucking/Dragan.",
  "Trucking":  "Money you fronted to trucking companies minus what they paid back — your monthly float change.",
  "Balances":  "Running balance of what trucking companies and Dragan currently owe you in total.",
};

// Column headers per metric (Month is always first, not listed here)
const COLS = {
  "Overview":  ["Money in (earned + repaid)", "Money out (spent + fronted)", "Net cash"],
  "Personal":  ["Salary / income earned", "Personal spending", "Debt costs (interest + fees)", "Your net result"],
  "Income":    ["Salary / income earned", "Repayments received", "Total received", "Net cash"],
  "Trucking":  ["Fronted to trucking cos.", "Fronted to Dragan", "Total repaid to you", "Monthly float change"],
  "Balances":  ["Trucking owes you", "Dragan owes you", "Total owed to you"],
};

// Per-row cell values
function rowData(metric, d) {
  switch (metric) {
    case "Overview":
      return [
        d.earned + (d.came_back ?? 0),                                           // money in
        d.personal + (d.debt_cost ?? 0) + (d.paydown ?? 0)
          + d.fronted_trucking + d.fronted_dragan,                               // money out
        d.net_cash,                                                              // net (money_in - money_out)
      ];
    case "Personal":
      return [d.earned, d.personal, d.debt_cost ?? 0, d.own_life ?? 0];
    case "Income":
      return [d.earned, d.came_back ?? 0, d.total_in ?? (d.earned + (d.came_back ?? 0)), d.net_cash];
    case "Trucking":
      return [
        d.fronted_trucking,
        d.fronted_dragan,
        d.repaid_trucking + d.repaid_dragan,
        d.fronted_trucking + d.fronted_dragan - d.repaid_trucking - d.repaid_dragan,
      ];
    case "Balances":
      return [d.trucking_balance, d.dragan_balance, d.trucking_balance + d.dragan_balance];
    default:
      return [];
  }
}

// Consistent color rule: green = money coming to you, red = money going out
function cellColor(metric, colIdx, val) {
  switch (metric) {
    case "Overview":
      if (colIdx === 0) return C.moss;                    // money in → green
      if (colIdx === 1) return C.oxide;                   // money out → red
      return val >= 0 ? C.moss : C.oxide;                 // net cash → sign
    case "Personal":
      if (colIdx === 0) return C.moss;                    // earned → green
      if (colIdx === 1) return C.oxide;                   // personal spend → red
      if (colIdx === 2) return C.oxide;                   // debt costs → red
      return val >= 0 ? C.moss : C.oxide;                 // your net → sign
    case "Income":
      if (colIdx < 3) return C.moss;                      // all income columns → green
      return val >= 0 ? C.moss : C.oxide;                 // net cash → sign
    case "Trucking":
      if (colIdx < 2) return C.oxide;                     // fronted → red (your cash out)
      if (colIdx === 2) return C.moss;                    // repaid → green (your cash back)
      return val > 0 ? C.oxide : val < 0 ? C.moss : C.ghost; // float change: positive=more out=red, negative=more in=green
    case "Balances":
      return val > 0 ? C.moss : C.ghost;                  // owed to you → green if positive
    default:
      return C.text;
  }
}

// Bar chart key (what drives bar height and direction)
function barKey(metric, d) {
  switch (metric) {
    case "Overview":  return { pos: Math.max(0, d.net_cash),       neg: Math.min(0, d.net_cash) };
    case "Personal":  return { pos: 0,                             neg: -(d.own_life < 0 ? Math.abs(d.own_life) : d.personal) };
    case "Income":    return { pos: d.earned + (d.came_back ?? 0), neg: 0 };
    case "Trucking":  return { pos: 0, neg: -(d.fronted_trucking + d.fronted_dragan) };
    case "Balances":  return { trucking: d.trucking_balance, dragan: d.dragan_balance };
    default:          return { pos: 0, neg: 0 };
  }
}

function mini(val, max) {
  if (!max || max === 0) return 0;
  return Math.min(1, Math.abs(val) / max);
}

export default function Drift() {
  const { drift, hasData } = useFinance();
  const [metric, setMetric] = useState("Overview");

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

  const shown  = drift.slice().reverse(); // newest first
  const fn     = (d) => barKey(metric, d);
  const maxVal = Math.max(...drift.map((d) => {
    const v = fn(d);
    return Math.max(Math.abs(v.pos ?? 0), Math.abs(v.neg ?? 0), Math.abs(v.trucking ?? 0), Math.abs(v.dragan ?? 0));
  }));

  // All-time totals — only sum columns that are meaningful across time
  const totals = (() => {
    if (metric === "Balances") {
      // Running balances: show current (latest) values, not a sum
      const latest = shown[0];
      if (!latest) return null;
      const cells = rowData("Balances", latest);
      return { cells, label: "Current balance" };
    }
    const sums = shown.reduce((acc, d) => {
      rowData(metric, d).forEach((v, i) => { acc[i] = (acc[i] ?? 0) + (v ?? 0); });
      return acc;
    }, {});
    return { cells: Object.values(sums), label: "All-time total" };
  })();

  return (
    <div className="space-y-7">
      {/* Bar chart */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Month-over-month drift" action={
          <div className="overflow-x-auto" data-no-print>
            <Seg options={METRICS} value={metric} onChange={setMetric} />
          </div>
        } flush>
          {/* Metric description */}
          <div className="px-5 py-2 text-[12px]" style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(44,55,42,0.2)" }}>
            {METRIC_DESC[metric]}
          </div>
          {/* Chart */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 px-5 pb-3 pt-6" style={{ minWidth: shown.length * 44 }}>
              {shown.map((d, i) => {
                const v   = fn(d);
                const pos = mini(v.pos ?? 0, maxVal);
                const neg = mini(v.neg ?? 0, maxVal);
                const trk = metric === "Balances" ? mini(v.trucking ?? 0, maxVal) : 0;
                const drg = metric === "Balances" ? mini(v.dragan ?? 0, maxVal) : 0;
                const BAR_H = 80;
                return (
                  <div key={d.month} className="flex flex-col items-center gap-1" style={{ minWidth: 38 }}>
                    <div className="flex items-end" style={{ height: BAR_H }}>
                      {metric !== "Balances" && pos > 0 && (
                        <motion.div
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                          style={{ width: 18, height: pos * BAR_H, background: C.moss, transformOrigin: "bottom", alignSelf: "flex-end" }} />
                      )}
                      {metric === "Balances" && (
                        <div className="flex gap-[2px] items-end" style={{ height: BAR_H }}>
                          {trk > 0 && (
                            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: 0.04 * i }}
                              style={{ width: 8, height: trk * BAR_H, background: C.moss, transformOrigin: "bottom", alignSelf: "flex-end" }} />
                          )}
                          {drg > 0 && (
                            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: 0.04 * i + 0.05 }}
                              style={{ width: 8, height: drg * BAR_H, background: "#D4A574", transformOrigin: "bottom", alignSelf: "flex-end" }} />
                          )}
                        </div>
                      )}
                    </div>
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
          {/* Legend for Balances */}
          {metric === "Balances" && (
            <div className="flex items-center gap-5 px-5 py-3 text-[11px]" style={{ color: C.faint, borderTop: `1px solid ${C.lineSoft}` }}>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3" style={{ background: C.moss }} /> Trucking owes you</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3" style={{ background: "#D4A574" }} /> Dragan owes you</span>
            </div>
          )}
        </Panel>
      </motion.div>

      {/* Table */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Monthly breakdown" action={
          <button data-no-print type="button" onClick={() => window.print()}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: C.faint }}>
            <Printer size={13} /> Print
          </button>
        } flush>
          <div className="overflow-x-auto" data-print-panel>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                  <th className="px-5 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}>Month</th>
                  {COLS[metric].map((h) => (
                    <th key={h} className="px-5 py-[10px] text-right text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}>{h}</th>
                  ))}
                </tr>
                {totals && (
                  <tr style={{ background: "rgba(59,82,55,0.3)", borderBottom: `2px solid ${C.moss}` }}>
                    <td className="px-5 py-[11px] text-[11px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: C.moss }}>{totals.label}</td>
                    {totals.cells.map((val, ci) => (
                      <td key={ci} className="px-5 py-[11px] text-right text-[13px] font-bold"
                        style={{ ...num, color: cellColor(metric, ci, val) }}>
                        {money(val)}
                      </td>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {shown.map((d) => {
                  const cells = rowData(metric, d);
                  return (
                    <tr key={d.month}>
                      <td className="px-5 py-[13px] text-[13px] whitespace-nowrap font-semibold"
                        style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{d.month}</td>
                      {cells.map((val, ci) => (
                        <td key={ci} className="px-5 py-[13px] text-right text-[13px]"
                          style={{ ...num, color: cellColor(metric, ci, val), borderBottom: `1px solid ${C.lineSoft}` }}>
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
