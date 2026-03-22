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

export interface CheckIn {
  id: string;
  bankBalance: number;
  completedAt: string;
  weekStart: string;
}
