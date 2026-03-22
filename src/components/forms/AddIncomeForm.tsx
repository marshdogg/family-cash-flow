"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { IncomeCategory, Frequency } from "@/lib/types";

const CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: "paycheck", label: "Paycheck", icon: "💰" },
  { value: "bonus", label: "Bonus", icon: "🎉" },
  { value: "side", label: "Side Income", icon: "💼" },
  { value: "benefits", label: "Benefits", icon: "🏛" },
  { value: "refund", label: "Refund", icon: "📥" },
  { value: "other", label: "Other", icon: "📋" },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly (every 2 weeks)" },
  { value: "semimonthly", label: "Semi-monthly (1st & 15th)" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "one-time", label: "One-time" },
];

interface AddIncomeFormProps {
  onSubmit: (data: { name: string; category: IncomeCategory; amount: number; frequency: Frequency; nextDate: string; status: "active" | "expected" }) => void;
  onClose: () => void;
}

export function AddIncomeForm({ onSubmit, onClose }: AddIncomeFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IncomeCategory>("paycheck");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [isExpected, setIsExpected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const trapRef = useFocusTrap();

  const handleFrequencyChange = (f: Frequency) => {
    setFrequency(f);
    if (f === "one-time") setIsExpected(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) newErrors.amount = "Enter a valid amount";
    if (!nextDate) newErrors.nextDate = "Date is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    onSubmit({
      name: name.trim(),
      category,
      amount: num,
      frequency,
      nextDate,
      status: isExpected ? "expected" : "active",
    });
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="income-dialog-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="income-dialog-title" className="text-[16px] font-bold text-gray-900">Add Income</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="income-name" className="text-[12px] font-semibold text-gray-500">Source Name</label>
              <input
                id="income-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Salary"
                autoFocus
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "income-name-error" : undefined}
              />
              {errors.name && <p id="income-name-error" className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
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
                <label htmlFor="income-amount" className="text-[12px] font-semibold text-gray-500">Amount</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="flex-1 border-none px-3 py-2.5 text-[14px] outline-none"
                    aria-invalid={!!errors.amount}
                    aria-describedby={errors.amount ? "income-amount-error" : undefined}
                  />
                </div>
                {errors.amount && <p id="income-amount-error" className="mt-1 text-[11px] text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label htmlFor="income-frequency" className="text-[12px] font-semibold text-gray-500">Frequency</label>
                <select
                  id="income-frequency"
                  value={frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as Frequency)}
                  className="mt-1 block w-full rounded-sm border border-gray-200 px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="income-date" className="text-[12px] font-semibold text-gray-500">
                {frequency === "one-time" ? "Expected Date" : "Next Expected Date"}
              </label>
              <input
                id="income-date"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.nextDate ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.nextDate}
              />
            </div>

            {frequency !== "one-time" && (
              <label htmlFor="income-expected-toggle" className="flex cursor-pointer items-center gap-3">
                <button
                  id="income-expected-toggle"
                  type="button"
                  role="switch"
                  aria-checked={isExpected}
                  onClick={() => setIsExpected(!isExpected)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${isExpected ? "bg-purple-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isExpected ? "left-6" : "left-1"}`} />
                </button>
                <span className="text-[13px] font-medium text-gray-700">Mark as expected (not yet confirmed)</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50">
              {saving ? "Adding..." : "Add Income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
