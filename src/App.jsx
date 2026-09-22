import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, CheckSquare, Target, WalletCards, Timer, BookOpen } from "lucide-react";
import { C, money, num } from "./theme";
import { Label, Fig, Plot } from "./kit";
import Backdrop from "./components/Backdrop";
import Home from "./screens/Home";
import { Habits, Goals, Focus, Journal } from "./screens/PersonalSheets";
import Morning from "./screens/Morning";
import Month from "./screens/Month";
import Recurring from "./screens/Recurring";
import Split from "./screens/Split";
import Drift from "./screens/Drift";
import { meta } from "./data";
import { useHabits } from "./hooks/useHabits";
import { useFocus } from "./hooks/useFocus";
import { useFinance } from "./hooks/useFinance";

const PRIMARY = [
  { id: "home", no: "P-00", label: "Home", sub: "The daily glance", icon: HomeIcon },
  { id: "habits", no: "P-01", label: "Habits", sub: "Small promises", icon: CheckSquare },
  { id: "goals", no: "P-02", label: "Goals", sub: "ClickUp priorities", icon: Target },
  { id: "finance", no: "P-03", label: "Financials", sub: "Money + float", icon: WalletCards },
  { id: "focus", no: "P-04", label: "Focus", sub: "Timer + sound", icon: Timer },
  { id: "journal", no: "P-05", label: "Journal", sub: "Private page", icon: BookOpen },
];
const FINANCE = [
  { id: "morning", no: "F-01", label: "Overview" },
  { id: "month", no: "F-02", label: "The Month" },
  { id: "recurring", no: "F-03", label: "Recurring" },
  { id: "split", no: "F-04", label: "The Split" },
  { id: "drift", no: "F-05", label: "The Drift" },
];
const FINANCE_BODY = { morning: Morning, month: Month, recurring: Recurring, split: Split, drift: Drift };

export default function App() {
  const [page, setPage] = useState("home");
  const [finance, setFinance] = useState("morning");

  const { done: habitDone, total: habitTotal } = useHabits();
  const { todayMins: focusMins, goalMin: focusGoal } = useFocus();
  const { accounts } = useFinance();
  const liquid = accounts.filter((a) => a.balance > 0).reduce((a, x) => a + x.balance, 0);

  const Body = page === "finance"
    ? FINANCE_BODY[finance]
    : { home: Home, habits: Habits, goals: Goals, focus: Focus, journal: Journal }[page];
  const active = PRIMARY.find((p) => p.id === page);
  const go = (id) => { setPage(id); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative min-h-screen overflow-x-hidden font-[Montserrat] antialiased" style={{ background: C.floor, color: C.text }}>
      <Backdrop />

      <header className="relative z-10" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="mx-auto max-w-[102rem] px-5 pb-7 pt-5 sm:px-9 sm:pb-8 sm:pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.26em]" style={{ color: C.dim }}>
              {meta.owner} · Personal operating system
            </p>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.faint }}>
              {todayStr}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-7">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[clamp(2.7rem,7.6vw,5.9rem)] font-black uppercase leading-[0.84] tracking-[-0.045em]"
                style={{ color: C.white }}
              >
                MAR<span style={{ color: C.moss }}>·</span>OS
              </motion.h1>
              <p className="mt-4 max-w-[40ch] border-l pl-4 text-[16px] font-light leading-[1.55] sm:text-[17px]"
                style={{ color: C.text, borderColor: C.moss }}>
                Your personal operating system. Less friction between what matters and what you do next.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:gap-x-12">
              <div>
                <Label>Today</Label>
                <div className="mt-2">
                  <Fig size={29} color={habitDone === habitTotal && habitTotal > 0 ? C.moss : C.text}>
                    {habitDone}/{habitTotal}
                  </Fig>
                </div>
                <div className="mt-1 text-[12px]" style={{ color: C.faint }}>habits complete</div>
              </div>
              <div>
                <Label>Focus</Label>
                <div className="mt-2"><Fig size={29}>{focusMins}m</Fig></div>
                <div className="mt-1 text-[12px]" style={{ color: C.faint }}>of {focusGoal}m goal</div>
              </div>
              <div>
                <Label>Liquid</Label>
                <div className="mt-2">
                  <Fig size={29} color={liquid > 0 ? C.text : C.ghost}>
                    {liquid > 0 ? money(liquid) : "—"}
                  </Fig>
                </div>
                <div className="mt-1 text-[12px]" style={{ color: C.faint }}>in accounts</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(26,33,24,.95)", borderBottom: `1px solid ${C.line}` }}>
        <div className="mx-auto max-w-[102rem] overflow-x-auto">
          <div className="flex min-w-max" style={{ background: C.line }}>
            {PRIMARY.map((p) => {
              const on = page === p.id;
              const I = p.icon;
              return (
                <button key={p.id} type="button" onClick={() => go(p.id)}
                  className="relative flex min-w-[145px] cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors"
                  style={{ background: on ? C.canopy : C.floor, color: on ? C.white : C.dim }}>
                  {on && <motion.span layoutId="primary" className="absolute inset-x-0 top-0 h-[2px]" style={{ background: C.moss }} />}
                  <I size={15} color={on ? C.moss : C.faint} />
                  <span>
                    <span className="block text-[12px] font-bold uppercase tracking-[0.14em]">{p.label}</span>
                    <span className="mt-1 block text-[12px]" style={{ color: on ? C.dim : C.ghost }}>{p.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {page === "finance" && (
        <div className="relative z-20 border-b" style={{ borderColor: C.line, background: C.floor }}>
          <div className="mx-auto flex max-w-[102rem] overflow-x-auto px-5 sm:px-9">
            {FINANCE.map((f) => (
              <button key={f.id}
                onClick={() => { setFinance(f.id); window.scrollTo({ top: 0 }); }}
                className="cursor-pointer border-b-2 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: finance === f.id ? C.moss : "transparent", color: finance === f.id ? C.white : C.faint }}>
                {f.no} · {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-[102rem] px-5 pb-20 pt-9 sm:px-9 sm:pb-24 sm:pt-11">
        <div className="relative">
          <Plot token={page + finance} />
          <div className="mb-7 flex items-baseline gap-4">
            <span className="text-[12px] font-black tracking-[0.16em]" style={{ color: C.moss }}>{active?.no}</span>
            <h2 className="text-[25px] font-bold uppercase tracking-[-0.01em]" style={{ color: C.white }}>{active?.label}</h2>
            <span className="h-px min-w-[40px] flex-1" style={{ background: C.line }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={page + finance}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}>
              <Body go={go} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 border-t pt-8" style={{ borderColor: C.line }}>
          <div>
            <Label color={C.moss}>MAR OS · private sheet</Label>
            <p className="mt-3 max-w-[55ch] text-[15px] font-light leading-[1.55]" style={{ color: C.dim }}>
              A daily home for the person behind the projects.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
