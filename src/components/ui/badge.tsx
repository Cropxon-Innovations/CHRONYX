import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "text-foreground border-border/80 bg-background/50",
        // Premium variants
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        info: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
        premium: "border-transparent bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-400",
        // Subtle variants
        "subtle-primary": "border-primary/20 bg-primary/5 text-primary",
        "subtle-secondary": "border-secondary/20 bg-secondary/5 text-secondary-foreground",
        "subtle-success": "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
        "subtle-warning": "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
        "subtle-destructive": "border-destructive/20 bg-destructive/5 text-destructive",
        // Dot variants
        dot: "pl-2 before:mr-1.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };