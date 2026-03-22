"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Wallet, TrendingUp, CalendarHeart, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/bills", label: "Expenses", icon: Receipt },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/plans", label: "Plans & Events", icon: CalendarHeart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const isSettingsActive = pathname === "/settings";

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
          <span className="text-xs font-extrabold text-white">R</span>
        </div>
        <span className="text-[15px] font-bold text-gray-900">Runway</span>
      </div>

      <ul className="mt-2 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-100 px-3 py-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            isSettingsActive
              ? "bg-purple-50 text-purple-500"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
