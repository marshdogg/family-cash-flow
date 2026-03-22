import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="mt-5 flex gap-3">
      <Link
        href="/check-in"
        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-purple-500 px-4 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:bg-purple-600 hover:shadow-glow"
      >
        <ClipboardCheck className="h-4 w-4" />
        Weekly Check-In
      </Link>
      <Link
        href="/bills"
        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 transition-colors hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
      >
        <Plus className="h-4 w-4" />
        Add Expense
      </Link>
    </div>
  );
}
