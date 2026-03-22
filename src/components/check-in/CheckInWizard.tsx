"use client";

import { useState, useMemo } from "react";
import { Check, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Bill, IncomeSource } from "@/lib/types";

interface CheckInWizardProps {
  bills: Bill[];
  income: IncomeSource[];
  previousBalance: number | null;
  onComplete: (bankBalance: number) => void;
  onCancel: () => void;
}

const STEPS = [
  { key: "balance", title: "Bank Balance", description: "Enter your current balance" },
  { key: "expenses", title: "Review Expenses", description: "Confirm your recurring expenses" },
  { key: "income", title: "Review Income", description: "Confirm your income sources" },
  { key: "summary", title: "Summary", description: "Your financial snapshot" },
];

export function CheckInWizard({ bills, income, previousBalance, onComplete, onCancel }: CheckInWizardProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [openStep, setOpenStep] = useState(0);
  const [bankBalance, setBankBalance] = useState(previousBalance ?? 0);
  const [balanceInput, setBalanceInput] = useState(previousBalance ? previousBalance.toLocaleString() : "");

  const activeBills = bills.filter((b) => b.status === "active");
  const activeIncome = income.filter((i) => i.frequency !== "one-time");

  const toWeekly = (amount: number, frequency: string) => {
    if (frequency === "weekly") return amount;
    if (frequency === "biweekly") return amount / 2;
    if (frequency === "semimonthly") return (amount * 2) / (52 / 12);
    if (frequency === "monthly") return amount / (52 / 12);
    if (frequency === "quarterly") return amount / 13;
    if (frequency === "annually") return amount / 52;
    return amount;
  };

  const weeklyExpenses = useMemo(() =>
    activeBills.reduce((sum, b) => sum + toWeekly(b.amount, b.frequency), 0),
    [activeBills]
  );

  const weeklyIncome = useMemo(() =>
    activeIncome.reduce((sum, i) => sum + toWeekly(i.amount, i.frequency), 0),
    [activeIncome]
  );

  const weeklyNet = weeklyIncome - weeklyExpenses;
  const projectedBalance = bankBalance + weeklyNet * 12;

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw) || 0;
    setBalanceInput(num > 0 ? num.toLocaleString() : "");
    setBankBalance(num);
  };

  const completeStep = (stepIndex: number) => {
    setCompletedSteps((prev) => { const next = new Set(prev); next.add(stepIndex); return next; });
    if (stepIndex < STEPS.length - 1) {
      setOpenStep(stepIndex + 1);
    }
  };

  const canCompleteStep = (stepIndex: number) => {
    if (stepIndex === 0) return bankBalance > 0;
    return true;
  };

  const getStepSummary = (stepIndex: number): string | null => {
    if (!completedSteps.has(stepIndex)) return null;
    switch (stepIndex) {
      case 0: return formatCurrency(bankBalance);
      case 1: return `${activeBills.length} expenses · ${formatCurrency(Math.round(weeklyExpenses))}/wk`;
      case 2: return `${activeIncome.length} sources · ${formatCurrency(Math.round(weeklyIncome))}/wk`;
      default: return null;
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {STEPS.map((s, i) => {
        const isOpen = openStep === i;
        const isCompleted = completedSteps.has(i);
        const isAccessible = i === 0 || completedSteps.has(i - 1);
        const summary = getStepSummary(i);

        return (
          <div key={s.key} className="overflow-hidden rounded-xl bg-white shadow-md">
            {/* Accordion Header */}
            <button
              onClick={() => isAccessible && setOpenStep(isOpen ? -1 : i)}
              disabled={!isAccessible}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${
                isAccessible ? "hover:bg-gray-50" : "opacity-50"
              }`}
            >
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isCompleted ? "bg-purple-500 text-white"
                : isOpen ? "bg-gradient-primary text-white"
                : "bg-gray-100 text-gray-400"
              }`}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-gray-900">{s.title}</div>
                {summary && !isOpen ? (
                  <div className="mt-0.5 text-[12px] font-medium text-purple-500">{summary}</div>
                ) : (
                  <div className="mt-0.5 text-[12px] text-gray-400">{s.description}</div>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-5">
                {/* Step 0: Bank Balance */}
                {i === 0 && (
                  <div>
                    <p className="text-[13px] text-gray-500">Check your bank app and enter the balance you see right now.</p>
                    <div className="mt-4 flex items-center rounded-md border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                      <span className="border-r border-gray-200 bg-gray-50 px-4 py-4 font-mono text-[18px] font-semibold text-gray-400">$</span>
                      <input
                        type="text"
                        value={balanceInput}
                        onChange={handleBalanceChange}
                        placeholder="0"
                        autoFocus
                        className="flex-1 border-none px-4 py-4 font-mono text-[28px] font-semibold text-gray-900 outline-none placeholder:text-gray-300"
                      />
                    </div>
                    {previousBalance != null && previousBalance > 0 && (
                      <p className="mt-3 text-[12px] text-gray-400">
                        Last check-in: {formatCurrency(previousBalance)}
                        {bankBalance > 0 && (
                          <span className={`ml-2 font-semibold ${bankBalance >= previousBalance ? "text-positive" : "text-negative"}`}>
                            {bankBalance >= previousBalance ? "+" : "−"}{formatCurrency(Math.abs(bankBalance - previousBalance))}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => completeStep(0)}
                        disabled={!canCompleteStep(0)}
                        className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Review Expenses */}
                {i === 1 && (
                  <div>
                    <p className="text-[13px] text-gray-500">{activeBills.length} active expenses totaling {formatCurrency(Math.round(weeklyExpenses))}/week</p>
                    <div className="mt-4 max-h-[300px] space-y-1.5 overflow-y-auto">
                      {activeBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3">
                          <div>
                            <div className="text-[13px] font-semibold text-gray-900">{bill.name}</div>
                            <div className="text-[11px] text-gray-400">{bill.frequency}</div>
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-gray-900">
                            −{formatCurrency(bill.amount)}
                          </div>
                        </div>
                      ))}
                      {activeBills.length === 0 && (
                        <p className="py-8 text-center text-[13px] text-gray-400">No expenses yet. Add some from the Expenses page.</p>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => completeStep(1)}
                        className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                      >
                        Looks Good
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Review Income */}
                {i === 2 && (
                  <div>
                    <p className="text-[13px] text-gray-500">{activeIncome.length} active sources totaling {formatCurrency(Math.round(weeklyIncome))}/week</p>
                    <div className="mt-4 max-h-[300px] space-y-1.5 overflow-y-auto">
                      {activeIncome.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3">
                          <div>
                            <div className="text-[13px] font-semibold text-gray-900">{item.name}</div>
                            <div className="text-[11px] text-gray-400">{item.frequency}</div>
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-positive">
                            +{formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                      {activeIncome.length === 0 && (
                        <p className="py-8 text-center text-[13px] text-gray-400">No income sources yet. Add some from the Income page.</p>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => completeStep(2)}
                        className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                      >
                        Looks Good
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Summary */}
                {i === 3 && (
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-md bg-gray-50 px-5 py-4">
                        <span className="text-[13px] font-medium text-gray-500">Bank Balance</span>
                        <span className="font-mono text-[16px] font-bold text-gray-900">{formatCurrency(bankBalance)}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-md bg-positive-light px-5 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-positive" />
                          <span className="text-[13px] font-medium text-positive">Weekly Income</span>
                        </div>
                        <span className="font-mono text-[16px] font-bold text-positive">+{formatCurrency(Math.round(weeklyIncome))}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-md bg-negative-light px-5 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-negative" />
                          <span className="text-[13px] font-medium text-negative">Weekly Expenses</span>
                        </div>
                        <span className="font-mono text-[16px] font-bold text-negative">−{formatCurrency(Math.round(weeklyExpenses))}</span>
                      </div>

                      <div className="h-px bg-gray-200" />

                      <div className={`flex items-center justify-between rounded-md px-5 py-4 ${weeklyNet >= 0 ? "bg-purple-50" : "bg-negative-light"}`}>
                        <span className="text-[13px] font-semibold text-gray-700">Weekly Net</span>
                        <span className={`font-mono text-[16px] font-bold ${weeklyNet >= 0 ? "text-purple-600" : "text-negative"}`}>
                          {weeklyNet >= 0 ? "+" : "−"}{formatCurrency(Math.abs(Math.round(weeklyNet)))}
                        </span>
                      </div>

                      <div className={`flex items-center justify-between rounded-xl border-2 px-5 py-5 ${projectedBalance >= 500 ? "border-purple-200 bg-purple-50" : "border-red-200 bg-negative-light"}`}>
                        <div>
                          <span className="text-[14px] font-bold text-gray-900">12-Week Projected Balance</span>
                          <p className="mt-0.5 text-[11px] text-gray-400">Current balance + 12 weeks of net cash flow</p>
                        </div>
                        <span className={`font-mono text-[24px] font-bold ${projectedBalance >= 500 ? "text-purple-600" : "text-negative"}`}>
                          {formatCurrency(Math.round(projectedBalance))}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <button
                        onClick={onCancel}
                        className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onComplete(bankBalance)}
                        className="flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-2.5 text-[13px] font-bold text-white shadow-md hover:shadow-glow"
                      >
                        <Check className="h-4 w-4" />
                        Save Check-In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel button (visible when not on summary) */}
      {openStep !== STEPS.length - 1 && (
        <div className="flex justify-start">
          <button
            onClick={onCancel}
            className="text-[13px] font-medium text-gray-400 hover:text-gray-600"
          >
            Cancel check-in
          </button>
        </div>
      )}
    </div>
  );
}
