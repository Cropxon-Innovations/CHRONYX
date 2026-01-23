import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  value: string | number;
  label: string;
  suffix?: string;
  className?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accentColor?: "default" | "success" | "warning" | "danger" | "info";
}

const accentStyles = {
  default: "from-primary/10 via-primary/5 to-transparent border-primary/20",
  success: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20",
  warning: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
  danger: "from-red-500/10 via-red-500/5 to-transparent border-red-500/20",
  info: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20",
};

const iconStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const MetricCard = ({ 
  value, 
  label, 
  suffix, 
  className, 
  icon: Icon,
  trend,
  trendValue,
  accentColor = "default"
}: MetricCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        accentStyles[accentColor],
        className
      )}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
                {value}
              </span>
              {suffix && (
                <span className="text-lg font-medium text-muted-foreground">{suffix}</span>
              )}
            </div>
            
            {trend && trendValue && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend === "up" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                trend === "down" && "bg-red-500/10 text-red-600 dark:text-red-400",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}>
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trendValue}
              </div>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
              iconStyles[accentColor]
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-50",
        accentColor === "default" && "from-primary/50 via-primary to-primary/50",
        accentColor === "success" && "from-emerald-500/50 via-emerald-500 to-emerald-500/50",
        accentColor === "warning" && "from-amber-500/50 via-amber-500 to-amber-500/50",
        accentColor === "danger" && "from-red-500/50 via-red-500 to-red-500/50",
        accentColor === "info" && "from-blue-500/50 via-blue-500 to-blue-500/50"
      )} />
    </motion.div>
  );
};

export default MetricCard;
