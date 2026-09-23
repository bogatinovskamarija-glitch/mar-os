import Papa from "papaparse";

// ── Entity / group constants ─────────────────────────────────────────────────
export const TRUCKING_ENTITIES = new Set([
  "Carat Expedited","Pro Freight Transportation","Pro Freight Logistics",
  "Treviator Trucking","Stork Transportation",
]);

export const ENTITY_GROUP = {
  "Carat Expedited":           "trucking",
  "Pro Freight Transportation":"trucking",
  "Pro Freight Logistics":     "trucking",
  "Treviator Trucking":        "trucking",
  "Stork Transportation":      "trucking",
  "Dragan Dimishkov":          "dragan",
  "Bogat A&D":                 "bogat",
};

export const SHARED_CATS = new Set([
  "Housing (rent)","Utilities & Phone","Groceries & Household",
  "Dining & Going Out","Entertainment",
]);

// ── Account label map (classify.py §ACCOUNT_LABEL) ─────────────────────────
const ACCOUNT_LABEL = {
  "marija bogatinovska":                    "BofA Checking ·0901",
  "Advantage Savings":                      "BofA Savings ·1833",
  "BankAmericard Platinum Plus Mastercard": "BofA Platinum Plus ·6818",
  "Customized Cash Rewards Visa Signature": "BofA Cash Rewards ·5825",
  "Blue Cash Everyday®":               "Amex Blue Cash Everyday",
  "Blue Cash Preferred®":              "Amex Blue Cash Preferred",
  "Platinum Card®":                    "Amex Platinum",
  "MARIJA BOGATINOVSKA -81001":             "Amex (legacy -81001)",
  "MARIJA BOGATINOVSKA -91001":             "Amex (legacy -91001)",
  "Citi Strata℠ Card":                "Citi Strata ·1176",
  "Citi® Diamond Preferred® Card": "Citi Diamond Preferred ·0382",
  "Discover it Card":                       "Discover it ·8668",
  "Quicksilver":                            "Capital One Quicksilver ·8977",
  "Ulta Beauty":                            "Ulta Mastercard ·6369",
};

// ── Entity detection (classify.py §ENTITY_RULES) ────────────────────────────
const ENTITY_RULES = [
  [/PRO FREIGHT LOGISTICS/,               "Pro Freight Logistics"],
  [/CARAT|CHK 1149|FLEETONE|GORDANA DIMISKOVA/, "Carat Expedited"],
  [/PRO FREIGHT|CHK 9278/,               "Pro Freight Transportation"],
  [/TREVIATOR/,                           "Treviator Trucking"],
  [/STORK TRANSPORTATION/,               "Stork Transportation"],
  [/DIMISHKOV|DRAGAN|CHK 4627/,          "Dragan Dimishkov"],
  [/BOGAT ARCHITECTURE|MB ONLINE STORE/, "Bogat A&D"],
];

const TRUCK_MERCHANTS =
  /MOTIVE|KEEPTRUCKIN|DAT SOLUTIONS|MEDSTOP|FMCSA|CLEARINGHOUS|DRIVERFACTS|DVS IDR|CRASH REP|ECRASH|LEXISNEXIS|CITATION TRACKING|SAFETY HOLDINGS|COMDATA|3MD SOLUTIONS|KENWORTH|MHC-KW|SPEEDCO|PETRO |PILOT TRAVEL|PILOT_|TA #|TA LAKE|TA \d|LOVE.?S|TRUCK|TOWING|TIRE|TRAILER|KYTC MOTOR|IL DEPT OF REVEN|HUB INTERNATIONA|AGCS|ACUITY A MUTUAL|OK COM OFFICERS|ILLINOISSECRETARY|ILSOS|I2G AMERICA|PIKEPASS|TXTAG|E-?Z.?PASS|EZPASS|IL TOLLWAY|PTC EZPASS|PARKWAYS|RIVERLINK|MASSDOT|NH TURNPIKE|ELIZABETH RIVERS|PA COURTS|JUD.JEFFERSN|GSUITE.?CARATEX|GSUITE CARATEXP|SB DOT MULTISERVICES|MTEL USA/;

const TRACKED_CARD_PAYEES =
  /COMN CAP|PAYMENT TO ACCT# ?(?:6818|5825)|AMERICAN EXPRESS|CITI CARD|CITI AUTOPAY|DISCOVER|CAPITAL ONE|COMENITY|PAYMENT TO CRD|BANK OF AMERICA CREDIT CARD|BA ELECTRONIC PAYMENT/;
const UNTRACKED_CARD_PAYEES = /CHASE CREDIT|MACYS/;

const CAT_MAP = {
  "Bills & Utilities":    "Utilities & Phone",
  "Groceries":            "Groceries & Household",
  "Dining & Drinks":      "Dining & Going Out",
  "Shopping":             "Shopping",
  "Auto & Transport":     "Car, Gas & Transport",
  "Car Expenses":         "Car, Gas & Transport",
  "Travel & Vacation":    "Travel",
  "Medical":              "Health & Medical",
  "Health & Wellness":    "Health & Medical",
  "Personal Care":        "Personal Care",
  "Pets":                 "Pets",
  "Subscriptions":        "Subscriptions & Software",
  "Software & Tech":      "Subscriptions & Software",
  "Productivity":         "Subscriptions & Software",
  "Education":            "Education & Licensure",
  "Courses":              "Education & Licensure",
  "Entertainment & Rec.": "Entertainment",
  "Gifts":                "Gifts & Donations",
  "Charitable Donations": "Gifts & Donations",
  "Taxes":                "Taxes & Government",
  "Legal":                "Legal & Professional",
  "Home & Garden":        "Home & Garden",
  "Business":             "Bogat A&D / AREna (business)",
  "ETSY Store":           "Bogat A&D / AREna (business)",
  "Investment":           "Investing",
  "Loan Payment":         "Student Loans",
  "Uncategorized":        "Uncategorized",
  "Cash & Checks":        "Cash Withdrawals",
  "Reimbursement":        "Uncategorized",
};

const MERCHANT_CATS = [
  [/REGATTA AT NEW R|ALTMANMGNT|YSI\*REGATTA/,                                         "Housing (rent)"],
  [/FPL |FPL DIRECT|VERIZON|HOTWIRE|COMCAST|XFINITY|AT&T/,                             "Utilities & Phone"],
  [/STUDNTLOAN|NAVI ED SERV|ADVS ED SERV|RETRY PYMT/,                                  "Student Loans"],
  [/PROGRESSIVE|AGI\*RENTERS|GEICO|STATE FARM|LEMONADE/,                               "Insurance"],
  [/NCARB|ARE 5|PROSOFT|AMBER BOOK|BRAINSTORMARE|NCARB\*/,                             "Education & Licensure"],
  [/NETFLIX|SPOTIFY|HULU|YOUTUBE ?TV|ESPN|DISNEY|AUDIBLE|APPLE\.COM\/BILL|ICLOUD|GOOGLE ONE|DROPBOX|ADOBE|CLAUDE|ANTHROPIC|OPENAI|CHATGPT|CLICKUP|SQUARESPACE|SQSP|CANVA|HEYGEN|ROCKET MONEY|TRUEBILL|D5 |PADDLE|MESHY|CAPCUT|GAMMA\.APP|WONDERSHARE|AUTODESK|MIDJOURNEY|NOTION|ELEMENTOR/, "Subscriptions & Software"],
  [/UBER|LYFT|SUNPASS|SHELL|CHEVRON|EXXON|WAWA|RACETRAC|MOBIL/,                       "Car, Gas & Transport"],
  [/PUBLIX|WHOLE ?FOODS|TRADER JOE|ALDI|COSTCO|SAMS ?CLUB|WINN/,                      "Groceries & Household"],
];
const RENT_CASH = /BKOFAMERICA BC .+WITHDRWL .+LAS OLAS/;

// ── Helpers ──────────────────────────────────────────────────────────────────
function r2(n) { return Math.round(n * 100) / 100; }

function normMerchant(s) {
  s = String(s).toUpperCase();
  s = s.replace(/^(CHECKCARD|PURCHASE)\s+\d{4}\s+/, "");
  s = s.replace(/X{3,}\w*/g, "");
  s = s.replace(/CONF(IRMATION)?#.*|ID:.*|INDN:.*|\bDES:/g, " ");
  s = s.replace(/\d{3,}/g, "").replace(/[*#]+/g, " ").replace(/\s+/g, " ").trim();
  return s.slice(0, 40);
}

function fnv1a(str) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function makeTxKey(date, acct, amount, desc, idx) {
  return fnv1a(`${date}|${acct}|${amount}|${desc}|${idx}`).slice(0, 12);
}

// ── Raw Rocket Money classifier (porting classify.py) ─────────────────────
function classifyRM(row, idx, amexDups, cardDups) {
  const T = ((row["Name"] ?? "") + " | " + (row["Description"] ?? "")).toUpperCase();
  const rmCat  = (row["Category"] ?? "").trim();
  const acctName = row["Account Name"] ?? "";
  const account  = ACCOUNT_LABEL[acctName] ?? acctName;
  const isCard   = row["Account Type"] === "Credit Card";
  const amount   = parseFloat(row["Amount"] ?? "0");
  const signed   = -amount;
  const merchant = normMerchant(row["Name"] ?? "");
  const date     = (row["Date"] ?? "").trim();
  const month    = date.slice(0, 7);
  const year     = parseInt(date.slice(0, 4)) || 0;

  let flow = null, category = null, entity = null, entityBasis = null, flag = "";

  // Step 0: duplicates / ignored
  if (amexDups.has(idx) || cardDups.has(idx)) {
    flow = "DUPLICATE"; category = "Duplicate import";
  } else if ((row["Ignored From"] ?? "").trim()) {
    flow = "IGNORED"; category = "Ignored in Rocket Money";
  }

  if (!flow) {
    // Step 1: entity
    for (const [pat, ent] of ENTITY_RULES) {
      if (pat.test(T)) { entity = ent; entityBasis = "named in transaction"; break; }
    }

    // Step 2: own-account movement
    if (!entity) {
      const ownRef  = /SAV 1833|CHK 0901|TRANSFER (?:TO|FROM) SAV|SCHEDULED TRANSFER/.test(T);
      const cpSide  = isCard && ["Credit Card Payment","Credit Card Payment Expense"].includes(rmCat)
                      && /PAYMENT|AUTOPAY|PYMT|THANK YOU|RETURNED/.test(T)
                      && !/REWARD|REDEMPTION|POINTS|CASHBACK|REFUND/.test(T);
      const bkPay   = !isCard && TRACKED_CARD_PAYEES.test(T) && !UNTRACKED_CARD_PAYEES.test(T);
      if (ownRef || cpSide || bkPay) { flow = "TRANSFER"; category = "Between my accounts"; }
      else if (UNTRACKED_CARD_PAYEES.test(T)) { flow = "DEBT_PAYDOWN"; category = "Old card payoff (Chase closed, Macy's)"; }
      else if (/WEBULL/.test(T)) { flow = "EXPENSE"; category = "Investing"; }
      else if (amount < 0 && /CASH ?REWARD|REDEMPTION|POINTS FOR STATEMENT|CASHBACK BONUS|YOUR CASH REWARD/.test(T)) {
        flow = "INCOME"; category = "Rewards & interest";
      } else if (amount < 0 && /ZELLE PAYMENT FROM .+".*PAYROLL/.test(T)) {
        entity = "Pro Freight Transportation"; entityBasis = "memo (inferred)";
      }
    }

    // Step 3: owner draw
    if (!flow && entity === "Bogat A&D" && amount < 0 && /SALARY|PAYROLL/.test(T)) {
      flow = "INCOME"; category = "Owner draw – Bogat A&D";
    }

    // Step 4: entity movement
    if (!flow && entity) {
      flow     = amount > 0 ? "FRONTED" : "REPAID";
      category = entity;
    }

    // Step 5: trucking spend
    if (!flow) {
      if (rmCat === "Carat Expedited") {
        flow = "FRONTED"; category = "Carat Expedited"; entity = "Carat Expedited"; entityBasis = "rm_category";
      } else if (TRUCK_MERCHANTS.test(T) && !["Income","Fees"].includes(rmCat)) {
        flow = "FRONTED"; category = "Carat Expedited"; entity = "Carat Expedited"; entityBasis = "merchant_inferred";
      } else if (rmCat === "Dragan") {
        flow = "FRONTED"; category = "Dragan Dimishkov"; entity = "Dragan Dimishkov"; entityBasis = "rm_category";
      }
    }

    // Step 6: debt cost
    if (!flow) {
      const feeText = /MEMBERSHIP FEE|OVERDRAFT|RETURN(?:ED)? CHECK|RETURN PAYMENT FEE|RETURN CHECK FEE|\bNSF\b|INSUFFICIENT|WIRE TRANSFER FEE|INTEREST|FINANCE CHARGE|LATE FEE|PAST DUE|FOREIGN TRANSACTION/.test(T);
      if (rmCat === "Fees" || feeText) {
        flow = "DEBT_COST";
        if (/INTEREST|FINANCE CHARGE/.test(T)) category = "Interest charges";
        else if (/LATE FEE|PAST DUE|RETURN(?:ED)? (?:PAYMENT|CHECK)|\bRTN\b|INSUFFICIENT|\bNSF\b/.test(T)) category = "Late & returned-payment fees";
        else if (/MEMBERSHIP FEE/.test(T)) category = "Card annual fees";
        else category = "Bank fees & overdraft";
      }
    }

    // Step 7: reversal
    if (!flow && (rmCat === "Returned Payment" || /RETURN OF POSTED|ADJUSTMENT\/CORRECTION/.test(T))) {
      flow = "REVERSAL"; category = "Returned / bounced items";
    }

    // Step 8: income
    if (!flow && amount < 0 && ["Income","Cash & Checks","Internal Transfers","Temporary","Business","Uncategorized","Savings Transfer","Dining & Drinks"].includes(rmCat)) {
      flow = "INCOME";
      if (/TAMARA PEACOCK|THE TAM DES:PAYROLL/.test(T)) category = "Salary (W-2 payroll)";
      else if (/BOSTON ARCHITECT/.test(T)) category = "Architecture fees";
      else if (/UPWORK/.test(T)) category = "Freelance (Upwork)";
      else if (/CASHREWARD|INTEREST EARNED|CASHBACK|REDEMPTION/.test(T)) category = "Rewards & interest";
      else if (/DEPOSIT|WIRE TYPE|ZELLE PAYMENT FROM|CASH APP/.test(T)) {
        category = "Deposits & Zelle – source unclear";
        flag = "Money in with no clear source";
      } else category = "Other income";
    }

    // Step 9: expense
    if (!flow) {
      flow = "EXPENSE";
      let cat = CAT_MAP[rmCat] ?? "Uncategorized";
      for (const [pat, c] of MERCHANT_CATS) { if (pat.test(T)) { cat = c; break; } }
      if (RENT_CASH.test(T) && rmCat === "Bills & Utilities") cat = "Housing (rent)";
      category = cat;
      if (["Internal Transfers","Savings Transfer","Credit Card Payment","Credit Card Payment Expense","Temporary","Ignore"].includes(rmCat)
          && !["Housing (rent)","Student Loans"].includes(cat)) {
        category = "Unmatched transfers – review";
        flag = "Rocket Money called this a transfer but no own-account or entity match was found";
      }
    }
  }

  const shared = flow === "EXPENSE" && SHARED_CATS.has(category);
  return {
    tx_key: makeTxKey(date, acctName, amount, row["Description"] ?? "", idx),
    date, month, year, account, account_type: row["Account Type"] ?? "",
    merchant, name: row["Name"] ?? "", description: row["Description"] ?? "",
    amount, signed, flow, category: category ?? "", entity: entity ?? "",
    entity_basis: entityBasis ?? "", shared, rm_category: rmCat, flag,
  };
}

function parseRocketMoney(rows) {
  // Step 0a: Amex deduplication (same date+amount across Amex accounts → keep first)
  const amexDups = new Set();
  const amexSeen = {};
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]["Institution Name"] !== "American Express") continue;
    const k = `${rows[i]["Date"]}|${parseFloat(rows[i]["Amount"]).toFixed(2)}`;
    if (amexSeen[k] !== undefined) amexDups.add(i);
    else amexSeen[k] = i;
  }
  // Step 0b: card exact-row deduplication
  const cardDups = new Set();
  const cardSeen = {};
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]["Account Type"] !== "Credit Card") continue;
    const k = `${rows[i]["Date"]}|${rows[i]["Amount"]}|${rows[i]["Account Name"]}|${rows[i]["Name"]}`;
    if (cardSeen[k] !== undefined) cardDups.add(i);
    else cardSeen[k] = i;
  }
  return rows
    .filter((r) => (r["Date"] ?? "").trim() && !isNaN(parseFloat(r["Amount"] ?? "")) && parseFloat(r["Amount"]) !== 0)
    .map((r, i) => classifyRM(r, i, amexDups, cardDups))
    .filter((t) => !["DUPLICATE","IGNORED","TRANSFER"].includes(t.flow));
}

// ── Pre-classified tx_clean CSV parser ───────────────────────────────────────
function parseTxClean(rows) {
  return rows.map((r) => ({
    tx_key:       r["tx_id"] ?? r["tx_key"] ?? "",
    date:         r["Date"] ?? "",
    month:        r["month"] ?? "",
    year:         parseInt(r["year"]) || 0,
    account:      r["account"] ?? "",
    account_type: r["Account Type"] ?? "",
    merchant:     r["merchant"] ?? "",
    name:         r["Name"] ?? "",
    description:  r["Description"] ?? "",
    amount:       parseFloat(r["Amount"] ?? "0"),
    signed:       parseFloat(r["signed"] ?? "0"),
    flow:         r["flow"] ?? "EXPENSE",
    category:     r["category"] ?? "",
    entity:       r["entity"] ?? "",
    entity_basis: r["entity_basis"] ?? "",
    shared:       r["shared"] === "True" || r["shared"] === true,
    rm_category:  r["rm_category"] ?? "",
    flag:         r["flag"] ?? "",
  })).filter((r) => r.date && !isNaN(r.amount) && r.amount !== 0
    && !["DUPLICATE","IGNORED","TRANSFER"].includes(r.flow));
}

// ── Main CSV parse entry point ────────────────────────────────────────────────
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length && data.length === 0) { reject(new Error(errors[0].message)); return; }
        const headers = Object.keys(data[0] ?? {});
        const txns = headers.includes("flow")
          ? parseTxClean(data)
          : parseRocketMoney(data);
        resolve(txns);
      },
      error: reject,
    });
  });
}

// ── Recurring detection (porting recurring.py) ───────────────────────────────
const SERVICE_KEYS = [
  [/MOTIVE|KEEPTRUCKIN/, "Motive (ELD)"],
  [/DAT SOLUTIONS/, "DAT load board"],
  [/GORDANA DIMISKOVA/, "Carat Macedonia payroll"],
  [/CHASE CREDIT/, "Chase payoff (closed card)"],
  [/INTEREST CHARGE/, "Card interest"],
  [/FPL/, "FPL electric"],
  [/VERIZON/, "Verizon Wireless"],
  [/ARENA AI/, "AREna AI"],
  [/GOOGLE WORKSPACE|GSUITE|WORKSPACE_/, "Google Workspace"],
  [/DISNEY/, "Disney+"],
  [/WEBFLOW/, "Webflow"],
  [/HOTWIRE/, "Hotwire internet"],
  [/ADOBE/, "Adobe"],
  [/RENDER\.COM/, "Render.com"],
  [/CAPCUT/, "CapCut"],
  [/PADDLE/, "Paddle (software)"],
  [/SQSP|SQUARESPACE/, "Squarespace"],
  [/ROCKET MONEY/, "Rocket Money"],
  [/GOOGLE ONE/, "Google One"],
  [/NETFLIX/, "Netflix"],
  [/SPOTIFY/, "Spotify"],
  [/YOUTUBE/, "YouTube"],
  [/ANTHROPIC|CLAUDE/, "Claude (Anthropic)"],
  [/OPENAI|CHATGPT/, "ChatGPT"],
  [/D5 /, "D5 Render"],
  [/WIX/, "Wix"],
  [/AUDIBLE/, "Audible"],
  [/APPLE\.COM|ICLOUD/, "Apple / iCloud"],
  [/HEYGEN/, "HeyGen"],
  [/DROPBOX/, "Dropbox"],
  [/CLICKUP/, "ClickUp"],
  [/NCARB/, "NCARB"],
  [/AMAZON PRIME|PRIME VIDEO/, "Amazon Prime"],
  [/AMAZON GROCERY SUB/, "Amazon grocery"],
  [/SAFETY HOLDINGS/, "Safety Holdings"],
  [/MEDSTOP/, "Medstop drug tests"],
  [/REGATTA|YSI\*/, "Rent – Regatta"],
  [/BKOFAMERICA BC .+WITHDRWL .+LAS OLAS/, "Rent – branch withdrawal"],
  [/ESPN/, "ESPN+"],
  [/MESHY/, "Meshy"],
  [/CANVA/, "Canva"],
  [/SUNPASS/, "SunPass"],
  [/DRIVEEZMD/, "DriveEzMD"],
];

const BOGAT_TOOLS = new Set(["AREna AI","Webflow","Render.com","Google Workspace","Paddle (software)","D5 Render","Wix","Meshy","Canva","HeyGen"]);

const CAT_TYPE = {
  "Subscriptions & Software": "Subscription",
  "Utilities & Phone":        "Bill",
  "Housing (rent)":           "Bill",
  "Interest charges":         "Debt cost",
  "Old card payoff (Chase closed, Macy's)": "Debt payment",
  "Education & Licensure":    "Subscription",
  "Insurance":                "Bill",
};

function svcKey(t) {
  const text = ((t.name ?? "") + " " + (t.description ?? "")).toUpperCase();
  for (const [pat, name] of SERVICE_KEYS) {
    if (pat.test(text)) return name;
  }
  return null;
}

export function detectRecurring(txns, today = new Date()) {
  const relevant = txns.filter((t) =>
    ["EXPENSE","FRONTED","DEBT_COST","DEBT_PAYDOWN"].includes(t.flow) && t.amount > 0
  );
  const groups = {};
  for (const t of relevant) {
    const svc = svcKey(t);
    if (!svc) continue;
    (groups[svc] = groups[svc] ?? []).push(t);
  }

  const todayMs = today.getTime();
  const results = [];

  for (const [svc, rows] of Object.entries(groups)) {
    if (rows.length < 3) continue;
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const last6  = sorted.slice(-6);
    const gaps   = last6.slice(1).map((t, i) =>
      (new Date(t.date).getTime() - new Date(last6[i].date).getTime()) / 86400000
    ).sort((a, b) => a - b);
    const medGap = gaps.length === 0 ? 0 :
      gaps.length % 2 === 0 ? (gaps[gaps.length/2-1] + gaps[gaps.length/2]) / 2 : gaps[Math.floor(gaps.length/2)];

    let cadence, perMo;
    if      (medGap >= 25  && medGap <= 35 ) { cadence = "Monthly";         perMo = 1; }
    else if (medGap >= 5   && medGap <= 9  ) { cadence = "Weekly";          perMo = 52/12; }
    else if (medGap >= 10  && medGap <= 24 ) { cadence = "Every 2–3 weeks"; perMo = 30/medGap; }
    else if (medGap >= 80  && medGap <= 100) { cadence = "Quarterly";       perMo = 1/3; }
    else if (medGap >= 340 && medGap <= 390) { cadence = "Annual";          perMo = 1/12; }
    else continue;

    const last3 = sorted.slice(-3).map((t) => t.amount).sort((a, b) => a - b);
    const typical = last3.length % 2 === 0
      ? (last3[last3.length/2-1] + last3[last3.length/2]) / 2
      : last3[Math.floor(last3.length/2)];

    const cutoff90 = new Date(todayMs - 90*86400000).toISOString().slice(0, 10);
    const recent90 = sorted.filter((t) => t.date > cutoff90).reduce((s, t) => s + t.amount, 0) / 3;
    if (cadence === "Weekly" || cadence === "Every 2–3 weeks" ||
        svc === "Card interest" || svc === "Chase payoff (closed card)") {
      perMo = typical > 0 ? recent90 / typical : 0;
    }

    const lastDate  = sorted[sorted.length - 1].date;
    const daysSince = (todayMs - new Date(lastDate).getTime()) / 86400000;
    const active    = daysSince <= Math.max(45, medGap * 1.6);
    const lastTxn   = sorted[sorted.length - 1];

    let owner;
    if (lastTxn.entity === "Bogat A&D") owner = "Bogat A&D (fronted)";
    else if (lastTxn.flow === "FRONTED") owner = "Trucking (fronted)";
    else if (BOGAT_TOOLS.has(svc)) owner = "Bogat / AREna";
    else owner = "Personal";

    const rtype = owner.startsWith("Bogat A&D") ? "Own business"
      : owner === "Trucking (fronted)" ? "Trucking ops"
      : (CAT_TYPE[lastTxn.category] ?? "Subscription");

    const nextExpected = active && medGap > 0
      ? new Date(new Date(lastDate).getTime() + medGap * 86400000).toISOString().slice(0, 10)
      : null;

    results.push({
      service: svc, type: rtype, owner, cadence,
      charges: sorted.length,
      typical_amount:  r2(typical),
      monthly_equiv:   r2(typical * perMo),
      annual_equiv:    r2(typical * perMo * 12),
      first_seen:      sorted[0].date,
      last_charge:     lastDate,
      days_since_last: Math.round(daysSince),
      next_expected:   nextExpected,
      status:          active ? "Active" : "Stopped",
      lifetime_paid:   r2(sorted.reduce((s, t) => s + t.amount, 0)),
      category:        lastTxn.category ?? "",
    });
  }

  const typeOrder = { Bill:0, "Debt cost":1, "Debt payment":2, Subscription:3, "Own business":4, "Trucking ops":5 };
  return results.sort((a, b) => {
    if (a.status !== b.status) return a.status === "Active" ? -1 : 1;
    return (typeOrder[a.type] ?? 6) - (typeOrder[b.type] ?? 6) || b.monthly_equiv - a.monthly_equiv;
  });
}

// ── Build full finance state ──────────────────────────────────────────────────
export function buildFinanceState(txns) {
  const today       = new Date();
  const curMonth    = today.toISOString().slice(0, 7);
  const active      = txns; // already filtered on import

  const eGroup = (ent) => {
    if (TRUCKING_ENTITIES.has(ent)) return "trucking";
    if (ent === "Dragan Dimishkov")  return "dragan";
    if (ent === "Bogat A&D")         return "bogat";
    return null;
  };

  // All unique months sorted
  const months = [...new Set(active.map((t) => t.month))].filter(Boolean).sort();

  // ── Monthly aggregates ─────────────────────────────────────────────────────
  const mSums = {};
  for (const m of months) {
    const mt = active.filter((t) => t.month === m);
    const sumSigned = (flow) => mt.filter((t) => t.flow === flow).reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    const fTruck    = mt.filter((t) => t.flow === "FRONTED" && eGroup(t.entity) === "trucking");
    const rTruck    = mt.filter((t) => t.flow === "REPAID"  && eGroup(t.entity) === "trucking");
    const fDragan   = mt.filter((t) => t.flow === "FRONTED" && eGroup(t.entity) === "dragan");
    const rDragan   = mt.filter((t) => t.flow === "REPAID"  && eGroup(t.entity) === "dragan");
    const fBogat    = mt.filter((t) => t.flow === "FRONTED" && eGroup(t.entity) === "bogat");

    const earned      = sumSigned("INCOME");
    const came_back   = mt.filter((t) => ["REPAID","REVERSAL"].includes(t.flow)).reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    const personal    = -mt.filter((t) => t.flow === "EXPENSE").reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    const debt_cost   = -sumSigned("DEBT_COST");
    const paydown     = -sumSigned("DEBT_PAYDOWN");
    const ft = -fTruck.reduce((s, t)  => s + (t.signed ?? -t.amount), 0);
    const rt =  rTruck.reduce((s, t)  => s + (t.signed ?? -t.amount), 0);
    const fd = -fDragan.reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    const rd =  rDragan.reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    const fb = -fBogat.reduce((s, t)  => s + (t.signed ?? -t.amount), 0);
    const dragan_share = mt.filter((t) => t.shared && t.flow === "EXPENSE")
      .reduce((s, t) => s + Math.abs(t.amount) * 0.5, 0);

    mSums[m] = {
      month: m, earned, came_back, personal, debt_cost, paydown,
      fronted_trucking: ft, repaid_trucking: rt,
      fronted_dragan:   fd, repaid_dragan:   rd,
      fronted_bogat:    fb, dragan_share,
      total_in:  r2(earned + came_back),
      total_out: r2(personal + debt_cost + paydown + ft + fd + fb),
      net_cash:  r2(earned + came_back - personal - debt_cost - paydown - ft - fd - fb),
      own_life:  r2(earned - personal - debt_cost),
    };
  }

  // ── Running balances per month ─────────────────────────────────────────────
  let trBal = 0, drBal = 0;
  const drift = months.map((m) => {
    const s = mSums[m];
    trBal = r2(trBal + s.fronted_trucking - s.repaid_trucking);
    drBal = r2(drBal + s.fronted_dragan + s.dragan_share - s.repaid_dragan);
    return { ...s, trucking_balance: trBal, dragan_balance: drBal };
  });

  // ── Current month ──────────────────────────────────────────────────────────
  const cur = mSums[curMonth] ?? {
    month: curMonth, earned:0, came_back:0, personal:0, debt_cost:0, paydown:0,
    fronted_trucking:0, repaid_trucking:0, fronted_dragan:0, repaid_dragan:0,
    fronted_bogat:0, dragan_share:0, total_in:0, total_out:0, net_cash:0, own_life:0,
  };
  const lastDrift = drift[drift.length - 1];
  const truckingBalance = lastDrift?.trucking_balance ?? 0;
  const draganBalance   = lastDrift?.dragan_balance   ?? 0;

  // ── Envelope (F-02): personal categories, plan = 12-month median ───────────
  const PCATS = [
    "Housing (rent)","Utilities & Phone","Groceries & Household","Dining & Going Out",
    "Shopping","Car, Gas & Transport","Travel","Health & Medical","Personal Care",
    "Pets","Subscriptions & Software","Education & Licensure","Entertainment",
    "Gifts & Donations","Insurance","Student Loans","Bogat A&D / AREna (business)",
    "Home & Garden","Cash Withdrawals","Taxes & Government","Legal & Professional",
    "Investing","Uncategorized",
  ];
  const last12months = months.slice(-12);
  const curExpenses  = active.filter((t) => t.month === curMonth && t.flow === "EXPENSE");

  const envelope = PCATS.map((cat) => {
    const monthlyAmts = last12months.map((m) =>
      active.filter((t) => t.month === m && t.flow === "EXPENSE" && t.category === cat)
            .reduce((s, t) => s + Math.abs(t.signed ?? -t.amount) * -1, 0)  // signed is negative for expenses
    ).map(Math.abs);
    const sorted = [...monthlyAmts].sort((a, b) => a - b);
    const med = sorted.length === 0 ? 0
      : sorted.length % 2 === 0
        ? (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2
        : sorted[Math.floor(sorted.length/2)];

    const catExpenses = curExpenses.filter((t) => t.category === cat);
    const actual      = catExpenses.reduce((s, t) => s + Math.abs(t.signed ?? 0), 0);
    const drShare     = catExpenses.filter((t) => t.shared).reduce((s, t) => s + Math.abs(t.amount) * 0.5, 0);
    return {
      cat, plan: r2(Math.round(med)), actual: r2(actual), shared: SHARED_CATS.has(cat),
      txns: catExpenses.length, dragan_share: r2(drShare),
    };
  }).filter((e) => e.actual > 0 || e.plan > 0);

  // ── Inflow for F-01 ───────────────────────────────────────────────────────
  const incomeGroups = {};
  for (const t of active.filter((t) => t.month === curMonth && t.flow === "INCOME")) {
    const k = t.category || "Other income";
    const s = incomeGroups[k] ?? (incomeGroups[k] = { source: k, amount: 0, kind: incomeKind(k) });
    s.amount = r2(s.amount + (t.signed ?? -t.amount));
  }
  const inflow = Object.values(incomeGroups).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);

  // ── Accounts: this-month flow per account ─────────────────────────────────
  const acctMap = {};
  for (const t of active.filter((t) => t.month === curMonth)) {
    const a = acctMap[t.account] ?? (acctMap[t.account] = {
      name: t.account,
      kind: (t.account_type === "Credit Card") ? "credit"
          : (t.account_type === "Savings") ? "savings" : "checking",
      thisMonthOut: 0, thisMonthIn: 0, txns: 0,
    });
    const s = t.signed ?? -t.amount;
    if (s > 0) a.thisMonthIn  = r2(a.thisMonthIn  + s);
    else       a.thisMonthOut = r2(a.thisMonthOut + Math.abs(s));
    a.txns++;
  }
  const acctOrder = { checking: 0, savings: 1, credit: 2 };
  const accounts = Object.values(acctMap).sort((a, b) => (acctOrder[a.kind] ?? 3) - (acctOrder[b.kind] ?? 3));

  // ── Trucking split data ───────────────────────────────────────────────────
  const last12start = months[Math.max(0, months.length - 12)] ?? curMonth;
  const trk = (flow, ents = null) => active.filter((t) =>
    t.flow === flow && (ents ? ents.has(t.entity) : eGroup(t.entity) === "trucking")
  );
  const trkFront   = (sub) => trk("FRONTED").filter((t) => !sub || t.month >= sub).reduce((s, t) => s - (t.signed ?? -t.amount) * -1, 0);
  const trkRepaid  = (sub) => trk("REPAID").filter((t) => !sub || t.month >= sub).reduce((s, t) => s + (t.signed ?? -t.amount), 0);

  const trkCompanies = {};
  for (const ent of TRUCKING_ENTITIES) {
    const f = active.filter((t) => t.flow === "FRONTED" && t.entity === ent).reduce((s, t) => s + Math.abs(t.amount), 0);
    const r = active.filter((t) => t.flow === "REPAID"  && t.entity === ent).reduce((s, t) => s + (t.signed ?? -t.amount), 0);
    if (f > 0 || r > 0) trkCompanies[ent] = { fronted: r2(f), repaid: r2(r), balance: r2(f - r) };
  }

  // ── Dragan split data ─────────────────────────────────────────────────────
  const drgFronted = active.filter((t) => t.flow === "FRONTED" && t.entity === "Dragan Dimishkov")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const drgRepaid  = active.filter((t) => t.flow === "REPAID"  && t.entity === "Dragan Dimishkov")
    .reduce((s, t) => s + (t.signed ?? -t.amount), 0);
  const drgShareAll = active.filter((t) => t.shared && t.flow === "EXPENSE")
    .reduce((s, t) => s + Math.abs(t.amount) * 0.5, 0);
  const drgShare12  = active.filter((t) => t.shared && t.flow === "EXPENSE" && t.month >= last12start)
    .reduce((s, t) => s + Math.abs(t.amount) * 0.5, 0);
  const drgRepaid12 = active.filter((t) => t.flow === "REPAID" && t.entity === "Dragan Dimishkov" && t.month >= last12start)
    .reduce((s, t) => s + (t.signed ?? -t.amount), 0);
  const drgTxnsThisMonth = active.filter((t) => t.month === curMonth &&
    (t.entity === "Dragan Dimishkov" || (t.shared && t.flow === "EXPENSE")));

  // ── Recurring ─────────────────────────────────────────────────────────────
  const recurring = detectRecurring(txns, today);

  return {
    thisMonth:       cur,
    truckingBalance: r2(truckingBalance),
    draganBalance:   r2(draganBalance),
    inflow,
    accounts,
    envelope,
    recurring,
    trucking: {
      balance:    r2(truckingBalance),
      thisMonth:  { fronted: r2(cur.fronted_trucking), repaid: r2(cur.repaid_trucking) },
      last12:     { fronted: r2(trkFront(last12start)), repaid: r2(trkRepaid(last12start)) },
      lifetime:   { fronted: r2(trkFront(null)),        repaid: r2(trkRepaid(null)) },
      companies:  trkCompanies,
      monthly:    drift.map((d) => ({
        month: d.month, fronted: r2(d.fronted_trucking), repaid: r2(d.repaid_trucking),
        net: r2(d.fronted_trucking - d.repaid_trucking), running_balance: d.trucking_balance,
      })),
    },
    dragan: {
      balance:        r2(draganBalance),
      direct_fronted: r2(drgFronted),
      dragan_share:   r2(drgShareAll),
      repaid:         r2(drgRepaid),
      share12:        r2(drgShare12),
      repaid12:       r2(drgRepaid12),
      transactions:   drgTxnsThisMonth,
      monthly:        drift.map((d) => ({
        month: d.month, direct_fronted: r2(d.fronted_dragan),
        dragan_share: r2(d.dragan_share), repaid: r2(d.repaid_dragan),
        running_balance: d.dragan_balance,
      })),
    },
    drift,
    transactions: txns,
  };
}

function incomeKind(cat) {
  if (!cat) return "income";
  if (cat.includes("Salary") || cat.includes("Architecture") || cat.includes("Freelance") || cat.includes("draw")) return "earned";
  if (cat.includes("Rewards") || cat.includes("interest")) return "rewards";
  if (cat.includes("unclear")) return "unclear";
  return "income";
}
