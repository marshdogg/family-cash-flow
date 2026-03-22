"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { PlannedEventCategory, Frequency } from "@/lib/types";

const CATEGORIES: { value: PlannedEventCategory; label: string; icon: string }[] = [
  { value: "trip", label: "Trip", icon: "\u2708\uFE0F" },
  { value: "camp", label: "Camp", icon: "\u26FA" },
  { value: "holiday", label: "Holiday", icon: "\uD83C\uDF84" },
  { value: "school", label: "School", icon: "\uD83C\uDF92" },
  { value: "car", label: "Car", icon: "\uD83D\uDE97" },
  { value: "home", label: "Home", icon: "\uD83C\uDFE0" },
  { value: "medical", label: "Medical", icon: "\uD83C\uDFE5" },
  { value: "other", label: "Other", icon: "\uD83D\uDCCB" },
];

const CONTRIB_FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "semimonthly", label: "Semi-monthly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

interface PlanData {
  name: string;
  category: PlannedEventCategory;
  amount: number;
  savedSoFar: number;
  targetDate: string;
  contributionAmount: number | null;
  contributionFrequency: Frequency | null;
}

interface AddPlanFormProps {
  onSubmit: (data: PlanData) => void;
  onClose: () => void;
  initialData?: PlanData;
}

export function AddPlanForm({ onSubmit, onClose, initialData }: AddPlanFormProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState<PlannedEventCategory>(initialData?.category ?? "other");
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [savedSoFar, setSavedSoFar] = useState(initialData ? String(initialData.savedSoFar) : "");
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ?? "");
  const [hasContribution, setHasContribution] = useState(initialData?.contributionAmount != null);
  const [contribAmount, setContribAmount] = useState(initialData?.contributionAmount ? String(initialData.contributionAmount) : "");
  const [contribFrequency, setContribFrequency] = useState<Frequency>(initialData?.contributionFrequency ?? "monthly");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const trapRef = useFocusTrap();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) newErrors.amount = "Enter a valid amount";
    const saved = savedSoFar ? parseFloat(savedSoFar) : 0;
    if (isNaN(saved) || saved < 0) newErrors.savedSoFar = "Enter a valid amount";
    if (!targetDate) newErrors.targetDate = "Target date is required";

    let contribNum: number | null = null;
    if (hasContribution) {
      contribNum = parseFloat(contribAmount);
      if (isNaN(contribNum) || contribNum <= 0) newErrors.contribAmount = "Enter a valid contribution amount";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    onSubmit({
      name: name.trim(),
      category,
      amount: num,
      savedSoFar: saved,
      targetDate,
      contributionAmount: hasContribution ? contribNum : null,
      contributionFrequency: hasContribution ? contribFrequency : null,
    });
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-[60] flex items-end justify-center px-3 sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl max-h-[85vh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="plan-dialog-title" className="text-[16px] font-bold text-gray-900">{isEdit ? "Edit Goal" : "Add Savings Goal"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label htmlFor="plan-name" className="text-[12px] font-semibold text-gray-500">Name</label>
              <input
                id="plan-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Camp, Family Vacation"
                autoFocus
                className={`mt-1 block w-full rounded-sm border px-3 py-2 text-[16px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "plan-name-error" : undefined}
              />
              {errors.name && <p id="plan-name-error" className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
            </div>

            <fieldset>
              <legend className="text-[12px] font-semibold text-gray-500">Category</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      category === cat.value
                        ? "border-purple-500 bg-purple-50 text-purple-600"
                        : "border-gray-200 text-gray-500 hover:border-purple-200"
                    }`}
                    aria-pressed={category === cat.value}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="plan-amount" className="text-[12px] font-semibold text-gray-500">Total Amount Needed</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="flex-shrink-0 border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="plan-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="min-w-0 flex-1 border-none px-3 py-2 text-[16px] outline-none"
                    aria-invalid={!!errors.amount}
                    aria-describedby={errors.amount ? "plan-amount-error" : undefined}
                  />
                </div>
                {errors.amount && <p id="plan-amount-error" className="mt-1 text-[11px] text-red-500">{errors.amount}</p>}
              </div>
              <div className="min-w-0">
                <label htmlFor="plan-saved" className="text-[12px] font-semibold text-gray-500">Amount Saved So Far</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="plan-saved"
                    type="number"
                    step="0.01"
                    min="0"
                    value={savedSoFar}
                    onChange={(e) => setSavedSoFar(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="flex-1 border-none px-3 py-2 text-[16px] outline-none"
                    aria-invalid={!!errors.savedSoFar}
                  />
                </div>
                {errors.savedSoFar && <p className="mt-1 text-[11px] text-red-500">{errors.savedSoFar}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="plan-date" className="text-[12px] font-semibold text-gray-500">Target Date</label>
              <input
                id="plan-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={`mt-1 block w-full rounded-sm border px-3 py-2 text-[16px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.targetDate ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.targetDate}
              />
              {errors.targetDate && <p className="mt-1 text-[11px] text-red-500">{errors.targetDate}</p>}
            </div>

            {/* Recurring contribution toggle */}
            {(() => {
              const savedNum = parseFloat(savedSoFar) || 0;
              const amountNum = parseFloat(amount) || 0;
              const fullyFunded = amountNum > 0 && savedNum >= amountNum;
              return (
            <div className={`rounded-lg border p-4 ${fullyFunded ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
              <label htmlFor="plan-contrib-toggle" className={`flex items-center gap-3 ${fullyFunded ? "cursor-default" : "cursor-pointer"}`}>
                <button
                  id="plan-contrib-toggle"
                  type="button"
                  role="switch"
                  aria-checked={hasContribution}
                  disabled={fullyFunded}
                  onClick={() => { if (!fullyFunded) setHasContribution(!hasContribution); }}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${fullyFunded ? "bg-green-400 cursor-not-allowed" : hasContribution ? "bg-purple-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${fullyFunded || hasContribution ? "left-6" : "left-1"}`} />
                </button>
                <div>
                  {fullyFunded ? (
                    <>
                      <span className="text-[13px] font-semibold text-green-700">Fully funded</span>
                      <p className="mt-0.5 text-[11px] text-green-600">This plan is fully saved for — no contributions needed</p>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold text-gray-700">Set up recurring savings</span>
                      <p className="mt-0.5 text-[11px] text-gray-400">Automatically factor a regular contribution into your projection</p>
                    </>
                  )}
                </div>
              </label>

              {hasContribution && !fullyFunded && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label htmlFor="plan-contrib-amount" className="text-[12px] font-semibold text-gray-500">Contribution Amount</label>
                    <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                      <span className="flex-shrink-0 border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                      <input
                        id="plan-contrib-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0.00"
                        className="min-w-0 flex-1 border-none px-3 py-2 text-[16px] outline-none"
                        aria-invalid={!!errors.contribAmount}
                        aria-describedby={errors.contribAmount ? "plan-contrib-error" : undefined}
                      />
                    </div>
                    {errors.contribAmount && <p id="plan-contrib-error" className="mt-1 text-[11px] text-red-500">{errors.contribAmount}</p>}
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="plan-contrib-freq" className="text-[12px] font-semibold text-gray-500">Frequency</label>
                    <select
                      id="plan-contrib-freq"
                      value={contribFrequency}
                      onChange={(e) => setContribFrequency(e.target.value as Frequency)}
                      className="mt-1 block w-full truncate rounded-sm border border-gray-200 px-3 py-2 text-[16px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      {CONTRIB_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-purple-500 px-5 py-3 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
