"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SetupBanner } from "@/components/shared/SetupBanner";
import { Plus, Trash2 } from "lucide-react";
import { AddPlanForm } from "@/components/forms/AddPlanForm";
import { useSharedStore } from "@/hooks/StoreProvider";
import { formatCurrency } from "@/lib/format";
import type { PlannedEvent } from "@/lib/types";

const PLAN_ICONS: Record<string, { icon: string; bg: string }> = {
  trip: { icon: "\u2708\uFE0F", bg: "#E8F2FF" },
  camp: { icon: "\u26FA", bg: "#DCFCE7" },
  holiday: { icon: "\uD83C\uDF84", bg: "#FEE2E2" },
  school: { icon: "\uD83C\uDF92", bg: "#FEF3C7" },
  car: { icon: "\uD83D\uDE97", bg: "#F3F4F6" },
  home: { icon: "\uD83C\uDFE0", bg: "#F0EBFF" },
  medical: { icon: "\uD83C\uDFE5", bg: "#FCE7F3" },
  other: { icon: "\uD83D\uDCCB", bg: "#F3F4F6" },
};

export default function PlansPageWrapper() {
  return (
    <Suspense>
      <PlansPage />
    </Suspense>
  );
}

function PlansPage() {
  const { plannedEvents, addPlannedEvent, updatePlannedEvent, removePlannedEvent, loaded } = useSharedStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PlannedEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const consumedEditId = useRef<string | null>(null);

  // Auto-open edit form from ?edit=<id> deep link
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && editId !== consumedEditId.current && loaded && plannedEvents.length > 0) {
      const target = plannedEvents.find((e) => e.id === editId);
      if (target) {
        consumedEditId.current = editId;
        setEditTarget(target);
        setShowForm(true);
        router.replace("/plans", { scroll: false });
      }
    }
  }, [searchParams, loaded, plannedEvents, router]);

  if (!loaded) return null;

  const totalPlanned = plannedEvents.reduce((sum, e) => sum + e.amount, 0);
  const totalSaved = plannedEvents.reduce((sum, e) => sum + e.savedSoFar, 0);
  const remaining = totalPlanned - totalSaved;
  const overallProgress = totalPlanned > 0 ? Math.min((totalSaved / totalPlanned) * 100, 100) : 0;

  const getMonthsUntil = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate + "T00:00:00");
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          <SetupBanner currentStep="plans" />
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-gray-900">Savings Goals</h1>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="mt-px text-[14px]">💡</span>
            <p className="text-[12px] font-medium leading-relaxed text-purple-700">
              Plans are big upcoming expenses you&apos;re saving toward — vacations, tuition, home repairs. Track your progress and Runway will factor the monthly savings needed into your projection.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border-l-[3px] border-l-purple-500 bg-white p-4 shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Planned</p>
              <p className="mt-1 font-mono text-[20px] font-semibold text-gray-900">
                {formatCurrency(Math.round(totalPlanned))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">{plannedEvents.length} events</p>
            </div>
            <div className="rounded-lg border-l-[3px] border-l-green-500 bg-white p-4 shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Saved</p>
              <p className="mt-1 font-mono text-[20px] font-semibold text-gray-900">
                {formatCurrency(Math.round(totalSaved))}
              </p>
              <p className="mt-0.5 text-[11px] text-green-600">{Math.round(overallProgress)}% funded</p>
            </div>
            <div className="rounded-lg border-l-[3px] border-l-amber-500 bg-white p-4 shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Remaining</p>
              <p className="mt-1 font-mono text-[20px] font-semibold text-gray-900">
                {formatCurrency(Math.round(remaining))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">still needed</p>
            </div>
          </div>

          {/* Overall progress bar */}
          {plannedEvents.length > 0 && (
            <div className="mb-5 rounded-lg bg-white p-4 shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-gray-600">Overall Savings Progress</p>
                <p className="font-mono text-[12px] font-semibold text-purple-500">{Math.round(overallProgress)}%</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {plannedEvents.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="text-[36px]">{"\uD83D\uDCC5"}</div>
                <h2 className="mt-3 text-[17px] font-bold text-gray-900">No savings goals yet</h2>
                <p className="mt-1 text-[13px] text-gray-500">Track upcoming trips, camps, seasonal expenses, and other big-ticket items.</p>
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true); }}
                  className="mt-4 rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600"
                >
                  Add Your First Goal
                </button>
              </div>
            ) : (
              plannedEvents.map((event) => {
                const config = PLAN_ICONS[event.category] ?? PLAN_ICONS.other;
                const progress = event.amount > 0 ? Math.min((event.savedSoFar / event.amount) * 100, 100) : 0;
                const monthsUntil = getMonthsUntil(event.targetDate);
                const remainingForEvent = Math.max(0, event.amount - event.savedSoFar);
                const monthlyNeeded = monthsUntil > 0 ? remainingForEvent / monthsUntil : remainingForEvent;

                return (
                  <div
                    key={event.id}
                    onClick={() => { setEditTarget(event); setShowForm(true); }}
                    className="group cursor-pointer border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                        style={{ background: config.bg }}
                      >
                        {config.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-gray-900">{event.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                          <span>{monthsUntil === 0 ? "This month" : `${monthsUntil} mo away`}</span>
                          <span>&middot;</span>
                          <span>
                            {new Date(event.targetDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="font-mono text-[14px] font-semibold text-purple-500">
                          {formatCurrency(event.amount)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-400">
                          {event.contributionAmount != null
                            ? `${formatCurrency(event.contributionAmount)}/${event.contributionFrequency === "weekly" ? "wk" : event.contributionFrequency === "biweekly" ? "2wk" : event.contributionFrequency === "monthly" ? "mo" : event.contributionFrequency === "quarterly" ? "qtr" : "yr"}`
                            : `${formatCurrency(Math.round(monthlyNeeded))}/mo needed`}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: event.id, name: event.name }); }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label={`Delete ${event.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 pl-[52px] flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-400 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">
                        {formatCurrency(event.savedSoFar)} / {formatCurrency(event.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <BottomNav />

      {showForm && (
        <AddPlanForm
          initialData={editTarget ? { name: editTarget.name, category: editTarget.category, amount: editTarget.amount, savedSoFar: editTarget.savedSoFar, targetDate: editTarget.targetDate, contributionAmount: editTarget.contributionAmount, contributionFrequency: editTarget.contributionFrequency } : undefined}
          onSubmit={(data) => {
            if (editTarget) {
              updatePlannedEvent(editTarget.id, data);
            } else {
              addPlannedEvent(data);
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
          message="This savings goal will be permanently removed from your cash flow projections."
          onConfirm={() => { removePlannedEvent(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
