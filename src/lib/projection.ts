import type { Bill, IncomeSource } from "./types";

export type ViewMode = "weekly" | "biweekly" | "monthly";

export interface ProjectionPeriod {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

/**
 * Convert any frequency amount to a per-day rate for accurate projection.
 * This avoids rounding errors when aggregating across different period sizes.
 */
function toDailyRate(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":       return amount / 7;
    case "biweekly":     return amount / 14;
    case "semimonthly":  return (amount * 24) / 365;  // 24 payments/year
    case "monthly":      return (amount * 12) / 365;
    case "quarterly":    return (amount * 4) / 365;
    case "annually":     return amount / 365;
    default:             return 0; // one-time handled separately
  }
}

/**
 * Build 12 projection periods for the given view mode.
 *
 * - Weekly:    12 periods × 7 days  = 84 days  (~3 months)
 * - Biweekly:  12 periods × 14 days = 168 days (~6 months)
 * - Monthly:   12 periods × ~30 days = 365 days (1 year)
 */
export function buildProjection(
  startBalance: number,
  bills: Bill[],
  income: IncomeSource[],
  viewMode: ViewMode
): ProjectionPeriod[] {
  const activeBills = bills.filter((b) => b.status === "active" && b.frequency !== "one-time");
  const activeIncome = income.filter((i) => i.frequency !== "one-time");

  // One-time items (bills and income) — we'll place them in the right period
  const oneTimeBills = bills.filter((b) => b.frequency === "one-time" && b.status === "active");
  const oneTimeIncome = income.filter((i) => i.frequency === "one-time");

  // Daily rates for recurring items
  const dailyExpense = activeBills.reduce((sum, b) => sum + toDailyRate(b.amount, b.frequency), 0);
  const dailyIncome = activeIncome.reduce((sum, i) => sum + toDailyRate(i.amount, i.frequency), 0);

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
      // Monthly — use calendar months
      periodStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      if (i === 0) periodStart = new Date(today); // current month starts from today
      periodEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0); // last day of month
      label = periodStart.toLocaleDateString("en-US", { month: "short" });
      if (i === 0) {
        label = periodStart.toLocaleDateString("en-US", { month: "short" });
      }
    }

    // Days in this period
    const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Recurring
    let periodIncome = Math.round(dailyIncome * days);
    let periodExpense = Math.round(dailyExpense * days);

    // Add one-time items that fall within this period
    for (const bill of oneTimeBills) {
      const d = new Date(bill.nextDate + "T00:00:00");
      if (d >= periodStart && d <= periodEnd) {
        periodExpense += bill.amount;
      }
    }
    for (const inc of oneTimeIncome) {
      const d = new Date(inc.nextDate + "T00:00:00");
      if (d >= periodStart && d <= periodEnd) {
        periodIncome += inc.amount;
      }
    }

    running += periodIncome - periodExpense;

    periods.push({
      label,
      income: periodIncome,
      expense: periodExpense,
      balance: Math.round(running),
    });
  }

  return periods;
}

/** Human-readable title for the projection section */
export function projectionTitle(viewMode: ViewMode): string {
  switch (viewMode) {
    case "weekly":    return "12-Week Projection";
    case "biweekly":  return "6-Month Projection";
    case "monthly":   return "12-Month Projection";
  }
}
