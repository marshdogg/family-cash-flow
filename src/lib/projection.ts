import type { Bill, IncomeSource, Investment, PlannedEvent } from "./types";

export type ViewMode = "weekly" | "biweekly" | "monthly";

export interface LineItem {
  name: string;
  icon: string;
  amount: number;
}

export interface ProjectionPeriod {
  label: string;
  income: number;
  expense: number;
  invested: number;
  balance: number;
  incomeItems: LineItem[];
  expenseItems: LineItem[];
  investmentItems: LineItem[];
  plannedEventItems: LineItem[];
}

/**
 * Convert any frequency amount to a per-day rate for accurate projection.
 */
function toDailyRate(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":       return amount / 7;
    case "biweekly":     return amount / 14;
    case "semimonthly":  return (amount * 24) / 365;
    case "monthly":      return (amount * 12) / 365;
    case "quarterly":    return (amount * 4) / 365;
    case "annually":     return amount / 365;
    default:             return 0;
  }
}

interface OneTimeItem { nextDate: string; amount: number }

function sumOneTimeInPeriod(items: OneTimeItem[], start: Date, end: Date): number {
  let total = 0;
  for (const item of items) {
    const d = new Date(item.nextDate + "T00:00:00");
    if (d >= start && d <= end) total += item.amount;
  }
  return total;
}

const BILL_ICONS: Record<string, string> = {
  housing: "🏠", utilities: "⚡", insurance: "🛡", transport: "🚗",
  groceries: "🛒", childcare: "👶", subscriptions: "📱", loan: "🏦", other: "📋",
};
const INCOME_ICONS: Record<string, string> = {
  paycheck: "💰", bonus: "🎉", side: "💼", benefits: "🏛", refund: "📥", other: "📋",
};
const INVEST_ICONS: Record<string, string> = {
  rrsp: "📊", tfsa: "🛡", resp: "🎓", brokerage: "📈", realestate: "🏘", crypto: "₿", other: "💎",
};
const EVENT_ICONS: Record<string, string> = {
  trip: "✈️", camp: "⛺", holiday: "🎄", school: "🎒", car: "🚗", home: "🏠", medical: "🏥", other: "📋",
};

/**
 * Build 12 projection periods for the given view mode.
 */
export function buildProjection(
  startBalance: number,
  bills: Bill[],
  income: IncomeSource[],
  investments: Investment[],
  viewMode: ViewMode,
  plannedEvents: PlannedEvent[] = []
): ProjectionPeriod[] {
  const activeBills = bills.filter((b) => b.status === "active" && b.frequency !== "one-time");
  const activeIncome = income.filter((i) => i.frequency !== "one-time");
  const activeInvestments = investments.filter((i) => i.status === "active" && i.frequency !== "one-time");

  const oneTimeBills = bills.filter((b) => b.frequency === "one-time" && b.status === "active");
  const oneTimeIncome = income.filter((i) => i.frequency === "one-time");
  const oneTimeInvestments = investments.filter((i) => i.frequency === "one-time" && i.status === "active");

  // Planned events that haven't been spent yet show as future one-time expenses
  const plannedOneTimeExpenses: { nextDate: string; amount: number }[] = plannedEvents
    .filter((e) => e.status !== "spent")
    .map((e) => ({ nextDate: e.targetDate, amount: e.amount }));

  const dailyExpense = activeBills.reduce((sum, b) => sum + toDailyRate(b.amount, b.frequency), 0);
  const dailyIncome = activeIncome.reduce((sum, i) => sum + toDailyRate(i.amount, i.frequency), 0);
  const dailyInvestment = activeInvestments.reduce((sum, i) => sum + toDailyRate(i.amount, i.frequency), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periods: ProjectionPeriod[] = [];
  let running = startBalance;

  for (let i = 0; i < 12; i++) {
    let periodStart: Date;
    let periodEnd: Date;
    let label: string;

    if (viewMode === "weekly") {
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() + i * 7);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      label = periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (viewMode === "biweekly") {
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() + i * 14);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13);
      label = periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      if (i === 0) periodStart = new Date(today);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
      label = periodStart.toLocaleDateString("en-US", { month: "short" });
    }

    const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let periodIncome = Math.round(dailyIncome * days);
    let periodExpense = Math.round(dailyExpense * days);
    let periodInvested = Math.round(dailyInvestment * days);

    periodExpense += sumOneTimeInPeriod(oneTimeBills, periodStart, periodEnd);
    periodExpense += sumOneTimeInPeriod(plannedOneTimeExpenses, periodStart, periodEnd);
    periodIncome += sumOneTimeInPeriod(oneTimeIncome, periodStart, periodEnd);
    periodInvested += sumOneTimeInPeriod(oneTimeInvestments, periodStart, periodEnd);

    running += periodIncome - periodExpense - periodInvested;

    // Build line items for this period
    const incomeItems: LineItem[] = [
      ...activeIncome.map((i) => ({ name: i.name, icon: INCOME_ICONS[i.category] || "📋", amount: Math.round(toDailyRate(i.amount, i.frequency) * days) })),
      ...oneTimeIncome.filter((i) => { const d = new Date(i.nextDate + "T00:00:00"); return d >= periodStart && d <= periodEnd; })
        .map((i) => ({ name: i.name, icon: INCOME_ICONS[i.category] || "📋", amount: i.amount })),
    ].filter((i) => i.amount > 0);

    const expenseItems: LineItem[] = [
      ...activeBills.map((b) => ({ name: b.name, icon: BILL_ICONS[b.category] || "📋", amount: Math.round(toDailyRate(b.amount, b.frequency) * days) })),
      ...oneTimeBills.filter((b) => { const d = new Date(b.nextDate + "T00:00:00"); return d >= periodStart && d <= periodEnd; })
        .map((b) => ({ name: b.name, icon: BILL_ICONS[(b as Bill).category] || "📋", amount: b.amount })),
    ].filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);

    const investmentItems: LineItem[] = [
      ...activeInvestments.map((i) => ({ name: i.name, icon: INVEST_ICONS[i.category] || "💎", amount: Math.round(toDailyRate(i.amount, i.frequency) * days) })),
      ...oneTimeInvestments.filter((i) => { const d = new Date(i.nextDate + "T00:00:00"); return d >= periodStart && d <= periodEnd; })
        .map((i) => ({ name: i.name, icon: INVEST_ICONS[(i as Investment).category] || "💎", amount: i.amount })),
    ].filter((i) => i.amount > 0);

    const plannedEventItems: LineItem[] = plannedEvents
      .filter((e) => e.status !== "spent")
      .filter((e) => { const d = new Date(e.targetDate + "T00:00:00"); return d >= periodStart && d <= periodEnd; })
      .map((e) => ({ name: e.name, icon: EVENT_ICONS[e.category] || "📋", amount: e.amount }));

    periods.push({
      label,
      income: periodIncome,
      expense: periodExpense,
      invested: periodInvested,
      balance: Math.round(running),
      incomeItems,
      expenseItems,
      investmentItems,
      plannedEventItems,
    });
  }

  return periods;
}

/**
 * Build a what-if projection by injecting hypothetical items into the full calculation.
 */
export function buildWhatIfProjection(
  startBalance: number,
  bills: Bill[],
  income: IncomeSource[],
  investments: Investment[],
  whatIfItems: { name: string; amount: number; frequency: string; type: "expense" | "income" | "investment" }[],
  viewMode: ViewMode,
  plannedEvents: PlannedEvent[] = []
): ProjectionPeriod[] {
  // Inject what-if items as temporary entries
  const today = new Date().toISOString().slice(0, 10);
  const extraBills: Bill[] = whatIfItems
    .filter((i) => i.type === "expense")
    .map((i, idx) => ({ id: `whatif-e-${idx}`, name: i.name, category: "other" as const, amount: i.amount, frequency: i.frequency as Bill["frequency"], nextDate: today, status: "active" as const }));
  const extraIncome: IncomeSource[] = whatIfItems
    .filter((i) => i.type === "income")
    .map((i, idx) => ({ id: `whatif-i-${idx}`, name: i.name, category: "other" as const, amount: i.amount, frequency: i.frequency as IncomeSource["frequency"], nextDate: today, status: "active" as const }));
  const extraInvestments: Investment[] = whatIfItems
    .filter((i) => i.type === "investment")
    .map((i, idx) => ({ id: `whatif-v-${idx}`, name: i.name, category: "other" as const, amount: i.amount, frequency: i.frequency as Investment["frequency"], nextDate: today, status: "active" as const }));

  return buildProjection(
    startBalance,
    [...bills, ...extraBills],
    [...income, ...extraIncome],
    [...investments, ...extraInvestments],
    viewMode,
    plannedEvents
  );
}

export function projectionTitle(viewMode: ViewMode): string {
  switch (viewMode) {
    case "weekly":    return "12-Week Projection";
    case "biweekly":  return "6-Month Projection";
    case "monthly":   return "12-Month Projection";
  }
}
