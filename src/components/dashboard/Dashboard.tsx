"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Sparkles, Flame, ClipboardCheck, Check } from "lucide-react";
import Link from "next/link";
import { ProjectionChart } from "./ProjectionChart";
import { PeriodDetail } from "./PeriodDetail";
import { WhatIfPanel } from "./WhatIfPanel";
import type { WhatIfItem } from "./WhatIfPanel";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { AddIncomeForm } from "@/components/forms/AddIncomeForm";
import { AddInvestmentForm } from "@/components/forms/AddInvestmentForm";
import { AddPlanForm } from "@/components/forms/AddPlanForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { buildProjection, buildWhatIfProjection } from "@/lib/projection";
import { formatCurrency } from "@/lib/format";
import type { ViewMode } from "@/lib/projection";
import type { Bill, IncomeSource, Investment, PlannedEvent } from "@/lib/types";

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

const INCOME_ICONS: Record<string, { icon: string; bg: string }> = {
  paycheck: { icon: "💰", bg: "#DCFCE7" },
  bonus: { icon: "🎉", bg: "#FEF3C7" },
  side: { icon: "💼", bg: "#F0EBFF" },
  benefits: { icon: "🏛", bg: "#E8F2FF" },
  refund: { icon: "📥", bg: "#FCE7F3" },
  other: { icon: "📋", bg: "#F3F4F6" },
};

const INVEST_ICONS: Record<string, { icon: string; bg: string }> = {
  rrsp: { icon: "📊", bg: "#F0EBFF" },
  tfsa: { icon: "🛡", bg: "#E8F2FF" },
  resp: { icon: "🎓", bg: "#FEF3C7" },
  brokerage: { icon: "📈", bg: "#DCFCE7" },
  realestate: { icon: "🏘", bg: "#FCE7F3" },
  crypto: { icon: "₿", bg: "#FEF3C7" },
  other: { icon: "💎", bg: "#F3F4F6" },
};

export function Dashboard() {
  const store = useSharedStore();
  const [previewEmpty, setPreviewEmpty] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview")) {
      setPreviewEmpty(true);
    }
  }, []);

  const { bills: realBills, income: realIncome, investments: realInvestments, plannedEvents: realPlannedEvents, latestCheckIn: realLatestCheckIn, totalMonthlyBills: realTotalMonthlyBills, totalMonthlyIncome: realTotalMonthlyIncome, totalMonthlyInvestments: realTotalMonthlyInvestments, totalMonthlySavingsNeeded: realTotalMonthlySavingsNeeded, monthlyAvailableToSpend: realMonthlyAvailableToSpend, checkIns: realCheckIns, updateBill, updateIncome, updateInvestment, updatePlannedEvent, settings, loaded } = store;

  const bills = previewEmpty ? [] : realBills;
  const income = previewEmpty ? [] : realIncome;
  const investments = previewEmpty ? [] : realInvestments;
  const plannedEvents = previewEmpty ? [] : realPlannedEvents;
  const latestCheckIn = previewEmpty ? null : realLatestCheckIn;
  const totalMonthlyBills = previewEmpty ? 0 : realTotalMonthlyBills;
  const totalMonthlyIncome = previewEmpty ? 0 : realTotalMonthlyIncome;
  const totalMonthlyInvestments = previewEmpty ? 0 : realTotalMonthlyInvestments;
  const totalMonthlySavingsNeeded = previewEmpty ? 0 : realTotalMonthlySavingsNeeded;
  const monthlyAvailableToSpend = previewEmpty ? 0 : realMonthlyAvailableToSpend;
  const checkIns = previewEmpty ? [] : realCheckIns;

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfItems, setWhatIfItems] = useState<WhatIfItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editIncome, setEditIncome] = useState<IncomeSource | null>(null);
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [editPlan, setEditPlan] = useState<PlannedEvent | null>(null);

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

  // Upcoming: all cash flow items in the next 30 days + planned events in 90 days, sorted by date
  const activityFeed = useMemo(() => {
    const cutoff30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const cutoff90 = Date.now() + 90 * 24 * 60 * 60 * 1000;

    const billItems = bills
      .filter((b) => b.status === "active" && new Date(b.nextDate + "T00:00:00").getTime() <= cutoff30)
      .map((b) => ({
        type: "bill" as const,
        id: b.id,
        name: b.name,
        amount: b.amount,
        date: b.nextDate,
        dateLabel: new Date(b.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: BILL_ICONS[b.category]?.icon ?? "📋",
        bg: BILL_ICONS[b.category]?.bg ?? "#F3F4F6",
      }));

    const incomeItems = income
      .filter((i) => i.frequency !== "one-time" && new Date(i.nextDate + "T00:00:00").getTime() <= cutoff30)
      .map((i) => ({
        type: "income" as const,
        id: i.id,
        name: i.name,
        amount: i.amount,
        date: i.nextDate,
        dateLabel: new Date(i.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: INCOME_ICONS[i.category]?.icon ?? "📋",
        bg: INCOME_ICONS[i.category]?.bg ?? "#F3F4F6",
      }));

    const investmentItems = investments
      .filter((i) => i.frequency !== "one-time" && i.status === "active" && new Date(i.nextDate + "T00:00:00").getTime() <= cutoff30)
      .map((i) => ({
        type: "investment" as const,
        id: i.id,
        name: i.name,
        amount: i.amount,
        date: i.nextDate,
        dateLabel: new Date(i.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: INVEST_ICONS[i.category]?.icon ?? "💎",
        bg: INVEST_ICONS[i.category]?.bg ?? "#F3F4F6",
      }));

    const eventItems = plannedEvents
      .filter((e) => e.status !== "spent" && new Date(e.targetDate + "T00:00:00").getTime() <= cutoff90)
      .map((e) => ({
        type: "event" as const,
        id: e.id,
        name: e.name,
        amount: e.amount,
        date: e.targetDate,
        dateLabel: new Date(e.targetDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        icon: EVENT_ICONS[e.category] ?? "📋",
        bg: "#FEF3C7",
        saved: e.savedSoFar,
        progress: Math.round((e.savedSoFar / e.amount) * 100),
      }));

    return [...billItems, ...incomeItems, ...investmentItems, ...eventItems]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [bills, income, investments, plannedEvents]);

  const streak = checkIns.length;

  if (!loaded) return null;

  // ── Full-page onboarding for first-time users ──
  const hasIncome = income.length > 0;
  const hasExpenses = bills.length > 0;
  const hasPlans = plannedEvents.length > 0;
  const hasCheckIn = !!latestCheckIn;
  const isNewUser = !hasIncome || !hasExpenses || !hasPlans || !hasCheckIn;

  if (isNewUser) {
    const setupSteps = [
      {
        num: 1,
        done: hasIncome,
        title: "Add your income",
        description: "Paychecks, side hustles, benefits — anything that puts money in your account.",
        icon: "💰",
        href: "/income",
      },
      {
        num: 2,
        done: hasExpenses,
        title: "Add your expenses",
        description: "Rent, utilities, groceries, subscriptions — your recurring costs.",
        icon: "📋",
        href: "/bills",
      },
      {
        num: 3,
        done: hasPlans,
        title: "Add a savings goal",
        description: "Upcoming trips, tuition, big purchases — things you're saving toward.",
        icon: "📅",
        href: "/plans",
      },
      {
        num: 4,
        done: hasCheckIn,
        title: "Complete your first check-in",
        description: "Enter your current bank balance and Runway will project your cash flow forward.",
        icon: "📊",
        href: "/check-in",
      },
    ];

    // Find the first incomplete step so we can highlight it
    const nextStepNum = setupSteps.find((s) => !s.done)?.num ?? 0;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          <h1 className="text-[26px] font-bold text-gray-900">Not sure where your money goes?</h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
            Let&apos;s find out together. A few quick steps and you&apos;ll have a clear picture of your cash flow. No judgment, just clarity.
          </p>

          {/* Step tiles */}
          <div className="mt-8 space-y-3">
            {setupSteps.map((step) => {
              const isNext = step.num === nextStepNum;

              if (step.done) {
                return (
                  <div
                    key={step.num}
                    className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-left"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-green-700 line-through">{step.title}</div>
                      <div className="mt-0.5 text-[12px] text-green-500">Done</div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={step.num}
                  href={step.href}
                  className={`group flex items-center gap-4 rounded-xl border px-5 text-left transition-colors ${
                    isNext
                      ? "border-purple-200 bg-white py-5 shadow-md hover:border-purple-300"
                      : "border-gray-100 bg-gray-50 py-4 opacity-60"
                  }`}
                >
                  <div className={`flex flex-shrink-0 items-center justify-center rounded-lg text-[18px] ${
                    isNext ? "h-12 w-12 bg-purple-50" : "h-10 w-10 bg-gray-100"
                  }`}>
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold ${isNext ? "text-[15px] text-gray-900" : "text-[14px] text-gray-500"}`}>
                      {step.title}
                    </div>
                    {isNext && (
                      <div className="mt-0.5 text-[12px] text-gray-400">{step.description}</div>
                    )}
                  </div>
                  {isNext && (
                    <span className="rounded-md bg-purple-500 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-colors group-hover:bg-purple-600">
                      Start
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <p className="mt-8 text-[11px] text-gray-300">
            Investments are optional — add them anytime from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
      {/* ── Metrics Strip ── */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gray-400">Balance</p>
            <div className="mt-0.5 font-mono text-[28px] font-bold leading-none tracking-tight text-gray-900 sm:text-[36px]">
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
          <Link
            href="/check-in"
            className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow sm:px-5"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Check-In</span>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-6">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Income</p>
            <p className="font-mono text-[14px] font-bold text-green-600 sm:text-[18px]">
              +{formatCurrency(displayIncome)}
              <span className="text-[10px] font-medium text-gray-300 sm:text-[11px]">{periodLabel}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400">Expenses</p>
            <p className="font-mono text-[14px] font-bold text-red-500 sm:text-[18px]">
              −{formatCurrency(displayExpenses)}
              <span className="text-[10px] font-medium text-gray-300 sm:text-[11px]">{periodLabel}</span>
            </p>
          </div>
          {displayInvestments > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400">Investments</p>
              <p className="font-mono text-[14px] font-bold text-purple-500 sm:text-[18px]">
                −{formatCurrency(displayInvestments)}
                <span className="text-[10px] font-medium text-gray-300 sm:text-[11px]">{periodLabel}</span>
              </p>
            </div>
          )}
          {displaySavings > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400">Goal Savings</p>
              <p className="font-mono text-[14px] font-bold text-amber-500 sm:text-[18px]">
                −{formatCurrency(displaySavings)}
                <span className="text-[10px] font-medium text-gray-300 sm:text-[11px]">{periodLabel}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-medium text-gray-400">Free Cash</p>
            <p className={`font-mono text-[14px] font-bold sm:text-[18px] ${displayAvailable >= 0 ? "text-green-600" : "text-red-500"}`}>
              {displayAvailable < 0 ? "−" : ""}{formatCurrency(Math.abs(displayAvailable))}
              <span className="text-[10px] font-medium text-gray-300 sm:text-[11px]">{periodLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Toggle + What If ── */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex flex-1 gap-1 rounded-lg bg-gray-100 p-[3px] sm:flex-initial">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setViewMode(opt.value); setSelectedPeriod(null); }}
              className={`flex-1 rounded-md px-4 py-2 text-[13px] font-bold transition-colors sm:flex-initial ${
                viewMode === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {opt.full}
            </button>
          ))}
        </div>

      </div>

      {/* ── Two Column: Chart + Activity Feed ── */}
      <div className="mt-4 grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: Chart */}
        <div>
          <ProjectionChart
            periods={periods}
            whatIfPeriods={whatIfPeriods}
            threshold={settings.threshold}
            selectedIndex={selectedPeriod}
            onPeriodClick={(i) => setSelectedPeriod(selectedPeriod === i ? null : i)}
            onEventClick={(eventId) => {
              const plan = plannedEvents.find((e) => e.id === eventId);
              if (plan) setEditPlan(plan);
            }}
          />

          {selectedPeriod !== null && periods[selectedPeriod] && (
            <PeriodDetail
              period={periods[selectedPeriod]}
              whatIfPeriod={whatIfPeriods?.[selectedPeriod]}
              threshold={settings.threshold}
              onClose={() => setSelectedPeriod(null)}
            />
          )}

          {/* What If button below chart */}
          {!whatIfOpen && (
            <button
              onClick={() => setWhatIfOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-5 py-2.5 text-[13px] font-bold text-amber-700 shadow-md transition-colors hover:bg-amber-100"
            >
              <Sparkles className="h-4 w-4" />
              What If
            </button>
          )}

          {/* Inline What If panel */}
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
        <div className="min-w-0 overflow-hidden rounded-lg bg-white shadow-md">
          {activityFeed.length > 0 ? (
            <div>
              <h3 className="border-b border-gray-100 px-3.5 py-2 text-[11px] font-bold tracking-wider text-gray-400">UPCOMING TRANSACTIONS</h3>
            {activityFeed.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  if (item.type === "event") {
                    const plan = plannedEvents.find((e) => e.id === item.id);
                    if (plan) setEditPlan(plan);
                  } else if (item.type === "income") {
                    const inc = income.find((i) => i.id === item.id);
                    if (inc) setEditIncome(inc);
                  } else if (item.type === "investment") {
                    const inv = investments.find((i) => i.id === item.id);
                    if (inv) setEditInvestment(inv);
                  } else {
                    const bill = bills.find((b) => b.id === item.id);
                    if (bill) setEditBill(bill);
                  }
                }}
                className="flex w-full min-w-0 items-center gap-3 border-b border-gray-100 px-3.5 py-3 text-left last:border-b-0 transition-colors hover:bg-gray-50"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[13px]"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-gray-900">{item.name}</div>
                  <div className="text-[11px] text-gray-400">{item.dateLabel}</div>
                </div>
                <div className="flex-shrink-0 text-right">
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
                  ) : item.type === "income" ? (
                    <div className="font-mono text-[12px] font-semibold text-green-600">
                      +{formatCurrency(item.amount)}
                    </div>
                  ) : item.type === "investment" ? (
                    <div className="font-mono text-[12px] font-semibold text-purple-500">
                      −{formatCurrency(item.amount)}
                    </div>
                  ) : (
                    <div className="font-mono text-[12px] font-semibold text-gray-700">
                      −{formatCurrency(item.amount)}
                    </div>
                  )}
                </div>
              </button>
            ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-[12px] text-gray-400">No upcoming items</p>
              <p className="mt-1 text-[11px] text-gray-300">Add expenses and plans to see what&apos;s coming up</p>
            </div>
          )}
        </div>
      </div>

      {editBill && (
        <AddBillForm
          initialData={{ name: editBill.name, category: editBill.category, amount: editBill.amount, frequency: editBill.frequency, nextDate: editBill.nextDate }}
          onSubmit={(data) => {
            updateBill(editBill.id, data);
            setEditBill(null);
          }}
          onClose={() => setEditBill(null)}
        />
      )}

      {editIncome && (
        <AddIncomeForm
          initialData={{ name: editIncome.name, category: editIncome.category, amount: editIncome.amount, frequency: editIncome.frequency, nextDate: editIncome.nextDate, status: editIncome.status }}
          onSubmit={(data) => {
            updateIncome(editIncome.id, data);
            setEditIncome(null);
          }}
          onClose={() => setEditIncome(null)}
        />
      )}

      {editInvestment && (
        <AddInvestmentForm
          initialData={{ name: editInvestment.name, category: editInvestment.category, amount: editInvestment.amount, frequency: editInvestment.frequency, nextDate: editInvestment.nextDate }}
          onSubmit={(data) => {
            updateInvestment(editInvestment.id, data);
            setEditInvestment(null);
          }}
          onClose={() => setEditInvestment(null)}
        />
      )}

      {editPlan && (
        <AddPlanForm
          initialData={{ name: editPlan.name, category: editPlan.category, amount: editPlan.amount, savedSoFar: editPlan.savedSoFar, targetDate: editPlan.targetDate, contributionAmount: editPlan.contributionAmount, contributionFrequency: editPlan.contributionFrequency }}
          onSubmit={(data) => {
            updatePlannedEvent(editPlan.id, data);
            setEditPlan(null);
          }}
          onClose={() => setEditPlan(null)}
        />
      )}
    </div>
  );
}
