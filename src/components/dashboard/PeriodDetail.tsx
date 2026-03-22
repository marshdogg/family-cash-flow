"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ProjectionPeriod } from "@/lib/projection";

interface PeriodDetailProps {
  period: ProjectionPeriod;
  whatIfPeriod?: ProjectionPeriod;
  threshold: number;
  onClose: () => void;
}

export function PeriodDetail({ period, whatIfPeriod, threshold, onClose }: PeriodDetailProps) {
  const [expanded, setExpanded] = useState(false);
  const net = period.income - period.expense - period.invested;
  const whatIfDiff = whatIfPeriod ? whatIfPeriod.balance - period.balance : 0;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      {/* Rolled up */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-bold text-gray-900">{period.label}</span>
          <span className={`font-mono text-[13px] font-semibold ${period.balance < threshold ? "text-red-500" : "text-purple-600"}`}>
            {formatCurrency(period.balance)}
          </span>
          {whatIfPeriod && (
            <span className={`font-mono text-[12px] font-semibold ${whatIfDiff >= 0 ? "text-green-500" : "text-red-400"}`}>
              What if: {whatIfDiff >= 0 ? "+" : "−"}{formatCurrency(Math.abs(whatIfDiff))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[12px] font-medium">
            <span className="text-green-600">+{formatCurrency(period.income)}</span>
            <span className="text-red-500">−{formatCurrency(period.expense)}</span>
            <span className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
              Net: {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net))}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Inflows */}
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-green-600">
                Inflows — +{formatCurrency(period.income)}
              </h4>
              <div className="space-y-1.5">
                {period.incomeItems.length > 0 ? period.incomeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <span className="text-[11px]">{item.icon}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-green-600">
                      +{formatCurrency(item.amount)}
                    </span>
                  </div>
                )) : (
                  <p className="text-[12px] text-gray-400">No income this period</p>
                )}
              </div>
            </div>

            {/* Outflows */}
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red-500">
                Outflows — −{formatCurrency(period.expense + period.invested)}
              </h4>
              <div className="space-y-1.5">
                {period.expenseItems.map((item, i) => (
                  <div key={`e-${i}`} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <span className="text-[11px]">{item.icon}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-red-500">
                      −{formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}

                {/* Planned events in this period */}
                {period.plannedEventItems.map((item, i) => (
                  <div key={`p-${i}`} className="flex items-center justify-between rounded bg-amber-50 px-1.5 py-0.5">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-amber-700">
                      <span className="text-[11px]">{item.icon}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-amber-600">
                      −{formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}

                {/* Investments */}
                {period.investmentItems.map((item, i) => (
                  <div key={`i-${i}`} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <span className="text-[11px]">{item.icon}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-purple-500">
                      −{formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}

                {period.expenseItems.length === 0 && period.investmentItems.length === 0 && period.plannedEventItems.length === 0 && (
                  <p className="text-[12px] text-gray-400">No outflows this period</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
