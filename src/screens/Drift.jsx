import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Th, Td, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

const H = 224;

export default function Drift() {
  const { trend, cantilever, hasData } = useFinance();

  const maxFlow = Math.max(...trend.flatMap((t) => [t.inflow, t.outflow]), 1);
  const maxFloat = Math.max(...trend.map((t) => t.float), 1);
  const n = trend.length;

  const cx = (i) => ((i + 0.5) / n) * 100;
  const fy = (v) => H - (v / maxFloat) * (H - 18);
  const path = trend.map((t, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${fy(t.float)}`).join(" ");

  const netAvg = n > 0 ? Math.round(trend.reduce((a, t) => a + (t.inflow - t.outflow), 0) / n) : 0;
  const floatGrowth = n > 1 ? trend[n - 1].float - trend[0].float : 0;
  const frontedTotal = cantilever.fronted.reduce((a, r) => a + r.amount, 0);
  const backTotal = cantilever.fronted.reduce((a, r) => a + r.back, 0);
  const recovery = frontedTotal > 0 ? Math.round((backTotal / frontedTotal) * 100) : 0;

  return (
    <div className="space-y-7">
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <div className="grid gap-px sm:grid-cols-3" style={{ background: C.line, border: `1px solid ${C.line}` }}>
          {[
            { l: "Average monthly net", v: hasData ? money(netAvg) : "—", t: !hasData ? C.ghost : netAvg >= 0 ? C.moss : C.oxide, s: "Your own life, six-month mean" },
            { l: "Float growth", v: hasData && floatGrowth !== 0 ? `${floatGrowth > 0 ? "+" : ""}${money(floatGrowth)}` : "—", t: floatGrowth > 0 ? C.oxide : C.moss, s: "The line that never comes down" },
            { l: "Recovery rate", v: frontedTotal > 0 ? `${recovery}%` : "—", t: recovery > 80 ? C.moss : recovery > 50 ? C.dim : C.oxide, s: "Of trucking float that came back" },
          ].map((s) => (
            <div key={s.l} className="px-5 py-5"
              style={{ background: "rgba(36, 46, 34, 0.7)", backdropFilter: "blur(14px)" }}>
              <Label>{s.l}</Label>
              <div className="mt-3"><Fig size={29} color={s.t}>{s.v}</Fig></div>
              <div className="mt-2 text-[12px] font-light" style={{ color: C.faint }}>{s.s}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Six-month section">
          {!hasData && (
            <div className="py-16 text-center">
              <div className="text-[16px] font-semibold" style={{ color: C.dim }}>No data imported yet</div>
              <p className="mt-3 text-[14px] font-light" style={{ color: C.faint }}>
                Import CSV from F-01 Overview to see your six-month trend.
              </p>
            </div>
          )}
          {hasData && (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.faint }}>
                  Monthly flow · to {money(maxFlow)}
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.oxide }}>
                  Float carried · to {money(maxFloat)}
                </span>
              </div>

              <div className="relative w-full" style={{ height: H, borderBottom: `1px solid ${C.line}` }}>
                <div className="absolute inset-0 flex items-end">
                  {trend.map((t, i) => (
                    <div key={t.m} className="flex h-full flex-1 items-end justify-center gap-[4px] px-[7px]">
                      <motion.div className="w-full max-w-[38px] origin-bottom"
                        style={{ background: C.canopy, height: `${(t.inflow / maxFlow) * 100}%` }}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        title={`${t.m} came in · ${money(t.inflow)}`} />
                      <motion.div className="w-full max-w-[38px] origin-bottom"
                        style={{ height: `${(t.outflow / maxFlow) * 100}%`, backgroundImage: `repeating-linear-gradient(45deg, ${C.moss}66 0 1px, transparent 1px 9px)`, border: `1px solid ${C.moss}55` }}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.06 + 0.07, ease: [0.16, 1, 0.3, 1] }}
                        title={`${t.m} went out · ${money(t.outflow)}`} />
                    </div>
                  ))}
                </div>

                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                  viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
                  <motion.path d={path} fill="none" stroke={C.oxide} strokeWidth="2" strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }} />
                </svg>

                {trend.map((t, i) => (
                  <motion.span key={t.m} className="absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${cx(i)}%`, top: fy(t.float), background: C.floor, border: `2px solid ${C.oxide}` }}
                    initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.14 }}
                    title={`${t.m} float · ${money(t.float)}`} />
                ))}
              </div>

              <div className="flex w-full">
                {trend.map((t) => {
                  const net = t.inflow - t.outflow;
                  return (
                    <div key={t.m} className="flex-1 pt-3 text-center">
                      <div className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint }}>{t.m}</div>
                      <div className="mt-1.5 text-[12px] font-semibold" style={{ ...num, color: net >= 0 ? C.moss : C.oxide }}>
                        {net >= 0 ? "+" : ""}{money(net)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.ghost }}>
                <span className="flex items-center gap-2"><span className="h-[11px] w-[17px]" style={{ background: C.canopy }} /> Came in</span>
                <span className="flex items-center gap-2"><span className="h-[11px] w-[17px]" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${C.moss}66 0 1px, transparent 1px 7px)`, border: `1px solid ${C.moss}55` }} /> Went out</span>
                <span className="flex items-center gap-2"><span className="h-[2px] w-[19px]" style={{ background: C.oxide }} /> Float carried · right scale</span>
              </div>
            </>
          )}
        </Panel>
      </motion.div>

      {hasData && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Panel title="Six-month ledger" flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr>
                    <Th w="16%">Month</Th>
                    <Th right>Came in</Th>
                    <Th right>Went out</Th>
                    <Th right>Net</Th>
                    <Th right>Float at close</Th>
                    <Th right>Float change</Th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t, i) => {
                    const net = t.inflow - t.outflow;
                    const delta = i === 0 ? null : t.float - trend[i - 1].float;
                    return (
                      <tr key={t.m} className="transition-colors hover:bg-[#2C372A]">
                        <Td><span className="font-semibold uppercase tracking-[0.1em]">{t.m} 2026</span></Td>
                        <Td right><span style={num}>{money(t.inflow)}</span></Td>
                        <Td right color={C.dim}><span style={num}>{money(t.outflow)}</span></Td>
                        <Td right color={net >= 0 ? C.moss : C.oxide}>
                          <span style={{ ...num, fontWeight: 600 }}>{net >= 0 ? "+" : ""}{money(net)}</span>
                        </Td>
                        <Td right color={C.oxide}><span style={{ ...num, fontWeight: 600 }}>{money(t.float)}</span></Td>
                        <Td right color={delta === null ? C.ghost : delta > 0 ? C.oxide : C.moss}>
                          <span style={num}>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${money(delta)}`}</span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-[18px]" style={{ background: "rgba(44, 55, 42, 0.5)", borderTop: `1px solid ${C.line}` }}>
              <p className="max-w-[72ch] text-[15px] font-light leading-[1.55]" style={{ color: C.dim }}>
                {netAvg >= 0
                  ? `Average of ${money(netAvg)} left over monthly. `
                  : `Average shortfall of ${money(Math.abs(netAvg))} monthly. `}
                {floatGrowth > 0 && `In the same period the float you carry grew ${money(floatGrowth)}, and only ${recovery}% of what you front comes back. Budgeting is not the problem on this sheet.`}
              </p>
            </div>
          </Panel>
        </motion.div>
      )}
    </div>
  );
}
