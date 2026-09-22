const BASE = "https://api.clickup.com/api/v2";

const WORKSPACE = "9006080499";
const GOALS_LIST = "901312614793";
const HABIT_LOG_LIST = "901329140004";
const PRIORITY_SPACES = ["90060197380", "90060197389"]; // Personal + Bogat A&D

const PROGRESS_FIELD = "5d7ef7bf-df61-44c4-9826-ff82a385a8b3";
const AREA_FIELD = "8e93d3f2-2695-40bb-8b74-19b528e3452b";
const AREA_MAP = {
  "88886779-f1ab-4807-b53e-963456a9def8": "Licensure",
  "e254fc7f-23b3-48f2-8178-98e174450189": "Credentials",
  "0929e517-beab-4670-bb68-5bbb9e32890f": "Finance",
  "98250056-a4ed-44ec-bf55-090e31a69f86": "Portfolio",
  "0928f39e-c48b-4b64-9466-9244dbc06138": "Brand",
  "b8a39920-4add-4642-bbfc-185c289200d4": "Health",
  "65115b50-da9d-4e0b-9fdd-710a69ef0f65": "Family",
};

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
export async function fetchGoals() {
  const data = await cu(`/list/${GOALS_LIST}/task?subtasks=false&include_closed=false`);

  return (data.tasks ?? [])
    .filter((t) => !["canceled", "complete"].includes(t.status?.status?.toLowerCase()))
    .map((t) => {
      const fields = t.custom_fields ?? [];
      const pf = fields.find((f) => f.id === PROGRESS_FIELD);
      const af = fields.find((f) => f.id === AREA_FIELD);
      const raw = pf?.value;
      const progress =
        typeof raw === "number" ? Math.round(raw) :
        typeof raw === "object" && raw !== null ? Math.round(raw.current ?? 0) :
        parseInt(raw) || 0;
      const areaVal = af?.value;
      const area = AREA_MAP[areaVal] ?? "Other";

      return {
        id: t.id,
        title: t.name,
        area,
        progress,
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
      const order = ["Licensure","Credentials","Health","Finance","Portfolio","Brand","Family","Other"];
      return order.indexOf(a.area) - order.indexOf(b.area);
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
