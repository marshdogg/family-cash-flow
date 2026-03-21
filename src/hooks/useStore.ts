"use client";

import { useState, useCallback, useEffect } from "react";
import type { Bill, IncomeSource, CheckIn } from "@/lib/types";

const BILLS_KEY = "fcf_bills";
const INCOME_KEY = "fcf_income";
const CHECKINS_KEY = "fcf_checkins";
const SETTINGS_KEY = "fcf_settings";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Default seed data ──

const DEFAULT_BILLS: Bill[] = [
  { id: uid(), name: "Rent", category: "housing", amount: 1800, frequency: "monthly", nextDate: "2026-04-01", status: "active" },
  { id: uid(), name: "Car Payment", category: "transport", amount: 450, frequency: "monthly", nextDate: "2026-03-28", status: "active" },
  { id: uid(), name: "Electric", category: "utilities", amount: 120, frequency: "monthly", nextDate: "2026-04-01", status: "active" },
  { id: uid(), name: "Internet", category: "utilities", amount: 75, frequency: "monthly", nextDate: "2026-03-25", status: "active" },
  { id: uid(), name: "Car Insurance", category: "insurance", amount: 145, frequency: "monthly", nextDate: "2026-03-27", status: "active" },
  { id: uid(), name: "Netflix", category: "subscriptions", amount: 15, frequency: "monthly", nextDate: "2026-03-28", status: "active" },
  { id: uid(), name: "Gym", category: "subscriptions", amount: 50, frequency: "monthly", nextDate: "2026-04-01", status: "active" },
  { id: uid(), name: "Student Loan", category: "loan", amount: 320, frequency: "monthly", nextDate: "2026-03-30", status: "active" },
  { id: uid(), name: "Groceries", category: "groceries", amount: 200, frequency: "weekly", nextDate: "2026-03-24", status: "active" },
  { id: uid(), name: "Daycare", category: "childcare", amount: 1200, frequency: "monthly", nextDate: "2026-04-01", status: "active" },
];

const DEFAULT_INCOME: IncomeSource[] = [
  { id: uid(), name: "Primary Salary", category: "paycheck", amount: 3800, frequency: "biweekly", nextDate: "2026-03-28", status: "active" },
  { id: uid(), name: "Partner Salary", category: "paycheck", amount: 3200, frequency: "biweekly", nextDate: "2026-03-28", status: "active" },
  { id: uid(), name: "Freelance Design", category: "side", amount: 1200, frequency: "monthly", nextDate: "2026-04-01", status: "active" },
];

// ── Hook ──

export function useStore() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState({ threshold: 500, cadence: "weekly" as string, householdName: "Our Household" });
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setBills(load(BILLS_KEY, DEFAULT_BILLS));
    setIncome(load(INCOME_KEY, DEFAULT_INCOME));
    setCheckIns(load(CHECKINS_KEY, [] as CheckIn[]));
    setSettings(load(SETTINGS_KEY, { threshold: 500, cadence: "weekly", householdName: "Our Household" }));
    setLoaded(true);
  }, []);

  // Persist on changes
  useEffect(() => { if (loaded) save(BILLS_KEY, bills); }, [bills, loaded]);
  useEffect(() => { if (loaded) save(INCOME_KEY, income); }, [income, loaded]);
  useEffect(() => { if (loaded) save(CHECKINS_KEY, checkIns); }, [checkIns, loaded]);
  useEffect(() => { if (loaded) save(SETTINGS_KEY, settings); }, [settings, loaded]);

  // ── Bills ──
  const addBill = useCallback((bill: Omit<Bill, "id" | "status">) => {
    setBills((prev) => [...prev, { ...bill, id: uid(), status: "active" }]);
  }, []);

  const removeBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Income ──
  const addIncome = useCallback((item: Omit<IncomeSource, "id">) => {
    setIncome((prev) => [...prev, { ...item, id: uid() }]);
  }, []);

  const removeIncome = useCallback((id: string) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Check-Ins ──
  const addCheckIn = useCallback((bankBalance: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const ci: CheckIn = {
      id: uid(),
      bankBalance,
      completedAt: now.toISOString(),
      weekStart: monday.toISOString().slice(0, 10),
    };
    setCheckIns((prev) => [...prev, ci]);
    return ci;
  }, []);

  const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

  // ── Computed ──
  const totalMonthlyBills = bills
    .filter((b) => b.status === "active")
    .reduce((sum, b) => {
      if (b.frequency === "weekly") return sum + b.amount * 4.33;
      if (b.frequency === "biweekly") return sum + b.amount * 2.17;
      if (b.frequency === "quarterly") return sum + b.amount / 3;
      if (b.frequency === "annually") return sum + b.amount / 12;
      return sum + b.amount;
    }, 0);

  const totalMonthlyIncome = income
    .filter((i) => i.frequency !== "one-time")
    .reduce((sum, i) => {
      if (i.frequency === "weekly") return sum + i.amount * 4.33;
      if (i.frequency === "biweekly") return sum + i.amount * 2.17;
      if (i.frequency === "quarterly") return sum + i.amount / 3;
      if (i.frequency === "annually") return sum + i.amount / 12;
      return sum + i.amount;
    }, 0);

  return {
    loaded,
    bills,
    income,
    checkIns,
    settings,
    latestCheckIn,
    totalMonthlyBills,
    totalMonthlyIncome,
    addBill,
    removeBill,
    addIncome,
    removeIncome,
    addCheckIn,
    setSettings,
  };
}
