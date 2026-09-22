import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Th, Td, rise } from "../kit";
import Span from "../components/Span";
import { useFinance } from "../hooks/useFinance";

function todayMeta() {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return {
    month: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    dayOfMonth: d.getDate(),
    daysInMonth,
  };
}

export default function Month() {
  const { envelope, inflow, cantilever, hasData } = useFinance();
  const meta = todayMeta();

  const inTotal = inflow.reduce((a, r) => a + r.amount, 0);
  const fronted = cantilever.fronted.reduce((a, r) => a + r.amount, 0);
  const back = cantilever.fronted.reduce((a, r) => a + r.back, 0);
  const carried = fronted - back;

  const planTotal = envelope.reduce((a, r) => a + r.plan, 0);
  const actTotal = envelope.reduce((a, r) => a + r.actual, 0);

  return (
    <div className="space-y-7">
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <Panel title={`${meta.month} · span diagram`} action={<Chip tone="review">Day {meta.dayOfMonth} of {meta.daysInMonth}</Chip>}>
          {!hasData && (
            <p className="py-8 text-center text-[14px] font-light" style={{ color: C.faint }}>
              Import CSV files from F-01 Overview to see the span diagram.
            </p>
          )}
          {hasData && (
            <Span inflowTotal={inTotal} plates={envelope} carried={carried} carriedItems={cantilever.fronted} />
          )}
        </Panel>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Plate schedule" flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <Th w="34%">Category</Th>
                  <Th right>Planned</Th>
                  <Th right>Actual</Th>
                  <Th right>Delta</Th>
                  <Th right w="88px">Txns</Th>
                  <Th w="22%">Note</Th>
                </tr>
              </thead>
              <tbody>
                {envelope.map((e) => {
                  const d = e.actual - e.plan;
                  return (
                    <tr key={e.cat} className="transition-colors hover:bg-[#2C372A]">
                      <Td>
                        <span className="flex items-center gap-3">
                          <span className="h-[11px] w-[11px] shrink-0" style={{ background: d > 0 ? C.oxide : C.canopy }} />
                          {e.cat}
                        </span>
                      </Td>
                      <Td right color={C.faint}><span style={num}>{e.plan > 0 ? money(e.plan) : "—"}</span></Td>
                      <Td right><span style={{ ...num, fontWeight: 600 }}>{e.actual > 0 ? money(e.actual) : "—"}</span></Td>
                      <Td right color={d > 0 ? C.oxide : d < 0 ? C.moss : C.faint}>
                        <span style={{ ...num, fontWeight: 600 }}>{d === 0 ? "—" : (d > 0 ? "+" : "") + money(d)}</span>
                      </Td>
                      <Td right color={C.faint}><span style={num}>{e.txns || "—"}</span></Td>
                      <Td color={C.faint} className="text-[13px]">
                        {e.flag ? <span style={{ color: C.oxide }}>{e.flag}</span> : e.shared ? <Chip tone="shared">Shared</Chip> : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(44, 55, 42, 0.5)" }}>
                  <Td color={C.text}><span className="text-[12px] font-bold uppercase tracking-[0.16em]">Total</span></Td>
                  <Td right color={C.dim}><span style={{ ...num, fontWeight: 700 }}>{money(planTotal)}</span></Td>
                  <Td right color={C.text}><span style={{ ...num, fontWeight: 700 }}>{money(actTotal)}</span></Td>
                  <Td right color={actTotal > planTotal ? C.oxide : C.moss}>
                    <span style={{ ...num, fontWeight: 700 }}>{actTotal >= planTotal ? "+" : ""}{money(actTotal - planTotal)}</span>
                  </Td>
                  <Td right color={C.faint}><span style={num}>{envelope.reduce((a, r) => a + (r.txns || 0), 0)}</span></Td>
                  <Td>{" "}</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
        <div className="grid gap-7 sm:grid-cols-3">
          {[
            { l: "Planned envelope", v: money(planTotal), t: C.dim, s: "What a normal month should cost" },
            { l: "Actual spending", v: money(actTotal), t: actTotal > planTotal ? C.oxide : C.text, s: actTotal > planTotal ? `${Math.round((actTotal / planTotal - 1) * 100)}% over plan` : "Within plan" },
            { l: "Carried past the support", v: money(carried), t: carried > 0 ? C.oxide : C.faint, s: carried > 0 ? "Not spending. Lending." : "No trucking float this month" },
          ].map((s) => (
            <div key={s.l} className="px-5 py-5"
              style={{ background: "rgba(36, 46, 34, 0.6)", backdropFilter: "blur(12px)", border: `1px solid rgba(60, 75, 55, 0.4)` }}>
              <Label>{s.l}</Label>
              <div className="mt-3"><Fig size={29} color={s.t}>{s.v}</Fig></div>
              <div className="mt-2 text-[12px] font-light" style={{ color: C.faint }}>{s.s}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
