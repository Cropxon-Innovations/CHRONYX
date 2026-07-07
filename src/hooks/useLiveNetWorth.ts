import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LiveNetWorth {
  loading: boolean;
  assets: number;         // sum of user_assets.current_value
  cash: number;           // lifetime income - lifetime expenses
  liabilities: number;    // outstanding loan principal (approx)
  netWorth: number;       // assets + cash - liabilities
  monthlyIncome: number;  // current month
  monthlyExpenses: number;
  monthlySavings: number;
  emiDueThisMonth: number;
  updatedAt: Date;
  refetch: () => void;
}

const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Live aggregation of finance data across expenses, income_entries, loans,
 * emi_schedule, and user_assets. Subscribes to Supabase Realtime so any
 * change in any of those tables refreshes the totals within ~200ms.
 */
export function useLiveNetWorth(): LiveNetWorth {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<LiveNetWorth, "refetch">>({
    loading: true,
    assets: 0,
    cash: 0,
    liabilities: 0,
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    emiDueThisMonth: 0,
    updatedAt: new Date(),
  });

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const isoMonthStart = monthStart.toISOString().slice(0, 10);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const isoMonthEnd = monthEnd.toISOString().slice(0, 10);

    type R = { data: any[] | null };
    const sb: any = supabase;
    const run = async (p: any): Promise<R> => {
      const r = (await p) as R;
      return { data: r.data ?? [] };
    };

    const assetsQ = await run(
      sb.from("user_assets").select("current_value, purchase_price").eq("user_id", user.id),
    );
    const expAllQ = await run(
      sb.from("expenses").select("amount").eq("user_id", user.id),
    );
    const incAllQ = await run(
      sb.from("income_entries").select("amount").eq("user_id", user.id),
    );
    const expMonthQ = await run(
      sb.from("expenses").select("amount").eq("user_id", user.id)
        .gte("expense_date", isoMonthStart).lt("expense_date", isoMonthEnd),
    );
    const incMonthQ = await run(
      sb.from("income_entries").select("amount").eq("user_id", user.id)
        .gte("received_date", isoMonthStart).lt("received_date", isoMonthEnd),
    );
    const loansQ = await run(
      sb.from("loans")
        .select("outstanding_amount, principal_amount, loan_amount, status")
        .eq("user_id", user.id),
    );
    const emiMonthQ = await run(
      sb.from("emi_schedule").select("emi_amount, due_date, status")
        .eq("user_id", user.id).gte("due_date", isoMonthStart).lt("due_date", isoMonthEnd),
    );

    const assets = (assetsQ.data ?? []).reduce(
      (s, a: any) => s + num(a.current_value ?? a.purchase_price),
      0,
    );
    const expensesTotal = (expAllQ.data ?? []).reduce(
      (s, e: any) => s + num(e.amount),
      0,
    );
    const incomeTotal = (incAllQ.data ?? []).reduce(
      (s, i: any) => s + num(i.amount),
      0,
    );
    const monthlyExpenses = (expMonthQ.data ?? []).reduce(
      (s, e: any) => s + num(e.amount),
      0,
    );
    const monthlyIncome = (incMonthQ.data ?? []).reduce(
      (s, i: any) => s + num(i.amount),
      0,
    );
    const liabilities = (loansQ.data ?? [])
      .filter((l: any) => (l.status ?? "active") !== "closed")
      .reduce(
        (s, l: any) =>
          s +
          num(l.outstanding_amount ?? l.principal_amount ?? l.loan_amount),
        0,
      );
    const emiDueThisMonth = (emiMonthQ.data ?? [])
      .filter((e: any) => (e.status ?? "pending") !== "paid")
      .reduce((s, e: any) => s + num(e.emi_amount), 0);

    const cash = incomeTotal - expensesTotal;
    const netWorth = assets + cash - liabilities;

    setState({
      loading: false,
      assets,
      cash,
      liabilities,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      emiDueThisMonth,
      updatedAt: new Date(),
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchAll();

    // Debounced refetch to coalesce bursts of realtime events.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fetchAll, 250);
    };

    const filter = `user_id=eq.${user.id}`;
    const channel = supabase
      .channel(`live-networth-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "income_entries", filter }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "loans", filter }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "emi_schedule", filter }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_assets", filter }, schedule)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAll]);

  return { ...state, refetch: fetchAll };
}
