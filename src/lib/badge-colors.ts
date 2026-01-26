// Badge color configurations for sidebar navigation tags
// Each badge type has distinct colors for easy identification

export type BadgeType = "NEW" | "PRO" | "BETA" | "PREMIUM";

export interface BadgeColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const badgeColors: Record<BadgeType, BadgeColorConfig> = {
  NEW: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  PRO: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
  },
  BETA: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  PREMIUM: {
    bg: "bg-gradient-to-r from-amber-500/15 to-orange-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
};

export const getBadgeColors = (badge: string): BadgeColorConfig => {
  const upperBadge = badge.toUpperCase() as BadgeType;
  return badgeColors[upperBadge] || badgeColors.NEW;
};

export const getBadgeClasses = (badge: string): string => {
  const colors = getBadgeColors(badge);
  return `${colors.bg} ${colors.text} ${colors.border}`;
};

export const getBadgeDotColor = (badge: string): string => {
  return getBadgeColors(badge).dot;
};
