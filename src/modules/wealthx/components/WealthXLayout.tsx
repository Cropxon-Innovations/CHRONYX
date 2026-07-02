import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutGrid, PieChart, LineChart, TrendingUp, Coins, Landmark,
  Receipt, CalendarClock, Target, Star, BarChart3, Sparkles, Radar,
  Newspaper, Settings2,
} from "lucide-react";

const NAV = [
  { to: "/app/wealthx",              end: true, label: "Dashboard",     Icon: LayoutGrid },
  { to: "/app/wealthx/portfolio",    label: "Portfolio",      Icon: PieChart },
  { to: "/app/wealthx/mutual-funds", label: "Mutual Funds",   Icon: LineChart },
  { to: "/app/wealthx/stocks",       label: "Stocks",         Icon: TrendingUp },
  { to: "/app/wealthx/etfs",         label: "ETFs",           Icon: Coins },
  { to: "/app/wealthx/gold",         label: "Gold",           Icon: Landmark },
  { to: "/app/wealthx/transactions", label: "Transactions",   Icon: Receipt },
  { to: "/app/wealthx/sip",          label: "SIP Manager",    Icon: CalendarClock },
  { to: "/app/wealthx/goals",        label: "Goals",          Icon: Target },
  { to: "/app/wealthx/watchlist",    label: "Watchlist",      Icon: Star },
  { to: "/app/wealthx/analytics",    label: "Analytics",      Icon: BarChart3 },
  { to: "/app/wealthx/insights",     label: "AI Insights",    Icon: Sparkles },
  { to: "/app/wealthx/predictions",  label: "Predictions",    Icon: Radar },
  { to: "/app/wealthx/news",         label: "News",           Icon: Newspaper },
  { to: "/app/wealthx/settings",     label: "Settings",       Icon: Settings2 },
];

export const WealthXLayout = () => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background to-background/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-border flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Chronyx · Wealth</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">WealthX</h1>
            </div>
          </div>

          <nav
            aria-label="WealthX sections"
            className="mt-6 -mx-1 flex gap-1 overflow-x-auto pb-2 scrollbar-thin"
          >
            {NAV.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <Outlet />
      </motion.div>
    </div>
  );
};

export default WealthXLayout;
