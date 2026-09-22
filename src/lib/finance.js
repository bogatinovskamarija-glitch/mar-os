import Papa from "papaparse";

// ── Rocket Money category → app envelope bucket ──────────────────────────────
const RM_BUCKET = {
  "Bills & Utilities":    "Housing & utilities",
  "Groceries":            "Groceries & household",
  "Subscriptions":        "Subscriptions",
  "Software & Tech":      "Subscriptions",
  "Auto & Transport":     "Car, gas & tolls",
  "Medical":              "Health & fitness",
  "Health & Wellness":    "Health & fitness",
  "Pets":                 "Canelo",
  "Loan Payment":         "Student loans",
  // all others fall through to "Personal & misc"
};

// These are internal movements — not expenses, not income
const RM_SKIP = new Set([
  "Credit Card Payment",
  "Credit Card Payment Expense",
  "Internal Transfers",
  "Savings Transfer",
  "Returned Payment",
]);

// ── Category rules for raw bank CSVs (Chase / Amex) ──────────────────────────
const CATS = [
  {
    name: "Housing & utilities", short: "Housing", shared: true,
    kw: ["rent", "fpl", "florida power", "electric", "water", "sewer", "internet", "spectrum", "att ", "comcast", "xfinity"],
  },
  {
    name: "Groceries & household", short: "Groceries", shared: true,
    kw: ["publix", "walmart", "target", "costco", "whole foods", "trader joe", "aldi", "kroger", "winn-dixie", "amazon fresh", "fresh market"],
  },
  {
    name: "Subscriptions", short: "Subs", shared: false,
    kw: ["netflix", "spotify", "adobe", "apple.com/bill", "google one", "amazon prime", "hulu", "youtube premium", "clickup", "squarespace", "dropbox", "icloud", "canva", "claude", "chatgpt", "openai", "supabase", "audible", "kindle", "ncarb", "heygen", "rocket money"],
  },
  {
    name: "Car, gas & tolls", short: "Car & gas", shared: false,
    kw: ["shell", "chevron", "bp ", "exxon", "mobil", "sunoco", "wawa", "circle k", "sunpass", "e-pass", "tollway", " toll ", "geico", "progressive insurance", "state farm"],
  },
  {
    name: "Health & fitness", short: "Health", shared: false,
    kw: ["gym", "la fitness", "planet fitness", "equinox", "cvs", "walgreens", "pharmacy", "doctor", "dental", "vision", "urgent care", "anytime fitness"],
  },
  {
    name: "Canelo", short: "Canelo", shared: true,
    kw: ["petsmart", "petco", "banfield", "veterinar", "pet supply", "chewy", "animal hospital", "vet "],
  },
  {
    name: "Student loans", short: "Loans", shared: false,
    kw: ["navient", "sallie mae", "mohela", "nelnet", "fedloan", "great lakes", "student loan", "dept of ed"],
  },
];

const TRUCKING_KW = ["carat expedited", "pro freight", "fuel advance", "ifta", "commercial insurance", "permits"];

function categorize(desc) {
  const d = desc.toLowerCase();
  if (TRUCKING_KW.some((kw) => d.includes(kw))) return "__trucking__";
  for (const c of CATS) {
    if (c.kw.some((kw) => d.includes(kw))) return c.name;
  }
  return "Personal & misc";
}

// ── Format detection ─────────────────────────────────────────────────────────
function detectFormat(headers) {
  const h = headers.map((s) => s.toLowerCase().trim());
  if (h.includes("institution name")) return "rocketmoney";
  if (h.includes("transaction date")) return "chase";
  if (h.includes("date") && h.includes("amount") && h.some((x) => x.includes("extended"))) return "amex";
  return "chase";
}

// ── Account normalization ────────────────────────────────────────────────────
function normalizeAccount(accountName, institutionName) {
  const acct = (accountName ?? "").toLowerCase();
  const inst = (institutionName ?? "").toLowerCase();

  if (inst.includes("american express")) {
    if (acct.includes("platinum")) return "Amex · Platinum";
    if (acct.includes("blue cash")) return "Amex · Blue Cash";
    if (acct.includes("gold")) return "Amex · Gold";
    // old accounts named "MARIJA BOGATINOVSKA -81001" / "-91001"
    if (acct.includes("bogatinovska") || acct.includes("marija")) return "Amex · card";
    return "Amex · card";
  }
  if (inst.includes("bank of america")) {
    return (acct.includes("sav") || acct.includes("advantage")) ? "BofA · savings" : "BofA · checking";
  }
  if (inst.includes("citi")) {
    if (acct.includes("strata")) return "Citi · Strata";
    if (acct.includes("diamond")) return "Citi · Diamond";
    return "Citi · card";
  }
  if (inst.includes("discover")) return "Discover it";

  return accountName ?? "Unknown";
}

// ── Rocket Money row parser ───────────────────────────────────────────────────
// RM sign convention: positive = expense (outflow), negative = income (inflow)
// We normalise to standard: negative = expense, positive = income.
function parseRocketMoneyRows(rows) {
  return rows.flatMap((row) => {
    const rmCat = (row["Category"] ?? "").trim();
    if (RM_SKIP.has(rmCat)) return [];
    if ((row["Ignored From"] ?? "").trim()) return [];

    const date = (row["Date"] ?? "").trim();
    const rmAmount = parseFloat(row["Amount"] ?? "0");
    if (!date || isNaN(rmAmount) || rmAmount === 0) return [];

    const desc = ((row["Custom Name"] ?? "").trim() || (row["Name"] ?? "").trim())
      .replace(/\s+/g, " ");
    if (!desc) return [];

    const account = normalizeAccount(row["Account Name"], row["Institution Name"]);

    // Negate: RM positive (expense) → negative; RM negative (income) → positive
    const amount = -rmAmount;

    const isTrucking = rmCat === "Carat Expedited";
    const isIncome = amount > 0 && rmCat === "Income";
    const appCategory = isTrucking
      ? "__trucking__"
      : isIncome
        ? "__income__"
        : (RM_BUCKET[rmCat] ?? "Personal & misc");

    return [{ date, description: desc, amount, account, category: appCategory, trucking: isTrucking }];
  });
}

// ── Chase / Amex row parser ───────────────────────────────────────────────────
function parseOtherRows(rows, fmt, filename) {
  const account = guessAccount(filename);
  return rows
    .map((row) => {
      let date, desc, amount;
      if (fmt === "amex") {
        date = row["Date"] ?? row["date"] ?? "";
        desc = row["Description"] ?? row["description"] ?? "";
        amount = -(parseFloat(row["Amount"] ?? row["amount"] ?? "0"));
      } else {
        date = row["Transaction Date"] ?? row["Date"] ?? row["date"] ?? "";
        desc = row["Description"] ?? row["description"] ?? "";
        amount = parseFloat(row["Amount"] ?? row["amount"] ?? "0");
      }
      return { date, description: desc.trim(), amount: isNaN(amount) ? 0 : amount, account };
    })
    .filter((r) => r.description && r.amount !== 0 && r.date)
    .map((r) => ({ ...r, category: categorize(r.description), trucking: categorize(r.description) === "__trucking__" }));
}

function guessAccount(filename) {
  const f = filename.toLowerCase();
  if (f.includes("saving")) return "BofA · savings";
  if (f.includes("checking") || f.includes("bofa") || f.includes("boa")) return "BofA · checking";
  if (f.includes("platinum")) return "Amex · Platinum";
  if (f.includes("amex") || f.includes("gold")) return "Amex · Gold";
  if (f.includes("citi")) return "Citi · Strata";
  if (f.includes("discover")) return "Discover it";
  return "BofA · checking";
}

// ── Main parse entry point ────────────────────────────────────────────────────
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length && data.length === 0) { reject(new Error(errors[0].message)); return; }
        const headers = Object.keys(data[0] ?? {});
        const fmt = detectFormat(headers);
        const rows = fmt === "rocketmoney"
          ? parseRocketMoneyRows(data)
          : parseOtherRows(data, fmt, file.name);
        resolve(rows);
      },
      error: reject,
    });
  });
}

// ── Build finance state from all imported transactions ────────────────────────
export function buildFinanceState(allTransactions) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = allTransactions.filter((t) => {
    const d = new Date(t.date);
    return !isNaN(d) && d >= firstOfMonth;
  });

  // Envelope: personal spending this month (category is an app bucket, not __trucking__/__income__)
  const envelopeMap = {};
  for (const c of CATS) {
    envelopeMap[c.name] = { cat: c.name, short: c.short, shared: c.shared, plan: 0, actual: 0, txns: 0 };
  }
  envelopeMap["Personal & misc"] = { cat: "Personal & misc", short: "Personal", shared: false, plan: 0, actual: 0, txns: 0 };

  for (const t of thisMonth) {
    if (t.trucking || t.category === "__income__" || t.amount >= 0) continue;
    const cat = t.category && envelopeMap[t.category] ? t.category : "Personal & misc";
    envelopeMap[cat].actual = +(envelopeMap[cat].actual + Math.abs(t.amount)).toFixed(2);
    envelopeMap[cat].txns++;
  }

  // Inflow: positive amounts this month from non-trucking sources
  const inflowMap = {};
  for (const t of thisMonth.filter((t) => t.amount > 0 && !t.trucking)) {
    const key = t.description.slice(0, 35);
    if (!inflowMap[key]) {
      inflowMap[key] = { source: t.description, amount: 0, kind: guessInflowKind(t.description), note: "" };
    }
    inflowMap[key].amount = +(inflowMap[key].amount + t.amount).toFixed(2);
  }

  // Trucking float: Carat Expedited expenses this month
  const truckingTxns = thisMonth.filter((t) => t.trucking && t.amount < 0);
  const cantileverFronted = truckingTxns.map((t) => ({
    item: t.description,
    short: t.description.slice(0, 18),
    amount: Math.abs(t.amount),
    date: t.date,
    entity: t.description.toLowerCase().includes("carat") ? "Carat Expedited" : "Pro Freight",
    back: 0,
  }));

  // Account balances: running sum over all imported transactions
  // Convention after normalisation: negative = expense, positive = income
  // balance = sum(amounts) per account → positive for asset accounts, negative for credit owed
  const ACCOUNT_META = {
    "BofA · checking":  { kind: "checking" },
    "BofA · savings":   { kind: "savings" },
    "Amex · Platinum":  { kind: "credit", limit: 25000 },
    "Amex · Blue Cash": { kind: "credit", limit: 10000 },
    "Amex · Gold":      { kind: "credit", limit: 15000 },
    "Amex · card":      { kind: "credit", limit: 10000 },
    "Citi · Strata":    { kind: "credit", limit: 9000 },
    "Citi · Diamond":   { kind: "credit", limit: 6000 },
    "Discover it":      { kind: "credit", limit: 6500 },
  };

  const accountTotals = {};
  for (const t of allTransactions) {
    if (!accountTotals[t.account]) {
      const meta = ACCOUNT_META[t.account] ?? { kind: "checking" };
      accountTotals[t.account] = { name: t.account, balance: 0, ...meta };
    }
    accountTotals[t.account].balance = +(accountTotals[t.account].balance + t.amount).toFixed(2);
  }

  return {
    envelope: Object.values(envelopeMap),
    inflow: Object.values(inflowMap).filter((r) => r.amount > 0),
    cantilever: {
      fronted: cantileverFronted,
      priorBalance: 0,
      ageBuckets: [
        { label: "0–30 days", amount: cantileverFronted.reduce((a, r) => a + r.amount, 0) },
        { label: "31–60 days", amount: 0 },
        { label: "61–90 days", amount: 0 },
        { label: "90+ days",   amount: 0 },
      ],
    },
    accounts: Object.values(accountTotals),
    trend: buildTrend(allTransactions),
    transactions: allTransactions,
  };
}

function guessInflowKind(desc) {
  const d = desc.toLowerCase();
  if (d.includes("carat") || d.includes("pro freight") || d.includes("freight")) return "payback";
  if (d.includes("transfer") || d.includes("zelle") || d.includes("venmo")) return "transfer";
  return "earned";
}

function buildTrend(transactions) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const yr = d.getFullYear(), mo = d.getMonth();
    const txns = transactions.filter((t) => {
      const td = new Date(t.date);
      return !isNaN(td) && td.getFullYear() === yr && td.getMonth() === mo;
    });
    const inflow  = txns.filter((t) => t.amount > 0 && !t.trucking).reduce((a, t) => a + t.amount, 0);
    const outflow = txns.filter((t) => t.amount < 0 && !t.trucking).reduce((a, t) => a + Math.abs(t.amount), 0);
    const float   = txns.filter((t) => t.trucking && t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
    return { m: label, inflow: +inflow.toFixed(0), outflow: +outflow.toFixed(0), float: +float.toFixed(0) };
  });
}
