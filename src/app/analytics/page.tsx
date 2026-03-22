"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";

type Range = "3M" | "6M" | "1Y" | "All";
const RANGES: Range[] = ["3M", "6M", "1Y", "All"];

const CATEGORY_LABELS: Record<string, string> = {
  housing: "Housing",
  utilities: "Utilities",
  insurance: "Insurance",
  transport: "Transport",
  groceries: "Groceries",
  childcare: "Childcare",
  subscriptions: "Subscriptions",
  loan: "Loans",
  other: "Other",
};

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly": return amount * (52 / 12);
    case "biweekly": return amount * (26 / 12);
    case "semimonthly": return amount * 2;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "annually": return amount / 12;
    default: return amount;
  }
}

export default function AnalyticsPage() {
  const {
    bills, income, plannedEvents, checkIns,
    totalMonthlyBills, totalMonthlyIncome, loaded,
  } = useSharedStore();

  const [range, setRange] = useState<Range>("6M");

  // ── Derived metrics ──
  const savingsRate = totalMonthlyIncome > 0
    ? ((totalMonthlyIncome - totalMonthlyBills) / totalMonthlyIncome) * 100
    : 0;

  const totalSavedTowardPlans = plannedEvents.reduce((sum, e) => sum + e.savedSoFar, 0);

  const activeBills = bills.filter((b) => b.status === "active");

  // ── Spending by category ──
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of activeBills) {
      const monthly = toMonthly(b.amount, b.frequency);
      map[b.category] = (map[b.category] || 0) + monthly;
    }
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount: Math.round(amount), label: CATEGORY_LABELS[category] || category }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeBills]);

  const maxCategoryAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].amount : 1;

  // ── Balance history from check-ins ──
  const balanceHistory = useMemo(() => {
    return checkIns
      .map((c) => ({
        date: new Date(c.completedAt),
        balance: c.bankBalance,
        label: new Date(c.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [checkIns]);

  // ── Monthly income vs expenses (simulated forward/backward from current rates) ──
  const monthlyComparison = useMemo(() => {
    const months = range === "3M" ? 3 : range === "6M" ? 6 : range === "1Y" ? 12 : 12;
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        income: Math.round(totalMonthlyIncome),
        expenses: Math.round(totalMonthlyBills),
      });
    }
    return result;
  }, [range, totalMonthlyIncome, totalMonthlyBills]);

  // ── Monthly savings (income - expenses per month) ──
  const monthlySavings = useMemo(() => {
    return monthlyComparison.map((m) => ({
      month: m.month,
      saved: m.income - m.expenses,
    }));
  }, [monthlyComparison]);

  const maxSaved = Math.max(...monthlySavings.map((m) => Math.abs(m.saved)), 1);

  // ── Runway in months ──
  const runwayMonths = totalMonthlyBills > 0 && checkIns.length > 0
    ? Math.round((checkIns[checkIns.length - 1].bankBalance) / totalMonthlyBills)
    : 0;

  // ── Insights ──
  const insights = useMemo(() => {
    const items: { icon: string; title: string; description: string; tag: string; tagColor: string; tagBg: string }[] = [];

    // Biggest expense category
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      const pct = totalMonthlyBills > 0 ? Math.round((top.amount / totalMonthlyBills) * 100) : 0;
      items.push({
        icon: "📊",
        title: `${top.label} is ${pct}% of your spending`,
        description: `At ${formatCurrency(top.amount)}/mo, it's your largest expense category.`,
        tag: "top category",
        tagColor: "#a29bf0",
        tagBg: "#2a1f5e",
      });
    }

    // Savings rate insight
    if (savingsRate > 20) {
      items.push({
        icon: "✦",
        title: `Savings rate: ${savingsRate.toFixed(1)}%`,
        description: "You're saving more than 20% of income — strong financial health.",
        tag: "on track",
        tagColor: "#3ecf8e",
        tagBg: "#0d2e1a",
      });
    } else if (savingsRate > 0) {
      items.push({
        icon: "⚡",
        title: `Savings rate: ${savingsRate.toFixed(1)}%`,
        description: "Aim for 20%+ to build a comfortable cushion faster.",
        tag: "room to grow",
        tagColor: "#f0a500",
        tagBg: "#2e1a00",
      });
    }

    // Runway insight
    if (runwayMonths > 0) {
      items.push({
        icon: runwayMonths >= 6 ? "🛡" : "⚠️",
        title: `${runwayMonths}-month runway at current spending`,
        description: runwayMonths >= 6
          ? "You have a healthy buffer. Keep it up."
          : "Consider building toward 6+ months of cushion.",
        tag: runwayMonths >= 6 ? "healthy" : "build up",
        tagColor: runwayMonths >= 6 ? "#3ecf8e" : "#f0a500",
        tagBg: runwayMonths >= 6 ? "#0d2e1a" : "#2e1a00",
      });
    }

    // Plan progress
    const activePlans = plannedEvents.filter((e) => e.status === "saving");
    if (activePlans.length > 0) {
      const totalTarget = activePlans.reduce((s, e) => s + e.amount, 0);
      const totalProgress = activePlans.reduce((s, e) => s + e.savedSoFar, 0);
      const pct = totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0;
      items.push({
        icon: "🎯",
        title: `${pct}% funded across ${activePlans.length} plan${activePlans.length > 1 ? "s" : ""}`,
        description: `${formatCurrency(Math.round(totalProgress))} saved of ${formatCurrency(Math.round(totalTarget))} target.`,
        tag: "plans",
        tagColor: "#a29bf0",
        tagBg: "#2a1f5e",
      });
    }

    return items.slice(0, 3);
  }, [categoryBreakdown, savingsRate, runwayMonths, plannedEvents, totalMonthlyBills]);

  if (!loaded) return null;

  const hasData = bills.length > 0 || income.length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-gray-900">Analytics</h1>
            <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm border border-gray-200">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    range === r
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {!hasData ? (
            <div className="rounded-lg bg-white px-8 py-16 text-center shadow-md">
              <div className="text-[36px]">📊</div>
              <h2 className="mt-3 text-[17px] font-bold text-gray-900">No data yet</h2>
              <p className="mt-1 text-[13px] text-gray-500">Add income and expenses to see your financial analytics.</p>
            </div>
          ) : (
            <>
              {/* KPI Row */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Savings Rate"
                  value={`${savingsRate.toFixed(1)}%`}
                  sub={savingsRate >= 20 ? "above 20% target" : "below 20% target"}
                  subColor={savingsRate >= 20 ? "text-green-600" : "text-amber-600"}
                  accent="border-l-purple-500"
                />
                <KpiCard
                  label="Monthly Expenses"
                  value={formatCurrency(Math.round(totalMonthlyBills))}
                  sub={`${activeBills.length} active expenses`}
                  accent="border-l-red-500"
                />
                <KpiCard
                  label="Saved Toward Plans"
                  value={formatCurrency(Math.round(totalSavedTowardPlans))}
                  sub={`${plannedEvents.filter((e) => e.status === "saving").length} active plans`}
                  subColor="text-green-600"
                  accent="border-l-green-500"
                />
                <KpiCard
                  label="Runway"
                  value={runwayMonths > 0 ? `${runwayMonths} months` : "—"}
                  sub={runwayMonths > 0 ? "at current burn rate" : "complete a check-in"}
                  accent="border-l-amber-500"
                />
              </div>

              {/* Row 2: Income vs Expenses + Category Breakdown */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
                {/* Income vs Expenses Chart */}
                <div className="rounded-lg bg-white p-5 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Income vs Expenses</h3>
                    <p className="text-[12px] text-gray-400">Monthly comparison — the gap is your margin</p>
                  </div>
                  <IncomeExpenseChart data={monthlyComparison} />
                </div>

                {/* Category Breakdown */}
                <div className="rounded-lg bg-white p-5 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Spending by Category</h3>
                    <p className="text-[12px] text-gray-400">Monthly breakdown</p>
                  </div>
                  <div className="space-y-2.5">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="w-20 text-right text-[11px] text-gray-500 flex-shrink-0">{cat.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${(cat.amount / maxCategoryAmount) * 100}%`, opacity: 0.4 + (cat.amount / maxCategoryAmount) * 0.6 }}
                          />
                        </div>
                        <span className="w-16 text-right text-[11px] font-medium text-gray-700 flex-shrink-0">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    ))}
                    {categoryBreakdown.length === 0 && (
                      <p className="py-4 text-center text-[12px] text-gray-400">No expenses to show</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Balance History + Monthly Savings + Insights */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Balance History */}
                <div className="rounded-lg bg-white p-5 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Balance History</h3>
                    <p className="text-[12px] text-gray-400">From your check-ins</p>
                  </div>
                  {balanceHistory.length >= 2 ? (
                    <BalanceChart data={balanceHistory} />
                  ) : (
                    <div className="flex h-[160px] items-center justify-center">
                      <p className="text-[12px] text-gray-400">Need 2+ check-ins to chart</p>
                    </div>
                  )}
                </div>

                {/* Monthly Savings */}
                <div className="rounded-lg bg-white p-5 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Monthly Savings</h3>
                    <p className="text-[12px] text-gray-400">What stays in your pocket</p>
                  </div>
                  <div className="space-y-2">
                    {monthlySavings.map((m) => (
                      <div key={m.month} className="flex items-center gap-2">
                        <span className="w-7 text-[11px] text-gray-400 flex-shrink-0">{m.month}</span>
                        <div className="flex-1 h-5 rounded bg-gray-50 overflow-hidden relative">
                          <div
                            className={`absolute left-0 top-0 h-full rounded ${m.saved >= 0 ? "bg-green-500" : "bg-red-400"}`}
                            style={{ width: `${Math.min((Math.abs(m.saved) / maxSaved) * 100, 100)}%`, opacity: 0.7 }}
                          />
                        </div>
                        <span className={`w-16 text-right text-[11px] font-medium flex-shrink-0 ${m.saved >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {m.saved >= 0 ? "+" : "−"}{formatCurrency(Math.abs(m.saved))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="rounded-lg bg-gray-900 p-5 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-100">Runway Insights</h3>
                    <p className="text-[12px] text-gray-500">What your data is telling you</p>
                  </div>
                  <div className="space-y-3">
                    {insights.length > 0 ? insights.map((ins, i) => (
                      <div key={i} className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                        <div className="flex gap-2.5">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[12px]"
                            style={{ background: ins.tagBg }}
                          >
                            {ins.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-gray-100">{ins.title}</div>
                            <div className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">{ins.description}</div>
                            <span
                              className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: ins.tagBg, color: ins.tagColor }}
                            >
                              {ins.tag}
                            </span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="py-4 text-center text-[12px] text-gray-500">Add more data to unlock insights</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

// ── KPI Card ──
function KpiCard({ label, value, sub, subColor, accent }: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  accent: string;
}) {
  return (
    <div className={`rounded-lg border-l-[3px] bg-white p-4 shadow-md ${accent}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 font-mono text-[20px] font-semibold text-gray-900">{value}</p>
      <p className={`mt-0.5 text-[11px] ${subColor || "text-gray-400"}`}>{sub}</p>
    </div>
  );
}

// ── Income vs Expense Bar Chart ──
function IncomeExpenseChart({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);
  const chartHeight = 160;

  return (
    <div>
      <div className="flex items-end gap-3" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const incomeH = (d.income / max) * (chartHeight - 24);
          const expenseH = (d.expenses / max) * (chartHeight - 24);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-1" style={{ height: chartHeight - 24 }}>
                <div
                  className="w-[35%] rounded-t bg-green-400"
                  style={{ height: incomeH, opacity: 0.7 }}
                  title={`Income: ${formatCurrency(d.income)}`}
                />
                <div
                  className="w-[35%] rounded-t bg-purple-400"
                  style={{ height: expenseH, opacity: 0.7 }}
                  title={`Expenses: ${formatCurrency(d.expenses)}`}
                />
              </div>
              <span className="text-[10px] text-gray-400">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-[11px] text-gray-400">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-[11px] text-gray-400">Expenses</span>
        </div>
      </div>
    </div>
  );
}

// ── Balance History Sparkline ──
function BalanceChart({ data }: { data: { date: Date; balance: number; label: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 10, right: 10, bottom: 24, left: 50 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const balances = data.map((d) => d.balance);
    const min = Math.min(...balances) * 0.95;
    const max = Math.max(...balances) * 1.05;
    const range = max - min || 1;

    const points = data.map((d, i) => ({
      x: pad.left + (i / (data.length - 1)) * chartW,
      y: pad.top + chartH - ((d.balance - min) / range) * chartH,
    }));

    // Fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.lineTo(points[0].x, pad.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, "rgba(139, 92, 246, 0.15)");
    grad.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Dots + labels
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.stroke();

      // X label (show first, last, and every other)
      if (i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(data.length / 4)) === 0) {
        ctx.fillStyle = "#bbb";
        ctx.fillText(data[i].label, points[i].x, h - 4);
      }
    }

    // Y axis labels
    ctx.textAlign = "right";
    ctx.fillStyle = "#ccc";
    ctx.font = "10px sans-serif";
    const ySteps = 3;
    for (let i = 0; i <= ySteps; i++) {
      const val = min + (range * i) / ySteps;
      const y = pad.top + chartH - (i / ySteps) * chartH;
      ctx.fillText(`$${Math.round(val / 1000)}k`, pad.left - 6, y + 3);
      if (i > 0 && i < ySteps) {
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.strokeStyle = "#f3f4f6";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [data]);

  return <canvas ref={canvasRef} className="h-[160px] w-full" />;
}
