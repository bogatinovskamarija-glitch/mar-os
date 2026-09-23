import { useMemo } from "react";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { C, money, num } from "../theme";
import { Label, Panel, Fig, rise } from "../kit";
import { useFinance } from "../hooks/useFinance";

export default function CreditCards() {
  const { transactions, hasData } = useFinance();

  const { summary, byCard, monthlyInterest } = useMemo(() => {
    if (!transactions.length) return { summary: null, byCard: [], monthlyInterest: [] };

    // Interest, fees by category
    const interest  = transactions.filter((t) => t.flow === "DEBT_COST" && t.category === "Interest charges");
    const annual    = transactions.filter((t) => t.flow === "DEBT_COST" && t.category === "Card annual fees");
    const late      = transactions.filter((t) => t.flow === "DEBT_COST" && t.category === "Late & returned-payment fees");
    const bankFees  = transactions.filter((t) => t.flow === "DEBT_COST" && t.category === "Bank fees & overdraft");
    const payments  = transactions.filter((t) => t.flow === "DEBT_PAYDOWN");

    const sum = (arr) => arr.reduce((s, t) => s + Math.abs(t.amount), 0);

    const totalInterest  = sum(interest);
    const totalAnnual    = sum(annual);
    const totalLate      = sum(late);
    const totalBankFees  = sum(bankFees);
    const totalPayments  = sum(payments);
    const totalDebtCost  = totalInterest + totalAnnual + totalLate + totalBankFees;

    // Per-card breakdown (interest + fees are on the card account)
    const cardMap = {};
    const addToCard = (t, field) => {
      const card = t.account ?? "Unknown";
      if (!cardMap[card]) cardMap[card] = { card, interest: 0, annual: 0, late: 0, bankFees: 0, payments: 0 };
      cardMap[card][field] += Math.abs(t.amount);
    };
    interest.forEach((t) => addToCard(t, "interest"));
    annual.forEach((t)   => addToCard(t, "annual"));
    late.forEach((t)     => addToCard(t, "late"));
    bankFees.forEach((t) => addToCard(t, "bankFees"));

    // Payments come FROM checking — try to match by merchant name
    payments.forEach((t) => {
      const name = (t.name ?? t.description ?? "").toUpperCase();
      let card = "Other / Unmatched";
      if (/AMERICAN EXPRESS|AMEX/.test(name))          card = "American Express (payments)";
      else if (/CITI/.test(name))                       card = "Citi (payments)";
      else if (/BANK OF AMERICA CREDIT|PAYMENT TO ACCT/.test(name)) {
        card = /6818/.test(name) ? "BofA Platinum Plus ·6818 (payments)"
             : /5825/.test(name) ? "BofA Cash Rewards ·5825 (payments)"
             : "BofA Credit Card (payments)";
      } else if (/DISCOVER/.test(name))                 card = "Discover (payments)";
      else if (/CAPITAL ONE/.test(name))                card = "Capital One (payments)";
      if (!cardMap[card]) cardMap[card] = { card, interest: 0, annual: 0, late: 0, bankFees: 0, payments: 0 };
      cardMap[card].payments += Math.abs(t.amount);
    });

    const byCard = Object.values(cardMap)
      .filter((c) => c.interest + c.annual + c.late + c.bankFees + c.payments > 0)
      .sort((a, b) => (b.interest + b.annual + b.late) - (a.interest + a.annual + a.late));

    // Month-by-month interest (from drift-like grouping)
    const iByMonth = {};
    interest.forEach((t) => {
      iByMonth[t.month] = (iByMonth[t.month] ?? 0) + Math.abs(t.amount);
    });
    const monthlyInterest = Object.entries(iByMonth)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 24)
      .map(([month, amount]) => ({ month, amount }));

    return {
      summary: { totalInterest, totalAnnual, totalLate, totalBankFees, totalDebtCost, totalPayments },
      byCard,
      monthlyInterest,
    };
  }, [transactions]);

  if (!hasData) {
    return (
      <div className="space-y-7">
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <Panel title="Credit card overview">
            <div className="py-8 text-[13px]" style={{ color: C.faint }}>Import CSV to see credit card interest and fees.</div>
          </Panel>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Hero stats */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: C.line, border: `1px solid ${C.line}` }} data-print-panel>
          {[
            { l: "Interest paid (lifetime)", v: summary.totalInterest, c: C.oxide },
            { l: "Fees paid (annual + late)", v: summary.totalAnnual + summary.totalLate, c: summary.totalAnnual + summary.totalLate > 0 ? C.oxide : C.ghost },
            { l: "Total debt cost", v: summary.totalDebtCost, c: C.oxide },
            { l: "Total CC payments made", v: summary.totalPayments, c: C.moss },
          ].map((s) => (
            <div key={s.l} className="px-6 py-6" style={{ background: "rgba(36,46,34,0.7)", backdropFilter: "blur(14px)" }}>
              <Label>{s.l}</Label>
              <div className="mt-3"><Fig size={26} color={s.c}>{money(s.v)}</Fig></div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-card breakdown */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
        <Panel title="Breakdown by card" action={
          <button data-no-print type="button" onClick={() => window.print()}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: C.faint }}>
            <Printer size={12} /> Print
          </button>
        } flush>
          <div className="overflow-x-auto" data-print-panel>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                  {["Card / Account", "Interest charged", "Annual fees", "Late fees", "Total cost", "Payments made"].map((h, i) => (
                    <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
                <tr style={{ background: "rgba(59,82,55,0.3)", borderBottom: `2px solid ${C.moss}` }}>
                  <td className="px-5 py-[10px] text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.moss }}>All cards total</td>
                  {[
                    summary.totalInterest,
                    summary.totalAnnual,
                    summary.totalLate,
                    summary.totalDebtCost,
                    summary.totalPayments,
                  ].map((v, i) => (
                    <td key={i} className="px-5 py-[10px] text-right text-[13px] font-bold"
                      style={{ ...num, color: i === 4 ? C.moss : v > 0 ? C.oxide : C.ghost }}>
                      {money(v)}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCard.map((c) => (
                  <tr key={c.card}>
                    <td className="px-5 py-[13px] text-[13px]"
                      style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{c.card}</td>
                    {[c.interest, c.annual, c.late, c.interest + c.annual + c.late, c.payments].map((v, i) => (
                      <td key={i} className="px-5 py-[13px] text-right text-[13px]"
                        style={{ ...num, color: i === 4 ? (v > 0 ? C.moss : C.ghost) : v > 0 ? C.oxide : C.ghost, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {v > 0 ? money(v) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </motion.div>

      {/* Month-by-month interest */}
      {monthlyInterest.length > 0 && (
        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Panel title="Interest charged by month" flush>
            <div className="overflow-x-auto" data-print-panel>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(44,55,42,0.5)" }}>
                    {["Month", "Interest charged"].map((h, i) => (
                      <th key={h} className="px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyInterest.map((m) => (
                    <tr key={m.month}>
                      <td className="px-5 py-[12px] text-[13px] font-semibold"
                        style={{ color: C.text, borderBottom: `1px solid ${C.lineSoft}` }}>{m.month}</td>
                      <td className="px-5 py-[12px] text-right text-[13px]"
                        style={{ ...num, color: C.oxide, borderBottom: `1px solid ${C.lineSoft}` }}>
                        {money(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </motion.div>
      )}

      <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
        <div className="px-5 py-4 text-[12px] font-light" style={{ color: C.faint, border: `1px solid ${C.lineSoft}` }}>
          Interest and fees are auto-detected from transaction history (flow = DEBT_COST) ·
          Payments made include all transfers classified as credit card paydowns ·
          "Total cost" = interest + annual fees + late fees (excludes payments)
        </div>
      </motion.div>
    </div>
  );
}
