import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Play, ArrowUpRight, Clock3, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind } from "lucide-react";
import { C } from "../theme";
import { Label, Fig, Panel, Chip, Btn, rise } from "../kit";
import { useHabits } from "../hooks/useHabits";
import { usePriorities } from "../hooks/usePriorities";
import { useGoals } from "../hooks/useGoals";
import { useFocus } from "../hooks/useFocus";
import { useWeather } from "../hooks/useWeather";

function WeatherIcon({ code, ...props }) {
  const I = code === 0 || code === 1 ? Sun
    : code <= 3 ? Cloud
    : code <= 48 ? Wind
    : code <= 67 ? CloudRain
    : code <= 77 ? Snowflake
    : code <= 82 ? CloudRain
    : CloudLightning;
  return <I {...props} />;
}

export default function Home({ go }) {
  const { checks, toggle, done, total, streak, names: HABIT_NAMES, notes: HABIT_NOTES } = useHabits();
  const { priorities, loading: pLoading } = usePriorities();
  const { goals, loading: gLoading } = useGoals();
  const { todayMins, goalMin } = useFocus();
  const { weather, loading: wLoading, error: wError } = useWeather();

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-7">
      {/* Hero row */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <div className="grid gap-px lg:grid-cols-[1.45fr_1fr_1fr_0.7fr]" style={{ background: C.line, border: `1px solid ${C.line}` }}>
          <div className="px-6 py-6" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
            <Label>Today · {todayLabel}</Label>
            <h3 className="mt-3 text-[29px] font-bold leading-[1.05]" style={{ color: C.white }}>
              Make the day<br /><span style={{ color: C.moss }}>count.</span>
            </h3>
            <p className="mt-3 max-w-[34ch] text-[14px] font-light leading-[1.5]" style={{ color: C.dim }}>
              One home page for the work, the body, the money, and the person carrying all of it.
            </p>
          </div>
          <div className="px-6 py-6" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
            <Label>Habits today</Label>
            <div className="mt-3 flex items-baseline gap-3">
              <Fig size={42} color={done === total ? C.moss : C.text}>{done}/{total}</Fig>
              {streak > 0 && <Chip tone="keep">{streak} day streak</Chip>}
            </div>
            <div className="mt-4 h-[5px]" style={{ background: C.lineSoft }}>
              <div className="h-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, background: C.moss }} />
            </div>
            <button type="button" onClick={() => go("habits")}
              className="mt-4 flex cursor-pointer items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.moss }}>
              Open habits <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="px-6 py-6" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
            <Label>Focus today</Label>
            <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: C.dim }}>
              <Clock3 size={15} />{todayMins} / {goalMin} min
            </div>
            <div className="mt-4 h-[5px]" style={{ background: C.lineSoft }}>
              <div className="h-full" style={{ width: `${Math.min(100, (todayMins / goalMin) * 100)}%`, background: C.canopyLt }} />
            </div>
            <button type="button" onClick={() => go("focus")}
              className="mt-4 flex cursor-pointer items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.moss }}>
              Start focus <Play size={13} />
            </button>
          </div>
          <div className="px-6 py-6" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
            <Label>Weather</Label>
            {wLoading
              ? <div className="mt-4 text-[12px]" style={{ color: C.faint }}>Locating…</div>
              : wError === "denied"
              ? <div className="mt-4 text-[12px]" style={{ color: C.faint }}>Allow location to see weather.</div>
              : wError
              ? <div className="mt-4 text-[12px]" style={{ color: C.faint }}>Unavailable</div>
              : weather
              ? <>
                  <div className="mt-3 flex items-end gap-3">
                    <WeatherIcon code={weather.code} size={20} color={C.moss} />
                    <Fig size={34} color={C.white}>{weather.temp}°C</Fig>
                  </div>
                  <div className="mt-2 text-[12px] font-semibold" style={{ color: C.dim }}>{weather.desc}</div>
                  <div className="mt-1 text-[11px]" style={{ color: C.faint }}>Feels {weather.feels}° · {weather.city}</div>
                </>
              : null}
          </div>
        </div>
      </motion.div>

      {/* Habits + Priorities */}
      <div className="grid gap-7 lg:grid-cols-[1.12fr_0.88fr]">
        <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
          <Panel title="Today's habits" action={<span className="text-[12px]" style={{ color: C.faint }}>Tap to mark complete</span>} flush>
            {HABIT_NAMES.map((name) => {
              const checked = !!checks[name];
              return (
                <button key={name} type="button" onClick={() => toggle(name)}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-[14px] text-left transition-colors hover:bg-[#2C372A]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <span className="grid h-[20px] w-[20px] place-items-center border" style={{ borderColor: checked ? C.moss : C.ghost, background: checked ? C.moss : "transparent" }}>
                    {checked ? <Check size={14} color={C.forest} /> : null}
                  </span>
                  <span className="flex-1 text-[15px]" style={{ color: checked ? C.dim : C.text, textDecoration: checked ? "line-through" : "none" }}>
                    {name}
                  </span>
                  <span className="text-[12px]" style={{ color: C.faint }}>{HABIT_NOTES[name] ?? ""}</span>
                </button>
              );
            })}
          </Panel>
        </motion.div>
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Panel title="Today's priorities"
            action={<button type="button" onClick={() => go("goals")} className="cursor-pointer text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.moss }}>Goals + ClickUp</button>}
            flush>
            {pLoading
              ? <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>Fetching from ClickUp…</div>
              : priorities.length === 0
                ? <div className="px-5 py-8 text-[13px]" style={{ color: C.faint }}>No tasks due today. Good.</div>
                : priorities.slice(0, 3).map((p, i) => (
                  <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer"
                    className="flex w-full gap-4 px-5 py-[16px] text-left transition-colors hover:bg-[#2C372A] no-underline"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <span className="text-[12px] font-bold" style={{ color: C.ghost }}>0{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-[14px] font-medium leading-snug" style={{ color: C.text }}>{p.title}</span>
                      <span className="mt-2 block text-[12px]" style={{ color: C.faint }}>{p.space ?? "ClickUp"} · {p.due ?? "Due today"}</span>
                    </span>
                  </a>
                ))}
          </Panel>
        </motion.div>
      </div>

      {/* Goals */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
        <Panel title="Life dashboard">
          {gLoading
            ? <div className="py-4 text-[13px]" style={{ color: C.faint }}>Loading goals…</div>
            : goals.length === 0
              ? <div className="py-4 text-[13px]" style={{ color: C.faint }}>No goals synced yet. Add goals to ClickUp list.</div>
              : <div className="space-y-5">
                  {goals.slice(0, 4).map((g) => (
                    <div key={g.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px]" style={{ color: C.text }}>{g.title}</span>
                        <span className="text-[12px]" style={{ color: C.faint }}>{g.progress}%</span>
                      </div>
                      <div className="mt-2 h-[4px]" style={{ background: C.lineSoft }}>
                        <div className="h-full" style={{ width: `${g.progress}%`, background: g.area === "Finance" ? C.oxide : C.moss }} />
                      </div>
                    </div>
                  ))}
                </div>}
          <Btn tone="secondary" className="mt-6" onClick={() => go("goals")}>Open goals</Btn>
        </Panel>
      </motion.div>
    </div>
  );
}
