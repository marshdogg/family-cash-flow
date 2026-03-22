"use client";

import { useMemo, useState, useCallback } from "react";
import { Sparkles, Flame, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { ProjectionChart } from "./ProjectionChart";
import { PeriodDetail } from "./PeriodDetail";
import { WhatIfPanel } from "./WhatIfPanel";
import type { WhatIfItem } from "./WhatIfPanel";
import { useSharedStore } from "@/hooks/StoreProvider";
import { buildProjection, buildWhatIfProjection } from "@/lib/projection";
import { formatCurrency } from "@/lib/format";
import type { ViewMode } from "@/lib/projection";

const VIEW_OPTIONS: { value: ViewMode; label: string; full: string }[] = [
  { value: "weekly", label: "W", full: "Weekly" },
  { value: "biweekly", label: "2W", full: "Biweekly" },
  { value: "monthly", label: "M", full: "Monthly" },
];

const BILL_ICONS: Record<string, { icon: string; bg: string }> = {
  housing: { icon: "🏠", bg: "#F0EBFF" },
  utilities: { icon: "⚡", bg: "#FEF3C7" },
  insurance: { icon: "🛡", bg: "#E8F2FF" },
  transport: { icon: "🚗", bg: "#F3F4F6" },
  groceries: { icon: "🛒", bg: "#DCFCE7" },
  childcare: { icon: "👶", bg: "#FCE7F3" },
  subscriptions: { icon: "📱", bg: "#F0EBFF" },
  loan: { icon: "🏦", bg: "#FEE2E2" },
  other: { icon: "📋", bg: "#F3F4F6" },
};

const EVENT_ICONS: Record<string, string> = {
  trip: "✈️", camp: "⛺", holiday: "🎄", school: "🎒", car: "🚗", home: "🏠", medical: "🏥", other: "📋",
};

export function Dashboard() {
  const { bills, income, investments, plannedEvents, latestCheckIn, totalMonthlyBills, totalMonthlyIncome, totalMonthlyInvestments, totalMonthlySavingsNeeded, monthlyAvailableToSpend, checkIns, settings, loaded } = useSharedStore();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfItems, setWhatIfItems] = useState<WhatIfItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  const balance = latestCheckIn?.bankBalance ?? 0;
  const weeklyExpenses = totalMonthlyBills / (52 / 12);
  const weeklyIncome = totalMonthlyIncome / (52 / 12);

  const scale = viewMode === "weekly" ? 1 : viewMode === "biweekly" ? 2 : (52 / 12);
  const periodLabel = viewMode === "weekly" ? "/wk" : viewMode === "biweekly" ? "/2wk" : "/mo";
  const displayIncome = Math.round(weeklyIncome * scale);
  const displayExpenses = Math.round(weeklyExpenses * scale);
  const displayInvestments = Math.round((totalMonthlyInvestments / (52 / 12)) * scale);
  const displaySavings = Math.round((totalMonthlySavingsNeeded / (52 / 12)) * scale);
  const weeklyAvailable = monthlyAvailableToSpend / (52 / 12);
  const displayAvailable = Math.round(viewMode === "weekly" ? weeklyAvailable : viewMode === "biweekly" ? weeklyAvailable * 2 : monthlyAvailableToSpend);

  const lastCheckInLabel = useMemo(() => {
    if (!latestCheckIn) return "Never";
    const days = Math.floor((Date.now() - new Date(latestCheckIn.completedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }, [latestCheckIn]);

  const periods = useMemo(
    () => buildProjection(balance, bills, income, investments, viewMode, plannedEvents),
    [balance, bills, income, investments, viewMode, plannedEvents]
  );

  const whatIfPeriods = useMemo(
    () => whatIfItems.length > 0
      ? buildWhatIfProjection(balance, bills, income, investments, whatIfItems, viewMode, plannedEvents)
      : undefined,
    [balance, bills, income, investments, whatIfItems, viewMode, plannedEvents]
  );

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

  // Upcoming: bills in next 30 days + planned events in next 90 days, merged and sorted by date
  const activityFeed = useMemo(() => {
    const billCutoff = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const eventCutoff = Date.now() + 90 * 24 * 60 * 60 * 1000;

    const billItems = bills
      .filter((b) => b.status === "active" && new Date(b.nextDate + "T00:00:00").getTime() <= billCutoff)
      .map((b) => ({
        type: "bill" as const,
        name: b.name,
        amount: b.amount,
        date: b.nextDate,
        dateLabel: new Date(b.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: BILL_ICONS[b.category]?.icon ?? "📋",
        bg: BILL_ICONS[b.category]?.bg ?? "#F3F4F6",
      }));

    const eventItems = plannedEvents
      .filter((e) => e.status !== "spent" && new Date(e.targetDate + "T00:00:00").getTime() <= eventCutoff)
      .map((e) => ({
        type: "event" as const,
        name: e.name,
        amount: e.amount,
        date: e.targetDate,
        dateLabel: new Date(e.targetDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: EVENT_ICONS[e.category] ?? "📋",
        bg: "#FEF3C7",
        saved: e.savedSoFar,
        progress: Math.round((e.savedSoFar / e.amount) * 100),
      }));

    return [...billItems, ...eventItems]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [bills, plannedEvents]);

  const streak = checkIns.length;

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
      {/* ── Metrics Strip ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <p className="text-[12px] font-medium text-gray-400">Balance</p>
          <div className="mt-0.5 font-mono text-[36px] font-bold leading-none tracking-tight text-gray-900">
            {formatCurrency(balance)}
          </div>
          <p className="mt-1.5 text-[12px] text-gray-400">
            Last check-in {lastCheckInLabel}
            {streak > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-600">
                <Flame className="h-3 w-3" /> {streak} wk streak
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Income</p>
            <p className="font-mono text-[18px] font-bold text-green-600">
              +{formatCurrency(displayIncome)}
              <span className="text-[11px] font-medium text-gray-300">{periodLabel}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400">Expenses</p>
            <p className="font-mono text-[18px] font-bold text-red-500">
              −{formatCurrency(displayExpenses)}
              <span className="text-[11px] font-medium text-gray-300">{periodLabel}</span>
            </p>
          </div>
          {displayInvestments > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400">Investments</p>
              <p className="font-mono text-[18px] font-bold text-purple-500">
                −{formatCurrency(displayInvestments)}
                <span className="text-[11px] font-medium text-gray-300">{periodLabel}</span>
              </p>
            </div>
          )}
          {displaySavings > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400">Plan Savings</p>
              <p className="font-mono text-[18px] font-bold text-amber-500">
                −{formatCurrency(displaySavings)}
                <span className="text-[11px] font-medium text-gray-300">{periodLabel}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-medium text-gray-400">Free Cash</p>
            <p className={`font-mono text-[18px] font-bold ${displayAvailable >= 0 ? "text-purple-600" : "text-red-500"}`}>
              {formatCurrency(Math.abs(displayAvailable))}
              <span className="text-[11px] font-medium text-gray-300">{periodLabel}</span>
            </p>
          </div>

          <Link
            href="/check-in"
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow"
          >
            <ClipboardCheck className="h-4 w-4" />
            Check-In
          </Link>
        </div>
      </div>

      {/* ── Toggle + What If ── */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-[3px]">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setViewMode(opt.value); setSelectedPeriod(null); }}
              className={`rounded-md px-4 py-2 text-[13px] font-bold transition-colors ${
                viewMode === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {opt.full}
            </button>
          ))}
        </div>

        {!whatIfOpen && (
          <button
            onClick={() => setWhatIfOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            What If
          </button>
        )}
      </div>

      {/* ── Stacked: Chart then Activity Feed ── */}
      <div className="mt-4 space-y-4">
        {/* Chart */}
        <div>
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

        {/* Right: Activity Feed */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          {activityFeed.length > 0 ? (
            <div>
              <h3 className="border-b border-gray-100 px-3.5 py-2 text-[11px] font-bold tracking-wider text-gray-400">UPCOMING</h3>
            {activityFeed.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-gray-100 px-3.5 py-3 last:border-b-0 transition-colors hover:bg-gray-50"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[13px]"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-gray-900">{item.name}</div>
                  <div className="text-[11px] text-gray-400">{item.dateLabel}</div>
                </div>
                <div className="text-right">
                  {item.type === "event" ? (
                    <div>
                      <div className="font-mono text-[12px] font-bold text-amber-600">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="mt-0.5 h-1 w-14 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${(item as { progress: number }).progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono text-[12px] font-semibold text-gray-700">
                      −{formatCurrency(item.amount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[12px] text-gray-400">
              No upcoming expenses
            </p>
          )}
        </div>
      </div>

      {/* ── First-time prompt ── */}
      {!latestCheckIn && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 px-6 py-10 text-center">
          <h3 className="text-[16px] font-bold text-gray-900">Welcome! Start with a check-in</h3>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-gray-500">
            Complete your first weekly check-in to see your cash flow projection and get started.
          </p>
        </div>
      )}
    </div>
  );
}
