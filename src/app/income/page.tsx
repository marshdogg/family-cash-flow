"use client";

import { useState } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Plus, Trash2 } from "lucide-react";
import { AddIncomeForm } from "@/components/forms/AddIncomeForm";
import { useStore } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/format";

const INCOME_ICONS: Record<string, { icon: string; bg: string }> = {
  paycheck: { icon: "💰", bg: "#DCFCE7" },
  bonus: { icon: "🎉", bg: "#FEF3C7" },
  side: { icon: "💼", bg: "#F0EBFF" },
  benefits: { icon: "🏛", bg: "#E8F2FF" },
  refund: { icon: "📥", bg: "#FCE7F3" },
  other: { icon: "📋", bg: "#F3F4F6" },
};

export default function IncomePage() {
  const { income, totalMonthlyIncome, addIncome, removeIncome, loaded } = useStore();
  const [showForm, setShowForm] = useState(false);

  if (!loaded) return null;

  const recurring = income.filter((i) => i.frequency !== "one-time");
  const oneTime = income.filter((i) => i.frequency === "one-time");
  const totalOneTime = oneTime.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Income</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow"
            >
              <Plus className="h-4 w-4" />
              Add Income
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly Recurring</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-positive">
                +{formatCurrency(Math.round(totalMonthlyIncome))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{recurring.length} active sources</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Upcoming One-Time</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-blue-500">
                +{formatCurrency(totalOneTime)}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{oneTime.length} expected</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {income.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">💰</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No income sources yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Add your paychecks, side income, and other sources.</p>
              </div>
            ) : (
              income.map((item) => {
                const config = INCOME_ICONS[item.category] ?? INCOME_ICONS.other;
                return (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                      style={{ background: config.bg }}
                    >
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-gray-900">{item.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{item.frequency}</span>
                        <span>·</span>
                        <span>Next: {new Date(item.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[14px] font-semibold text-positive">
                        +{formatCurrency(item.amount)}
                      </div>
                      {item.status === "expected" && (
                        <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                          Expected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeIncome(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <BottomNav />

      {showForm && (
        <AddIncomeForm
          onSubmit={(data) => {
            addIncome(data);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
