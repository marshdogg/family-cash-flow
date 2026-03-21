"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ClipboardCheck } from "lucide-react";
import { CheckInWizard } from "@/components/check-in/CheckInWizard";
import { useStore } from "@/hooks/useStore";

export default function CheckInPage() {
  const router = useRouter();
  const { bills, income, latestCheckIn, addCheckIn, loaded } = useStore();
  const [started, setStarted] = useState(false);

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {!started ? (
            <div className="flex flex-col items-center rounded-xl bg-white px-8 py-16 text-center shadow-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100">
                <ClipboardCheck className="h-8 w-8 text-purple-500" />
              </div>
              <h1 className="mt-5 text-[20px] font-bold text-gray-900">
                Weekly Check-In
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[14px] text-gray-500">
                Take 5 minutes to update your balance, review upcoming bills, and see where your cash is headed.
              </p>

              {latestCheckIn && (
                <p className="mt-3 text-[12px] text-gray-400">
                  Last check-in: {new Date(latestCheckIn.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}

              <button
                onClick={() => setStarted(true)}
                className="mt-6 rounded-md bg-gradient-primary px-8 py-3 text-[14px] font-bold text-white shadow-md transition-all hover:shadow-glow"
              >
                Start Check-In
              </button>
              <p className="mt-3 text-[12px] text-gray-400">Takes about 5 minutes</p>
            </div>
          ) : (
            <CheckInWizard
              bills={bills}
              income={income}
              previousBalance={latestCheckIn?.bankBalance ?? null}
              onComplete={(bankBalance) => {
                addCheckIn(bankBalance);
                router.push("/");
              }}
              onCancel={() => setStarted(false)}
            />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
