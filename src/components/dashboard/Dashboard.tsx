"use client";

import { useMemo, useState } from "react";
import { BalanceHero } from "./BalanceHero";
import { ProjectionChart } from "./ProjectionChart";
import { UpcomingBills } from "./UpcomingBills";
import { QuickActions } from "./QuickActions";
import { useStore } from "@/hooks/useStore";
import { buildProjection, projectionTitle } from "@/lib/projection";
import type { ViewMode } from "@/lib/projection";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "weekly", label: "W" },
  { value: "biweekly", label: "2W" },
  { value: "monthly", label: "M" },
];

export function Dashboard() {
  const { bills, income, latestCheckIn, totalMonthlyBills, totalMonthlyIncome, checkIns, settings, loaded } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  const balance = latestCheckIn?.bankBalance ?? 0;
  const weeklyExpenses = totalMonthlyBills / (52 / 12);
  const weeklyIncome = totalMonthlyIncome / (52 / 12);

  const lastCheckInLabel = useMemo(() => {
    if (!latestCheckIn) return "Never";
    const days = Math.floor((Date.now() - new Date(latestCheckIn.completedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }, [latestCheckIn]);

  const periods = useMemo(
    () => buildProjection(balance, bills, income, viewMode),
    [balance, bills, income, viewMode]
  );

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

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-gray-900">{projectionTitle(viewMode)}</h2>
          <div className="flex gap-0.5 rounded-lg bg-gray-100 p-[3px]">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  viewMode === opt.value
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={opt.value === "weekly" ? "Weekly" : opt.value === "biweekly" ? "Biweekly" : "Monthly"}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <ProjectionChart periods={periods} threshold={settings.threshold} />
      </div>

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
