"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Wallet, CalendarHeart, TrendingUp, BarChart3, Settings, MoreHorizontal, X } from "lucide-react";

const PRIMARY_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bills", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/plans", label: "Goals", icon: CalendarHeart },
];

const MORE_ITEMS = [
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((item) => pathname === item.href);

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-[60px] right-3 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {MORE_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-500"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/90 backdrop-blur-lg lg:hidden" aria-label="Main navigation">
        <div className="mx-auto flex max-w-lg">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "text-purple-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors ${
              isMoreActive || moreOpen
                ? "text-purple-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-expanded={moreOpen}
            aria-label="More navigation options"
          >
            {moreOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" strokeWidth={isMoreActive ? 2.5 : 2} />}
            More
          </button>
        </div>
      </nav>
    </>
  );
}
