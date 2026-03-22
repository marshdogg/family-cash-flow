"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useSharedStore } from "@/hooks/StoreProvider";

/**
 * Shows a small banner at the top of sub-pages when the user is still
 * completing initial setup. Guides them back to the dashboard to continue.
 */
export function SetupBanner({ currentStep }: { currentStep: "income" | "expenses" | "plans" | "check-in" }) {
  const { income, bills, plannedEvents, latestCheckIn, loaded } = useSharedStore();
  if (!loaded) return null;

  const steps = [
    { key: "income" as const, done: income.length > 0, label: "Income" },
    { key: "expenses" as const, done: bills.length > 0, label: "Expenses" },
    { key: "plans" as const, done: plannedEvents.length > 0, label: "Goals" },
    { key: "check-in" as const, done: !!latestCheckIn, label: "Check-in" },
  ];

  const allDone = steps.every((s) => s.done);
  const currentDone = steps.find((s) => s.key === currentStep)?.done ?? false;

  // Don't show if setup is complete
  if (allDone) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-600 hover:text-purple-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to setup
      </Link>
      <div className="h-4 w-px bg-purple-200" />
      <div className="flex items-center gap-2">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-1">
            {step.done ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <div className={`h-2 w-2 rounded-full ${step.key === currentStep ? "bg-purple-500" : "bg-gray-300"}`} />
            )}
            <span className={`text-[11px] font-medium ${
              step.key === currentStep ? "text-purple-700" : step.done ? "text-green-600" : "text-gray-400"
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {currentDone && (
        <>
          <div className="h-4 w-px bg-purple-200" />
          <Link
            href="/"
            className="text-[12px] font-semibold text-purple-600 hover:text-purple-700"
          >
            Continue setup &rarr;
          </Link>
        </>
      )}
    </div>
  );
}
