import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Btn, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";
import FinanceImport from "../components/FinanceImport";
import { SUBSCRIPTIONS } from "../data";

function todayMeta() {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return {
    month: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    dayOfMonth: d.getDate(),
    daysInMonth,
  };
}

export default function Morning({ go }) {
  const [showImport, setShowImport] = useState(false);
  const { envelope, inflow, cantilever, accounts, hasData, importedAt, importFiles, importing, importError, clearData } = useFinance();
  const meta = todayMeta();

  const inTotal = inflow.reduce((a, r) => a + r.amount, 0);
  const outTotal = envelope.reduce((a, r) => a + r.actual, 0);
  const daysLeft = meta.daysInMonth - meta.dayOfMonth;
  const left = inTotal - outTotal;

  const fronted = cantilever.fronted.reduce((a, r) => a + r.amount, 0);
  const back = cantilever.fronted.reduce((a, r) => a + r.back, 0);
  const floatBalance = cantilever.priorBalance + fronted - back;

  const cancels = SUBSCRIPTIONS.filter((r) => r.verdict === "cancel");
  const cancelSave = cancels.reduce((a, r) => a + r.amount, 0);
  const liquid = accounts.filter((a) => a.kind !== "credit" && a.balance > 0).reduce((a, x) => a + x.balance, 0);
  const cardSpend = accounts.filter((a) => a.kind === "credit").reduce((a, x) => a + x.balance, 0);

  const overs = envelope.filter((e) => e.actual > e.plan && e.plan > 0).sort((a, b) => (b.actual - b.plan) - (a.actual - a.plan));

  const decisions = [
    { n: "01", text: `Cancel ${cancels.length} dead subscriptions`, gain: `+${money(cancelSave, true)}/mo`, to: "recurring", tone: "moss" },
    floatBalance > 0 && { n: "02", text: "Invoice the trucking float you are carrying", gain: money(floatBalance), to: "split", tone: "oxide" },
    { n: "03", text: "Reconcile the household ledger with Dragan", gain: "split", to: "split", tone: "oxide" },
    { n: "04", text: "Pick a student loan repayment plan", gain: "still unset", to: "month", tone: "oxide" },
    { n: "05", text: "Set a real owner draw at Bogat A&D", gain: "5 months late", to: "drift", tone: "oxide" },
  ].filter(Boolean);

  return (
    <div className="space-y-7">
      {/* Import banner when no data */}
      {!hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={-1}>
          <div className="flex flex-wrap items-center justify-between gap-4 border px-6 py-5"
            style={{ borderColor: "rgba(232, 169, 142, 0.4)", background: "rgba(58, 38, 32, 0.5)", backdropFilter: "blur(12px)" }}>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.oxide }}>No CSV data imported yet</div>
              <div className="mt-1 text-[13px] font-light" style={{ color: C.dim }}>
                Drop your Rocket Money export CSV to see live financial data.
              </div>
            </div>
            <Btn onClick={() => setShowImport(true)}>
              <Upload size={15} /> Import CSV
            </Btn>
          </div>
        </motion.div>
      )}

      {hasData && importedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px]" style={{ color: C.faint }}>Last imported {importedAt}</span>
          <div className="flex gap-3">
            <Btn tone="secondary" onClick={() => setShowImport(true)}><Upload size={13} /> Update</Btn>
            <Btn tone="secondary" onClick={clearData}>Clear data</Btn>
          </div>
        </div>
      )}

      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title="Accounts" flush>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {accounts.map((a, i) => {
              const credit = a.kind === "credit";
              const used = credit && a.limit ? a.balance / a.limit : 0;
              return (
                <div key={a.name} className="px-5 py-[18px]"
                  style={{ borderRight: i < accounts.length - 1 ? `1px solid ${C.lineSoft}` : "none", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <Label>{credit ? "this month" : a.kind}</Label>
                  <div className="mt-2.5"><Fig size={27} color={credit ? (a.balance > 0 ? C.oxide : C.faint) : (a.balance < 0 ? C.oxide : C.text)}>{money(a.balance)}</Fig></div>
                  <div className="mt-2 truncate text-[12px]" style={{ color: C.faint }}>{a.name}</div>
                  {credit && a.limit && (
                    <div className="mt-3 h-[3px] w-full" style={{ background: C.lineSoft }}>
                      <motion.div className="h-full" style={{ background: used > 0.3 ? C.oxide : C.moss }}
                        initial={{ width: 0 }} animate={{ width: `${used * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 px-5 py-4"
            style={{ background: "rgba(44, 55, 42, 0.5)", backdropFilter: "blur(8px)" }}>
            <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint }}>Net position</span>
            <Fig size={22} color={liquid > 0 ? C.text : C.faint}>{liquid > 0 ? money(liquid) : "—"}</Fig>
            <span className="text-[13px] font-light" style={{ color: C.dim }}>{money(cardSpend)} charged on cards this month</span>
            {floatBalance > 0 && (
              <span className="text-[13px] font-light" style={{ color: C.dim }}>
                and {money(floatBalance)} of it is really the trucking company's
              </span>
            )}
          </div>
        </Panel>
      </motion.div>

      <div className="grid gap-7 lg:grid-cols-[1.15fr_1fr]">
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Needs a decision" flush>
            {decisions.map((d, i) => (
              <button key={d.n} type="button" onClick={() => go(d.to)}
                className="flex w-full cursor-pointer items-center gap-5 px-5 py-[18px] text-left transition-colors hover:bg-[#2C372A]"
                style={{ borderBottom: i < decisions.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: C.ghost }}>{d.n}</span>
                <span className="flex-1 text-[15px]" style={{ color: C.text }}>{d.text}</span>
                <span className="shrink-0 text-[14px] font-semibold" style={{ ...num, color: d.tone === "moss" ? C.moss : C.oxide }}>
                  {d.gain}
                </span>
              </button>
            ))}
            <div className="px-5 py-[17px]" style={{ background: "rgba(44, 55, 42, 0.5)", borderTop: `1px solid ${C.line}` }}>
              <p className="text-[14px] font-light leading-[1.55]" style={{ color: C.dim }}>
                The first action is worth{" "}
                <span style={{ ...num, color: C.moss, fontWeight: 700 }}>{money(cancelSave, true)}</span> a month.
                Both subscription kills are a single cancellation click.
              </p>
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Panel title="Over plan this month"
            action={<Btn tone="secondary" onClick={() => go("month")}>Open the month</Btn>} flush>
            {overs.length === 0 && (
              <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
                {hasData ? "Nothing over plan yet this month." : "Import CSV to see category spending."}
              </div>
            )}
            {overs.map((o, i) => {
              const over = o.actual - o.plan;
              const ratio = over / o.plan;
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

      {inflow.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
          <Panel title={`Where the ${money(inTotal)} came from`} flush>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {inflow.map((r, i) => (
                <div key={r.source} className="p-5"
                  style={{ borderRight: i < inflow.length - 1 ? `1px solid ${C.lineSoft}` : "none", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <Fig size={25} color={r.amount === 0 ? C.ghost : C.text}>{money(r.amount)}</Fig>
                    <Chip tone={r.kind === "earned" ? "keep" : r.kind === "payback" ? "cancel" : "shared"}>{r.kind}</Chip>
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
