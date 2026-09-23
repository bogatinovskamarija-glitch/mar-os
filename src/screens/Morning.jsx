import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Btn, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";
import FinanceImport from "../components/FinanceImport";
import { salaryStore } from "../lib/salaryStore";

function todayMeta() {
  const d = new Date();
  return {
    month: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    dayOfMonth: d.getDate(),
    daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
  };
}

export default function Morning({ go }) {
  const [showImport, setShowImport] = useState(false);
  const {
    inflow, accounts, thisMonth, truckingBalance, draganBalance,
    envelope, recurring, hasData, importedAt, importFiles, importing, importError, clearData,
  } = useFinance();
  const meta = todayMeta();
  const [salaryOwed]  = useState(() => salaryStore.computeOwed());

  const inTotal    = inflow.reduce((a, r) => a + r.amount, 0);
  const tm         = thisMonth;

  // Card interest this month from recurring
  const cardInterest = recurring.filter((r) => r.service === "Card interest" && r.status === "Active")
    .reduce((a, r) => a + r.monthly_equiv, 0);

  // Decisions — generated from data
  const decisions = [
    hasData && cardInterest > 0 && {
      n: "01", text: `Interest charges this month: ${money(cardInterest)}`,
      gain: "Go to Drift", to: "drift", tone: "oxide",
    },
    hasData && truckingBalance > 1000 && {
      n: "02", text: "Invoice the trucking float you are carrying",
      gain: money(truckingBalance), to: "split", tone: "oxide",
    },
    hasData && draganBalance > 500 && {
      n: "03", text: "Dragan owes you on the household split",
      gain: money(draganBalance), to: "split", tone: "oxide",
    },
    hasData && recurring.filter((r) => r.status === "Stopped" && r.type === "Subscription").length > 0 && {
      n: "04",
      text: `${recurring.filter((r) => r.status === "Stopped").length} recurring charges went quiet`,
      gain: "Review", to: "recurring", tone: "moss",
    },
    hasData && tm.own_life < 0 && {
      n: "05", text: "Your own income didn't cover your personal costs this month",
      gain: money(tm.own_life), to: "drift", tone: "oxide",
    },
  ].filter(Boolean);

  // "Over plan" categories
  const overs = envelope
    .filter((e) => e.actual > e.plan && e.plan > 0)
    .sort((a, b) => (b.actual - b.plan) - (a.actual - a.plan));

  return (
    <div className="space-y-7">
      {/* Import banner */}
      {!hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={-1}>
          <div className="flex flex-wrap items-center justify-between gap-4 border px-6 py-5"
            style={{ borderColor: "rgba(232,169,142,0.4)", background: "rgba(58,38,32,0.5)", backdropFilter: "blur(12px)" }}>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.oxide }}>No CSV data imported yet</div>
              <div className="mt-1 text-[13px] font-light" style={{ color: C.dim }}>
                Drop your Rocket Money export <em>or</em> pre-classified tx_clean.csv here.
              </div>
            </div>
            <Btn onClick={() => setShowImport(true)}><Upload size={15} /> Import CSV</Btn>
          </div>
        </motion.div>
      )}

      {hasData && importedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px]" style={{ color: C.faint }}>
            Last imported {new Date(importedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="flex gap-3">
            <Btn tone="secondary" onClick={() => setShowImport(true)}><Upload size={13} /> Update</Btn>
            <Btn tone="secondary" onClick={clearData}>Clear</Btn>
          </div>
        </div>
      )}

      {/* Accounts */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Accounts" flush>
          {accounts.length === 0 && (
            <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
              Import CSV to see accounts.
            </div>
          )}
          {accounts.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {accounts.map((a, i) => {
                  const isCredit = a.kind === "credit";
                  const net = a.thisMonthIn - a.thisMonthOut;
                  return (
                    <div key={a.name} className="px-5 py-[18px]"
                      style={{ borderRight: i < accounts.length - 1 ? `1px solid ${C.lineSoft}` : "none", borderBottom: `1px solid ${C.lineSoft}` }}>
                      <Label>{isCredit ? "this month" : a.kind}</Label>
                      <div className="mt-2.5">
                        <Fig size={27} color={isCredit ? (a.thisMonthOut > 0 ? C.oxide : C.faint) : (net < 0 ? C.oxide : C.text)}>
                          {isCredit ? money(a.thisMonthOut) : money(Math.abs(net))}
                        </Fig>
                      </div>
                      <div className="mt-2 truncate text-[12px]" style={{ color: C.faint }}>{a.name}</div>
                      {isCredit && a.thisMonthIn > 0 && (
                        <div className="mt-1 text-[11px]" style={{ color: C.moss }}>
                          {money(a.thisMonthIn)} paid
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 px-5 py-4"
                style={{ background: "rgba(44,55,42,0.5)", backdropFilter: "blur(8px)" }}>
                <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint }}>This month</span>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-light" style={{ color: C.dim }}>
                  {tm.earned > 0 && <span><span style={{ color: C.moss, fontWeight: 600, ...num }}>{money(tm.earned)}</span> earned</span>}
                  {tm.came_back > 0 && <span><span style={{ color: C.moss, fontWeight: 600, ...num }}>{money(tm.came_back)}</span> came back</span>}
                  {tm.personal > 0 && <span><span style={{ color: C.oxide, fontWeight: 600, ...num }}>{money(tm.personal)}</span> personal</span>}
                  {tm.debt_cost > 0 && <span><span style={{ color: C.oxide, fontWeight: 600, ...num }}>{money(tm.debt_cost)}</span> debt cost</span>}
                  {(tm.fronted_trucking + tm.fronted_dragan) > 0 && (
                    <span><span style={{ color: C.oxide, fontWeight: 600, ...num }}>{money(tm.fronted_trucking + tm.fronted_dragan)}</span> fronted</span>
                  )}
                </div>
                <span className="ml-auto text-[13px]" style={{ color: C.dim }}>
                  Net: <span style={{ ...num, fontWeight: 700, color: tm.net_cash >= 0 ? C.moss : C.oxide }}>{money(tm.net_cash)}</span>
                </span>
              </div>
            </>
          )}
        </Panel>
      </motion.div>

      {/* Balances strip */}
      {hasData && (truckingBalance !== 0 || draganBalance !== 0 || cardInterest > 0 || salaryOwed.total > 0) && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={0.5}>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { l: "Trucking float balance", v: money(Math.abs(truckingBalance)), t: truckingBalance > 0 ? C.oxide : C.moss,
                s: truckingBalance > 0 ? `They still owe you ${money(truckingBalance)}` : truckingBalance < 0 ? `You've collected ${money(Math.abs(truckingBalance))} more than fronted` : "Square", to: "split" },
              { l: "Dragan balance", v: money(Math.abs(draganBalance)), t: draganBalance > 0 ? C.oxide : C.moss,
                s: draganBalance > 0 ? `He owes you ${money(draganBalance)}` : draganBalance < 0 ? `He overpaid by ${money(Math.abs(draganBalance))} — you owe him` : "Square", to: "split" },
              { l: "Card interest / mo", v: cardInterest > 0 ? money(cardInterest) : "—", t: cardInterest > 0 ? C.oxide : C.ghost,
                s: cardInterest > 0 ? "Largest silent subscription" : "No active interest detected", to: "drift" },
              { l: "Salary owed by company", v: money(salaryOwed.total), t: salaryOwed.total > 0 ? C.oxide : C.moss,
                s: salaryOwed.total > 0 ? `${salaryOwed.unpaid} weeks unpaid × ${money(salaryOwed.rate)}` : "All weeks marked as paid", to: "salary" },
            ].map((s) => (
              <button key={s.l} type="button" onClick={() => go(s.to)}
                className="cursor-pointer px-5 py-5 text-left transition-colors hover:bg-[#2C372A]"
                style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
                <Label>{s.l}</Label>
                <div className="mt-3"><Fig size={25} color={s.t}>{s.v}</Fig></div>
                <div className="mt-2 text-[12px] font-light" style={{ color: C.faint }}>{s.s}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid gap-7 lg:grid-cols-[1.15fr_1fr]">
        {/* Decisions */}
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Needs a decision" flush>
            {decisions.length === 0 && (
              <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
                {hasData ? "Nothing flagged right now." : "Import CSV to generate decisions."}
              </div>
            )}
            {decisions.map((d, i) => (
              <button key={d.n} type="button" onClick={() => go(d.to)}
                className="flex w-full cursor-pointer items-center gap-5 px-5 py-[18px] text-left transition-colors hover:bg-[#2C372A]"
                style={{ borderBottom: i < decisions.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: C.ghost }}>{d.n}</span>
                <span className="flex-1 text-[15px]" style={{ color: C.text }}>{d.text}</span>
                <span className="shrink-0 text-[14px] font-semibold" style={{ ...num, color: d.tone === "moss" ? C.moss : C.oxide }}>{d.gain}</span>
              </button>
            ))}
          </Panel>
        </motion.div>

        {/* Over plan */}
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Panel title="Over plan this month"
            action={<Btn tone="secondary" onClick={() => go("month")}>Open the month</Btn>} flush>
            {overs.length === 0 && (
              <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
                {hasData ? "Nothing over plan yet." : "Import CSV to see categories."}
              </div>
            )}
            {overs.map((o, i) => {
              const over  = o.actual - o.plan;
              const ratio = o.plan > 0 ? over / o.plan : 0;
              return (
                <div key={o.cat} className="px-5 py-[13px]"
                  style={{ borderBottom: i < overs.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                  <div className="flex items-baseline gap-3">
                    <span className="flex-1 truncate text-[14px]" style={{ color: C.text }}>{o.cat}</span>
                    <span className="text-[14px] font-semibold" style={{ ...num, color: C.oxide }}>+{money(over)}</span>
                    <span className="w-[52px] shrink-0 text-right text-[12px]" style={{ ...num, color: C.faint }}>{Math.round(ratio * 100)}%</span>
                  </div>
                  <div className="mt-2 h-[3px] w-full" style={{ background: C.lineSoft }}>
                    <motion.div className="h-full" style={{ background: C.oxide }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              );
            })}
          </Panel>
        </motion.div>
      </div>

      {/* Where the money came from */}
      {inflow.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
          <Panel title={`Where the ${money(inTotal)} came from · ${meta.month}`} flush>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {inflow.map((r, i) => (
                <div key={r.source} className="p-5"
                  style={{ borderRight: i < inflow.length - 1 ? `1px solid ${C.lineSoft}` : "none", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <Fig size={25} color={C.text}>{money(r.amount)}</Fig>
                    <Chip tone={r.kind === "earned" ? "keep" : r.kind === "rewards" ? "shared" : "review"}>{r.kind}</Chip>
                  </div>
                  <div className="mt-3 text-[13px] font-semibold leading-snug" style={{ color: C.dim }}>{r.source}</div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      )}

      <AnimatePresence>
        {showImport && (
          <FinanceImport
            onImport={async (files) => { await importFiles(files); setShowImport(false); }}
            importing={importing}
            error={importError}
            importedAt={importedAt}
            onClose={() => setShowImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
