"use client";

import { useMemo, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { BalanceHero } from "./BalanceHero";
import { ProjectionChart } from "./ProjectionChart";
import { UpcomingBills } from "./UpcomingBills";
import { QuickActions } from "./QuickActions";
import { PeriodDetail } from "./PeriodDetail";
import { WhatIfPanel } from "./WhatIfPanel";
import type { WhatIfItem } from "./WhatIfPanel";
import { useSharedStore } from "@/hooks/StoreProvider";
import { buildProjection, buildWhatIfProjection, projectionTitle } from "@/lib/projection";
import type { ViewMode } from "@/lib/projection";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "weekly", label: "W" },
  { value: "biweekly", label: "2W" },
  { value: "monthly", label: "M" },
];

export function Dashboard() {
  const { bills, income, investments, plannedEvents, latestCheckIn, totalMonthlyBills, totalMonthlyIncome, monthlyAvailableToSpend, checkIns, settings, loaded } = useSharedStore();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfItems, setWhatIfItems] = useState<WhatIfItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

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
    () => buildProjection(balance, bills, income, investments, viewMode, plannedEvents),
    [balance, bills, income, investments, viewMode, plannedEvents]
  );

  const whatIfPeriods = useMemo(
    () => whatIfItems.length > 0
      ? buildWhatIfProjection(balance, bills, income, investments, whatIfItems, viewMode)
      : undefined,
    [balance, bills, income, investments, whatIfItems, viewMode]
  );

  // Monthly impact of what-if items
  const whatIfMonthlyImpact = useMemo(() => {
    const toMonthly = (amount: number, freq: string) => {
      if (freq === "weekly") return amount * (52 / 12);
      if (freq === "biweekly") return amount * (26 / 12);
      if (freq === "semimonthly") return amount * 2;
      if (freq === "quarterly") return amount / 3;
      if (freq === "annually") return amount / 12;
      return amount;
    };
    return whatIfItems.reduce((sum, item) => {
      const monthly = toMonthly(item.amount, item.frequency);
      return sum + (item.type === "income" ? monthly : -monthly);
    }, 0);
  }, [whatIfItems]);

  const handleAddWhatIf = useCallback((item: WhatIfItem) => {
    setWhatIfItems((prev) => [...prev, item]);
  }, []);

  const handleRemoveWhatIf = useCallback((index: number) => {
    setWhatIfItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
        monthlyAvailableToSpend={monthlyAvailableToSpend}
        streak={streak}
        viewMode={viewMode}
      />

      <QuickActions />

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-gray-900">{projectionTitle(viewMode)}</h2>
          <div className="flex items-center gap-2">
            {!whatIfOpen && (
              <button
                onClick={() => setWhatIfOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Sparkles className="h-3.5 w-3.5" />
                What If
              </button>
            )}
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
        </div>

        <ProjectionChart
          periods={periods}
          whatIfPeriods={whatIfPeriods}
          threshold={settings.threshold}
          selectedIndex={selectedPeriod}
          onPeriodClick={(i) => setSelectedPeriod(selectedPeriod === i ? null : i)}
        />

        {selectedPeriod !== null && periods[selectedPeriod] && (
          <PeriodDetail
            period={periods[selectedPeriod]}
            whatIfPeriod={whatIfPeriods?.[selectedPeriod]}
            threshold={settings.threshold}
            onClose={() => setSelectedPeriod(null)}
          />
        )}

        {whatIfOpen && (
          <div className="mt-4">
            <WhatIfPanel
              items={whatIfItems}
              onAdd={handleAddWhatIf}
              onRemove={handleRemoveWhatIf}
              onClear={() => setWhatIfItems([])}
              onClose={() => { setWhatIfOpen(false); setWhatIfItems([]); }}
              monthlyImpact={whatIfMonthlyImpact}
            />
          </div>
        )}
      </div>

      {upcomingBills.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">Upcoming Expenses</h2>
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
