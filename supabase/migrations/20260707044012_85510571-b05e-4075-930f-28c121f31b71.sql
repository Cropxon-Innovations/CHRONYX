-- Enable Realtime for finance tables consumed by WealthX + Net Worth tracker
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emi_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_assets;