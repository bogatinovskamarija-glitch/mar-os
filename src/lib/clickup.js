const BASE = "https://api.clickup.com/api/v2";

const WORKSPACE = "9006080499";
const GOALS_LIST = "901312614793";
const HABIT_LOG_LIST = "901329140004";
const PRIORITY_SPACES = ["90060197380", "90060197389"]; // Personal + Bogat A&D
const JOURNAL_DOC_ID = "8ccvrfk-36973";
const JOURNAL_2026_PAGE_ID = "8ccvrfk-48613";

function tok() {
  return import.meta.env.VITE_CLICKUP_TOKEN ?? "";
}

async function cu(path, opts = {}) {
  const t = tok();
  if (!t) throw new Error("VITE_CLICKUP_TOKEN not set");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: t, "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`ClickUp ${res.status}: ${path}`);
  return res.json();
}

// ── Goals ────────────────────────────────────────────────────────────────────
const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export async function fetchGoals() {
  const data = await cu(`/list/${GOALS_LIST}/task?subtasks=false&include_closed=false`);

  return (data.tasks ?? [])
    .filter((t) => !["canceled", "complete"].includes(t.status?.status?.toLowerCase()))
    .map((t) => {
      const fields = t.custom_fields ?? [];

      // Area: find by field name, then resolve option label from type_config
      const areaField = fields.find((f) => f.name?.toLowerCase() === "goal area");
      let area = "Other";
      if (areaField) {
        const optId = areaField.value;
        const opt = (areaField.type_config?.options ?? []).find((o) => o.id === optId);
        area = opt?.name ?? (typeof optId === "string" && !optId.includes("-") ? optId : "Other");
      }

      // Progress: percent_done is the reliable source; fall back to any numeric custom field
      let progress = typeof t.percent_done === "number" ? Math.round(t.percent_done) : 0;
      if (!progress) {
        const numField = fields.find(
          (f) => ["number", "percent"].includes(f.type) &&
                 f.name?.toLowerCase().includes("progress") &&
                 f.value !== undefined && f.value !== null
        );
        if (numField) progress = Math.round(Number(numField.value)) || 0;
      }

      return {
        id: t.id,
        title: t.name,
        area,
        progress,
        priority: t.priority?.priority ?? "normal",
        priorityColor: t.priority?.color ?? null,
        due: t.due_date
          ? new Date(parseInt(t.due_date)).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })
          : null,
        why: (t.description ?? "").slice(0, 200),
        url: t.url,
      };
    })
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });
}

// ── Priorities (tasks due today or overdue, across Personal + Bogat A&D) ─────
export async function fetchPriorities() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const ts = end.getTime();

  const params = PRIORITY_SPACES.map((id) => `space_ids[]=${id}`).join("&");
  const data = await cu(
    `/team/${WORKSPACE}/task?${params}&include_closed=false&due_date_lte=${ts}&page=0&order_by=due_date&subtasks=false`
  );

  const today = new Date();
  return (data.tasks ?? [])
    .filter((t) => !["canceled", "complete"].includes(t.status?.status?.toLowerCase()))
    .slice(0, 5)
    .map((t) => {
      const d = t.due_date ? new Date(parseInt(t.due_date)) : null;
      const isToday = d && d.toDateString() === today.toDateString();
      return {
        id: t.id,
        title: t.name,
        space: t.list?.name ?? t.space?.name ?? "Workspace",
        due: isToday ? "Today" : "Overdue",
        url: t.url,
      };
    });
}

// ── Habit Log (one ClickUp task per day, description = JSON) ────────────────
export async function fetchHabitDay(dateKey) {
  try {
    const data = await cu(`/list/${HABIT_LOG_LIST}/task?include_closed=false`);
    const task = (data.tasks ?? []).find((t) => t.name === dateKey);
    if (!task?.description) return null;
    return JSON.parse(task.description);
  } catch {
    return null;
  }
}

export async function writeHabitDay(dateKey, habitData) {
  try {
    const data = await cu(`/list/${HABIT_LOG_LIST}/task?include_closed=false`);
    const task = (data.tasks ?? []).find((t) => t.name === dateKey);
    const body = JSON.stringify({ description: JSON.stringify(habitData) });
    if (task) {
      await cu(`/task/${task.id}`, { method: "PUT", body });
    } else {
      await cu(`/list/${HABIT_LOG_LIST}/task`, {
        method: "POST",
        body: JSON.stringify({ name: dateKey, description: JSON.stringify(habitData) }),
      });
    }
  } catch {
    // ClickUp sync is best-effort; localStorage is source of truth
  }
}

// ── Journal (syncs to ClickUp doc "Journal" › 2026 › [date]) ────────────────
export async function writeJournalEntry(dateLabel, entry) {
  try {
    const content = [
      entry.mood ? `**Mood:** ${entry.mood}` : null,
      "",
      entry.text,
    ].filter((l) => l !== null).join("\n");

    // List existing pages to find if today already has one
    const pagesRes = await fetch(
      `${BASE}/workspaces/${WORKSPACE}/docs/${JOURNAL_DOC_ID}/pages`,
      { headers: { Authorization: tok(), "Content-Type": "application/json" } }
    );
    const pages = pagesRes.ok ? (await pagesRes.json()).pages ?? [] : [];
    const existing = pages.find(
      (p) => p.name === dateLabel && p.parent_page_id === JOURNAL_2026_PAGE_ID
    );

    const bodyJson = JSON.stringify({
      name: dateLabel,
      content,
      content_format: "text/md",
      parent_page_id: JOURNAL_2026_PAGE_ID,
    });

    if (existing) {
      await fetch(
        `${BASE}/workspaces/${WORKSPACE}/docs/${JOURNAL_DOC_ID}/pages/${existing.id}`,
        { method: "PUT", headers: { Authorization: tok(), "Content-Type": "application/json" }, body: bodyJson }
      );
    } else {
      await fetch(
        `${BASE}/workspaces/${WORKSPACE}/docs/${JOURNAL_DOC_ID}/pages`,
        { method: "POST", headers: { Authorization: tok(), "Content-Type": "application/json" }, body: bodyJson }
      );
    }
  } catch {
    // Best-effort; localStorage is source of truth
  }
}
