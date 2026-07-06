/**
 * Canonical list of every /app module.
 * Single source of truth for AppSidebar, LobbyEcosystem, and the automated
 * sync test. Meta routes (Dashboard, Security Dashboard, Privacy Center)
 * are intentionally excluded from the ecosystem showcase but still shown
 * in the sidebar via `showInLobby: false`.
 */

export type ModuleGroup =
  | "Overview"
  | "Productivity"
  | "Finance"
  | "Life"
  | "Work"
  | "Security";


export interface AppModule {
  /** Unique path under /app (e.g. "/app/todos") */
  path: string;
  /** Display label */
  label: string;
  /** Section it belongs to in the sidebar */
  group: ModuleGroup;
  /** Optional badge (NEW, BETA, PRO, PREMIUM) */
  badge?: string;
  /** Whether to render on the marketing lobby ecosystem grid */
  showInLobby: boolean;
  /** One-liner used on the lobby card */
  lobbyDesc?: string;
  /** Tailwind gradient tail used on the lobby card */
  lobbyHue?: string;
}

export const APP_MODULES: AppModule[] = [
  // Overview
  { path: "/app",              label: "Dashboard",         group: "Overview",     showInLobby: false },
  { path: "/app/resolutions",  label: "Resolutions",       group: "Overview",     showInLobby: true,  lobbyDesc: "Yearly intent, tracked.",       lobbyHue: "from-red-400/30 to-red-500/5" },

  // Productivity
  { path: "/app/todos",        label: "Todos",             group: "Productivity", showInLobby: true,  lobbyDesc: "Daily plan & timeline.",        lobbyHue: "from-teal-400/30 to-teal-500/5" },
  // Noteflow (path /app/notes) retired
  { path: "/app/study",        label: "Study",             group: "Productivity", showInLobby: true,  lobbyDesc: "Syllabus, PYQs, NOVA AI.",       lobbyHue: "from-emerald-400/30 to-emerald-500/5" },
  { path: "/app/library",      label: "Library",           group: "Productivity", badge: "NEW",  showInLobby: true, lobbyDesc: "Books, PDFs, readers.",  lobbyHue: "from-amber-400/30 to-amber-500/5" },
  { path: "/app/achievements", label: "Achievements",      group: "Productivity", showInLobby: true,  lobbyDesc: "Streaks & milestones.",          lobbyHue: "from-yellow-300/30 to-yellow-500/5" },

  // Finance
  // FinanceFlow (path /app/financeflow) retired — data surfaces inside WealthX
  { path: "/app/expenses",     label: "Expenses",          group: "Finance",      showInLobby: true,  lobbyDesc: "Budgets & categories.",          lobbyHue: "from-rose-400/30 to-rose-500/5" },
  { path: "/app/income",       label: "Income",            group: "Finance",      showInLobby: true,  lobbyDesc: "Salary & passive income.",       lobbyHue: "from-green-400/30 to-green-500/5" },
  { path: "/app/reports",      label: "Reports & Budget",  group: "Finance",      showInLobby: true,  lobbyDesc: "Spend insights & forecasts.",    lobbyHue: "from-sky-400/30 to-sky-500/5" },
  { path: "/app/loans",        label: "Loans & EMI",       group: "Finance",      showInLobby: true,  lobbyDesc: "Amortization & reminders.",      lobbyHue: "from-orange-400/30 to-orange-500/5" },
  { path: "/app/insurance",    label: "Insurance",         group: "Finance",      showInLobby: true,  lobbyDesc: "Policies & claims.",             lobbyHue: "from-pink-400/30 to-pink-500/5" },
  { path: "/app/tax",          label: "TAXYN",             group: "Finance",      badge: "PRO",  showInLobby: true, lobbyDesc: "Indian tax engine.",     lobbyHue: "from-indigo-400/30 to-indigo-500/5" },

  // WealthX (moved into Finance group)
  { path: "/app/wealthx",      label: "WealthX",           group: "Finance",      badge: "NEW",  showInLobby: true, lobbyDesc: "Investments, SIPs, portfolio intelligence.", lobbyHue: "from-emerald-400/30 to-cyan-500/5" },


  // Life
  { path: "/app/memory",       label: "Memory",            group: "Life",         showInLobby: true,  lobbyDesc: "Photos & collections.",          lobbyHue: "from-fuchsia-400/30 to-fuchsia-500/5" },
  { path: "/app/documents",    label: "Documents",         group: "Life",         showInLobby: true,  lobbyDesc: "Personal docs vault.",           lobbyHue: "from-cyan-400/30 to-cyan-500/5" },
  { path: "/app/family-tree",  label: "Family Tree",       group: "Life",         badge: "NEW",  showInLobby: true, lobbyDesc: "Generations & docs.",    lobbyHue: "from-lime-400/30 to-lime-500/5" },
  { path: "/app/social",       label: "Social",            group: "Life",         badge: "BETA", showInLobby: true, lobbyDesc: "15+ platforms unified.", lobbyHue: "from-purple-400/30 to-purple-500/5" },
  { path: "/app/lifespan",     label: "Lifespan",          group: "Life",         showInLobby: true,  lobbyDesc: "Years left, lived well.",        lobbyHue: "from-stone-400/30 to-stone-500/5" },

  // Work
  { path: "/app/tasks",        label: "Task Management",   group: "Work",         badge: "NEW",  showInLobby: true, lobbyDesc: "Jira-style boards.",     lobbyHue: "from-blue-400/30 to-blue-500/5" },

  // Security
  { path: "/app/vault",        label: "Vault",             group: "Security",     showInLobby: true,  lobbyDesc: "Passwords & secrets.",           lobbyHue: "from-slate-400/30 to-slate-500/5" },
  { path: "/app/security",     label: "Security Dashboard",group: "Security",     showInLobby: false },
  { path: "/app/privacy",      label: "Privacy Center",    group: "Security",     showInLobby: false },
];

export const LOBBY_MODULES = APP_MODULES.filter((m) => m.showInLobby);
