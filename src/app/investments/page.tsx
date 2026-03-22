"use client";

import { useState, useMemo } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, Trash2, TrendingUp, Calendar, Clock } from "lucide-react";
import { AddInvestmentForm } from "@/components/forms/AddInvestmentForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";
import type { Investment } from "@/lib/types";

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

function estimateYtdContributions(inv: Investment): number {
  if (inv.frequency === "one-time" || inv.status !== "active") return 0;
  const now = new Date();
  const monthsElapsed = now.getMonth() + (now.getDate() / 30);
  const monthly = toMonthly(inv.amount, inv.frequency);
  return monthly * monthsElapsed;
}

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
  const { investments, totalMonthlyInvestments, addInvestment, updateInvestment, removeInvestment, loaded } = useSharedStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const recurring = useMemo(() => investments.filter((i) => i.frequency !== "one-time" && i.status === "active"), [investments]);

  const projectedAnnual = Math.round(totalMonthlyInvestments * 12);

  const nextContribution = useMemo(() => {
    if (recurring.length === 0) return null;
    const sorted = [...recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const nextDate = sorted[0].nextDate;
    const sameDay = sorted.filter((i) => i.nextDate === nextDate);
    const combined = sameDay.reduce((sum, i) => sum + i.amount, 0);
    const daysUntil = Math.max(0, Math.ceil((new Date(nextDate + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { date: nextDate, combined, daysUntil };
  }, [recurring]);

  const ytdContributed = useMemo(() => {
    return Math.round(investments.reduce((sum, i) => sum + estimateYtdContributions(i), 0));
  }, [investments]);

  if (!loaded) return null;

  const now = new Date();
  const ytdLabel = `Jan – ${now.toLocaleDateString("en-US", { month: "short" })} ${now.getFullYear()}`;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-gray-900">Investments</h1>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Investment
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="mt-px text-[14px]">💡</span>
            <p className="text-[12px] font-medium leading-relaxed text-purple-700">
              Investments are cash outflows that build your net worth. They reduce your bank balance but aren&apos;t expenses — they&apos;re tracked separately so you can see the full picture.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Projected Annual */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="Total of all recurring contributions projected over 12 months">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-gradient-to-r from-purple-500 to-purple-300" />
              <div className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-purple-50">
                <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Projected Annual</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-purple-600">
                {formatCurrency(projectedAnnual)}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">Based on current rate</p>
            </div>

            {/* Next Contribution */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="Your next upcoming investment contribution">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-gradient-to-r from-emerald-500 to-emerald-300" />
              <div className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Next Contribution</p>
              {nextContribution ? (
                <>
                  <p className="mt-1 text-[22px] font-semibold text-emerald-700">
                    {new Date(nextContribution.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    In {nextContribution.daysUntil === 0 ? "today" : `${nextContribution.daysUntil}d`} · {formatCurrency(nextContribution.combined)} combined
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[22px] font-semibold text-gray-300">—</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">No recurring investments</p>
                </>
              )}
            </div>

            {/* YTD Contributed */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-md" title="Estimated total contributions year-to-date">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-gradient-to-r from-amber-500 to-amber-300" />
              <div className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-50">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">YTD Contributed</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-amber-700">
                {formatCurrency(ytdContributed)}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{ytdLabel}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {investments.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">📈</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No investments yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Track your RRSP, TFSA, brokerage contributions and lump-sum investments.</p>
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true); }}
                  className="mt-4 rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                >
                  Add Your First Investment
                </button>
              </div>
            ) : (
              investments.map((inv) => {
                const config = INVEST_ICONS[inv.category] ?? INVEST_ICONS.other;
                return (
                  <div
                    key={inv.id}
                    onClick={() => { setEditTarget(inv); setShowForm(true); }}
                    className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
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
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: inv.id, name: inv.name }); }}
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
          initialData={editTarget ? { name: editTarget.name, category: editTarget.category, amount: editTarget.amount, frequency: editTarget.frequency, nextDate: editTarget.nextDate } : undefined}
          onSubmit={(data) => {
            if (editTarget) {
              updateInvestment(editTarget.id, data);
            } else {
              addInvestment(data);
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
          message="This investment will be permanently removed from your cash flow projections."
          onConfirm={() => { removeInvestment(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
