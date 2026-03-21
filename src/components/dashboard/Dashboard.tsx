"use client";

import { BalanceHero } from "./BalanceHero";
import { ProjectionChart } from "./ProjectionChart";
import { UpcomingBills } from "./UpcomingBills";
import { QuickActions } from "./QuickActions";

// Mock data — will be replaced with real data hooks
const MOCK = {
  balance: 4280,
  lastCheckIn: "2 days ago",
  threshold: 500,
  weeklyIncome: 2400,
  weeklyExpenses: 1850,
  streak: 4,
  periods: [
    { label: "Mar 17", income: 2400, expense: 1850, balance: 4830 },
    { label: "Mar 24", income: 2400, expense: 2100, balance: 5130 },
    { label: "Mar 31", income: 2400, expense: 1750, balance: 5780 },
    { label: "Apr 7", income: 2400, expense: 3200, balance: 4980 },
    { label: "Apr 14", income: 2400, expense: 1900, balance: 5480 },
    { label: "Apr 21", income: 2400, expense: 1850, balance: 6030 },
    { label: "Apr 28", income: 2400, expense: 2500, balance: 5930 },
    { label: "May 5", income: 2400, expense: 1800, balance: 6530 },
    { label: "May 12", income: 2400, expense: 4100, balance: 4830 },
    { label: "May 19", income: 2400, expense: 1750, balance: 5480 },
    { label: "May 26", income: 2400, expense: 2000, balance: 5880 },
    { label: "Jun 2", income: 2400, expense: 1900, balance: 6380 },
  ],
  upcomingBills: [
    { name: "Rent", amount: 1800, date: "Mar 25", category: "housing" as const },
    { name: "Car Insurance", amount: 145, date: "Mar 27", category: "insurance" as const },
    { name: "Netflix", amount: 15, date: "Mar 28", category: "subscriptions" as const },
    { name: "Electric Bill", amount: 120, date: "Apr 1", category: "utilities" as const },
  ],
};

export function Dashboard() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:max-w-4xl lg:px-8 lg:py-8">
      <BalanceHero
        balance={MOCK.balance}
        lastCheckIn={MOCK.lastCheckIn}
        weeklyIncome={MOCK.weeklyIncome}
        weeklyExpenses={MOCK.weeklyExpenses}
        streak={MOCK.streak}
      />

      <QuickActions />

      <div className="mt-6">
        <h2 className="mb-3 text-[15px] font-bold text-gray-900">12-Week Projection</h2>
        <ProjectionChart
          periods={MOCK.periods}
          threshold={MOCK.threshold}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-[15px] font-bold text-gray-900">Upcoming Bills</h2>
        <UpcomingBills bills={MOCK.upcomingBills} />
      </div>
    </div>
  );
}
