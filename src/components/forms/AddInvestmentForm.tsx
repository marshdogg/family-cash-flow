"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { InvestmentCategory, Frequency } from "@/lib/types";

const CATEGORIES: { value: InvestmentCategory; label: string; icon: string }[] = [
  { value: "rrsp", label: "RRSP / 401k", icon: "📊" },
  { value: "tfsa", label: "TFSA / Roth", icon: "🛡" },
  { value: "resp", label: "RESP / 529", icon: "🎓" },
  { value: "brokerage", label: "Brokerage", icon: "📈" },
  { value: "realestate", label: "Real Estate", icon: "🏘" },
  { value: "crypto", label: "Crypto", icon: "₿" },
  { value: "other", label: "Other", icon: "💎" },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly (every 2 weeks)" },
  { value: "semimonthly", label: "Semi-monthly (1st & 15th)" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "one-time", label: "One-time (lump sum)" },
];

interface InvestmentData { name: string; category: InvestmentCategory; amount: number; frequency: Frequency; nextDate: string }

interface AddInvestmentFormProps {
  onSubmit: (data: InvestmentData) => void;
  onClose: () => void;
  initialData?: InvestmentData;
}

export function AddInvestmentForm({ onSubmit, onClose, initialData }: AddInvestmentFormProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState<InvestmentCategory>(initialData?.category ?? "rrsp");
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [frequency, setFrequency] = useState<Frequency>(initialData?.frequency ?? "monthly");
  const [nextDate, setNextDate] = useState(initialData?.nextDate ?? new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const trapRef = useFocusTrap();

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
    onSubmit({ name: name.trim(), category, amount: num, frequency, nextDate });
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="invest-dialog-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="invest-dialog-title" className="text-[16px] font-bold text-gray-900">{isEdit ? "Edit Investment" : "Add Investment"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="invest-name" className="text-[12px] font-semibold text-gray-500">Name</label>
              <input
                id="invest-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., RRSP — Monthly Contribution"
                autoFocus
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "invest-name-error" : undefined}
              />
              {errors.name && <p id="invest-name-error" className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
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
                <label htmlFor="invest-amount" className="text-[12px] font-semibold text-gray-500">Amount</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="invest-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="flex-1 border-none px-3 py-2.5 text-[14px] outline-none"
                    aria-invalid={!!errors.amount}
                    aria-describedby={errors.amount ? "invest-amount-error" : undefined}
                  />
                </div>
                {errors.amount && <p id="invest-amount-error" className="mt-1 text-[11px] text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label htmlFor="invest-frequency" className="text-[12px] font-semibold text-gray-500">Frequency</label>
                <select
                  id="invest-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="mt-1 block w-full rounded-sm border border-gray-200 px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="invest-date" className="text-[12px] font-semibold text-gray-500">
                {frequency === "one-time" ? "Investment Date" : "Next Contribution Date"}
              </label>
              <input
                id="invest-date"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.nextDate ? "border-red-400" : "border-gray-200"}`}
                aria-invalid={!!errors.nextDate}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600 disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
