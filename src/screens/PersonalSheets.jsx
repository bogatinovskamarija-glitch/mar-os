import { useState, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Save, Search, Copy, CalendarDays, ChevronRight } from "lucide-react";
import { C, num } from "../theme";
import { Label, Fig, Panel, Chip, Btn } from "../kit";
import { focusPresets, journalMoods, focusIntention, journalPromptCategories } from "../data";
import { habitsStore } from "../lib/storage";
import { supabase, getUid } from "../lib/supabase";
import { useHabits } from "../hooks/useHabits";
import { useGoals } from "../hooks/useGoals";
import { usePriorities } from "../hooks/usePriorities";
import { useFocus } from "../hooks/useFocus";
import { useJournal } from "../hooks/useJournal";

// ── Habits ───────────────────────────────────────────────────────────────────

function openYearPDF(activeNames, allNames, year) {
  const entries = habitsStore.allEntries(year);
  const dataMap = {};
  entries.forEach(({ date, data }) => { dataMap[date] = data ?? {}; });

  const totalDays = entries.length;
  const completeDays = entries.filter(({ data }) =>
    allNames.length > 0 && allNames.every((n) => data?.[n])
  ).length;
  const avgPct = totalDays
    ? Math.round(entries.reduce((s, { data }) => {
        const done = allNames.filter((n) => data?.[n]).length;
        return s + (allNames.length ? done / allNames.length : 0);
      }, 0) / totalDays * 100)
    : 0;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const yr = parseInt(year);

  // Build matrix rows: habits on Y, months on X
  // Each cell = mini day grid (7 cols, day squares) for that habit × month
  const matrixRows = allNames.map((name) => {
    const habitTotal = entries.filter(({ data }) => !!data?.[name]).length;
    const monthCells = MONTHS.map((_, mi) => {
      const pad = new Date(yr, mi, 1).getDay(); // Sun=0 offset
      const daysInMonth = new Date(yr, mi + 1, 0).getDate();
      const cells = Array(pad).fill(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        cells.push(dataMap[key]?.[name] ? "Y" : "N");
      }
      while (cells.length % 7 !== 0) cells.push(null);
      const squares = cells.map((c) =>
        c === null ? `<div class="ds e"></div>`
        : c === "Y"  ? `<div class="ds y"></div>`
        :               `<div class="ds n"></div>`
      ).join("");
      return `<td class="mc"><div class="mg">${squares}</div></td>`;
    }).join("");
    return `<tr>
      <td class="hl">${name}<br/><span class="hn">${habitTotal}d</span></td>
      ${monthCells}
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>MAR OS · ${year} Habit Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
  :root { --floor:#1A2118; --canopy:#2C372A; --raised:#232E21; --moss:#A9C4A1; --text:#D9E6D3; --dim:#8FA88A; --faint:#5A7058; --line:#2E3D2C; --white:#F0EDE6; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Montserrat',sans-serif; background:var(--floor); color:var(--text); padding:20px 24px; font-size:11px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .eyebrow { font-size:8px; font-weight:700; letter-spacing:0.26em; text-transform:uppercase; color:var(--dim); margin-bottom:5px; }
  h1 { font-size:26px; font-weight:900; letter-spacing:-0.04em; text-transform:uppercase; color:var(--white); border-bottom:1px solid var(--line); padding-bottom:10px; margin-bottom:10px; }
  h1 span { color:var(--moss); }
  .stats { display:flex; gap:0; margin-bottom:16px; border:1px solid var(--line); }
  .stat { flex:1; padding:8px 12px; border-right:1px solid var(--line); }
  .stat:last-child { border-right:none; }
  .stat-label { font-size:7px; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:var(--faint); }
  .stat-val { font-size:18px; font-weight:800; color:var(--white); margin-top:2px; }
  .section-label { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:var(--faint); margin-bottom:8px; }
  /* Matrix table */
  table.mx { border-collapse:collapse; width:100%; table-layout:fixed; }
  .mh { font-size:8px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:var(--dim); text-align:center; padding-bottom:5px; }
  .hl { width:88px; font-size:7px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--white); padding-right:8px; vertical-align:top; padding-top:4px; line-height:1.3; }
  .hn { font-size:6px; font-weight:600; color:var(--moss); letter-spacing:0.04em; display:block; margin-top:2px; }
  .mc { padding:3px 2px; vertical-align:top; border-left:1px solid var(--floor); }
  .mg { display:grid; grid-template-columns:repeat(7, 1fr); gap:1px; }
  .ds { aspect-ratio:1; }
  .ds.e { background:transparent; }
  .ds.y { background:var(--moss); }
  .ds.n { background:var(--canopy); }
  /* Row divider */
  tr { border-top:2px solid var(--floor); }
  .legend { display:flex; align-items:center; gap:6px; margin-top:10px; font-size:8px; color:var(--faint); font-weight:600; letter-spacing:0.08em; text-transform:uppercase; }
  .lc { width:10px; height:10px; display:inline-block; }
  .footer { margin-top:12px; font-size:8px; color:var(--faint); text-align:right; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; border-top:1px solid var(--line); padding-top:8px; }
  @media print { body { padding:10px 14px; } @page { margin:8mm; size:A4 landscape; } }
</style>
</head>
<body>
<p class="eyebrow">Maria Bogatinovska · Personal Operating System</p>
<h1>MAR<span>·</span>OS <span style="font-weight:300;font-size:0.5em;letter-spacing:0;color:var(--dim)">${year} Habit Tracker</span></h1>

<div class="stats">
  <div class="stat"><div class="stat-label">Habits</div><div class="stat-val">${allNames.length}</div></div>
  <div class="stat"><div class="stat-label">Days logged</div><div class="stat-val">${totalDays}</div></div>
  <div class="stat"><div class="stat-label">Perfect days</div><div class="stat-val">${completeDays}</div></div>
  <div class="stat"><div class="stat-label">Avg completion</div><div class="stat-val">${avgPct}%</div></div>
</div>

<p class="section-label">${allNames.length} habits × 12 months · each square = one day</p>
<table class="mx">
  <thead>
    <tr>
      <th class="hl" style="color:var(--faint);font-weight:700"></th>
      ${MONTHS.map((m) => `<th class="mh">${m}</th>`).join("")}
    </tr>
  </thead>
  <tbody>${matrixRows}</tbody>
</table>

<div class="legend">
  <span class="lc" style="background:var(--moss)"></span><span>Done</span>
  <span class="lc" style="background:var(--canopy);border:1px solid var(--line)"></span><span>Missed</span>
  <span class="lc" style="background:transparent"></span><span>No data</span>
</div>

<p class="footer">Generated ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} · MAR OS v2</p>
<script>window.onload = () => setTimeout(() => window.print(), 600);</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function exportHabitsCSV(allNames, prefix, label) {
  const entries = habitsStore.allEntries(prefix);
  if (!entries.length) { alert("No data found for that period."); return; }
  const header = ["Date", ...allNames, "Total"].join(",");
  const rows = entries.map(({ date, data }) => {
    const vals = allNames.map((n) => (data?.[n] ? 1 : 0));
    const total = vals.reduce((a, v) => a + v, 0);
    return [date, ...vals, total].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habits-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Habits() {
  const { weekData, toggle, names, notes, retiredNames, addHabit, retireHabit, restoreHabit } = useHabits();
  const [managing, setManaging] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  const allKnownNames = [...names, ...retiredNames];
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearPrefix = now.getFullYear().toString();
  const monthPrefix = now.toISOString().slice(0, 7);
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleAdd = () => {
    if (newHabit.trim()) { addHabit(newHabit); setNewHabit(""); }
  };

  return (
    <div className="space-y-7">
      <Panel
        title="Seven-day habit grid"
        action={
          <div className="flex items-center gap-2">
            <Btn tone="secondary" onClick={() => setManaging((v) => !v)}>
              {managing ? "Done" : "Manage"}
            </Btn>
          </div>
        }
        flush
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.faint }}>Habit</th>
                {weekData.map((day) => (
                  <th key={day.key} className="px-2 py-4 text-center text-[12px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: day.isToday ? C.moss : C.faint }}>{day.label}</th>
                ))}
                <th className="px-5 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.faint }}>
                  {managing ? "Action" : "Note"}
                </th>
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr key={name} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <td className="px-5 py-[16px] text-[15px]" style={{ color: C.text }}>{name}</td>
                  {weekData.map((day) => {
                    const checked = !!day.habits[name];
                    return (
                      <td key={day.key} className="px-2 py-[16px] text-center">
                        <button type="button"
                          onClick={() => day.isToday && toggle(name)}
                          aria-label={`${name} ${day.label}`}
                          className={`mx-auto grid h-[21px] w-[21px] place-items-center border ${day.isToday ? "cursor-pointer" : "cursor-default"}`}
                          style={{ borderColor: checked ? C.moss : C.ghost, background: checked ? C.moss : "transparent" }}>
                          {checked ? <span style={{ color: C.forest, fontSize: 14 }}>✓</span> : null}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-5 py-[16px] text-right text-[12px]">
                    {managing
                      ? <button type="button" onClick={() => retireHabit(name)}
                          className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.1em] hover:underline"
                          style={{ color: C.oxide }}>Retire</button>
                      : <span style={{ color: C.faint }}>{notes[name] ?? ""}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {managing && (
          <div className="border-t px-5 py-5 space-y-5" style={{ borderColor: C.line }}>
            <div>
              <Label>Add a new habit</Label>
              <div className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Cold shower, Read 20 pages"
                  className="flex-1 border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                  style={{ borderColor: C.moss, color: C.text }}
                />
                <Btn onClick={handleAdd}>Add</Btn>
              </div>
            </div>
            {retiredNames.length > 0 && (
              <div>
                <Label>Retired habits</Label>
                <div className="mt-2 space-y-1">
                  {retiredNames.map((name) => (
                    <div key={name} className="flex items-center justify-between gap-4 py-1.5">
                      <span className="text-[14px] line-through" style={{ color: C.ghost }}>{name}</span>
                      <button type="button" onClick={() => restoreHabit(name)}
                        className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: C.moss }}>Restore</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel title="Export habit data">
        <p className="text-[14px] font-light mb-5" style={{ color: C.dim }}>
          CSV is ready for Excel, Numbers, or Google Sheets. PDF shows a 52-week matrix — habits on columns, weeks on rows.
        </p>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: C.faint }}>Year</span>
          <button type="button"
            onClick={() => setExportYear((y) => y - 1)}
            className="cursor-pointer px-2 py-1 text-[14px] font-bold"
            style={{ color: C.moss, border: `1px solid ${C.line}`, background: C.raised }}>←</button>
          <span className="text-[18px] font-bold" style={{ color: C.white, minWidth: 50, textAlign: "center" }}>{exportYear}</span>
          <button type="button"
            onClick={() => setExportYear((y) => Math.min(currentYear, y + 1))}
            disabled={exportYear >= currentYear}
            className="cursor-pointer px-2 py-1 text-[14px] font-bold disabled:opacity-30"
            style={{ color: C.moss, border: `1px solid ${C.line}`, background: C.raised }}>→</button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn tone="secondary" onClick={() => exportHabitsCSV(allKnownNames, monthPrefix, monthLabel)}>
            {monthLabel} CSV
          </Btn>
          <Btn tone="secondary" onClick={() => exportHabitsCSV(allKnownNames, exportYear.toString(), exportYear.toString())}>
            {exportYear} CSV
          </Btn>
          <Btn tone="secondary" onClick={() => exportHabitsCSV(allKnownNames, null, "all-time")}>
            All time CSV
          </Btn>
          <Btn tone="secondary" onClick={() => openYearPDF(names, allKnownNames, exportYear.toString())}>
            {exportYear} PDF
          </Btn>
        </div>
        <p className="mt-4 text-[12px] font-light" style={{ color: C.faint }}>
          Retired habits appear as columns in exports so historical data stays complete.
        </p>
      </Panel>
    </div>
  );
}

// ── Goals ────────────────────────────────────────────────────────────────────

export function Goals() {
  const { goals, loading: gLoading, error: gError } = useGoals();
  const { priorities, loading: pLoading } = usePriorities();

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr]">
      <Panel title="Goals connected to ClickUp" action={<Chip tone="keep">Live roll-up</Chip>} flush>
        {gLoading && <div className="px-5 py-10 text-[13px]" style={{ color: C.faint }}>Fetching goals from ClickUp…</div>}
        {gError && <div className="px-5 py-6 text-[13px]" style={{ color: C.oxide }}>{gError}</div>}
        {!gLoading && goals.map((g) => {
          const priColor = { urgent: C.oxide, high: "#C9963A", normal: C.moss, low: C.ghost }[g.priority] ?? C.ghost;
          return (
            <div key={g.id} className="px-5 py-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-[2px] border"
                      style={{ color: priColor, borderColor: priColor }}>
                      {g.priority}
                    </span>
                    {g.area && g.area !== "Other" && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.faint }}>
                        {g.area}
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-semibold leading-snug" style={{ color: C.text }}>{g.title}</div>
                  <div className="mt-1 text-[12px]" style={{ color: C.faint }}>
                    {g.due ? `Due ${g.due}` : "No due date"}
                  </div>
                </div>
                <Fig size={22} color={g.progress >= 70 ? C.moss : g.progress > 0 ? C.text : C.ghost}>
                  {g.progress}%
                </Fig>
              </div>
              <div className="mt-3 h-[4px]" style={{ background: C.lineSoft }}>
                <div className="h-full transition-all" style={{
                  width: `${g.progress}%`,
                  background: g.area === "Finance" ? C.oxide : priColor,
                }} />
              </div>
              {g.why && <p className="mt-3 text-[13px] font-light" style={{ color: C.dim }}>{g.why}</p>}
            </div>
          );
        })}
        {!gLoading && goals.length === 0 && !gError && (
          <div className="px-5 py-10">
            <div className="text-[14px] font-semibold" style={{ color: C.dim }}>No goals synced</div>
            <div className="mt-2 text-[13px] font-light" style={{ color: C.faint }}>
              Add your VITE_CLICKUP_TOKEN to .env to connect.
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Today's priorities">
        <div className="space-y-1">
          {pLoading && <div className="py-4 text-[13px]" style={{ color: C.faint }}>Fetching…</div>}
          {!pLoading && priorities.length === 0 && (
            <div className="py-4 text-[13px]" style={{ color: C.faint }}>Nothing due today or overdue.</div>
          )}
          {!pLoading && priorities.map((p, i) => (
            <a key={p.id} href={p.url ?? "#"} target="_blank" rel="noreferrer"
              className="flex gap-4 border-b py-4 no-underline hover:bg-[#2C372A] px-1"
              style={{ borderColor: C.lineSoft }}>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: C.ghost }}>0{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] leading-snug" style={{ color: C.text }}>{p.title}</div>
                <div className="mt-1 text-[12px]" style={{ color: C.faint }}>{p.space ?? "ClickUp"} · {p.due ?? "Due today"}</div>
              </div>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── Playlists (YouTube embed, editable, saved to localStorage) ───────────────

const PLAYLIST_STORAGE_KEY = "mar-os-playlists";

const DEFAULT_PLAYLISTS = [
  { name: "Focus music", url: "#" },
  { name: "Cardio / workout", url: "#" },
  { name: "Morning start", url: "#" },
  { name: "Chill studio", url: "#" },
];

function loadPlaylists() {
  try {
    const s = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function getYouTubeEmbed(url) {
  if (!url || url === "#") return null;
  try {
    const u = new URL(url);
    const list = u.searchParams.get("list");
    if (list) return `https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1`;
    const v = u.searchParams.get("v") || (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
    if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
  } catch {}
  return null;
}

function PlaylistsPanel() {
  const [items, setItems] = useState(() => loadPlaylists() ?? DEFAULT_PLAYLISTS);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(null); // index of playing playlist

  const startEdit = (i) => { setEditing(i); setDraft(items[i].url === "#" ? "" : items[i].url); };
  const saveEdit = (i) => {
    const updated = items.map((p, idx) => idx === i ? { ...p, url: draft.trim() || "#" } : p);
    setItems(updated);
    try { localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated)); } catch {}
    const uid = getUid();
    if (uid) {
      supabase.from("mar_os_settings")
        .upsert({ user_id: uid, key: "playlists", value: updated }, { onConflict: "user_id,key" })
        .then(() => {});
    }
    setEditing(null);
  };

  const playOrStop = (i) => {
    if (!getYouTubeEmbed(items[i].url)) return;
    setActive((prev) => (prev === i ? null : i));
  };

  return (
    <Panel title="Music">
      <div className="space-y-0">
        {items.map((p, i) => {
          const embedUrl = getYouTubeEmbed(p.url);
          const isPlaying = active === i;
          return (
            <div key={i} className="border-b" style={{ borderColor: C.lineSoft }}>
              {editing === i
                ? <div className="flex items-center gap-2 px-2 py-2">
                    <input
                      autoFocus
                      type="url"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(i); if (e.key === "Escape") setEditing(null); }}
                      placeholder="Paste YouTube playlist or video URL"
                      className="flex-1 border bg-transparent px-3 py-2 text-[13px] font-light outline-none"
                      style={{ borderColor: C.moss, color: C.text }}
                    />
                    <button type="button" onClick={() => saveEdit(i)}
                      className="px-3 py-2 text-[12px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: C.moss }}>Save</button>
                    <button type="button" onClick={() => setEditing(null)}
                      className="px-2 py-2 text-[12px]" style={{ color: C.faint }}>✕</button>
                  </div>
                : <div className="flex items-center gap-3 py-3 px-1">
                    <button type="button" onClick={() => playOrStop(i)} disabled={!embedUrl}
                      className={`grid h-8 w-8 shrink-0 place-items-center border transition-colors ${embedUrl ? "cursor-pointer" : "cursor-default opacity-30"}`}
                      style={{ borderColor: isPlaying ? C.moss : C.line, background: isPlaying ? C.moss : "transparent" }}>
                      {isPlaying
                        ? <span style={{ color: C.forest, fontSize: 14, fontWeight: 700 }}>■</span>
                        : <Play size={13} color={embedUrl ? C.moss : C.ghost} />}
                    </button>
                    <span className="flex-1 text-[14px]" style={{ color: embedUrl ? C.text : C.dim }}>{p.name}</span>
                    <button type="button" onClick={() => startEdit(i)}
                      className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: C.faint }}>
                      {p.url === "#" ? "Add link" : "Edit"}
                    </button>
                  </div>}
              {isPlaying && embedUrl && (
                <div className="w-full" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={p.name}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] font-light" style={{ color: C.faint }}>
        Click "Add link" to paste a YouTube playlist URL, then ▶ to play it here.
      </p>
    </Panel>
  );
}

// ── Focus ────────────────────────────────────────────────────────────────────

export function Focus() {
  const { sessions, logSession } = useFocus();
  const [preset, setPreset] = useState(1);
  const [secs, setSecs] = useState(focusPresets[1].minutes * 60);
  const [run, setRun] = useState(false);
  const [target, setTarget] = useState("");
  const [doneMeans, setDoneMeans] = useState("");
  const [recovery, setRecovery] = useState(focusIntention.recoveryOptions[0]);
  const [ctx, setCtx] = useState("Firm");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setSecs((s) => {
      if (s <= 1) {
        setRun(false);
        setStarted(false);
        logSession({ target, mins: focusPresets[preset].minutes, done: doneMeans || "Completed", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
        return 0;
      }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [run]);

  const mins = String(Math.floor(secs / 60)).padStart(2, "0");
  const sec = String(secs % 60).padStart(2, "0");
  const ready = target.trim().length > 2;

  return (
    <div className="space-y-7">
      <div className="grid gap-7 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-7">
          <Panel title="Focus timer">
            <div className="py-10 text-center">
              {started && target && (
                <div className="mb-6 px-8">
                  <p className="text-[13px] font-light leading-[1.5]" style={{ color: C.dim }}>You are working on</p>
                  <p className="mt-2 text-[16px] font-semibold" style={{ color: C.moss }}>{target}</p>
                  {doneMeans && <p className="mt-1 text-[12px]" style={{ color: C.faint }}>Done means: {doneMeans}</p>}
                </div>
              )}
              <Label>Current session · {focusPresets[preset].label}</Label>
              <div className="mt-8"><Fig size={92} color={run ? C.moss : C.text}>{mins}:{sec}</Fig></div>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {!started
                  ? <Btn onClick={() => { if (ready) { setStarted(true); setRun(true); } }} disabled={!ready}><Play size={15} /> Start</Btn>
                  : <>
                      <Btn onClick={() => setRun((v) => !v)}>{run ? <Pause size={15} /> : <Play size={15} />} {run ? "Pause" : "Resume"}</Btn>
                      <Btn tone="secondary" onClick={() => { setRun(false); setStarted(false); setSecs(focusPresets[preset].minutes * 60); }}>
                        <RotateCcw size={14} /> End
                      </Btn>
                    </>}
              </div>
              {!started && !ready && (
                <p className="mt-4 text-[12px]" style={{ color: C.faint }}>
                  Type your focus target on the right to unlock Start
                </p>
              )}
              {started && <p className="mt-5 text-[12px]" style={{ color: C.faint }}>If stuck: {recovery}</p>}
            </div>
          </Panel>
          <Panel title="Presets">
            <div className="grid grid-cols-2 gap-2">
              {focusPresets.map((p, i) => (
                <button key={p.label} type="button"
                  onClick={() => { setPreset(i); setRun(false); setSecs(p.minutes * 60); }}
                  className="cursor-pointer border px-4 py-4 text-left"
                  style={{ borderColor: i === preset ? C.moss : C.line, background: i === preset ? C.canopy : "transparent", color: C.text }}>
                  <span className="block text-[14px] font-semibold">{p.label}</span>
                  <span className="mt-1 block text-[12px]" style={{ color: C.dim }}>{p.minutes} min</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-7">
          {!started
            ? <Panel title="Set the target">
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {focusIntention.contexts.map((c) => (
                      <button key={c} type="button" onClick={() => setCtx(c)}
                        className="cursor-pointer border px-3 py-[7px] text-[12px] font-semibold uppercase tracking-[0.1em]"
                        style={{ borderColor: ctx === c ? C.moss : C.line, background: ctx === c ? C.canopy : "transparent", color: ctx === c ? C.white : C.dim }}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label>One thing this block is for</Label>
                    <input type="text" value={target} onChange={(e) => setTarget(e.target.value)}
                      placeholder="Redline A-201 through A-208 stair details"
                      className="mt-2.5 w-full border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                      style={{ borderColor: C.line, color: C.text }} />
                  </div>
                  <div>
                    <Label>By the end, I will have</Label>
                    <input type="text" value={doneMeans} onChange={(e) => setDoneMeans(e.target.value)}
                      placeholder="A marked-up PDF and three consultant questions"
                      className="mt-2.5 w-full border bg-transparent px-4 py-3 text-[15px] font-light outline-none"
                      style={{ borderColor: C.line, color: C.text }} />
                  </div>
                  <div>
                    <Label>If I get stuck or distracted</Label>
                    <div className="mt-2.5 space-y-1.5">
                      {focusIntention.recoveryOptions.map((r) => (
                        <button key={r} type="button" onClick={() => setRecovery(r)}
                          className="w-full cursor-pointer border px-4 py-[10px] text-left text-[13px] font-light transition-colors"
                          style={{ borderColor: recovery === r ? C.moss : C.lineSoft, background: recovery === r ? "rgba(169,196,161,.08)" : "transparent", color: recovery === r ? C.text : C.dim }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            : <Panel title="Session active">
                <div className="px-5 py-5">
                  <p className="text-[14px] font-light" style={{ color: C.dim }}>
                    Timer is running. The target stays visible above.
                  </p>
                </div>
              </Panel>}

          <PlaylistsPanel />

          {sessions.length > 0 && (
            <Panel title="Recent sessions" flush>
              <div className="divide-y" style={{ borderColor: C.lineSoft }}>
                {sessions.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-[13px]" style={{ borderColor: C.lineSoft }}>
                    <div className="w-[62px] shrink-0"><Chip tone="keep">{s.mins}m</Chip></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium" style={{ color: C.text }}>{s.target}</div>
                      <div className="mt-1 truncate text-[12px]" style={{ color: C.faint }}>{s.date} · {s.done}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Journal ──────────────────────────────────────────────────────────────────

export function Journal() {
  const { text, setText, mood, setMood, words, savedTime, save, stats, todayDate, syncStatus } = useJournal();
  const [catIdx, setCatIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [search, setSearch] = useState("");
  const cat = journalPromptCategories[catIdx];

  return (
    <div className="space-y-7">
      <Panel title="Today's entry" action={<Chip tone="keep">Saved locally</Chip>}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays size={17} color={C.moss} />
            <span className="text-[14px]" style={{ ...num, color: C.dim }}>{todayDate}</span>
          </div>
          <span className="text-[12px]" style={{ color: C.faint }}>
            {words} words{savedTime ? ` · saved ${savedTime}` : ""}
            {syncStatus === "syncing" && " · syncing to ClickUp…"}
            {syncStatus === "synced" && " · ✓ ClickUp updated"}
            {syncStatus?.startsWith("error:") && ` · ClickUp sync failed: ${syncStatus.slice(6)}`}
          </span>
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="mt-5 min-h-[280px] w-full resize-y border p-5 text-[16px] font-light leading-[1.7] outline-none"
          style={{ background: "rgba(44, 55, 42, 0.5)", backdropFilter: "blur(8px)", borderColor: C.line, color: C.text }}
          placeholder="What is actually going on today. Talk it out, no need to make it tidy." />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {journalMoods.map((m) => (
            <button key={m} type="button" onClick={() => setMood(mood === m ? null : m)}
              className="cursor-pointer border px-[14px] py-[8px] text-[13px] font-medium transition-colors"
              style={{ borderColor: mood === m ? C.moss : C.line, background: mood === m ? C.canopy : "transparent", color: mood === m ? C.white : C.dim }}>
              {m}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[13px]" style={{ color: C.faint }}>{words} words</span>
          <Btn tone="secondary" onClick={save}><Save size={14} /> Save entry</Btn>
        </div>
      </Panel>

      <div className="grid gap-px sm:grid-cols-3" style={{ background: C.line, border: `1px solid ${C.line}` }}>
        {[
          { l: "Total entries", v: stats.total },
          { l: "Day streak", v: stats.streak },
          { l: "This month", v: stats.thisMonth },
        ].map((s) => (
          <div key={s.l} className="px-5 py-5 text-center" style={{ background: "rgba(36, 46, 34, 0.7)", backdropFilter: "blur(12px)" }}>
            <Fig size={34} color={C.text}>{s.v}</Fig>
            <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.faint }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.ghost }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your entries"
            className="w-full border bg-transparent py-3 pl-11 pr-4 text-[15px] font-light outline-none"
            style={{ borderColor: C.line, color: C.text }} />
        </div>
        <Btn tone="secondary"><Copy size={14} /> Copy for chapters</Btn>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_1fr]">
        <Panel title="Journal prompts" action={<Chip tone="neutral">{cat.group}</Chip>}>
          <p className="text-[17px] font-light leading-[1.55]" style={{ color: C.text }}>{cat.prompts[promptIdx]}</p>
          <div className="mt-6 flex items-center gap-3">
            <Btn tone="secondary" onClick={() => setPromptIdx((promptIdx + 1) % cat.prompts.length)}>
              <ChevronRight size={14} /> Next prompt
            </Btn>
            <button type="button"
              onClick={() => { setCatIdx((catIdx + 1) % journalPromptCategories.length); setPromptIdx(0); }}
              className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.moss }}>
              Switch to {journalPromptCategories[(catIdx + 1) % journalPromptCategories.length].group}
            </button>
          </div>
        </Panel>
        <Panel title="Prompt categories">
          <div className="space-y-1">
            {journalPromptCategories.map((c, i) => (
              <button key={c.group} type="button" onClick={() => { setCatIdx(i); setPromptIdx(0); }}
                className="flex w-full cursor-pointer items-center justify-between border-b py-3 text-left"
                style={{ borderColor: C.lineSoft }}>
                <span className="text-[14px] font-medium" style={{ color: i === catIdx ? C.moss : C.text }}>{c.group}</span>
                <span className="text-[12px]" style={{ color: C.ghost }}>{c.prompts.length} prompts</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
