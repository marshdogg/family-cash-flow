"use client";

import { useMemo } from "react";
import { BalanceHero } from "./BalanceHero";
import { ProjectionChart } from "./ProjectionChart";
import { UpcomingBills } from "./UpcomingBills";
import { QuickActions } from "./QuickActions";
import { useStore } from "@/hooks/useStore";

export function Dashboard() {
  const { bills, latestCheckIn, totalMonthlyBills, totalMonthlyIncome, checkIns, loaded } = useStore();

  const balance = latestCheckIn?.bankBalance ?? 0;
  const weeklyExpenses = totalMonthlyBills / 4.33;
  const weeklyIncome = totalMonthlyIncome / 4.33;
  const weeklyNet = weeklyIncome - weeklyExpenses;

  const lastCheckInLabel = useMemo(() => {
    if (!latestCheckIn) return "Never";
    const days = Math.floor((Date.now() - new Date(latestCheckIn.completedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }, [latestCheckIn]);

  // Build 12-week projection from current balance
  const periods = useMemo(() => {
    let running = balance;
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + i * 7);
      running += weeklyNet;
      return {
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        income: Math.round(weeklyIncome),
        expense: Math.round(weeklyExpenses),
        balance: Math.round(running),
      };
    });
  }, [balance, weeklyNet, weeklyIncome, weeklyExpenses]);

  // Upcoming bills (next 14 days)
  const upcomingBills = useMemo(() => {
    const cutoff = Date.now() + 14 * 24 * 60 * 60 * 1000;
    return bills
      .filter((b) => b.status === "active" && new Date(b.nextDate + "T00:00:00").getTime() <= cutoff)
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
      .slice(0, 5)
      .map((b) => ({
        name: b.name,
        amount: b.amount,
        date: new Date(b.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        category: b.category,
      }));
  }, [bills]);

  const streak = checkIns.length;

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:max-w-4xl lg:px-8 lg:py-8">
      <BalanceHero
        balance={balance}
        lastCheckIn={lastCheckInLabel}
        weeklyIncome={Math.round(weeklyIncome)}
        weeklyExpenses={Math.round(weeklyExpenses)}
        streak={streak}
      />

      <QuickActions />

      {periods.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">12-Week Projection</h2>
          <ProjectionChart periods={periods} threshold={500} />
        </div>
      )}

      {upcomingBills.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">Upcoming Bills</h2>
          <UpcomingBills bills={upcomingBills} />
        </div>
      )}

      {!latestCheckIn && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 px-6 py-10 text-center">
          <h3 className="text-[16px] font-bold text-gray-900">Welcome! Start with a check-in</h3>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-gray-500">
            Complete your first weekly check-in to see your cash flow projection and get started.
          </p>
        </div>
      )}
    </div>
  );
}
