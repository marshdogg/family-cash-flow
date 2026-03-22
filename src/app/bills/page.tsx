"use client";

import { useState, useMemo } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SetupBanner } from "@/components/shared/SetupBanner";
import { Plus, Trash2 } from "lucide-react";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";
import type { Bill } from "@/lib/types";

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

const FIXED_CATEGORIES = new Set(["housing", "insurance", "loan", "subscriptions", "childcare"]);

export default function BillsPage() {
  const { bills, totalMonthlyBills, addBill, updateBill, removeBill, loaded } = useSharedStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Bill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const activeBills = bills.filter((b) => b.status === "active");

  const { fixed, variable } = useMemo(() => {
    let fixedTotal = 0;
    let variableTotal = 0;
    for (const b of activeBills) {
      const monthly = toMonthly(b.amount, b.frequency);
      if (FIXED_CATEGORIES.has(b.category)) fixedTotal += monthly;
      else variableTotal += monthly;
    }
    return { fixed: Math.round(fixedTotal), variable: Math.round(variableTotal) };
  }, [activeBills]);

  const total = fixed + variable;
  const fixedPct = total > 0 ? Math.round((fixed / total) * 100) : 0;
  const variablePct = 100 - fixedPct;

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <SetupBanner currentStep="expenses" />
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-gray-900">Expenses</h1>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          {/* ── Hero Cards ── */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-md" title="Total of all active recurring expenses, normalized to a monthly amount">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">This Month</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-red-500">
                −{formatCurrency(Math.round(totalMonthlyBills))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {activeBills.length} active expenses
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-md" title="Fixed: housing, insurance, loans, subscriptions, childcare. Variable: everything else.">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Fixed vs Variable</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">Fixed</span>
                  <span className="font-mono font-semibold text-gray-900">{formatCurrency(fixed)} <span className="text-gray-400">{fixedPct}%</span></span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">Variable</span>
                  <span className="font-mono font-semibold text-gray-900">{formatCurrency(variable)} <span className="text-gray-400">{variablePct}%</span></span>
                </div>
              </div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="rounded-full bg-purple-500" style={{ width: `${fixedPct}%` }} />
                <div className="rounded-full bg-purple-200" style={{ width: `${variablePct}%` }} />
              </div>
              <div className="mt-1.5 flex gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />Fixed</span>
                <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-200" />Variable</span>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-md" title="Your monthly expenses divided into a weekly average — useful for weekly budgeting">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Weekly Burn</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-gray-900">
                {formatCurrency(Math.round(totalMonthlyBills / (52 / 12)))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                per week average
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="mt-px text-[14px]">💡</span>
            <p className="text-[12px] font-medium leading-relaxed text-purple-700">
              Expenses are recurring costs that reduce your bank balance — rent, utilities, groceries, subscriptions. They&apos;re the foundation of your cash flow projection.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {bills.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">📋</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No expenses yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Add your recurring expenses so Runway can project your cash flow.</p>
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true); }}
                  className="mt-4 rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                >
                  Add Your First Expense
                </button>
              </div>
            ) : (
              bills.map((bill) => {
                const config = BILL_ICONS[bill.category] ?? BILL_ICONS.other;
                return (
                  <div
                    key={bill.id}
                    onClick={() => { setEditTarget(bill); setShowForm(true); }}
                    className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                      style={{ background: config.bg }}
                    >
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-gray-900">{bill.name}</div>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        {bill.frequency} · Next: {new Date(bill.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="font-mono text-[14px] font-semibold text-gray-900">
                      −{formatCurrency(bill.amount)}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: bill.id, name: bill.name }); }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      aria-label={`Delete ${bill.name}`}
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
        <AddBillForm
          initialData={editTarget ? { name: editTarget.name, category: editTarget.category, amount: editTarget.amount, frequency: editTarget.frequency, nextDate: editTarget.nextDate } : undefined}
          onSubmit={(data) => {
            if (editTarget) {
              updateBill(editTarget.id, data);
            } else {
              addBill(data);
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
          message="This expense will be permanently removed from your cash flow projections."
          onConfirm={() => { removeBill(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

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
