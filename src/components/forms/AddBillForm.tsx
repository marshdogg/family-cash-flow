"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { BillCategory, Frequency } from "@/lib/types";

const CATEGORIES: { value: BillCategory; label: string; icon: string }[] = [
  { value: "housing", label: "Housing", icon: "🏠" },
  { value: "utilities", label: "Utilities", icon: "⚡" },
  { value: "insurance", label: "Insurance", icon: "🛡" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "groceries", label: "Groceries", icon: "🛒" },
  { value: "childcare", label: "Childcare", icon: "👶" },
  { value: "subscriptions", label: "Subscriptions", icon: "📱" },
  { value: "loan", label: "Loan Payment", icon: "🏦" },
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

interface AddBillFormProps {
  onSubmit: (data: { name: string; category: BillCategory; amount: number; frequency: Frequency; nextDate: string }) => void;
  onClose: () => void;
}

export function AddBillForm({ onSubmit, onClose }: AddBillFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BillCategory>("other");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) newErrors.amount = "Enter a valid amount";
    if (!nextDate) newErrors.nextDate = "Date is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit({ name: name.trim(), category, amount: num, frequency, nextDate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl bg-white shadow-xl sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[16px] font-bold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            {/* Name */}
            <div>
              <label className="text-[12px] font-semibold text-gray-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electric Bill"
                autoFocus
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.name ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="text-[12px] font-semibold text-gray-500">Category</label>
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
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount + Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-gray-500">Amount</label>
                <div className="mt-1 flex rounded-sm border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <span className="border-r border-gray-200 bg-gray-50 px-2.5 py-2.5 font-mono text-[13px] text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 border-none px-3 py-2.5 text-[14px] outline-none"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-[11px] text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-500">Frequency</label>
                <select
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

            {/* Next Due Date */}
            <div>
              <label className="text-[12px] font-semibold text-gray-500">Next Due Date</label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className={`mt-1 block w-full rounded-sm border px-3 py-2.5 text-[14px] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${errors.nextDate ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-purple-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-purple-600">
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
