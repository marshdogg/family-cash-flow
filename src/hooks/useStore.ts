"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Bill, IncomeSource, CheckIn } from "@/lib/types";

const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export function useStore() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettingsState] = useState({ threshold: 500, cadence: "weekly", householdName: "Our Household" });
  const [loaded, setLoaded] = useState(false);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    async function load() {
      const [billsRes, incomeRes, checkInsRes, householdRes] = await Promise.all([
        supabase.from("bills").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("income_sources").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("check_ins").select("*").eq("household_id", HOUSEHOLD_ID).order("completed_at", { ascending: true }),
        supabase.from("households").select("*").eq("id", HOUSEHOLD_ID).single(),
      ]);

      if (billsRes.data) {
        setBills(billsRes.data.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          amount: Number(r.amount),
          frequency: r.frequency,
          nextDate: r.next_date,
          status: r.status,
        })));
      }

      if (incomeRes.data) {
        setIncome(incomeRes.data.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          amount: Number(r.amount),
          frequency: r.frequency,
          nextDate: r.next_date,
          status: r.status,
        })));
      }

      if (checkInsRes.data) {
        setCheckIns(checkInsRes.data.map((r) => ({
          id: r.id,
          bankBalance: Number(r.bank_balance),
          completedAt: r.completed_at,
          weekStart: r.week_start,
        })));
      }

      if (householdRes.data) {
        setSettingsState({
          threshold: Number(householdRes.data.min_balance),
          cadence: householdRes.data.cadence,
          householdName: householdRes.data.name,
        });
      }

      setLoaded(true);
    }
    load();
  }, []);

  // ── Bills ──
  const addBill = useCallback(async (bill: Omit<Bill, "id" | "status">) => {
    const { data, error } = await supabase
      .from("bills")
      .insert({
        household_id: HOUSEHOLD_ID,
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        frequency: bill.frequency,
        next_date: bill.nextDate,
        status: "active",
      })
      .select()
      .single();

    if (data && !error) {
      setBills((prev) => [...prev, {
        id: data.id,
        name: data.name,
        category: data.category,
        amount: Number(data.amount),
        frequency: data.frequency,
        nextDate: data.next_date,
        status: data.status,
      }]);
    }
  }, []);

  const removeBill = useCallback(async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Income ──
  const addIncome = useCallback(async (item: Omit<IncomeSource, "id">) => {
    const { data, error } = await supabase
      .from("income_sources")
      .insert({
        household_id: HOUSEHOLD_ID,
        name: item.name,
        category: item.category,
        amount: item.amount,
        frequency: item.frequency,
        next_date: item.nextDate,
        status: item.status,
      })
      .select()
      .single();

    if (data && !error) {
      setIncome((prev) => [...prev, {
        id: data.id,
        name: data.name,
        category: data.category,
        amount: Number(data.amount),
        frequency: data.frequency,
        nextDate: data.next_date,
        status: data.status,
      }]);
    }
  }, []);

  const removeIncome = useCallback(async (id: string) => {
    await supabase.from("income_sources").delete().eq("id", id);
    setIncome((prev) => prev.filter((i) => i.id !== id));
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
    if (frequency === "weekly") return amount * (52 / 12);       // 4.333
    if (frequency === "biweekly") return amount * (26 / 12);     // 2.167
    if (frequency === "semimonthly") return amount * 2;           // exactly 2x/month
    if (frequency === "quarterly") return amount / 3;
    if (frequency === "annually") return amount / 12;
    return amount; // monthly
  };

  const totalMonthlyBills = bills
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);

  const totalMonthlyIncome = income
    .filter((i) => i.frequency !== "one-time")
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);

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
