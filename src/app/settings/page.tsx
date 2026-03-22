"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { UserPlus, Check, Save } from "lucide-react";
import { useSharedStore } from "@/hooks/StoreProvider";

type Cadence = "weekly" | "biweekly" | "monthly";

const CADENCE_OPTIONS: { value: Cadence; label: string; description: string }[] = [
  { value: "weekly", label: "Weekly", description: "Best for tight budgets or variable income. Sunday evening check-in." },
  { value: "biweekly", label: "Biweekly", description: "Aligns with most pay schedules. Check in on paydays." },
  { value: "monthly", label: "Monthly", description: "For stable finances. Review on the 1st of each month." },
];

export default function SettingsPage() {
  const { settings, setSettings, loaded } = useSharedStore();

  const [householdName, setHouseholdName] = useState("");
  const [threshold, setThreshold] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [saved, setSaved] = useState(false);

  // Sync local state from store once loaded
  useEffect(() => {
    if (loaded) {
      setHouseholdName(settings.householdName);
      setThreshold(String(settings.threshold));
      setCadence(settings.cadence as Cadence);
    }
  }, [loaded, settings]);

  const handleSave = () => {
    setSettings({
      householdName: householdName.trim() || "Our Household",
      threshold: parseInt(threshold) || 500,
      cadence,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Settings</h1>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-bold text-white shadow-md transition-all ${
                saved
                  ? "bg-positive"
                  : "bg-purple-500 hover:bg-purple-600 hover:shadow-glow"
              }`}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Household */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="text-[14px] font-bold text-gray-900">Household</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-500">Household Name</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="mt-1 block w-full rounded-sm border border-gray-200 px-3 py-2.5 text-[14px] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-500">Minimum Balance Threshold</label>
                <div className="mt-1 flex items-center rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-[13px] text-gray-400">$</span>
                  <input
                    type="text"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value.replace(/[^0-9]/g, ""))}
                    className="flex-1 border-none px-3 py-2.5 font-mono text-[14px] outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">You&apos;ll see a warning when your projected balance drops below this amount.</p>
              </div>
            </div>
          </div>

          {/* Check-In Cadence */}
          <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
            <h2 className="text-[14px] font-bold text-gray-900">Check-In Cadence</h2>
            <p className="mt-1 text-[13px] text-gray-500">
              How often would you like to review your finances?
            </p>
            <div className="mt-4 space-y-2">
              {CADENCE_OPTIONS.map((option) => {
                const isSelected = cadence === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setCadence(option.value)}
                    className={`flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left transition-colors ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <div className={`text-[13px] font-bold ${isSelected ? "text-purple-700" : "text-gray-900"}`}>
                        {option.label}
                        {option.value === "weekly" && (
                          <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-gray-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partner */}
          <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
            <h2 className="text-[14px] font-bold text-gray-900">Partner Access</h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Invite your partner to view the dashboard. They&apos;ll see everything you see.
            </p>
            <button className="mt-4 flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-4 py-2.5 text-[13px] font-semibold text-purple-600 transition-colors hover:bg-purple-100">
              <UserPlus className="h-4 w-4" />
              Invite Partner
            </button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
