import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "gradient" | "elevated";
  glow?: boolean;
  hoverable?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className,
  variant = "default",
  glow = false,
  hoverable = true,
}) => {
  const variants = {
    default: "bg-card border border-border/50",
    glass: "bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5",
    gradient: "bg-gradient-to-br from-card via-card to-muted/30 border border-border/30",
    elevated: "bg-card border border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300",
        variants[variant],
        hoverable && "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        glow && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface PremiumCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const PremiumCardHeader: React.FC<PremiumCardHeaderProps> = ({
  children,
  className,
  action,
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 pb-4",
      className
    )}>
      <div className="space-y-1">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface PremiumCardTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const PremiumCardTitle: React.FC<PremiumCardTitleProps> = ({
  children,
  icon,
  className,
}) => {
  return (
    <h3 className={cn(
      "flex items-center gap-2 text-base font-semibold tracking-tight",
      className
    )}>
      {icon && (
        <span className="text-primary">{icon}</span>
      )}
      {children}
    </h3>
  );
};

export const PremiumCardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const PremiumCardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("p-6 pt-0", className)}>
      {children}
    </div>
  );
};

export const PremiumCardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30",
      className
    )}>
      {children}
    </div>
  );
};

// Premium Section Header
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Premium Button styles
export const premiumButtonStyles = {
  primary: "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300",
  secondary: "bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground",
  ghost: "bg-transparent hover:bg-muted/50 text-foreground",
  outline: "border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300",
};

export default PremiumCard;
