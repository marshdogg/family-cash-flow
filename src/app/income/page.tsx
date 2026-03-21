import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const INCOME_CATEGORIES = {
  paycheck: { icon: "💰", label: "Paycheck", bg: "#DCFCE7", color: "#16A34A" },
  bonus: { icon: "🎉", label: "Bonus", bg: "#FEF3C7", color: "#D97706" },
  side: { icon: "💼", label: "Side Income", bg: "#F0EBFF", color: "#7B2FFF" },
  benefits: { icon: "🏛", label: "Benefits", bg: "#E8F2FF", color: "#4A9BFF" },
  refund: { icon: "📥", label: "Refund", bg: "#FCE7F3", color: "#DB2777" },
  other: { icon: "📋", label: "Other", bg: "#F3F4F6", color: "#6B7280" },
} as const;

type IncomeCategory = keyof typeof INCOME_CATEGORIES;

// Mock income sources
const MOCK_INCOME = [
  { id: "1", name: "Primary Salary", category: "paycheck" as IncomeCategory, amount: 3800, frequency: "Biweekly", nextDate: "Mar 28", status: "active" as const },
  { id: "2", name: "Partner Salary", category: "paycheck" as IncomeCategory, amount: 3200, frequency: "Biweekly", nextDate: "Mar 28", status: "active" as const },
  { id: "3", name: "Freelance Design", category: "side" as IncomeCategory, amount: 1200, frequency: "Monthly", nextDate: "Apr 1", status: "active" as const },
  { id: "4", name: "Q1 Performance Bonus", category: "bonus" as IncomeCategory, amount: 5000, frequency: "One-time", nextDate: "Apr 15", status: "expected" as const },
  { id: "5", name: "Tax Refund", category: "refund" as IncomeCategory, amount: 2800, frequency: "One-time", nextDate: "Apr 20", status: "expected" as const },
];

const totalMonthly = MOCK_INCOME
  .filter((i) => i.frequency !== "One-time")
  .reduce((sum, i) => {
    if (i.frequency === "Biweekly") return sum + i.amount * 2.17;
    return sum + i.amount;
  }, 0);

const upcomingOneTime = MOCK_INCOME
  .filter((i) => i.frequency === "One-time")
  .reduce((sum, i) => sum + i.amount, 0);

export default function IncomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Income</h1>
            <button className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow">
              <Plus className="h-4 w-4" />
              Add Income
            </button>
          </div>

          {/* Summary cards */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly Recurring</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-positive">
                +{formatCurrency(Math.round(totalMonthly))}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {MOCK_INCOME.filter((i) => i.frequency !== "One-time").length} active sources
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Upcoming One-Time</p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-blue-500">
                +{formatCurrency(upcomingOneTime)}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {MOCK_INCOME.filter((i) => i.frequency === "One-time").length} expected
              </p>
            </div>
          </div>

          {/* Income list */}
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {MOCK_INCOME.map((item) => {
              const cat = INCOME_CATEGORIES[item.category];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-gray-900">{item.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{item.frequency}</span>
                      <span>·</span>
                      <span>Next: {item.nextDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px] font-semibold text-positive">
                      +{formatCurrency(item.amount)}
                    </div>
                    {item.status === "expected" && (
                      <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        Expected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
