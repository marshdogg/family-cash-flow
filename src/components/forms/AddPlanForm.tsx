"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { PlannedEventCategory } from "@/lib/types";

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

interface PlanData { name: string; category: PlannedEventCategory; amount: number; savedSoFar: number; targetDate: string }

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
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    onSubmit({ name: name.trim(), category, amount: num, savedSoFar: saved, targetDate });
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="plan-dialog-title" className="text-[16px] font-bold text-gray-900">{isEdit ? "Edit Plan" : "Add Planned Event"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="plan-name" className="text-[12px] font-semibold text-gray-500">Name</label>
              <input
                id="plan-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Camp, Family Vacation"
                autoFocus
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.name ? "border-red-400" : "border-gray-200"}`}
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
              <div>
                <label htmlFor="plan-amount" className="text-[12px] font-semibold text-gray-500">Total Amount Needed</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="plan-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="flex-1 border-none px-3 py-2.5 text-[14px] outline-none"
                    aria-invalid={!!errors.amount}
                    aria-describedby={errors.amount ? "plan-amount-error" : undefined}
                  />
                </div>
                {errors.amount && <p id="plan-amount-error" className="mt-1 text-[11px] text-red-500">{errors.amount}</p>}
              </div>
              <div>
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
                    className="flex-1 border-none px-3 py-2.5 text-[14px] outline-none"
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
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.targetDate ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.targetDate}
              />
              {errors.targetDate && <p className="mt-1 text-[11px] text-red-500">{errors.targetDate}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
