import Papa from "papaparse";

// ── Envelope categories (used for both RM and keyword-based parsers) ──────────
export const CATS = [
  {
    name: "Housing & utilities", short: "Housing", shared: true,
    kw: ["rent", "fpl", "florida power", "electric", "water", "sewer", "internet", "spectrum", "att ", "comcast", "xfinity"],
  },
  {
    name: "Groceries & household", short: "Groceries", shared: true,
    kw: ["publix", "walmart", "target", "costco", "whole foods", "trader joe", "aldi", "kroger", "winn-dixie", "amazon fresh", "fresh market"],
  },
  {
    name: "Dining & going out", short: "Dining", shared: true,
    kw: ["restaurant", "cafe", "bar ", "doordash", "grubhub", "ubereats", "mcdonald", "chick-fil", "chipotle", "subway", "starbucks", "dunkin", "taco bell", "wendy", "burger king", "el camino"],
  },
  {
    name: "Shopping", short: "Shopping", shared: false,
    kw: ["amazon", "nordstrom", "macy", "zara", "h&m", "ulta", "sephora", "marshalls", "tj maxx", "ross dress", "home depot", "ikea", "wayfair", "ebay", "etsy", "paypal"],
  },
  {
    name: "Entertainment", short: "Entertain", shared: true,
    kw: ["ticketmaster", "livenation", "amc ", "cinema", "concert", "fandango", "event"],
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
    name: "Travel", short: "Travel", shared: false,
    kw: ["airbnb", "vrbo", "marriott", "hilton", "hyatt", "delta", "united air", "american air", "southwest", "spirit air", "frontier", "uber", "lyft", "hertz", "enterprise", "hotel"],
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

// ── Rocket Money category → app envelope bucket ───────────────────────────────
const RM_BUCKET = {
  // Housing
  "Bills & Utilities":    "Housing & utilities",

  // Food
  "Groceries":            "Groceries & household",
  "Dining & Drinks":      "Dining & going out",

  // Transport
  "Auto & Transport":     "Car, gas & tolls",
  "Car Expenses":         "Car, gas & tolls",

  // Health
  "Medical":              "Health & fitness",
  "Health & Wellness":    "Health & fitness",

  // Subscriptions / tech
  "Subscriptions":        "Subscriptions",
  "Software & Tech":      "Subscriptions",
  "Productivity":         "Subscriptions",

  // Pet
  "Pets":                 "Canelo",

  // Loans / debt
  "Loan Payment":         "Student loans",

  // Shopping / personal
  "Shopping":             "Shopping",
  "Personal Care":        "Shopping",
  "Home & Garden":        "Shopping",
  "Gifts":                "Shopping",

  // Entertainment
  "Entertainment & Rec.": "Entertainment",

  // Travel
  "Travel & Vacation":    "Travel",

  // Catch-all
  "Education":            "Personal & misc",
  "Courses":              "Personal & misc",
  "Charitable Donations": "Personal & misc",
  "Legal":                "Personal & misc",
  "Business":             "Personal & misc",
  "Fees":                 "Personal & misc",
  "Taxes":                "Personal & misc",
  "Cash & Checks":        "Personal & misc",
  "Uncategorized":        "Personal & misc",
  "ETSY Store":           "Personal & misc",
  "Reimbursement":        "Personal & misc",

  // Trucking buckets handled separately below (Carat Expedited, Dragan)
};

// These are internal movements — skip entirely
const RM_SKIP = new Set([
  "Credit Card Payment",
  "Credit Card Payment Expense",
  "Internal Transfers",
  "Savings Transfer",
  "Returned Payment",
  "Ignore",
  "Temporary",
  "Investment",
]);

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
    if (acct.includes("blue cash preferred")) return "Amex · Blue Cash Preferred";
    if (acct.includes("blue cash")) return "Amex · Blue Cash";
    if (acct.includes("gold")) return "Amex · Gold";
    return "Amex · card";
  }
  if (inst.includes("bank of america")) {
    if (acct.includes("sav") || acct.includes("advantage")) return "BofA · savings";
    if (acct.includes("customized") || acct.includes("cash rewards")) return "BofA · Cash Rewards";
    if (acct.includes("bankamericard")) return "BofA · Platinum";
    return "BofA · checking";
  }
  if (inst.includes("capital one")) {
    if (acct.includes("quicksilver")) return "Capital One · Quicksilver";
    return "Capital One · card";
  }
  if (inst.includes("citibank") || inst.includes("citi")) {
    if (acct.includes("strata")) return "Citi · Strata";
    if (acct.includes("diamond")) return "Citi · Diamond";
    return "Citi · card";
  }
  if (inst.includes("discover")) return "Discover it";
  if (inst.includes("ulta")) return "Ulta · Beauty";

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

    // Custom trucking/split categories the user set up in Rocket Money
    const isTrucking = rmCat === "Carat Expedited" || rmCat === "Pro Freight";
    const isDragan = rmCat === "Dragan";
    const isIncome = amount > 0 && rmCat === "Income";

    const appCategory = isTrucking
      ? "__trucking__"
      : isDragan
        ? "__dragan__"
        : isIncome
          ? "__income__"
          : (RM_BUCKET[rmCat] ?? "Personal & misc");

    return [{ date, description: desc, amount, account, category: appCategory, trucking: isTrucking, dragan: isDragan }];
  });
}

// ── Chase / Amex row parser ───────────────────────────────────────────────────
function categorize(desc) {
  const d = desc.toLowerCase();
  for (const c of CATS) {
    if (c.kw.some((kw) => d.includes(kw))) return c.name;
  }
  return "Personal & misc";
}

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
    .map((r) => {
      const cat = categorize(r.description);
      return { ...r, category: cat, trucking: false, dragan: false };
    });
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

  // Envelope: personal spending this month only
  const envelopeMap = {};
  for (const c of CATS) {
    envelopeMap[c.name] = { cat: c.name, short: c.short, shared: c.shared, plan: 0, actual: 0, txns: 0 };
  }
  envelopeMap["Personal & misc"] = { cat: "Personal & misc", short: "Personal", shared: false, plan: 0, actual: 0, txns: 0 };

  for (const t of thisMonth) {
    // Exclude transfers, trucking (Carat/Pro Freight), Dragan expenses, and income
    if (t.trucking || t.dragan || t.category === "__income__" || t.amount >= 0) continue;
    const cat = t.category && envelopeMap[t.category] ? t.category : "Personal & misc";
    envelopeMap[cat].actual = +(envelopeMap[cat].actual + Math.abs(t.amount)).toFixed(2);
    envelopeMap[cat].txns++;
  }

  // Inflow: positive amounts this month (income, paybacks)
  const inflowMap = {};
  for (const t of thisMonth.filter((t) => t.amount > 0 && !t.trucking && !t.dragan)) {
    const key = t.description.slice(0, 35);
    if (!inflowMap[key]) {
      inflowMap[key] = { source: t.description, amount: 0, kind: guessInflowKind(t.description), note: "" };
    }
    inflowMap[key].amount = +(inflowMap[key].amount + t.amount).toFixed(2);
  }

  // Trucking float: Carat Expedited / Pro Freight expenses fronted from personal account
  const truckingTxns = thisMonth.filter((t) => t.trucking && t.amount < 0);
  const cantileverFronted = truckingTxns.map((t) => ({
    item: t.description,
    short: t.description.slice(0, 18),
    amount: Math.abs(t.amount),
    date: t.date,
    entity: t.description.toLowerCase().includes("pro freight") ? "Pro Freight" : "Carat Expedited",
    back: 0,
  }));

  // Dragan expenses: money fronted for Dragan's share
  const draganTxns = thisMonth.filter((t) => t.dragan && t.amount < 0);
  const draganFronted = draganTxns.map((t) => ({
    item: t.description,
    short: t.description.slice(0, 18),
    amount: Math.abs(t.amount),
    date: t.date,
    entity: "Dragan",
    back: 0,
  }));

  // Account balances: current month spending per card (more meaningful than all-time sum)
  const ACCOUNT_META = {
    "BofA · checking":          { kind: "checking" },
    "BofA · savings":           { kind: "savings" },
    "BofA · Cash Rewards":      { kind: "credit", limit: 10000 },
    "BofA · Platinum":          { kind: "credit", limit: 5000 },
    "Amex · Platinum":          { kind: "credit", limit: 25000 },
    "Amex · Blue Cash":         { kind: "credit", limit: 10000 },
    "Amex · Blue Cash Preferred": { kind: "credit", limit: 10000 },
    "Amex · Gold":              { kind: "credit", limit: 15000 },
    "Amex · card":              { kind: "credit", limit: 10000 },
    "Citi · Strata":            { kind: "credit", limit: 9000 },
    "Citi · Diamond":           { kind: "credit", limit: 6000 },
    "Discover it":              { kind: "credit", limit: 6500 },
    "Capital One · Quicksilver": { kind: "credit", limit: 5000 },
    "Ulta · Beauty":            { kind: "credit", limit: 2000 },
  };

  const accountTotals = {};
  for (const t of thisMonth) {
    if (!accountTotals[t.account]) {
      const meta = ACCOUNT_META[t.account] ?? { kind: "credit" };
      accountTotals[t.account] = { name: t.account, balance: 0, ...meta };
    }
    accountTotals[t.account].balance = +(accountTotals[t.account].balance + t.amount).toFixed(2);
  }
  // For credit cards flip sign: negative net (charged more than paid) → positive = amount owed this month
  const accounts = Object.values(accountTotals).map((a) => ({
    ...a,
    balance: a.kind === "credit" ? -a.balance : a.balance,
  }));

  return {
    envelope: Object.values(envelopeMap),
    inflow: Object.values(inflowMap).filter((r) => r.amount > 0),
    cantilever: {
      fronted: cantileverFronted,
      draganFronted,
      priorBalance: 0,
      ageBuckets: [
        { label: "0–30 days", amount: cantileverFronted.reduce((a, r) => a + r.amount, 0) },
        { label: "31–60 days", amount: 0 },
        { label: "61–90 days", amount: 0 },
        { label: "90+ days",   amount: 0 },
      ],
    },
    accounts,
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
    const inflow  = txns.filter((t) => t.amount > 0 && !t.trucking && !t.dragan).reduce((a, t) => a + t.amount, 0);
    const outflow = txns.filter((t) => t.amount < 0 && !t.trucking && !t.dragan).reduce((a, t) => a + Math.abs(t.amount), 0);
    const float   = txns.filter((t) => (t.trucking || t.dragan) && t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
    return { m: label, inflow: +inflow.toFixed(0), outflow: +outflow.toFixed(0), float: +float.toFixed(0) };
  });
}
