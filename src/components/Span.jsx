import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Chip } from "../kit";

export default function Span({ inflowTotal, plates, carried, carriedItems }) {
  const [sel, setSel] = useState(null);

  const spent = plates.reduce((a, p) => a + p.actual, 0);
  const slack = Math.max(0, inflowTotal - spent);
  const total = inflowTotal + carried;
  const pct = (v) => (total > 0 ? (v / total) * 100 : 0);

  const active = sel === null ? null : plates[sel];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6 px-1">
        <div>
          <Label>Supported span · came in</Label>
          <div className="mt-2 flex items-baseline gap-3">
            <Fig size={40} color={C.text}>{money(inflowTotal)}</Fig>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.faint }}>
              {money(spent)} used · {money(slack)} slack
            </span>
          </div>
        </div>
        <div className="text-right">
          <Label color={C.oxide}>Cantilever · carried, not spent</Label>
          <div className="mt-2 flex items-baseline justify-end gap-3">
            <Fig size={40} color={C.oxide}>{money(carried)}</Fig>
            {inflowTotal > 0 && (
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.faint }}>
                {Math.round((carried / inflowTotal) * 100)}% of inflow
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-8 select-none">
        <div className="flex h-[136px] w-full" style={{ borderTop: `1px solid ${C.line}` }}>
          {plates.filter((p) => p.actual > 0).map((p, i) => {
            const over = Math.max(0, p.actual - p.plan);
            const on = sel === i;
            const w = pct(p.actual);
            return (
              <button
                key={p.cat}
                type="button"
                onClick={() => setSel(on ? null : i)}
                aria-pressed={on}
                className="group relative h-full cursor-pointer"
                style={{ width: `${w}%`, borderRight: `1px solid rgba(26,33,24,0.5)` }}
              >
                <motion.span
                  className="absolute inset-x-0 bottom-0 origin-bottom"
                  style={{ height: "100%", background: on ? "rgba(78,106,72,0.8)" : "rgba(59,82,55,0.7)" }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                />
                {over > 0 && (
                  <motion.span
                    className="absolute inset-x-0 top-0 origin-top"
                    style={{ height: `${(over / p.actual) * 100}%`, background: C.oxide }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.42, delay: 0.04 * i + 0.24, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                {w > 3.4 && (
                  <span
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.1em]"
                    style={{ writingMode: "vertical-rl", transform: "translateX(-50%) rotate(180deg)", color: on ? C.white : "rgba(255,255,255,0.88)" }}
                  >
                    {p.short}
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-[7px] h-[5px] transition-opacity"
                  style={{ background: C.moss, opacity: on ? 1 : 0 }}
                />
              </button>
            );
          })}

          {slack > 0 && (
            <div
              className="relative h-full"
              style={{
                width: `${pct(slack)}%`,
                borderLeft: `1px dashed ${C.ghost}`,
                background: `repeating-linear-gradient(90deg, rgba(47,58,44,0.4) 0 1px, transparent 1px 8px)`,
              }}
              title={`Slack · ${money(slack)}`}
            >
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ writingMode: "vertical-rl", transform: "translateX(-50%) rotate(180deg)", color: C.ghost }}>
                Slack
              </span>
            </div>
          )}

          {carried > 0 && (
            <div className="relative h-full" style={{ width: `${pct(carried)}%` }}>
              <span aria-hidden className="absolute inset-y-0 left-0 z-10 w-[2px]" style={{ background: C.moss }} />
              <motion.div
                className="flex h-full w-full origin-left"
                style={{ borderTop: `1px solid ${C.oxide}`, borderBottom: `1px solid ${C.oxide}`, borderRight: `1px solid ${C.oxide}` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {carriedItems.map((it, i) => {
                  const net = it.amount - it.back;
                  const w = carried > 0 ? (net / carried) * 100 : 0;
                  return (
                    <div key={it.item} className="relative h-full"
                      style={{ width: `${w}%`, borderLeft: i ? `1px solid rgba(232,169,142,0.5)` : "none",
                        backgroundImage: `repeating-linear-gradient(45deg, rgba(232,169,142,0.6) 0 1px, transparent 1px 8px)` }}
                      title={`${it.item} · ${money(net)} still out`}>
                      {w > 9 && (
                        <div className="absolute inset-x-0 bottom-3 hidden px-2 text-center sm:block">
                          <div className="truncate text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: C.oxide }}>{it.short}</div>
                          <div className="mt-1 truncate text-[12px] font-semibold" style={{ ...num, color: C.text }}>{money(net)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
              <motion.span aria-hidden className="absolute -right-px top-0 h-full w-[2px]" style={{ background: C.oxide }}
                animate={{ y: [0, 6, 0] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }} />
            </div>
          )}
        </div>

        <div className="relative h-[17px] w-full">
          {[0, pct(inflowTotal)].map((left, i) => (
            <div key={i} className="absolute top-0" style={{ left: `${left}%`, transform: i ? "translateX(-50%)" : "none" }}>
              <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden>
                <path d="M10 0 L19 13 L1 13 Z" fill="none" stroke={C.moss} strokeWidth="1.2" />
                <line x1="0" y1="15.5" x2="20" y2="15.5" stroke={C.moss} strokeWidth="1.2" />
              </svg>
            </div>
          ))}
        </div>

        <div className="mt-2 flex w-full text-[12px] font-bold uppercase tracking-[0.16em]">
          <div className="pr-3" style={{ width: `${pct(inflowTotal)}%`, color: C.faint }}>
            <div className="h-px w-full" style={{ background: "rgba(47,58,44,0.6)" }} />
            <div className="mt-2"><span className="sm:hidden">Span</span><span className="hidden sm:inline">Span · your own month</span></div>
          </div>
          {carried > 0 && (
            <div className="pl-3 text-right" style={{ width: `${pct(carried)}%`, color: C.oxide }}>
              <div className="h-px w-full" style={{ background: C.oxide, opacity: 0.5 }} />
              <div className="mt-2"><span className="sm:hidden">Overhang</span><span className="hidden sm:inline">Overhang · the trucking float</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 flex min-h-[86px] flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4"
        style={{ background: "rgba(44,55,42,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(60,75,55,0.35)" }}>
        {active ? (
          <>
            <div className="min-w-[180px]">
              <Label>{active.cat}</Label>
              <div className="mt-2 flex items-baseline gap-2">
                <Fig size={27} color={active.actual > active.plan ? C.oxide : C.text}>{money(active.actual)}</Fig>
                <span className="text-[12px]" style={{ ...num, color: C.faint }}>of {money(active.plan)} planned</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {active.actual > active.plan
                ? <Chip tone="cancel">{money(active.actual - active.plan)} over</Chip>
                : <Chip tone="keep">{money(active.plan - active.actual)} under</Chip>}
              {active.shared && <Chip tone="shared">Shared with Dragan</Chip>}
              <span className="text-[13px]" style={{ ...num, color: C.dim }}>{active.txns} transactions</span>
              {active.flag && <span className="text-[13px]" style={{ color: C.oxide }}>{active.flag}</span>}
            </div>
          </>
        ) : (
          <>
            <p className="max-w-[46ch] text-[15px] font-light leading-[1.5]" style={{ color: C.dim }}>
              {inflowTotal > 0
                ? `Your own month lands inside the span with ${money(slack)} to spare. The beam is bending because of what hangs past the support.`
                : "Import CSV files from your accounts to see the span diagram."}
            </p>
            <div className="ml-auto text-right">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint }}>Click any plate</div>
              <div className="mt-1.5 text-[13px] font-light" style={{ color: C.ghost }}>{plates.filter((p) => p.actual > 0).length} categories this month</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.ghost }}>
        <span className="flex items-center gap-2"><span className="h-[10px] w-[16px]" style={{ background: "rgba(59,82,55,0.7)" }} /> On plan</span>
        <span className="flex items-center gap-2"><span className="h-[10px] w-[16px]" style={{ background: C.oxide }} /> Over plan</span>
        <span className="flex items-center gap-2"><span className="h-[10px] w-[16px]" style={{ backgroundImage: `repeating-linear-gradient(90deg, rgba(47,58,44,0.4) 0 1px, transparent 1px 5px)`, border: `1px dashed ${C.ghost}` }} /> Slack</span>
        <span className="flex items-center gap-2"><span className="h-[10px] w-[16px]" style={{ backgroundImage: `repeating-linear-gradient(45deg, rgba(232,169,142,0.6) 0 1px, transparent 1px 5px)`, border: `1px solid ${C.oxide}` }} /> Not in contract · carried</span>
      </div>
    </div>
  );
}
