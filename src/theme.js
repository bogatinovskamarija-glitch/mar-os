export const C = {
  void:     "#12170F",
  floor:    "#1A2118",
  forest:   "#242E22",
  raised:   "#2C372A",
  hover:    "#334030",
  canopy:   "#3B5237",
  canopyLt: "#4E6A48",
  line:     "#3C4B37",
  lineSoft: "#2F3A2C",

  white:    "#FFFFFF",
  text:     "#EDF2EA",
  dim:      "#C6D8C1",
  faint:    "#BAD0B5",
  ghost:    "#A8BFA3",

  moss:     "#A9C4A1",
  oxide:    "#E8A98E",
  oxideBg:  "#3A2620",
};

export const money = (n, cents = false) =>
  (n < 0 ? "−$" : "$") +
  Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

export const num = { fontVariantNumeric: "tabular-nums", letterSpacing: "0.01em" };

/* 45-degree hatch: not-in-contract poche. */
export const hatch = (color = C.moss, op = 0.5, gap = 6) =>
  `repeating-linear-gradient(45deg, ${color}${Math.round(op * 255).toString(16).padStart(2, "0")} 0 1px, transparent 1px ${gap}px)`;

/* Frosted glass — used on all panels and cards */
export const glass = {
  background: "rgba(36, 46, 34, 0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderColor: "rgba(60, 75, 55, 0.45)",
};

export const glassRaised = {
  background: "rgba(44, 55, 42, 0.65)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
