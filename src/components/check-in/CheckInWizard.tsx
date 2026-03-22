"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Bill, IncomeSource } from "@/lib/types";

interface CheckInWizardProps {
  bills: Bill[];
  income: IncomeSource[];
  previousBalance: number | null;
  onComplete: (bankBalance: number) => void;
  onCancel: () => void;
}

const STEPS = ["Bank Balance", "Review Expenses", "Review Income", "Summary"];

export function CheckInWizard({ bills, income, previousBalance, onComplete, onCancel }: CheckInWizardProps) {
  const [step, setStep] = useState(0);
  const [bankBalance, setBankBalance] = useState(previousBalance ?? 0);
  const [balanceInput, setBalanceInput] = useState(previousBalance ? previousBalance.toLocaleString() : "");

  const activeBills = bills.filter((b) => b.status === "active");
  const activeIncome = income.filter((i) => i.frequency !== "one-time");

  const toWeekly = (amount: number, frequency: string) => {
    if (frequency === "weekly") return amount;
    if (frequency === "biweekly") return amount / 2;              // every 2 weeks
    if (frequency === "semimonthly") return (amount * 2) / (52 / 12); // 2x/month → weekly
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

  const canProceed = step === 0 ? bankBalance > 0 : true;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              i < step ? "bg-purple-500 text-white"
              : i === step ? "bg-gradient-primary text-white"
              : "bg-gray-100 text-gray-400"
            }`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full ${i < step ? "bg-purple-500" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        {/* Step 0: Bank Balance */}
        {step === 0 && (
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">What&apos;s your current bank balance?</h2>
            <p className="mt-1 text-[13px] text-gray-500">Check your bank app and enter the balance you see right now.</p>

            <div className="mt-6 flex items-center rounded-md border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
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
          </div>
        )}

        {/* Step 1: Review Expenses */}
        {step === 1 && (
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Your recurring expenses</h2>
            <p className="mt-1 text-[13px] text-gray-500">{activeBills.length} active expenses totaling {formatCurrency(Math.round(weeklyExpenses))}/week</p>

            <div className="mt-4 max-h-[360px] space-y-1.5 overflow-y-auto">
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
          </div>
        )}

        {/* Step 2: Review Income */}
        {step === 2 && (
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Your expected income</h2>
            <p className="mt-1 text-[13px] text-gray-500">{activeIncome.length} active sources totaling {formatCurrency(Math.round(weeklyIncome))}/week</p>

            <div className="mt-4 max-h-[360px] space-y-1.5 overflow-y-auto">
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
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Your financial summary</h2>
            <p className="mt-1 text-[13px] text-gray-500">Here&apos;s where you stand for the next 12 weeks.</p>

            <div className="mt-6 space-y-3">
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
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={step === 0 ? onCancel : () => setStep(step - 1)}
          className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            className="flex items-center gap-2 rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onComplete(bankBalance)}
            className="flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-2.5 text-[13px] font-bold text-white shadow-md hover:shadow-glow"
          >
            <Check className="h-4 w-4" />
            Save Check-In
          </button>
        )}
      </div>
    </div>
  );
}
