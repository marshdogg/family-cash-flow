"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Bill, IncomeSource, Investment, CheckIn } from "@/lib/types";

const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

function mapRow<T extends { id: string; name: string; category: string; amount: number; frequency: string; nextDate: string; status: string }>(r: Record<string, unknown>): T {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    amount: Number(r.amount),
    frequency: r.frequency,
    nextDate: r.next_date,
    status: r.status,
  } as T;
}

export function useStore() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettingsState] = useState({ threshold: 500, cadence: "weekly", householdName: "Our Household" });
  const [loaded, setLoaded] = useState(false);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    async function load() {
      const [billsRes, incomeRes, investRes, checkInsRes, householdRes] = await Promise.all([
        supabase.from("bills").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("income_sources").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("investments").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("check_ins").select("*").eq("household_id", HOUSEHOLD_ID).order("completed_at", { ascending: true }),
        supabase.from("households").select("*").eq("id", HOUSEHOLD_ID).single(),
      ]);

      if (billsRes.data) setBills(billsRes.data.map((r) => mapRow<Bill>(r)));
      if (incomeRes.data) setIncome(incomeRes.data.map((r) => mapRow<IncomeSource>(r)));
      if (investRes.data) setInvestments(investRes.data.map((r) => mapRow<Investment>(r)));

      if (checkInsRes.data) {
        setCheckIns(checkInsRes.data.map((r) => ({
          id: r.id as string,
          bankBalance: Number(r.bank_balance),
          completedAt: r.completed_at as string,
          weekStart: r.week_start as string,
        })));
      }

      if (householdRes.data) {
        setSettingsState({
          threshold: Number(householdRes.data.min_balance),
          cadence: householdRes.data.cadence as string,
          householdName: householdRes.data.name as string,
        });
      }

      setLoaded(true);
    }
    load();
  }, []);

  // ── Generic insert helper ──
  async function insertRow(table: string, row: Record<string, unknown>) {
    const { data, error } = await supabase
      .from(table)
      .insert({ household_id: HOUSEHOLD_ID, ...row })
      .select()
      .single();
    if (error) return null;
    return data;
  }

  // ── Bills ──
  const addBill = useCallback(async (bill: Omit<Bill, "id" | "status">) => {
    const data = await insertRow("bills", {
      name: bill.name, category: bill.category, amount: bill.amount,
      frequency: bill.frequency, next_date: bill.nextDate, status: "active",
    });
    if (data) setBills((prev) => [...prev, mapRow<Bill>(data)]);
  }, []);

  const removeBill = useCallback(async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Income ──
  const addIncome = useCallback(async (item: Omit<IncomeSource, "id">) => {
    const data = await insertRow("income_sources", {
      name: item.name, category: item.category, amount: item.amount,
      frequency: item.frequency, next_date: item.nextDate, status: item.status,
    });
    if (data) setIncome((prev) => [...prev, mapRow<IncomeSource>(data)]);
  }, []);

  const removeIncome = useCallback(async (id: string) => {
    await supabase.from("income_sources").delete().eq("id", id);
    setIncome((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Investments ──
  const addInvestment = useCallback(async (inv: Omit<Investment, "id" | "status">) => {
    const data = await insertRow("investments", {
      name: inv.name, category: inv.category, amount: inv.amount,
      frequency: inv.frequency, next_date: inv.nextDate, status: "active",
    });
    if (data) setInvestments((prev) => [...prev, mapRow<Investment>(data)]);
  }, []);

  const removeInvestment = useCallback(async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Check-Ins ──
  const addCheckIn = useCallback(async (bankBalance: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    const { data, error } = await supabase
      .from("check_ins")
      .insert({
        household_id: HOUSEHOLD_ID,
        bank_balance: bankBalance,
        week_start: monday.toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (data && !error) {
      const ci: CheckIn = {
        id: data.id,
        bankBalance: Number(data.bank_balance),
        completedAt: data.completed_at,
        weekStart: data.week_start,
      };
      setCheckIns((prev) => [...prev, ci]);
      return ci;
    }
  }, []);

  // ── Settings ──
  const setSettings = useCallback(async (s: typeof settings) => {
    setSettingsState(s);
    await supabase
      .from("households")
      .update({
        name: s.householdName,
        min_balance: s.threshold,
        cadence: s.cadence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", HOUSEHOLD_ID);
  }, []);

  const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

  // ── Computed ──
  const toMonthly = (amount: number, frequency: string) => {
    if (frequency === "weekly") return amount * (52 / 12);
    if (frequency === "biweekly") return amount * (26 / 12);
    if (frequency === "semimonthly") return amount * 2;
    if (frequency === "quarterly") return amount / 3;
    if (frequency === "annually") return amount / 12;
    return amount;
  };

  const totalMonthlyBills = bills
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);

  const totalMonthlyIncome = income
    .filter((i) => i.frequency !== "one-time")
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);

  const totalMonthlyInvestments = investments
    .filter((i) => i.status === "active" && i.frequency !== "one-time")
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);

  return {
    loaded,
    bills,
    income,
    investments,
    checkIns,
    settings,
    latestCheckIn,
    totalMonthlyBills,
    totalMonthlyIncome,
    totalMonthlyInvestments,
    addBill,
    removeBill,
    addIncome,
    removeIncome,
    addInvestment,
    removeInvestment,
    addCheckIn,
    setSettings,
  };
}
