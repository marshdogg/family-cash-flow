export type BillCategory = "housing" | "utilities" | "insurance" | "transport" | "groceries" | "childcare" | "subscriptions" | "loan" | "other";
export type IncomeCategory = "paycheck" | "bonus" | "side" | "benefits" | "refund" | "other";
export type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly" | "quarterly" | "annually" | "one-time";

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  frequency: Frequency;
  nextDate: string;
  status: "active" | "paused";
}

export interface IncomeSource {
  id: string;
  name: string;
  category: IncomeCategory;
  amount: number;
  frequency: Frequency;
  nextDate: string;
  status: "active" | "expected";
}

export type InvestmentCategory = "rrsp" | "tfsa" | "resp" | "brokerage" | "realestate" | "crypto" | "other";

export interface Investment {
  id: string;
  name: string;
  category: InvestmentCategory;
  amount: number;
  frequency: Frequency;
  nextDate: string;
  status: "active" | "paused";
}

export type PlannedEventCategory = "trip" | "camp" | "holiday" | "school" | "car" | "home" | "medical" | "other";

export interface PlannedEvent {
  id: string;
  name: string;
  category: PlannedEventCategory;
  amount: number;
  targetDate: string;
  savedSoFar: number;
  status: "saving" | "funded" | "spent";
}

export interface CheckIn {
  id: string;
  bankBalance: number;
  completedAt: string;
  weekStart: string;
}
