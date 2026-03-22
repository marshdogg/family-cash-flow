"use client";

import { useState } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Plus, Trash2 } from "lucide-react";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { useStore } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/format";

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

export default function BillsPage() {
  const { bills, totalMonthlyBills, addBill, removeBill, loaded } = useStore();
  const [showForm, setShowForm] = useState(false);

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Expenses</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          <div className="mb-5 rounded-lg bg-white p-4 shadow-md">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Monthly Outflow</p>
            <p className="mt-1 font-mono text-[22px] font-semibold text-negative">
              −{formatCurrency(Math.round(totalMonthlyBills))}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {bills.filter((b) => b.status === "active").length} active expenses
            </p>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {bills.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">📋</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No expenses yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Add your recurring expenses to start tracking expenses.</p>
              </div>
            ) : (
              bills.map((bill) => {
                const config = BILL_ICONS[bill.category] ?? BILL_ICONS.other;
                return (
                  <div
                    key={bill.id}
                    className="group flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
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
                      onClick={() => removeBill(bill.id)}
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
          onSubmit={(data) => {
            addBill(data);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
