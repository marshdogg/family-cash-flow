"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Bill, IncomeSource, Investment, PlannedEvent, CheckIn } from "@/lib/types";

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
  const [plannedEvents, setPlannedEvents] = useState<PlannedEvent[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettingsState] = useState({ threshold: 500, cadence: "weekly", householdName: "Our Household" });
  const [loaded, setLoaded] = useState(false);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    async function load() {
      const [billsRes, incomeRes, investRes, plansRes, checkInsRes, householdRes] = await Promise.all([
        supabase.from("bills").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("income_sources").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("investments").select("*").eq("household_id", HOUSEHOLD_ID).order("next_date"),
        supabase.from("planned_events").select("*").eq("household_id", HOUSEHOLD_ID).order("target_date"),
        supabase.from("check_ins").select("*").eq("household_id", HOUSEHOLD_ID).order("completed_at", { ascending: true }),
        supabase.from("households").select("*").eq("id", HOUSEHOLD_ID).single(),
      ]);

      if (billsRes.data) setBills(billsRes.data.map((r) => mapRow<Bill>(r)));
      if (incomeRes.data) setIncome(incomeRes.data.map((r) => mapRow<IncomeSource>(r)));
      if (investRes.data) setInvestments(investRes.data.map((r) => mapRow<Investment>(r)));

      if (plansRes.data) {
        setPlannedEvents(plansRes.data.map((r) => ({
          id: r.id as string,
          name: r.name as string,
          category: r.category as PlannedEvent["category"],
          amount: Number(r.amount),
          targetDate: r.target_date as string,
          savedSoFar: Number(r.saved_so_far),
          status: r.status as PlannedEvent["status"],
        })));
      }

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

  const updateBill = useCallback(async (id: string, bill: Omit<Bill, "id" | "status">) => {
    const { data } = await supabase.from("bills").update({
      name: bill.name, category: bill.category, amount: bill.amount,
      frequency: bill.frequency, next_date: bill.nextDate,
    }).eq("id", id).select().single();
    if (data) setBills((prev) => prev.map((b) => b.id === id ? mapRow<Bill>(data) : b));
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

  const updateIncome = useCallback(async (id: string, item: Omit<IncomeSource, "id">) => {
    const { data } = await supabase.from("income_sources").update({
      name: item.name, category: item.category, amount: item.amount,
      frequency: item.frequency, next_date: item.nextDate, status: item.status,
    }).eq("id", id).select().single();
    if (data) setIncome((prev) => prev.map((i) => i.id === id ? mapRow<IncomeSource>(data) : i));
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

  const updateInvestment = useCallback(async (id: string, inv: Omit<Investment, "id" | "status">) => {
    const { data } = await supabase.from("investments").update({
      name: inv.name, category: inv.category, amount: inv.amount,
      frequency: inv.frequency, next_date: inv.nextDate,
    }).eq("id", id).select().single();
    if (data) setInvestments((prev) => prev.map((i) => i.id === id ? mapRow<Investment>(data) : i));
  }, []);

  const removeInvestment = useCallback(async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Planned Events ──
  const addPlannedEvent = useCallback(async (event: Omit<PlannedEvent, "id" | "status">) => {
    const { data, error } = await supabase
      .from("planned_events")
      .insert({
        household_id: HOUSEHOLD_ID,
        name: event.name,
        category: event.category,
        amount: event.amount,
        target_date: event.targetDate,
        saved_so_far: event.savedSoFar,
        status: event.savedSoFar >= event.amount ? "funded" : "saving",
      })
      .select()
      .single();

    if (data && !error) {
      setPlannedEvents((prev) => [...prev, {
        id: data.id,
        name: data.name,
        category: data.category,
        amount: Number(data.amount),
        targetDate: data.target_date,
        savedSoFar: Number(data.saved_so_far),
        status: data.status,
      }]);
    }
  }, []);

  const removePlannedEvent = useCallback(async (id: string) => {
    await supabase.from("planned_events").delete().eq("id", id);
    setPlannedEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updatePlannedEventSaved = useCallback(async (id: string, savedSoFar: number) => {
    const event = plannedEvents.find((e) => e.id === id);
    if (!event) return;
    const status = savedSoFar >= event.amount ? "funded" : "saving";
    await supabase.from("planned_events").update({ saved_so_far: savedSoFar, status }).eq("id", id);
    setPlannedEvents((prev) => prev.map((e) => e.id === id ? { ...e, savedSoFar, status } : e));
  }, [plannedEvents]);

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

  // Monthly savings needed for all planned events
  const totalMonthlySavingsNeeded = plannedEvents
    .filter((e) => e.status === "saving")
    .reduce((sum, e) => {
      const remaining = e.amount - e.savedSoFar;
      const monthsLeft = Math.max(1, Math.ceil(
        (new Date(e.targetDate + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
      ));
      return sum + remaining / monthsLeft;
    }, 0);

  // Available to spend: income - bills - investments - savings needed
  const monthlyAvailableToSpend = totalMonthlyIncome - totalMonthlyBills - totalMonthlyInvestments - totalMonthlySavingsNeeded;

  return {
    loaded,
    bills,
    income,
    investments,
    plannedEvents,
    checkIns,
    settings,
    latestCheckIn,
    totalMonthlyBills,
    totalMonthlyIncome,
    totalMonthlyInvestments,
    totalMonthlySavingsNeeded,
    monthlyAvailableToSpend,
    addBill,
    updateBill,
    removeBill,
    addIncome,
    updateIncome,
    removeIncome,
    addInvestment,
    updateInvestment,
    removeInvestment,
    addPlannedEvent,
    removePlannedEvent,
    updatePlannedEventSaved,
    addCheckIn,
    setSettings,
  };
}
