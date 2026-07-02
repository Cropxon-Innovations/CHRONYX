import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  hint?: string;
}

export const ChartCard = ({ title, action, className, children, hint }: Props) => (
  <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export default ChartCard;
