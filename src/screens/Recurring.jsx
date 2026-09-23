import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Panel, Chip, Seg, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

const STATUS_TONE = { Active: "keep", Stopped: "cancel", Sporadic: "review" };
const CADENCE_ORDER = ["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Annual"];
const VIEWS = ["All", "Active", "Stopped"];

export default function Recurring() {
  const { recurring, hasData } = useFinance();
  const [view, setView] = useState("All");

  const filtered = recurring.filter((r) => {
    if (view === "Active")  return r.status === "Active";
    if (view === "Stopped") return r.status === "Stopped";
    return true;
  });

  // Group by cadence
  const groups = CADENCE_ORDER.map((cad) => ({
    cad,
    rows: filtered.filter((r) => r.cadence === cad),
  })).filter((g) => g.rows.length > 0);

  const monthlyTotal = recurring
    .filter((r) => r.status === "Active")
    .reduce((a, r) => a + (r.monthly_equiv ?? 0), 0);

  const annualTotal = monthlyTotal * 12;

  return (
    <div className="space-y-7">
      {/* Summary */}
      {hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={-1}>
          <div className="grid gap-px sm:grid-cols-3" style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { l: "Active recurring / mo", v: money(monthlyTotal), c: monthlyTotal > 0 ? C.oxide : C.ghost },
              { l: "Active recurring / yr", v: money(annualTotal), c: annualTotal > 0 ? C.oxide : C.ghost },
              { l: "Stopped charges", v: String(recurring.filter((r) => r.status === "Stopped").length), c: C.ghost },
            ].map((s) => (
              <div key={s.l} className="px-5 py-5" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
                <Label>{s.l}</Label>
                <div className="mt-3 text-[25px] font-bold" style={{ ...num, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Auto-detected recurring" action={<Seg options={VIEWS} value={view} onChange={setView} />} flush>
          {!hasData && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to detect recurring charges.</div>
          )}
          {hasData && filtered.length === 0 && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
              {view === "All" ? "No recurring patterns detected yet." : `No ${view.toLowerCase()} charges.`}
            </div>
          )}
          {groups.map((g, gi) => (
            <div key={g.cad}>
              <div className="flex items-center gap-4 px-5 py-[10px]"
                style={{ background: "rgba(44,55,42,0.45)", borderBottom: `1px solid ${C.lineSoft}` }}>
                <Label color={C.ghost}>{g.cad}</Label>
                <span className="ml-auto text-[12px]" style={{ ...num, color: C.faint }}>
                  {money(g.rows.filter((r) => r.status === "Active").reduce((a, r) => a + (r.monthly_equiv ?? 0), 0))}/mo equiv
                </span>
              </div>
              {g.rows.map((r, i) => (
                <motion.div key={r.service}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * (i + gi * 4), duration: 0.3 }}>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-[15px]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px]" style={{ color: C.text }}>{r.service}</div>
                      {r.account && (
                        <div className="mt-1 truncate text-[12px]" style={{ color: C.faint }}>{r.account}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.last_charge && (
                        <span className="text-[12px]" style={{ color: C.ghost }}>
                          Last {new Date(r.last_charge).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <div className="text-right">
                        <div className="text-[16px] font-semibold" style={{ ...num, color: r.status === "Active" ? C.oxide : C.faint }}>
                          {money(r.typical_amount)}
                        </div>
                        {r.monthly_equiv && r.cadence !== "Monthly" && (
                          <div className="text-[11px]" style={{ ...num, color: C.ghost }}>
                            {money(r.monthly_equiv)}/mo
                          </div>
                        )}
                      </div>
                      <Chip tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Chip>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </Panel>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <div className="px-5 py-4 text-[12px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
          Auto-detected from transaction history · ≥3 charges with consistent gap (5–390 days) · Service names matched by merchant keyword groups
        </div>
      </motion.div>
    </div>
  );
}
