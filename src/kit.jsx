import { motion } from "framer-motion";
import { C, num, hatch, glass, glassRaised } from "./theme";

export function Label({ children, color = C.faint, className = "" }) {
  return (
    <div className={`font-semibold text-[12px] tracking-[0.18em] uppercase ${className}`} style={{ color }}>
      {children}
    </div>
  );
}

export function Fig({ children, size = 31, weight = 700, color = C.text, className = "" }) {
  return (
    <span
      className={`leading-none ${className}`}
      style={{ ...num, fontSize: size, fontWeight: weight, color, letterSpacing: "-0.025em" }}
    >
      {children}
    </span>
  );
}

export function Panel({ title, action, children, className = "", flush = false }) {
  return (
    <section
      className={`border ${className}`}
      style={{ ...glass, borderColor: "rgba(60, 75, 55, 0.45)" }}
    >
      {(title || action) && (
        <header
          className="flex flex-wrap items-center gap-3 px-5 py-[13px]"
          style={{ ...glassRaised, borderBottom: "1px solid rgba(60, 75, 55, 0.35)" }}
        >
          {title && <Label color={C.text}>{title}</Label>}
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone = "plain", size = 31 }) {
  const col = tone === "moss" ? C.moss : tone === "oxide" ? C.oxide : tone === "dim" ? C.dim : C.text;
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-[11px]">
        <Fig size={size} color={col}>{value}</Fig>
      </div>
      {sub && (
        <div className="mt-[9px] text-[12px] leading-[1.45]" style={{ ...num, color: C.faint }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Chip({ children, tone = "neutral" }) {
  const v = {
    neutral: ["rgba(44,55,42,0.7)", C.dim, "rgba(60,75,55,0.5)"],
    keep:    ["rgba(169,196,161,0.12)", C.moss, "#55694F"],
    cancel:  ["rgba(58,38,32,0.7)", C.oxide, "#6B4034"],
    review:  ["transparent", C.dim, "rgba(60,75,55,0.4)"],
    solid:   [C.moss, C.forest, C.moss],
    shared:  ["rgba(59,82,55,0.5)", C.text, "rgba(78,106,72,0.7)"],
  }[tone] ?? ["rgba(44,55,42,0.7)", C.dim, "rgba(60,75,55,0.5)"];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap border px-[8px] py-[3px] text-[12px] font-semibold uppercase tracking-[0.12em]"
      style={{ background: v[0], color: v[1], borderColor: v[2] }}
    >
      {children}
    </span>
  );
}

export function Btn({ children, tone = "primary", onClick, disabled = false, className = "" }) {
  const v = {
    primary:   { background: C.moss, color: C.floor, borderColor: C.moss },
    secondary: { background: "rgba(44,55,42,0.5)", color: C.text, borderColor: "rgba(60,75,55,0.5)" },
    danger:    { background: "transparent", color: C.oxide, borderColor: "#6B4034" },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-[38px] cursor-pointer items-center justify-center gap-2 border px-[16px] text-[12px] font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={v}
    >
      {children}
    </button>
  );
}

export function Th({ children, right, w }) {
  return (
    <th
      className="px-4 py-[11px] text-[12px] font-semibold uppercase tracking-[0.14em]"
      style={{
        color: C.faint,
        background: "rgba(44,55,42,0.6)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(60,75,55,0.4)",
        textAlign: right ? "right" : "left",
        width: w,
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, right, color = C.text, className = "" }) {
  return (
    <td
      className={`px-4 py-[13px] text-[14px] ${className}`}
      style={{ color, textAlign: right ? "right" : "left", borderBottom: "1px solid rgba(47,58,44,0.6)" }}
    >
      {children}
    </td>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="inline-flex" style={{ border: "1px solid rgba(60,75,55,0.5)" }}>
      {options.map((o, i) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={on}
            className="cursor-pointer px-[13px] py-[8px] text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{
              background: on ? "rgba(59,82,55,0.7)" : "rgba(36,46,34,0.4)",
              color: on ? C.white : C.faint,
              borderLeft: i ? "1px solid rgba(60,75,55,0.4)" : "none",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Hatch({ className = "", color = C.moss, op = 0.5, gap = 6, style }) {
  return <div aria-hidden className={className} style={{ backgroundImage: hatch(color, op, gap), ...style }} />;
}

export function Datum({ label, tone = C.line, dashed = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: C.ghost }}>
        {label}
      </span>
      <span
        className="h-px flex-1"
        style={
          dashed
            ? { backgroundImage: `repeating-linear-gradient(90deg, ${tone} 0 5px, transparent 5px 10px)` }
            : { background: tone }
        }
      />
    </div>
  );
}

export function Plot({ token }) {
  return (
    <motion.span
      key={token}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-20 w-px"
      style={{ background: `linear-gradient(to bottom, transparent, ${C.moss}, transparent)` }}
      initial={{ left: "-1%", opacity: 0.8 }}
      animate={{ left: "101%", opacity: 0 }}
      transition={{ duration: 0.66, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};
