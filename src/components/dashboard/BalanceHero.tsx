"use client";

import { TrendingUp, TrendingDown, Flame, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ViewMode } from "@/lib/projection";

interface BalanceHeroProps {
  balance: number;
  lastCheckIn: string;
  weeklyIncome: number;
  weeklyExpenses: number;
  monthlyAvailableToSpend: number;
  streak: number;
  viewMode: ViewMode;
}

export function BalanceHero({
  balance,
  lastCheckIn,
  weeklyIncome,
  weeklyExpenses,
  monthlyAvailableToSpend,
  streak,
  viewMode,
}: BalanceHeroProps) {
  // Scale numbers to match the current view
  const scale = viewMode === "weekly" ? 1 : viewMode === "biweekly" ? 2 : (52 / 12);
  const periodLabel = viewMode === "weekly" ? "/wk" : viewMode === "biweekly" ? "/2wk" : "/mo";
  const displayIncome = Math.round(weeklyIncome * scale);
  const displayExpenses = Math.round(weeklyExpenses * scale);
  const net = displayIncome - displayExpenses;

  // Available to spend (weekly or scaled)
  const weeklyAvailable = monthlyAvailableToSpend / (52 / 12);
  const displayAvailable = Math.round(viewMode === "weekly" ? weeklyAvailable : viewMode === "biweekly" ? weeklyAvailable * 2 : monthlyAvailableToSpend);

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-primary p-6 text-white shadow-lg">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
            Cash Position
          </p>
          <div className="mt-1 font-mono text-[40px] font-semibold leading-none tracking-tight">
            {formatCurrency(balance)}
          </div>
          <p className="mt-2 text-[12px] font-medium text-white/50">
            Last check-in {lastCheckIn}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[12px] font-bold">{streak} week streak</span>
            </div>
          )}

          {/* Available to spend */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <Wallet className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-[12px] font-medium">
              <span className={`font-bold ${displayAvailable >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {formatCurrency(Math.abs(displayAvailable))}
              </span>
              <span className="text-white/40"> available{periodLabel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="mt-6 flex gap-6 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/50">Income</p>
            <p className="font-mono text-[14px] font-semibold">
              {formatCurrency(displayIncome)}
              <span className="text-[11px] text-white/40">{periodLabel}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <TrendingDown className="h-3.5 w-3.5 text-red-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/50">Expenses</p>
            <p className="font-mono text-[14px] font-semibold">
              {formatCurrency(displayExpenses)}
              <span className="text-[11px] text-white/40">{periodLabel}</span>
            </p>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] font-medium text-white/50">Net</p>
          <p className={`font-mono text-[14px] font-semibold ${net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net))}
            <span className="text-[11px] text-white/40">{periodLabel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
