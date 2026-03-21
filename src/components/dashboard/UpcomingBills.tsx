import { formatCurrency } from "@/lib/format";

type Category = "housing" | "utilities" | "insurance" | "subscriptions" | "transport" | "groceries" | "childcare" | "loan" | "other";

const CATEGORY_CONFIG: Record<Category, { icon: string; color: string; bg: string }> = {
  housing: { icon: "🏠", color: "#7B2FFF", bg: "#F0EBFF" },
  utilities: { icon: "⚡", color: "#F59E0B", bg: "#FEF3C7" },
  insurance: { icon: "🛡", color: "#4A9BFF", bg: "#E8F2FF" },
  subscriptions: { icon: "📱", color: "#7B2FFF", bg: "#F0EBFF" },
  transport: { icon: "🚗", color: "#6B7280", bg: "#F3F4F6" },
  groceries: { icon: "🛒", color: "#22C55E", bg: "#DCFCE7" },
  childcare: { icon: "👶", color: "#EC4899", bg: "#FCE7F3" },
  loan: { icon: "🏦", color: "#EF4444", bg: "#FEE2E2" },
  other: { icon: "📋", color: "#6B7280", bg: "#F3F4F6" },
};

interface Bill {
  name: string;
  amount: number;
  date: string;
  category: Category;
}

interface UpcomingBillsProps {
  bills: Bill[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md">
      {bills.map((bill, i) => {
        const config = CATEGORY_CONFIG[bill.category];
        return (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0"
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[15px]"
              style={{ background: config.bg }}
            >
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-gray-900">{bill.name}</div>
              <div className="text-[11px] font-medium text-gray-400">{bill.date}</div>
            </div>
            <div className="font-mono text-[14px] font-semibold text-gray-900">
              −{formatCurrency(bill.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
