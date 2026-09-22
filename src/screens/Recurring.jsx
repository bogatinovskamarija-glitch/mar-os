import { useState } from "react";
import { motion } from "framer-motion";
import { C, money, num } from "../theme";
import { Label, Fig, Panel, Chip, Th, Td, Seg, Btn, rise } from "../kit";
import { SUBSCRIPTIONS } from "../data";

const FILTERS = ["All", "Cancel", "Review", "Keep"];
const RANK = { cancel: 0, review: 1, keep: 2 };

export default function Recurring() {
  const [f, setF] = useState("All");
  const [killed, setKilled] = useState([]);

  const rows = [...SUBSCRIPTIONS]
    .filter((r) => f === "All" || r.verdict === f.toLowerCase())
    .sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || b.amount - a.amount);

  const monthly = SUBSCRIPTIONS.reduce((a, r) => a + r.amount, 0);
  const cancels = SUBSCRIPTIONS.filter((r) => r.verdict === "cancel");
  const reviews = SUBSCRIPTIONS.filter((r) => r.verdict === "review");
  const waste = cancels.reduce((a, r) => a + r.amount, 0);
  const saved = SUBSCRIPTIONS.filter((r) => killed.includes(r.name)).reduce((a, r) => a + r.amount, 0);

  const toggle = (n) => setKilled((k) => (k.includes(n) ? k.filter((x) => x !== n) : [...k, n]));

  return (
    <div className="space-y-7">
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <div className="grid gap-px sm:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }}>
          {[
            { l: "Recurring load", v: money(monthly, true), s: `${SUBSCRIPTIONS.length} active · ${money(monthly * 12)} a year`, t: C.text },
            { l: "Dead weight", v: money(waste, true), s: `${cancels.length} unused in 45+ days`, t: C.oxide },
            { l: "Worth a look", v: money(reviews.reduce((a, r) => a + r.amount, 0), true), s: `${reviews.length} drifting`, t: C.dim },
            { l: "Cancelled here", v: money(saved, true), s: killed.length ? `${killed.length} killed · ${money(saved * 12)} a year` : "Tick a row to model it", t: saved ? C.moss : C.ghost },
          ].map((s) => (
            <div key={s.l} className="px-5 py-5" style={{ background: "rgba(36, 46, 34, 0.7)", backdropFilter: "blur(14px)" }}>
              <Label>{s.l}</Label>
              <div className="mt-3"><Fig size={27} color={s.t}>{s.v}</Fig></div>
              <div className="mt-2 text-[12px] font-light leading-snug" style={{ color: C.faint }}>{s.s}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel
          title="Subscription audit"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Seg options={FILTERS} value={f} onChange={setF} />
              {killed.length > 0 && <Btn onClick={() => setKilled([])}>Reset · {killed.length}</Btn>}
            </div>
          }
          flush
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr>
                  <Th w="40px">{" "}</Th>
                  <Th w="26%">Service</Th>
                  <Th>Bucket</Th>
                  <Th right>Monthly</Th>
                  <Th right>Per year</Th>
                  <Th right>Last opened</Th>
                  <Th>Next charge</Th>
                  <Th right w="110px">Verdict</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const dead = killed.includes(r.name);
                  return (
                    <tr key={r.name} className="transition-colors hover:bg-[#2C372A]" style={{ opacity: dead ? 0.42 : 1 }}>
                      <Td>
                        <button type="button" onClick={() => toggle(r.name)} aria-pressed={dead}
                          aria-label={`Model cancelling ${r.name}`}
                          className="grid h-[16px] w-[16px] cursor-pointer place-items-center border"
                          style={{ borderColor: dead ? C.moss : C.ghost, background: dead ? C.moss : "transparent" }}>
                          {dead && (
                            <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                              <path d="M1 5.2 3.7 8 9 1.8" stroke={C.forest} strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </button>
                      </Td>
                      <Td>
                        <span className="font-medium" style={{ textDecoration: dead ? "line-through" : "none" }}>{r.name}</span>
                        {r.irony && <span className="ml-2 whitespace-nowrap text-[12px] italic" style={{ color: C.oxide }}>the one this board replaces</span>}
                      </Td>
                      <Td color={C.faint} className="text-[13px]">{r.bucket}</Td>
                      <Td right><span style={{ ...num, fontWeight: 600 }}>{money(r.amount, true)}</span></Td>
                      <Td right color={C.faint}><span style={num}>{money(r.amount * 12)}</span></Td>
                      <Td right color={r.lastUsed > 40 ? C.oxide : r.lastUsed > 14 ? C.dim : C.faint}>
                        <span style={num}>{r.lastUsed === 0 ? "today" : `${r.lastUsed}d ago`}</span>
                      </Td>
                      <Td color={C.faint}><span style={num}>{r.next}</span></Td>
                      <Td right><Chip tone={r.verdict}>{r.verdict}</Chip></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4" style={{ background: "rgba(44, 55, 42, 0.5)", borderTop: `1px solid ${C.line}` }}>
            <p className="text-[13px] font-light" style={{ color: C.faint }}>
              Update this list in <code className="text-[12px]" style={{ color: C.moss }}>src/data.js → SUBSCRIPTIONS</code> when you add or cancel a service.
            </p>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
