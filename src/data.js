/* Static config — shapes and labels only, no sample financial data.
   Financial figures come from CSV import (lib/finance.js → localStorage).
   Goal and priority data comes from ClickUp API (lib/clickup.js). */

export const meta = {
  owner: "Maria Bogatinovska",
  board: "MAR OS",
};

export const HABIT_NAMES = [
  "Morning walk",
  "Strength / cardio",
  "Read 20 min",
  "No spending impulse",
  "Daily walk",
  "Journal",
  "Screen off by 10",
];

export const HABIT_NOTES = {
  "Morning walk": "Canelo counts",
  "Strength / cardio": "1500mg creatine daily",
  "Read 20 min": "Fiction or development",
  "No spending impulse": "Money stays in the bank",
  "Daily walk": "30 min, phone stays home",
  "Journal": "Evening reset",
  "Screen off by 10": "Bed is sacred",
};

export const focusPresets = [
  { label: "Design sprint", minutes: 90 },
  { label: "Deep work", minutes: 50 },
  { label: "Admin block", minutes: 25 },
  { label: "Quick review", minutes: 15 },
];

export const playlists = [
  { service: "Spotify", name: "Architect's Focus", url: "#" },
  { service: "YouTube", name: "Rainy day studio", url: "#" },
  { service: "Spotify", name: "Cardio interval set", url: "#" },
  { service: "YouTube", name: "Quiet reading morning", url: "#" },
];

export const journalMoods = ["Good day", "Steady", "Hard", "Tired", "Anxious", "Proud"];

export const focusIntention = {
  contexts: ["Firm", "Exam", "Trucking", "Admin", "Home"],
  recoveryOptions: [
    "Write it down and return to the target.",
    "Mark the exact question, then move to the next solvable step.",
    "Take one minute to define the next action.",
    "Ignore it until the timer ends.",
  ],
};

export const journalPromptCategories = [
  { group: "Building", prompts: [
    "What must become true in the next 90 days for my firm to feel less dependent on my constant availability?",
    "Which type of project or client is both financially worthwhile and creatively energizing?",
    "Where is my money anxiety pointing to missing information, and where is it pointing to a genuinely unacceptable level of risk?",
    "What number would make the firm's current financial reality clearer, and when will I look at it?",
    "What business decision am I postponing because I want to remain liked or unquestionably competent?",
    "What recurring task should be documented and delegated next?",
  ]},
  { group: "Examining", prompts: [
    "What will passing the final licensing exam make possible?",
    "Which exam subject creates the strongest urge to avoid?",
    "What kind of mistake keeps appearing in my practice questions?",
    "What evidence from the last month suggests I am becoming more prepared?",
    "When exam anxiety appears during a study block, what exactly will I do instead of switching tasks?",
    "What does prepared enough mean in observable terms?",
  ]},
  { group: "Carrying", prompts: [
    "Which responsibilities am I carrying because they are truly mine?",
    "Which obligation has the greatest consequence if neglected?",
    "When money fear shows up, what factual snapshot do I need?",
    "What do I imagine would happen if I rested before everything was finished?",
    "What are my earliest signs that I am exceeding my capacity?",
    "Where am I calling something discipline when it is actually perfectionism?",
  ]},
  { group: "Seeing", prompts: [
    "Which design problems make me lose track of time?",
    "What spatial, material, social, or ethical question keeps recurring in my work?",
    "Where do client constraints sharpen my design thinking?",
    "Which recent design decision feels most unmistakably mine?",
    "What am I noticing in buildings, streets, or materials that others may be overlooking?",
    "What would I make if it did not need to impress a client?",
  ]},
  { group: "Holding", prompts: [
    "What is Dragan likely experiencing when I am physically present but mentally at the firm?",
    "What small weekly ritual would protect our relationship during a busy season?",
    "How can we talk about money so that anxiety is not the third person in the conversation?",
    "When I realize I have been distracted at home, what repair can I make?",
    "Which boundary around devices or work hours would protect our home life?",
    "What support do I need from Dragan that I have been avoiding requesting clearly?",
  ]},
  { group: "Becoming", prompts: [
    "Three years from now, what does an ordinary Tuesday look like if everything is working together?",
    "What does enough mean for my firm, income, savings, fitness, and home life?",
    "Which identity label am I outgrowing, and which am I practicing before I fully believe it?",
    "If I failed the exam or lost a client, what would remain true about me?",
    "What do I want people to say about how I built, designed, and led?",
    "What would my future self thank me for doing in the next 12 months?",
  ]},
];

// Fallback finance data — used only when no CSV has been imported yet
export const FALLBACK_ENVELOPE = [
  { cat: "Housing & utilities", short: "Housing", plan: 1450, actual: 0, shared: true, txns: 0 },
  { cat: "Groceries & household", short: "Groceries", plan: 550, actual: 0, shared: true, txns: 0 },
  { cat: "Subscriptions", short: "Subs", plan: 180, actual: 0, shared: false, txns: 0 },
  { cat: "Car, gas & tolls", short: "Car & gas", plan: 300, actual: 0, shared: false, txns: 0 },
  { cat: "Health & fitness", short: "Health", plan: 200, actual: 0, shared: false, txns: 0 },
  { cat: "Canelo", short: "Canelo", plan: 120, actual: 0, shared: true, txns: 0 },
  { cat: "Personal & misc", short: "Personal", plan: 250, actual: 0, shared: false, txns: 0 },
  { cat: "Student loans", short: "Loans", plan: 0, actual: 0, shared: false, txns: 0, flag: "No repayment plan selected yet" },
];

export const FALLBACK_ACCOUNTS = [
  { name: "BofA · checking",  balance: 0, kind: "checking" },
  { name: "BofA · savings",   balance: 0, kind: "savings" },
  { name: "Amex · Platinum",  balance: 0, kind: "credit", limit: 25000 },
  { name: "Amex · Blue Cash", balance: 0, kind: "credit", limit: 10000 },
  { name: "Citi · Strata",    balance: 0, kind: "credit", limit: 9000 },
  { name: "Discover it",      balance: 0, kind: "credit", limit: 6500 },
];

export const FOCUS_GOAL_MIN = 240;
