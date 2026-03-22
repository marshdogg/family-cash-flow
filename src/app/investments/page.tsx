"use client";

import { useState } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, Trash2 } from "lucide-react";
import { AddInvestmentForm } from "@/components/forms/AddInvestmentForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";

const INVEST_ICONS: Record<string, { icon: string; bg: string }> = {
  rrsp: { icon: "📊", bg: "#F0EBFF" },
  tfsa: { icon: "🛡", bg: "#E8F2FF" },
  resp: { icon: "🎓", bg: "#FEF3C7" },
  brokerage: { icon: "📈", bg: "#DCFCE7" },
  realestate: { icon: "🏘", bg: "#FCE7F3" },
  crypto: { icon: "₿", bg: "#FEF3C7" },
  other: { icon: "💎", bg: "#F3F4F6" },
};

export default function InvestmentsPage() {
  const { investments, totalMonthlyInvestments, addInvestment, removeInvestment, loaded } = useSharedStore();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!loaded) return null;

  const recurring = investments.filter((i) => i.frequency !== "one-time" && i.status === "active");
  const oneTime = investments.filter((i) => i.frequency === "one-time");
  const totalOneTime = oneTime.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Investments</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow"
            >
              <Plus className="h-4 w-4" />
              Add Investment
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly Contributions</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-purple-500">
                {formatCurrency(Math.round(totalMonthlyInvestments))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{recurring.length} active investments</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Upcoming Lump Sums</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-blue-500">
                {formatCurrency(totalOneTime)}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{oneTime.length} planned</p>
            </div>
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="mt-px text-[14px]">💡</span>
            <p className="text-[12px] font-medium leading-relaxed text-purple-700">
              Investments are cash outflows that build your net worth. They reduce your bank balance but aren&apos;t expenses — they&apos;re tracked separately so you can see the full picture.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {investments.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">📈</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No investments yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Track your RRSP, TFSA, brokerage contributions and lump-sum investments.</p>
              </div>
            ) : (
              investments.map((inv) => {
                const config = INVEST_ICONS[inv.category] ?? INVEST_ICONS.other;
                return (
                  <div
                    key={inv.id}
                    className="group flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                    style={inv.status === "paused" ? { opacity: 0.55 } : undefined}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                      style={{ background: config.bg }}
                    >
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-gray-900">{inv.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{inv.frequency === "one-time" ? "Lump sum" : inv.frequency}</span>
                        <span>·</span>
                        <span>Next: {new Date(inv.nextDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[14px] font-semibold text-purple-500">
                      {formatCurrency(inv.amount)}
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ id: inv.id, name: inv.name })}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      aria-label={`Delete ${inv.name}`}
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
        <AddInvestmentForm
          onSubmit={(data) => {
            addInvestment(data);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          message="This investment will be permanently removed from your cash flow projections."
          onConfirm={() => { removeInvestment(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
