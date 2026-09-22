import Papa from "papaparse";

// ── Category rules ───────────────────────────────────────────────────────────
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
    kw: ["netflix", "spotify", "adobe", "apple.com/bill", "google one", "amazon prime", "hulu", "youtube premium", "clickup", "squarespace", "dropbox", "icloud", "canva", "claude", "chatgpt", "openai", "supabase", "audible", "kindle", "ncarb", "heygen", "its.plot", "rocket money", "chatgpt"],
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

// ── CSV parsers ──────────────────────────────────────────────────────────────
function detectFormat(headers) {
  const h = headers.map((s) => s.toLowerCase());
  if (h.includes("transaction date")) return "chase";
  if (h.includes("date") && h.includes("amount") && h.some((x) => x.includes("extended"))) return "amex";
  return "chase"; // default
}

function parseRows(rows, filename) {
  const headers = Object.keys(rows[0] ?? {});
  const fmt = detectFormat(headers);
  const account = guessAccount(filename);

  return rows
    .map((row) => {
      let date, desc, amount;
      if (fmt === "amex") {
        date = row["Date"] ?? row["date"] ?? "";
        desc = row["Description"] ?? row["description"] ?? "";
        amount = -(parseFloat(row["Amount"] ?? row["amount"] ?? "0")); // amex positive = charge
      } else {
        date = row["Transaction Date"] ?? row["Date"] ?? row["date"] ?? "";
        desc = row["Description"] ?? row["description"] ?? "";
        amount = parseFloat(row["Amount"] ?? row["amount"] ?? "0");
      }
      return { date, description: desc.trim(), amount: isNaN(amount) ? 0 : amount, account };
    })
    .filter((r) => r.description && r.amount !== 0 && r.date);
}

function guessAccount(filename) {
  const f = filename.toLowerCase();
  if (f.includes("saving")) return "Chase · savings";
  if (f.includes("checking") || f.includes("chase")) return "Chase · personal checking";
  if (f.includes("amex") || f.includes("gold")) return "Amex · Gold";
  if (f.includes("freedom")) return "Chase · Freedom";
  return "Chase · personal checking";
}

// ── Main parse entry point ───────────────────────────────────────────────────
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length && data.length === 0) {
          reject(new Error(errors[0].message));
          return;
        }
        const rows = parseRows(data, file.name);
        const transactions = rows.map((r) => ({
          ...r,
          category: categorize(r.description),
          trucking: categorize(r.description) === "__trucking__",
        }));
        resolve(transactions);
      },
      error: reject,
    });
  });
}

// ── Build finance state from all imported transactions ───────────────────────
export function buildFinanceState(allTransactions) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = allTransactions.filter((t) => {
    const d = new Date(t.date);
    return !isNaN(d) && d >= firstOfMonth;
  });

  // Envelope: personal spending only (not trucking)
  const personal = thisMonth.filter((t) => !t.trucking && t.amount < 0);
  const envelopeMap = {};
  for (const c of CATS) {
    envelopeMap[c.name] = { cat: c.name, short: c.short, shared: c.shared, plan: 0, actual: 0, txns: 0 };
  }
  envelopeMap["Personal & misc"] = { cat: "Personal & misc", short: "Personal", shared: false, plan: 0, actual: 0, txns: 0 };

  for (const t of personal) {
    const cat = t.category === "__trucking__" ? "Personal & misc" : t.category;
    if (envelopeMap[cat]) {
      envelopeMap[cat].actual = +(envelopeMap[cat].actual + Math.abs(t.amount)).toFixed(2);
      envelopeMap[cat].txns++;
    }
  }

  // Inflow: positive transactions from personal accounts
  const inflowMap = {};
  for (const t of thisMonth.filter((t) => t.amount > 0)) {
    const key = t.description.slice(0, 35);
    if (!inflowMap[key]) {
      inflowMap[key] = { source: t.description, amount: 0, kind: guessInflowKind(t.description), note: "" };
    }
    inflowMap[key].amount = +(inflowMap[key].amount + t.amount).toFixed(2);
  }

  // Trucking float (this month only, not yet reimbursed)
  const truckingTxns = thisMonth.filter((t) => t.trucking && t.amount < 0);
  const cantileverFronted = truckingTxns.map((t) => ({
    item: t.description,
    short: t.description.slice(0, 14),
    amount: Math.abs(t.amount),
    date: t.date,
    entity: t.description.toLowerCase().includes("carat") ? "Carat Expedited" : "Pro Freight",
    back: 0,
  }));

  // Account balances: running sum per account from ALL transactions
  const accountTotals = {};
  const ACCOUNT_KINDS = {
    "Chase · personal checking": "checking",
    "Chase · savings": "savings",
    "Amex · Gold": "credit",
    "Chase · Freedom": "credit",
  };
  const CREDIT_LIMITS = { "Amex · Gold": 12000, "Chase · Freedom": 8000 };

  for (const t of allTransactions) {
    if (!accountTotals[t.account]) {
      accountTotals[t.account] = { name: t.account, balance: 0, kind: ACCOUNT_KINDS[t.account] ?? "checking" };
      if (CREDIT_LIMITS[t.account]) accountTotals[t.account].limit = CREDIT_LIMITS[t.account];
    }
    accountTotals[t.account].balance = +(accountTotals[t.account].balance + t.amount).toFixed(2);
  }

  // Trend: last 6 months
  const trend = buildTrend(allTransactions);

  return {
    envelope: Object.values(envelopeMap),
    inflow: Object.values(inflowMap).filter((r) => r.amount > 0),
    cantilever: {
      fronted: cantileverFronted,
      priorBalance: 0, // user enters manually or tracks separately
      ageBuckets: [
        { label: "0–30 days", amount: cantileverFronted.reduce((a, r) => a + r.amount, 0) },
        { label: "31–60 days", amount: 0 },
        { label: "61–90 days", amount: 0 },
        { label: "90+ days", amount: 0 },
      ],
    },
    accounts: Object.values(accountTotals),
    trend,
    transactions: allTransactions,
  };
}

function guessInflowKind(desc) {
  const d = desc.toLowerCase();
  if (d.includes("carat") || d.includes("pro freight")) return "payback";
  if (d.includes("transfer") || d.includes("zelle") || d.includes("venmo")) return "transfer";
  return "earned";
}

function buildTrend(transactions) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    const month = d.getMonth();
    const txns = transactions.filter((t) => {
      const td = new Date(t.date);
      return !isNaN(td) && td.getFullYear() === year && td.getMonth() === month;
    });
    const inflow = txns.filter((t) => t.amount > 0 && !t.trucking).reduce((a, t) => a + t.amount, 0);
    const outflow = txns.filter((t) => t.amount < 0 && !t.trucking).reduce((a, t) => a + Math.abs(t.amount), 0);
    const float = txns.filter((t) => t.trucking && t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
    months.push({ m: label, inflow: +inflow.toFixed(0), outflow: +outflow.toFixed(0), float: +float.toFixed(0) });
  }
  return months;
}
