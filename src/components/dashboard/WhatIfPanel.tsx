"use client";

import { useState } from "react";
import { X, Plus, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Frequency } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export interface WhatIfItem {
  name: string;
  amount: number;
  frequency: Frequency;
  type: "expense" | "income" | "investment";
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const PRESETS = [
  { name: "New car payment", amount: 600, frequency: "monthly" as Frequency, type: "expense" as const },
  { name: "Cancel streaming", amount: 45, frequency: "monthly" as Frequency, type: "income" as const },
  { name: "Side hustle", amount: 500, frequency: "monthly" as Frequency, type: "income" as const },
  { name: "New investment", amount: 200, frequency: "monthly" as Frequency, type: "investment" as const },
];

interface WhatIfPanelProps {
  items: WhatIfItem[];
  onAdd: (item: WhatIfItem) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
  monthlyImpact: number;
}

export function WhatIfPanel({ items, onAdd, onRemove, onClear, onClose, monthlyImpact }: WhatIfPanelProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [type, setType] = useState<"expense" | "income" | "investment">("expense");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) return;
    onAdd({ name: name.trim(), amount: num, frequency, type });
    setName("");
    setAmount("");
    setShowForm(false);
  };

  const handlePreset = (preset: typeof PRESETS[0]) => {
    onAdd(preset);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🔮</span>
          <h3 className="text-[15px] font-bold text-gray-900">What If Simulator</h3>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-amber-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick presets */}
      {items.length === 0 && !showForm && (
        <div className="mb-4">
          <p className="mb-2.5 text-[12px] font-medium text-gray-500">Try a scenario:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handlePreset(preset)}
                className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:border-amber-400 hover:bg-amber-50"
              >
                {preset.type === "expense" ? <Minus className="h-3 w-3 text-red-400" /> :
                 preset.type === "income" ? <Plus className="h-3 w-3 text-green-500" /> :
                 <TrendingUp className="h-3 w-3 text-purple-500" />}
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active items */}
      {items.length > 0 && (
        <div className="mb-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                {item.type === "expense" ? <TrendingDown className="h-3.5 w-3.5 text-red-400" /> :
                 item.type === "income" ? <TrendingUp className="h-3.5 w-3.5 text-green-500" /> :
                 <TrendingUp className="h-3.5 w-3.5 text-purple-500" />}
                <span className="text-[13px] font-semibold text-gray-900">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[13px] font-semibold ${
                  item.type === "income" ? "text-green-600" : item.type === "investment" ? "text-purple-500" : "text-red-500"
                }`}>
                  {item.type === "income" ? "+" : "−"}{formatCurrency(item.amount)}/{item.frequency === "weekly" ? "wk" : item.frequency === "biweekly" ? "2wk" : "mo"}
                </span>
                <button
                  onClick={() => onRemove(i)}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add custom */}
      {showForm ? (
        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-1">
            {(["expense", "income", "investment"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-md py-1.5 text-[12px] font-bold capitalize transition-colors ${
                  type === t
                    ? t === "expense" ? "bg-red-50 text-red-600" :
                      t === "income" ? "bg-green-50 text-green-600" :
                      "bg-purple-50 text-purple-600"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New car payment"
            className="mb-2 block w-full rounded-sm border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-purple-500"
            autoFocus
          />
          <div className="mb-3 flex gap-2">
            <div className="flex flex-1 rounded-sm border border-gray-200 focus-within:border-purple-500">
              <span className="border-r border-gray-200 bg-gray-50 px-2 py-2 font-mono text-[12px] text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 border-none px-2 py-2 text-[13px] outline-none"
              />
            </div>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="rounded-sm border border-gray-200 px-2 py-2 text-[12px] outline-none focus:border-purple-500"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAdd} className="rounded-md bg-purple-500 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-purple-600">
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex items-center gap-1.5 rounded-md border border-dashed border-amber-300 px-3 py-2 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom scenario
        </button>
      )}

      {/* Impact summary */}
      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-amber-200 pt-3">
          <div className="text-[12px] font-medium text-gray-500">
            Monthly impact: <span className={`font-mono font-bold ${monthlyImpact >= 0 ? "text-green-600" : "text-red-500"}`}>
              {monthlyImpact >= 0 ? "+" : "−"}{formatCurrency(Math.abs(Math.round(monthlyImpact)))}/mo
            </span>
          </div>
          <button onClick={onClear} className="text-[12px] font-semibold text-amber-700 hover:text-amber-900">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
