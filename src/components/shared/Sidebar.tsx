"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Wallet, TrendingUp, CalendarHeart, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/bills", label: "Expenses", icon: Receipt },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/plans", label: "Savings Goals", icon: CalendarHeart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const isSettingsActive = pathname === "/settings";

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" className="h-8 w-auto" fill="none" aria-hidden="true">
          <path d="M76,36 C76,16 24,16 24,36 C24,56 76,56 76,84 C76,104 24,104 24,84" stroke="#1C1C24" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="50" y1="4" x2="50" y2="136" stroke="#1C1C24" strokeWidth="20" strokeLinecap="round"/>
          <rect x="36" y="6" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <rect x="36" y="13" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <rect x="36" y="20" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <rect x="36" y="114" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <rect x="36" y="121" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <rect x="36" y="128" width="27" height="3.5" rx="1" fill="white" opacity=".9"/>
          <path d="M76,36 C76,16 24,16 24,36 C24,56 76,56 76,84 C76,104 24,104 24,84" stroke="white" strokeWidth="2.5" strokeDasharray="9 7" strokeLinecap="butt"/>
          <line x1="50" y1="27" x2="50" y2="112" stroke="white" strokeWidth="2.5" strokeDasharray="9 7" strokeLinecap="butt"/>
        </svg>
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
