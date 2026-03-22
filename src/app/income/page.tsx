"use client";

import { useState, useMemo } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SetupBanner } from "@/components/shared/SetupBanner";
import { Plus, Trash2 } from "lucide-react";
import { AddIncomeForm } from "@/components/forms/AddIncomeForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";
import type { IncomeSource } from "@/lib/types";

const INCOME_ICONS: Record<string, { icon: string; bg: string }> = {
  paycheck: { icon: "💰", bg: "#DCFCE7" },
  bonus: { icon: "🎉", bg: "#FEF3C7" },
  side: { icon: "💼", bg: "#F0EBFF" },
  benefits: { icon: "🏛", bg: "#E8F2FF" },
  refund: { icon: "📥", bg: "#FCE7F3" },
  other: { icon: "📋", bg: "#F3F4F6" },
};

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly": return amount * (52 / 12);
    case "biweekly": return amount * (26 / 12);
    case "semimonthly": return amount * 2;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "annually": return amount / 12;
    default: return amount;
  }
}

export default function IncomePage() {
  const { income, totalMonthlyIncome, addIncome, updateIncome, removeIncome, loaded } = useSharedStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<IncomeSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const recurring = useMemo(() => income.filter((i) => i.frequency !== "one-time"), [income]);
  const oneTime = useMemo(() => income.filter((i) => i.frequency === "one-time"), [income]);
  const totalOneTime = useMemo(() => oneTime.reduce((sum, i) => sum + i.amount, 0), [oneTime]);

  // YTD earnings estimate
  const ytdEarnings = useMemo(() => {
    const now = new Date();
    const monthsElapsed = now.getMonth() + (now.getDate() / 30);
    return Math.round(recurring.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0) * monthsElapsed);
  }, [recurring]);

  const now = new Date();
  const yearProgress = Math.round(((now.getMonth() * 30 + now.getDate()) / 365) * 100);
  const projectedAnnual = Math.round(totalMonthlyIncome * 12);
  const ytdLabel = `${yearProgress}% of year · ~${formatCurrency(projectedAnnual)} projected`;

  // Top income categories for subtitle
  const topCategories = useMemo(() => {
    const labels: Record<string, string> = { paycheck: "Salary", bonus: "Bonus", side: "Freelance", benefits: "Benefits", refund: "Refund", other: "Other" };
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const i of recurring) {
      if (!seen.has(i.category)) { seen.add(i.category); unique.push(i.category); }
      if (unique.length >= 3) break;
    }
    return unique.map((c) => labels[c] ?? c).join(", ");
  }, [recurring]);

  // Next one-time income
  const nextOneTime = useMemo(() => {
    if (oneTime.length === 0) return null;
    const sorted = [...oneTime].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    return sorted[0];
  }, [oneTime]);

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <SetupBanner currentStep="income" />
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-gray-900">Income</h1>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Income
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="mt-px text-[14px]">💡</span>
            <p className="text-[12px] font-medium leading-relaxed text-purple-700">
              Income sources are the cash flowing into your account — paychecks, side hustles, bonuses, refunds. They drive your runway projection forward.
            </p>
          </div>

          {/* Hero bar */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Monthly Recurring */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="Total of all recurring income sources, normalized to a monthly amount">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-emerald-500" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly Recurring</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold text-emerald-700">
                +{formatCurrency(Math.round(totalMonthlyIncome))}
              </p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                {recurring.length} active source{recurring.length !== 1 ? "s" : ""}
              </span>
              {topCategories && (
                <p className="mt-1 text-[11px] text-gray-400">{topCategories}</p>
              )}
            </div>

            {/* YTD Earnings */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="Estimated total income earned year-to-date based on recurring sources">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-green-500" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">YTD Earnings</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold text-green-700">
                +{formatCurrency(ytdEarnings)}
              </p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-800">
                on pace
              </span>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${yearProgress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">{ytdLabel}</p>
            </div>

            {/* Upcoming One-Time */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="One-time income like bonuses or refunds that aren't recurring">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-amber-500" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Upcoming One-Time</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold text-amber-700">
                +{formatCurrency(totalOneTime)}
              </p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                {oneTime.length} expected
              </span>
              {nextOneTime && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Next: {nextOneTime.name} {new Date(nextOneTime.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Income list */}
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {income.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">💰</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No income sources yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Add your paychecks, side income, and other sources to power your projection.</p>
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true); }}
                  className="mt-4 rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                >
                  Add Your First Income
                </button>
              </div>
            ) : (
              <>
                {/* Recurring section */}
                {recurring.length > 0 && (
                  <>
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Recurring
                    </div>
                    {recurring.map((item) => {
                      const config = INCOME_ICONS[item.category] ?? INCOME_ICONS.other;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { setEditTarget(item); setShowForm(true); }}
                          className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                        >
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                            style={{ background: config.bg }}
                          >
                            {config.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold text-gray-900">{item.name}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                              <span>{item.frequency}</span>
                              <span>·</span>
                              <span>Next: {new Date(item.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 font-mono text-[14px] font-semibold text-green-700">
                            +{formatCurrency(item.amount)}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: item.id, name: item.name }); }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* One-time section */}
                {oneTime.length > 0 && (
                  <>
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      One-time
                    </div>
                    {oneTime.map((item) => {
                      const config = INCOME_ICONS[item.category] ?? INCOME_ICONS.other;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { setEditTarget(item); setShowForm(true); }}
                          className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                        >
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                            style={{ background: config.bg }}
                          >
                            {config.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold text-gray-900">{item.name}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                              <span>one-time</span>
                              <span>·</span>
                              <span>Next: {new Date(item.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="font-mono text-[14px] font-semibold text-green-700">
                              +{formatCurrency(item.amount)}
                            </div>
                            {item.status === "expected" && (
                              <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                Expected
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: item.id, name: item.name }); }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <BottomNav />

      {showForm && (
        <AddIncomeForm
          initialData={editTarget ? { name: editTarget.name, category: editTarget.category, amount: editTarget.amount, frequency: editTarget.frequency, nextDate: editTarget.nextDate, status: editTarget.status } : undefined}
          onSubmit={(data) => {
            if (editTarget) {
              updateIncome(editTarget.id, data);
            } else {
              addIncome(data);
            }
            setShowForm(false);
            setEditTarget(null);
          }}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          message="This income source will be permanently removed from your cash flow projections."
          onConfirm={() => { removeIncome(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
