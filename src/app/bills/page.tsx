import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const BILL_CATEGORIES = {
  housing: { icon: "🏠", label: "Housing", bg: "#F0EBFF" },
  utilities: { icon: "⚡", label: "Utilities", bg: "#FEF3C7" },
  insurance: { icon: "🛡", label: "Insurance", bg: "#E8F2FF" },
  transport: { icon: "🚗", label: "Transport", bg: "#F3F4F6" },
  groceries: { icon: "🛒", label: "Groceries", bg: "#DCFCE7" },
  childcare: { icon: "👶", label: "Childcare", bg: "#FCE7F3" },
  subscriptions: { icon: "📱", label: "Subscriptions", bg: "#F0EBFF" },
  loan: { icon: "🏦", label: "Loan Payment", bg: "#FEE2E2" },
  other: { icon: "📋", label: "Other", bg: "#F3F4F6" },
} as const;

type BillCategory = keyof typeof BILL_CATEGORIES;

// Mock bills
const MOCK_BILLS = [
  { id: "1", name: "Rent", category: "housing" as BillCategory, amount: 1800, frequency: "Monthly", nextDate: "Apr 1", status: "active" as const },
  { id: "2", name: "Car Payment", category: "transport" as BillCategory, amount: 450, frequency: "Monthly", nextDate: "Mar 28", status: "active" as const },
  { id: "3", name: "Electric", category: "utilities" as BillCategory, amount: 120, frequency: "Monthly", nextDate: "Apr 1", status: "active" as const },
  { id: "4", name: "Internet", category: "utilities" as BillCategory, amount: 75, frequency: "Monthly", nextDate: "Mar 25", status: "active" as const },
  { id: "5", name: "Car Insurance", category: "insurance" as BillCategory, amount: 145, frequency: "Monthly", nextDate: "Mar 27", status: "active" as const },
  { id: "6", name: "Netflix", category: "subscriptions" as BillCategory, amount: 15, frequency: "Monthly", nextDate: "Mar 28", status: "active" as const },
  { id: "7", name: "Gym Membership", category: "subscriptions" as BillCategory, amount: 50, frequency: "Monthly", nextDate: "Apr 1", status: "active" as const },
  { id: "8", name: "Student Loan", category: "loan" as BillCategory, amount: 320, frequency: "Monthly", nextDate: "Mar 30", status: "active" as const },
  { id: "9", name: "Groceries", category: "groceries" as BillCategory, amount: 200, frequency: "Weekly", nextDate: "Mar 24", status: "active" as const },
  { id: "10", name: "Daycare", category: "childcare" as BillCategory, amount: 1200, frequency: "Monthly", nextDate: "Apr 1", status: "active" as const },
];

const totalMonthly = MOCK_BILLS.reduce((sum, b) => {
  if (b.frequency === "Weekly") return sum + b.amount * 4.33;
  return sum + b.amount;
}, 0);

export default function BillsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-8 lg:max-w-4xl lg:px-8">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-gray-900">Bills & Expenses</h1>
            <button className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow">
              <Plus className="h-4 w-4" />
              Add Bill
            </button>
          </div>

          {/* Summary */}
          <div className="mb-5 rounded-lg bg-white p-4 shadow-md">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Monthly Outflow</p>
            <p className="mt-1 font-mono text-[22px] font-semibold text-negative">
              −{formatCurrency(Math.round(totalMonthly))}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {MOCK_BILLS.length} active bills & expenses
            </p>
          </div>

          {/* Bills list */}
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {MOCK_BILLS.map((bill) => {
              const cat = BILL_CATEGORIES[bill.category];
              return (
                <div
                  key={bill.id}
                  className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[16px]"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-gray-900">{bill.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        {cat.label}
                      </span>
                      <span>{bill.frequency}</span>
                      <span>·</span>
                      <span>Next: {bill.nextDate}</span>
                    </div>
                  </div>
                  <div className="font-mono text-[14px] font-semibold text-gray-900">
                    −{formatCurrency(bill.amount)}
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
