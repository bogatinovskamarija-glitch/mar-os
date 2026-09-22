import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Th, Td, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

function todayMeta() {
  const d = new Date();
  return {
    month: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    monthShort: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

export default function Split() {
  const { cantilever, hasData } = useFinance();
  const meta = todayMeta();

  const fronted = cantilever.fronted.reduce((a, r) => a + r.amount, 0);
  const back = cantilever.fronted.reduce((a, r) => a + r.back, 0);
  const outstanding = cantilever.priorBalance + fronted - back;
  const maxBucket = Math.max(...cantilever.ageBuckets.map((b) => b.amount), 1);

  return (
    <div className="space-y-7">
      {/* Household ledger — manual / placeholder */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title={`Household ledger · ${meta.month}`}
          action={<Chip tone="review">Manual tracking</Chip>}>
          <div className="py-10 text-center px-6">
            <div className="text-[16px] font-semibold" style={{ color: C.dim }}>Add your shared expenses here</div>
            <p className="mt-3 max-w-[46ch] mx-auto text-[14px] font-light leading-[1.6]" style={{ color: C.faint }}>
              Track shared expenses with Dragan — rent, groceries, Canelo's vet bills. When you have a recurring list, add it to this screen in <code className="text-[12px]" style={{ color: C.moss }}>src/screens/Split.jsx</code> as a static array, or use the notes app until you're ready.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-5 max-w-[360px] mx-auto">
              {[
                { l: "You paid out", v: "—", t: C.text },
                { l: "Dragan paid out", v: "—", t: C.text },
                { l: "Your true share", v: "—", t: C.dim },
                { l: "Settle-up", v: "—", t: C.faint },
              ].map((s) => (
                <div key={s.l} className="px-4 py-4 text-left"
                  style={{ background: "rgba(44, 55, 42, 0.5)", backdropFilter: "blur(8px)", border: `1px solid rgba(60, 75, 55, 0.4)` }}>
                  <Label>{s.l}</Label>
                  <div className="mt-2"><Fig size={22} color={s.t}>{s.v}</Fig></div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Trucking float — live from CSV */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
          <Panel title="Trucking float · fronted from your personal account" flush>
            {!hasData && (
              <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
                Import CSV from F-01 to see trucking float transactions.
              </div>
            )}
            {hasData && cantilever.fronted.length === 0 && (
              <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>
                No trucking transactions found this month. The CSV parser looks for keywords like "carat expedited" and "pro freight".
              </div>
            )}
            {hasData && cantilever.fronted.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] border-collapse text-left">
                    <thead>
                      <tr>
                        <Th w="36%">Item</Th>
                        <Th>Entity</Th>
                        <Th>Date</Th>
                        <Th right>Fronted</Th>
                        <Th right>Came back</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {cantilever.fronted.map((r) => (
                        <tr key={r.item + r.date} className="transition-colors hover:bg-[#2C372A]">
                          <Td>{r.item}</Td>
                          <Td color={C.faint} className="text-[13px]">{r.entity}</Td>
                          <Td color={C.faint}><span style={num}>{r.date}</span></Td>
                          <Td right color={C.oxide}><span style={{ ...num, fontWeight: 600 }}>{money(r.amount)}</span></Td>
                          <Td right color={r.back ? C.moss : C.ghost}>
                            <span style={num}>{r.back ? money(r.back) : "—"}</span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "rgba(44, 55, 42, 0.5)" }}>
                        <Td color={C.text}><span className="text-[12px] font-bold uppercase tracking-[0.16em]">This month</span></Td>
                        <Td>{" "}</Td>
                        <Td>{" "}</Td>
                        <Td right color={C.oxide}><span style={{ ...num, fontWeight: 700 }}>{money(fronted)}</span></Td>
                        <Td right color={C.moss}><span style={{ ...num, fontWeight: 700 }}>{money(back)}</span></Td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {fronted > 0 && (
                  <div className="px-5 py-[18px]" style={{ background: "rgba(44, 55, 42, 0.5)", borderTop: `1px solid ${C.line}` }}>
                    <Label>Recovery rate</Label>
                    <p className="mt-2.5 max-w-[56ch] text-[15px] font-light leading-[1.55]" style={{ color: C.dim }}>
                      {money(back)} of the {money(fronted)} you fronted in {meta.monthShort} came back, a{" "}
                      <span style={{ ...num, color: C.oxide, fontWeight: 700 }}>
                        {fronted > 0 ? Math.round((back / fronted) * 100) : 0}%
                      </span>{" "}
                      recovery.
                    </p>
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="Aging">
            <Label>Outstanding balance</Label>
            <div className="mt-3">
              <Fig size={42} color={outstanding > 0 ? C.oxide : C.ghost}>{outstanding > 0 ? money(outstanding) : "—"}</Fig>
            </div>
            <p className="mt-3 text-[13px] font-light leading-[1.55]" style={{ color: C.dim }}>
              {outstanding > 0
                ? "Carried from trucking transactions. None on a repayment schedule."
                : "No outstanding trucking float."}
            </p>

            <div className="mt-7 space-y-4">
              {cantilever.ageBuckets.map((b, i) => (
                <div key={b.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint }}>{b.label}</span>
                    <span className="text-[14px] font-semibold" style={{ ...num, color: i > 1 ? C.oxide : C.text }}>{money(b.amount)}</span>
                  </div>
                  <div className="mt-2 h-[10px] w-full" style={{ background: C.lineSoft }}>
                    <motion.div className="h-full"
                      style={{ backgroundImage: `repeating-linear-gradient(45deg, ${C.oxide} 0 1px, transparent 1px 8px)`, borderTop: `1px solid ${C.oxide}`, borderBottom: `1px solid ${C.oxide}` }}
                      initial={{ width: 0 }}
                      animate={{ width: b.amount > 0 ? `${(b.amount / maxBucket) * 100}%` : "0%" }}
                      transition={{ duration: 0.75, delay: 0.12 + i * 0.09, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              ))}
            </div>

            {outstanding > 0 && (
              <div className="mt-7 px-4 py-4" style={{ background: C.oxideBg, border: `1px solid #6B4034` }}>
                <Label color={C.oxide}>What this costs you</Label>
                <p className="mt-2.5 text-[14px] font-light leading-[1.55]" style={{ color: C.text }}>
                  {money(outstanding)} of your money is doing the trucking company's job instead of yours. At your Bogat rate that is roughly {Math.round(outstanding / 195)} billable hours you fronted for free.
                </p>
              </div>
            )}
          </Panel>
        </div>
      </motion.div>
    </div>
  );
}
